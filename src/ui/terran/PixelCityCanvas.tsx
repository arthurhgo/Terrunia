import { useEffect, useRef, useState, type PointerEvent } from 'react'
import { NpcMarker } from './NpcMarker'
import { resolveAsset } from '../../assets/assetRegistry'
import { content } from '../../content/catalog'
import { TERRAN_LOCATION_IDS, type TerranLocationId } from '../../content/terran'
import type { TerranNpcPresence } from '../../content/types'
import { findCityPath, isCityWalkable } from './cityNavigation'
import type { CityActor } from './cityCast'
import { getNpcPatrol, type MovingCityActor } from './cityLife'
import { CITY_HEIGHT, CITY_WIDTH, drawPixelCity, getCityDoor, getCityPoint, type WorldPoint } from './pixelCityArt'
import type { ActorFacing } from './pixelActorArt'
import { PLAYER_HOME_DOOR, PLAYER_HOME_CENTER } from './roomContent'
import { CITY_NPC_SIZE, CITY_VIEW_WIDTH, CITY_VIEW_HEIGHT, getCityCamera, getCityDistrict, cityScreenToWorld, getLandmarkApproach } from './cityWorld'
import { terranLandmarks, cityLandmarkFlag, type TerranLandmark } from '../../content/terranExploration'
import type { RosettaQuestRoute } from '../../domain/terran/rosettaGuide'

type Direction = ActorFacing
type Destination = {
  path: WorldPoint[]
  site: TerranLocationId | null
  actorId: string | null
  landmarkId: string | null
  home: boolean
  goal: WorldPoint
  lastRepath: number
}
type Props = {
  portraitAssetId: string
  reducedMotion: boolean
  currentLocationId: string
  enabled: boolean
  objectiveId: string | null
  actors: readonly CityActor[]
  homeUnlocked: boolean
  spawnPoint?: WorldPoint | null
  onEnterHome: () => void
  onEnter: (locationId: TerranLocationId) => void
  onTalk: (locationId: TerranLocationId, presence: TerranNpcPresence) => void
  onInspectLandmark: (landmark: TerranLandmark) => void
  landmarkFlags: readonly string[]
  questRoutes?: readonly RosettaQuestRoute[]
  showQuestRoutes?: boolean
  onHideQuestRoutes?: () => void
}

const directions: Record<string, Direction> = {
  arrowup: 'up', w: 'up', arrowdown: 'down', s: 'down',
  arrowleft: 'left', a: 'left', arrowright: 'right', d: 'right',
}

const nearestSite = (point: WorldPoint, radius: number): TerranLocationId | null => {
  let nearest: TerranLocationId | null = null
  let distance = radius
  for (const id of TERRAN_LOCATION_IDS) {
    const door = getCityDoor(id)
    const candidate = Math.hypot(door.x - point.x, door.y - point.y)
    if (candidate < distance) { distance = candidate; nearest = id }
  }
  return nearest
}

const nearestNpc = (point: WorldPoint, actors: readonly CityActor[], radius: number): CityActor | null => {
  let nearest: CityActor | null = null
  let distance = radius
  for (const actor of actors) {
    const candidate = Math.hypot(actor.point.x - point.x, actor.point.y - point.y)
    if (candidate < distance) { distance = candidate; nearest = actor }
  }
  return nearest
}

export function PixelCityCanvas({ portraitAssetId, reducedMotion, currentLocationId, enabled, objectiveId, actors, homeUnlocked, spawnPoint, onEnterHome, onEnter, onTalk, onInspectLandmark, landmarkFlags, questRoutes = [], showQuestRoutes = false, onHideQuestRoutes }: Props) {
  const [rosettaHovered, setRosettaHovered] = useState(false)
  const [rosettaFocused, setRosettaFocused] = useState(false)
  const routesVisible = enabled && (rosettaHovered || rosettaFocused || showQuestRoutes)
  const routesVisibleRef = useRef(routesVisible); routesVisibleRef.current = routesVisible
  const routesRef = useRef(questRoutes); routesRef.current = questRoutes
  const routePathsRef = useRef(new Map<string, SVGPathElement>())
  const routeCacheRef = useRef(new Map<string, { key: string; d: string }>())
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const keysRef = useRef(new Set<Direction>())
  const destinationRef = useRef<Destination | null>(null)
  const initialId = TERRAN_LOCATION_IDS.find((id) => id === currentLocationId) ?? 'location_terran_portal_plaza'
  const playerRef = useRef<WorldPoint>({ ...(spawnPoint ?? getCityDoor(initialId)) })
  const cameraRef = useRef(getCityCamera(playerRef.current))
  const worldRef = useRef<HTMLDivElement>(null)
  const mapPlayerRef = useRef<SVGCircleElement>(null)
  const mapViewRef = useRef<SVGRectElement>(null)
  const districtRef = useRef<HTMLSpanElement>(null)
  const siteButtonsRef = useRef(new Map<string, HTMLButtonElement>())
  const landmarkButtonsRef = useRef(new Map<string, HTMLButtonElement>())
  const inspectRef = useRef(onInspectLandmark)
  inspectRef.current = onInspectLandmark
  const facingRef = useRef<Direction>('down')
  const enabledRef = useRef(enabled)
  const reducedMotionRef = useRef(reducedMotion)
  const homeUnlockedRef = useRef(homeUnlocked)
  const homeEnterRef = useRef(onEnterHome)
  const actorsRef = useRef(actors)
  const liveActorsRef = useRef<MovingCityActor[]>([])
  const npcButtonsRef = useRef(new Map<string, HTMLButtonElement>())
  const enterRef = useRef(onEnter)
  const talkRef = useRef(onTalk)
  enabledRef.current = enabled
  reducedMotionRef.current = reducedMotion
  homeUnlockedRef.current = homeUnlocked
  homeEnterRef.current = onEnterHome
  actorsRef.current = actors
  // Keep live positions across React renders while retaining identity from the save.
  if (!liveActorsRef.current.length && actors.length) liveActorsRef.current = actors.map((actor) => getNpcPatrol(actor, 0))
  enterRef.current = onEnter
  talkRef.current = onTalk

  useEffect(() => {
    if (!enabled) { keysRef.current.clear(); destinationRef.current = null }
  }, [enabled])

  const arrive = (destination: Destination) => {
    const actor = destination.actorId && liveActorsRef.current.find((candidate) => candidate.id === destination.actorId)
    if (actor && Math.hypot(actor.point.x - playerRef.current.x, actor.point.y - playerRef.current.y) < 20)
      talkRef.current(actor.locationId, actor.presence)
    else if (destination.landmarkId) {
      const landmark = terranLandmarks.find((entry) => entry.id === destination.landmarkId)
      if (landmark) inspectRef.current(landmark)
    } else if (destination.home) homeEnterRef.current()
    else if (destination.site) enterRef.current(destination.site)
  }

  const walkTo = (point: WorldPoint, site: TerranLocationId | null, actorId: string | null, home = false, landmarkId: string | null = null) => {
    if (!enabledRef.current) return
    const distance = Math.hypot(point.x - playerRef.current.x, point.y - playerRef.current.y)
    const destination: Destination = { path: findCityPath(playerRef.current, point), site, actorId, landmarkId, home, goal: point, lastRepath: 0 }
    if (distance < (site || actorId || home || landmarkId ? 17 : 4)) { arrive(destination); return }
    if (destination.path.length > 0) destinationRef.current = destination
  }

  const walkToSite = (site: TerranLocationId) => walkTo(getCityDoor(site), site, null)
  const walkToHome = () => walkTo(PLAYER_HOME_DOOR, null, null, true)
  const walkToLandmark = (landmark: TerranLandmark) => walkTo(getLandmarkApproach(landmark), null, null, false, landmark.id)
  const walkToActor = (actor: CityActor) => {
    const live = liveActorsRef.current.find((candidate) => candidate.id === actor.id) ?? actor
    walkTo({ x: live.point.x, y: Math.min(CITY_HEIGHT - 8, live.point.y + 7) }, null, actor.id)
  }

  const interactNearby = () => {
    const player = playerRef.current
    const actor = nearestNpc(player, liveActorsRef.current, 22)
    if (actor) { talkRef.current(actor.locationId, actor.presence); return }
    const landmark = terranLandmarks.find((entry) => Math.hypot(player.x - getLandmarkApproach(entry).x, player.y - getLandmarkApproach(entry).y) < 24)
    if (landmark) { inspectRef.current(landmark); return }
    if (Math.hypot(player.x - PLAYER_HOME_DOOR.x, player.y - PLAYER_HOME_DOOR.y) < 28) homeEnterRef.current()
    else { const site = nearestSite(player, 29); if (site) enterRef.current(site) }
  }

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx) return
    let frame = 0, raf = 0, previous = 0, elapsed = 0
    const sheet = new Image()
    sheet.src = resolveAsset(portraitAssetId).path
    sheet.onerror = () => { sheet.onerror = null; sheet.src = resolveAsset(portraitAssetId).fallback }
    const keydown = (event: KeyboardEvent) => {
      if (!enabledRef.current || event.altKey || event.ctrlKey || event.metaKey) return
      const target = event.target
      if (target instanceof HTMLElement && (['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(target.tagName) || target.isContentEditable)) return
      const key = event.key.toLowerCase()
      if (directions[key]) { keysRef.current.add(directions[key]); destinationRef.current = null; event.preventDefault() }
      if (key === 'e' || key === 'enter') {
        interactNearby()
        event.preventDefault()
      }
    }
    const keyup = (event: KeyboardEvent) => {
      const direction = directions[event.key.toLowerCase()]
      if (direction) keysRef.current.delete(direction)
    }
    const blur = () => keysRef.current.clear()
    const tick = (now: number) => {
      const delta = Math.min(0.05, previous ? (now - previous) / 1000 : 0)
      previous = now
      frame += 1
      if (enabledRef.current && !reducedMotionRef.current) elapsed += delta
      const liveCast = actorsRef.current.map((actor) => {
        const live = getNpcPatrol(actor, reducedMotionRef.current ? 0 : elapsed)
        return enabledRef.current ? live : { ...live, moving: false }
      })
      liveActorsRef.current = liveCast
      if (routesVisibleRef.current) {
        const source = liveCast.find((actor) => actor.presence.npcId === 'npc_rosetta')?.point
        if (source) for (const route of routesRef.current) {
          const target = route.player ? playerRef.current : liveCast.find((actor) => route.npcId && actor.presence.npcId === route.npcId)?.point
            ?? getCityDoor(TERRAN_LOCATION_IDS.find((id) => id === route.locationId) ?? 'location_terran_portal_plaza')
          const key = [source.x, source.y, target.x, target.y].map((value) => Math.round(value / 4)).join(':')
          let cached = routeCacheRef.current.get(route.id)
          if (!cached || cached.key !== key) {
            const path = findCityPath(source, target)
            cached = { key, d: `M ${source.x} ${source.y} ${path.map((point) => `L ${point.x} ${point.y}`).join(' ')}` }
            routeCacheRef.current.set(route.id, cached)
          }
          for (const prefix of ['world:', 'map:']) routePathsRef.current.get(prefix + route.id)?.setAttribute('d', cached.d)
        }
      }
      let walking = false
      if (enabledRef.current) {
        let dx = Number(keysRef.current.has('right')) - Number(keysRef.current.has('left'))
        let dy = Number(keysRef.current.has('down')) - Number(keysRef.current.has('up'))
        const destination = destinationRef.current
        const speed = 94 * delta
        if (dx === 0 && dy === 0 && destination) {
          const target = destination.actorId && liveCast.find((actor) => actor.id === destination.actorId)
          if (destination.actorId && !target) destinationRef.current = null
          else if (target && Math.hypot(target.point.x - playerRef.current.x, target.point.y - playerRef.current.y) < 20) {
            destinationRef.current = null
            arrive(destination)
          } else if (target && (destination.path.length === 0 || (now - destination.lastRepath > 400 && Math.hypot(target.point.x - destination.goal.x, target.point.y + 7 - destination.goal.y) > 6))) {
            const goal = { x: target.point.x, y: Math.min(CITY_HEIGHT - 8, target.point.y + 7) }
            destination.path = findCityPath(playerRef.current, goal)
            destination.goal = goal
            destination.lastRepath = now
          }
        }
        if (dx === 0 && dy === 0 && destinationRef.current) {
          const destination = destinationRef.current
          const waypoint = destination.path[0]
          if (!waypoint) { destinationRef.current = null; arrive(destination) }
          else {
            const distance = Math.hypot(waypoint.x - playerRef.current.x, waypoint.y - playerRef.current.y)
            if (distance <= speed + 0.4) {
              playerRef.current = { ...waypoint }
              destination.path.shift()
              if (!destination.path.length && !destination.actorId) { destinationRef.current = null; arrive(destination) }
            } else {
              dx = (waypoint.x - playerRef.current.x) / distance
              dy = (waypoint.y - playerRef.current.y) / distance
            }
          }
        }
        const magnitude = Math.hypot(dx, dy)
        if (magnitude > 0) {
          facingRef.current = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up')
          const next = { x: playerRef.current.x + dx / magnitude * speed, y: playerRef.current.y + dy / magnitude * speed }
          if (isCityWalkable(next)) { playerRef.current = next; walking = true }
          else if (isCityWalkable({ x: next.x, y: playerRef.current.y })) { playerRef.current.x = next.x; walking = true }
          else if (isCityWalkable({ x: playerRef.current.x, y: next.y })) { playerRef.current.y = next.y; walking = true }
          else if (destinationRef.current) destinationRef.current = null
        }
      }
      const camera = getCityCamera(playerRef.current)
      cameraRef.current = camera
      if (worldRef.current) worldRef.current.style.transform = `translate(${-camera.x / CITY_WIDTH * 100}%, ${-camera.y / CITY_HEIGHT * 100}%)`
      const inView = (point: WorldPoint) => point.x >= camera.x - 25 && point.x <= camera.x + CITY_VIEW_WIDTH + 25
        && point.y >= camera.y - 10 && point.y <= camera.y + CITY_VIEW_HEIGHT + 30
      for (const actor of liveCast) {
        const button = npcButtonsRef.current.get(actor.id)
        if (!button) continue
        button.style.left = `${actor.point.x / CITY_WIDTH * 100}%`
        button.style.top = `${(actor.point.y - CITY_NPC_SIZE / 2) / CITY_HEIGHT * 100}%`
        button.hidden = !inView(actor.point)
      }
      for (const id of TERRAN_LOCATION_IDS) {
        const button = siteButtonsRef.current.get(id)
        if (button) button.hidden = !inView(getCityPoint(id))
      }
      const homeButton = siteButtonsRef.current.get('home')
      if (homeButton) homeButton.hidden = !inView(PLAYER_HOME_CENTER)
      for (const landmark of terranLandmarks) {
        const button = landmarkButtonsRef.current.get(landmark.id)
        if (button) button.hidden = !inView(landmark.point)
      }
      mapPlayerRef.current?.setAttribute('cx', String(playerRef.current.x))
      mapPlayerRef.current?.setAttribute('cy', String(playerRef.current.y))
      mapViewRef.current?.setAttribute('x', String(camera.x))
      mapViewRef.current?.setAttribute('y', String(camera.y))
      if (districtRef.current) districtRef.current.textContent = getCityDistrict(playerRef.current)
      if (canvas) {
        canvas.dataset.cameraX = String(camera.x); canvas.dataset.cameraY = String(camera.y)
        canvas.dataset.playerX = String(Math.round(playerRef.current.x)); canvas.dataset.playerY = String(Math.round(playerRef.current.y))
      }
      drawPixelCity(ctx, playerRef.current, sheet, reducedMotionRef.current ? 0 : frame, walking && !reducedMotionRef.current, facingRef.current,
        portraitAssetId.includes('sigil') ? 'sigil' : 'terririan', liveCast, homeUnlockedRef.current, camera)
      const goal = destinationRef.current?.goal
      if (goal) {
        ctx.fillStyle = '#edc87e'
        ctx.fillRect(goal.x - camera.x - 4, goal.y - camera.y, 9, 1)
        ctx.fillRect(goal.x - camera.x, goal.y - camera.y - 4, 1, 9)
      }
      raf = requestAnimationFrame(tick)
    }
    window.addEventListener('keydown', keydown)
    window.addEventListener('keyup', keyup)
    window.addEventListener('blur', blur)
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('keydown', keydown)
      window.removeEventListener('keyup', keyup)
      window.removeEventListener('blur', blur)
    }
  }, [portraitAssetId])

  const pointerWalk = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!enabled) return
    const bounds = event.currentTarget.getBoundingClientRect()
    if (!bounds.width || !bounds.height) return
    const point = cityScreenToWorld({ x: Math.round((event.clientX - bounds.left) / bounds.width * CITY_VIEW_WIDTH), y: Math.round((event.clientY - bounds.top) / bounds.height * CITY_VIEW_HEIGHT) }, cameraRef.current)
    const actor = nearestNpc(point, liveActorsRef.current, 14)
    if (actor) { walkToActor(actor); return }
    const landmark = terranLandmarks.find((entry) => Math.hypot(point.x - entry.point.x, point.y - entry.point.y) < 26)
    if (landmark) { walkToLandmark(landmark); return }
    if (Math.hypot(point.x - PLAYER_HOME_CENTER.x, point.y - PLAYER_HOME_CENTER.y) < 31) { walkToHome(); return }
    const site = nearestSite(point, 30)
    if (site) walkToSite(site)
    else walkTo(point, null, null)
  }

  return (
    <div className="pixel-city" aria-label="Terran — mundo pixelado explorável">
      <canvas ref={canvasRef} width={CITY_VIEW_WIDTH} height={CITY_VIEW_HEIGHT} onPointerDown={pointerWalk}
        className="pixel-city__canvas" role="img" tabIndex={0}
        aria-label="Terran vista superior 3/4; caminhe por WASD, setas ou toque" />
      <div ref={worldRef} className="pixel-city__sites pixel-city__world" style={{ width: `${CITY_WIDTH / CITY_VIEW_WIDTH * 100}%`, height: `${CITY_HEIGHT / CITY_VIEW_HEIGHT * 100}%`, transform: `translate(${-cameraRef.current.x / CITY_WIDTH * 100}%, ${-cameraRef.current.y / CITY_HEIGHT * 100}%)` }}>
        {routesVisible && <svg className="rosetta-quest-lines" viewBox={`0 0 ${CITY_WIDTH} ${CITY_HEIGHT}`} role="img" aria-label="Caminhos dourados de Rosetta" data-reduced-motion={reducedMotion}>
          {questRoutes.map((route) => <path key={route.id} data-quest-ids={route.questIds.join(' ')}
            ref={(path) => { if (path) routePathsRef.current.set('world:' + route.id, path); else routePathsRef.current.delete('world:' + route.id) }}><title>{route.titles.join(' · ')}</title></path>)}
        </svg>}
        {TERRAN_LOCATION_IDS.map((id) => {
          const { x, y } = getCityPoint(id)
          return <button key={id} type="button" className={`pixel-city__site ${objectiveId === id ? 'is-objective' : ''}`}
            ref={(button) => { if (button) siteButtonsRef.current.set(id, button); else siteButtonsRef.current.delete(id) }}
            style={{ left: `${x / CITY_WIDTH * 100}%`, top: `${(y - 45) / CITY_HEIGHT * 100}%` }}
            aria-label={`Entrar em ${content.terranLocations[id].name}`}
            onClick={() => walkToSite(id)} disabled={!enabled}>
            {content.terranLocations[id].shortName}
            {objectiveId === id ? <b aria-label="Objetivo">!</b> : null}
          </button>
        })}
        <button type="button" className={`pixel-city__site pixel-city__home ${!homeUnlocked ? 'is-locked' : ''}`}
          ref={(button) => { if (button) siteButtonsRef.current.set('home', button); else siteButtonsRef.current.delete('home') }}
          style={{ left: `${PLAYER_HOME_CENTER.x / CITY_WIDTH * 100}%`, top: `${(PLAYER_HOME_CENTER.y - 45) / CITY_HEIGHT * 100}%` }}
          aria-label="Entrar em Base do Terrírian" title="Base do Terrírian · entrar"
          onClick={walkToHome} disabled={!enabled}>Base</button>
        {actors.map((actor) => <button key={actor.id} type="button" className={`pixel-city__npc ${actor.marker === '?' ? 'pixel-city__npc--guide' : ''}`}
          ref={(button) => { if (button) npcButtonsRef.current.set(actor.id, button); else npcButtonsRef.current.delete(actor.id) }}
          style={{ left: `${actor.point.x / CITY_WIDTH * 100}%`, top: `${(actor.point.y - CITY_NPC_SIZE / 2) / CITY_HEIGHT * 100}%`, width: `${CITY_NPC_SIZE / CITY_WIDTH * 100}%`, height: `${CITY_NPC_SIZE / CITY_HEIGHT * 100}%` }}
          aria-label={`Conversar com ${actor.presence.label}`} title={actor.presence.label}
          onPointerEnter={() => { if (actor.presence.npcId === 'npc_rosetta') setRosettaHovered(true) }}
          onPointerLeave={() => { if (actor.presence.npcId === 'npc_rosetta') setRosettaHovered(false) }}
          onFocus={() => { if (actor.presence.npcId === 'npc_rosetta') setRosettaFocused(true) }}
          onBlur={() => { if (actor.presence.npcId === 'npc_rosetta') setRosettaFocused(false) }}
          disabled={!enabled} onClick={() => walkToActor(actor)}>
          <NpcMarker state={actor.marker} phase={actor.markerPhase} />
        </button>)}
        {terranLandmarks.map((landmark) => <button key={landmark.id} type="button" className="pixel-city__landmark"
          ref={(button) => { if (button) landmarkButtonsRef.current.set(landmark.id, button); else landmarkButtonsRef.current.delete(landmark.id) }}
          style={{ left: `${landmark.point.x / CITY_WIDTH * 100}%`, top: `${(landmark.point.y - landmark.top - 8) / CITY_HEIGHT * 100}%` }}
          disabled={!enabled} aria-label={`Explorar ${landmark.name}`} title={landmark.name} onClick={() => walkToLandmark(landmark)}>✦</button>)}
      </div>
      <aside className="city-minimap" aria-label="Minimapa de Terran">
        <span ref={districtRef}>{getCityDistrict(playerRef.current)}</span>
        <svg viewBox={`0 0 ${CITY_WIDTH} ${CITY_HEIGHT}`} aria-label="Destinos e câmera da cidade">
          <rect width={CITY_WIDTH} height={CITY_HEIGHT} fill="#263f36" />
          {TERRAN_LOCATION_IDS.map((id) => {
            const p = getCityPoint(id), plaza = getCityPoint('location_terran_portal_plaza')
            return <path key={id} d={`M ${plaza.x} ${plaza.y} H ${p.x} V ${p.y}`} stroke="#8f7c57" strokeWidth="12" fill="none" />
          })}
          <g role="button" tabIndex={enabled ? 0 : -1} aria-disabled={!enabled} aria-label="Ir para Base do Terrírian"
            onClick={walkToHome} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); walkToHome() } }}>
            <title>Base do Terrírian</title>
            <rect x={PLAYER_HOME_CENTER.x - 25} y={PLAYER_HOME_CENTER.y - 22} width="50" height="44" fill="#7ca6ba" stroke="#19292d" strokeWidth="5" />
          </g>
          {TERRAN_LOCATION_IDS.map((id) => {
            const p = getCityPoint(id)
            return <g key={id} role="button" tabIndex={enabled ? 0 : -1} aria-disabled={!enabled} aria-label={`Ir para ${content.terranLocations[id].name}`}
              onClick={() => walkToSite(id)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); walkToSite(id) } }}>
              <title>{content.terranLocations[id].name}</title>
              <rect x={p.x - 27} y={p.y - 23} width="54" height="46" fill={id === objectiveId ? '#f2c36b' : '#99aba0'} stroke="#19292d" strokeWidth="5" />
            </g>
          })}
          {terranLandmarks.map((landmark) => <circle key={landmark.id} cx={landmark.point.x} cy={landmark.point.y} r="9" fill={landmarkFlags.includes(cityLandmarkFlag(landmark.id)) ? '#8caf8a' : '#d0ac69'} />)}
          {actors.filter((actor) => actor.marker).map((actor) => <circle key={actor.id} cx={actor.point.x} cy={actor.point.y} r="8" fill={actor.markerPhase === 'active' ? '#9da2a5' : actor.marker === '?' ? '#d56b72' : actor.marker === '!' ? '#f4ce65' : '#70c5df'} />)}
          {routesVisible && <g className="rosetta-minimap-lines" aria-hidden="true">{questRoutes.map((route) => <path key={route.id}
            ref={(path) => { if (path) routePathsRef.current.set('map:' + route.id, path); else routePathsRef.current.delete('map:' + route.id) }} />)}</g>}
          <rect ref={mapViewRef} x={cameraRef.current.x} y={cameraRef.current.y} width={CITY_VIEW_WIDTH} height={CITY_VIEW_HEIGHT} fill="none" stroke="#e5d6ad" strokeWidth="5" pointerEvents="none" />
          <circle ref={mapPlayerRef} cx={playerRef.current.x} cy={playerRef.current.y} r="11" fill="#ffe6a1" stroke="#17272d" strokeWidth="4" pointerEvents="none" />
        </svg>
        <small>! Missão · ◇ Sidequest · cinza: aceita</small>
        <small>{terranLandmarks.filter((landmark) => landmarkFlags.includes(cityLandmarkFlag(landmark.id))).length}/{terranLandmarks.length} pontos explorados</small>
      </aside>
      {routesVisible && <div className="rosetta-routes-caption"><span>{questRoutes.length} {questRoutes.length === 1 ? 'destino' : 'destinos'} de missão</span>
        {showQuestRoutes && <button type="button" onClick={() => { setRosettaHovered(false); setRosettaFocused(false); onHideQuestRoutes?.() }}>Ocultar caminhos</button>}</div>}
      <select className="city-destination" aria-label="Destino em Terran" defaultValue="" disabled={!enabled} onChange={(event) => {
        const value = event.target.value
        if (value === 'home') walkToHome()
        else if (value.startsWith('npc:')) { const actor = actors.find((entry) => entry.id === value.slice(4)); if (actor) walkToActor(actor) }
        else if (value.startsWith('landmark:')) { const landmark = terranLandmarks.find((entry) => entry.id === value.slice(9)); if (landmark) walkToLandmark(landmark) }
        else { const id = TERRAN_LOCATION_IDS.find((id) => id === value); if (id) walkToSite(id) }
        event.target.value = ''
      }}>
        <option value="" disabled>Explorar Terran…</option>
        <optgroup label="Locais">{TERRAN_LOCATION_IDS.map((id) => <option value={id} key={id}>{content.terranLocations[id].name}</option>)}<option value="home">Base do Terrírian</option></optgroup>
        <optgroup label="Moradores">{actors.map((actor) => <option key={actor.id} value={`npc:${actor.id}`}>{actor.marker ?? '·'} {actor.presence.label}</option>)}</optgroup>
        <optgroup label="Exploração">{terranLandmarks.map((landmark) => <option key={landmark.id} value={`landmark:${landmark.id}`}>{landmark.name}</option>)}</optgroup>
      </select>
      <div className="pixel-city__dpad" aria-label="Controle de movimento">
        {(['up', 'left', 'down', 'right'] as const).map((direction) => (
          <button key={direction} type="button" className={`pixel-city__direction pixel-city__direction--${direction}`}
            aria-label={`Mover ${direction}`} disabled={!enabled}
            onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); keysRef.current.add(direction); destinationRef.current = null }}
            onPointerUp={() => keysRef.current.delete(direction)} onPointerCancel={() => keysRef.current.delete(direction)}
            onLostPointerCapture={() => keysRef.current.delete(direction)}>
            {{ up: '▲', left: '◀', down: '▼', right: '▶' }[direction]}
          </button>
        ))}
        <button type="button" className="pixel-city__interact" disabled={!enabled} onClick={interactNearby}>E</button>
      </div>
    </div>
  )
}
