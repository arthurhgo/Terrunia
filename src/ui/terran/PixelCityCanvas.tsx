import { useEffect, useRef, type PointerEvent } from 'react'
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

type Direction = ActorFacing
type Destination = {
  path: WorldPoint[]
  site: TerranLocationId | null
  actorId: string | null
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

export function PixelCityCanvas({ portraitAssetId, reducedMotion, currentLocationId, enabled, objectiveId, actors, homeUnlocked, spawnPoint, onEnterHome, onEnter, onTalk }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const keysRef = useRef(new Set<Direction>())
  const destinationRef = useRef<Destination | null>(null)
  const initialId = TERRAN_LOCATION_IDS.find((id) => id === currentLocationId) ?? 'location_terran_portal_plaza'
  const playerRef = useRef<WorldPoint>({ ...(spawnPoint ?? getCityDoor(initialId)) })
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
    else if (destination.home) homeEnterRef.current()
    else if (destination.site) enterRef.current(destination.site)
  }

  const walkTo = (point: WorldPoint, site: TerranLocationId | null, actorId: string | null, home = false) => {
    if (!enabledRef.current) return
    const distance = Math.hypot(point.x - playerRef.current.x, point.y - playerRef.current.y)
    const destination: Destination = { path: findCityPath(playerRef.current, point), site, actorId, home, goal: point, lastRepath: 0 }
    if (distance < (site || actorId || home ? 17 : 4)) { arrive(destination); return }
    if (destination.path.length > 0) destinationRef.current = destination
  }

  const walkToSite = (site: TerranLocationId) => walkTo(getCityDoor(site), site, null)
  const walkToHome = () => walkTo(PLAYER_HOME_DOOR, null, null, true)
  const walkToActor = (actor: CityActor) => {
    const live = liveActorsRef.current.find((candidate) => candidate.id === actor.id) ?? actor
    walkTo({ x: live.point.x, y: Math.min(CITY_HEIGHT - 8, live.point.y + 7) }, null, actor.id)
  }

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!ctx) return
    let frame = 0, raf = 0, previous = 0, elapsed = 0
    const sheet = new Image()
    sheet.src = resolveAsset('character.terririan.map').path
    sheet.onerror = () => { sheet.onerror = null; sheet.src = resolveAsset('character.terririan.map').fallback }
    const keydown = (event: KeyboardEvent) => {
      if (!enabledRef.current || event.altKey || event.ctrlKey || event.metaKey) return
      const target = event.target
      if (target instanceof HTMLElement && (['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(target.tagName) || target.isContentEditable)) return
      const key = event.key.toLowerCase()
      if (directions[key]) { keysRef.current.add(directions[key]); destinationRef.current = null; event.preventDefault() }
      if (key === 'e' || key === 'enter') {
        const actor = nearestNpc(playerRef.current, liveActorsRef.current, 19)
        if (actor) talkRef.current(actor.locationId, actor.presence)
        else if (Math.hypot(playerRef.current.x - PLAYER_HOME_DOOR.x, playerRef.current.y - PLAYER_HOME_DOOR.y) < 28) homeEnterRef.current()
        else { const site = nearestSite(playerRef.current, 29); if (site) enterRef.current(site) }
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
      for (const actor of liveCast) {
        const button = npcButtonsRef.current.get(actor.id)
        if (!button) continue
        button.style.left = `${actor.point.x / CITY_WIDTH * 100}%`
        button.style.top = `${(actor.point.y - 9) / CITY_HEIGHT * 100}%`
      }
      let walking = false
      if (enabledRef.current) {
        let dx = Number(keysRef.current.has('right')) - Number(keysRef.current.has('left'))
        let dy = Number(keysRef.current.has('down')) - Number(keysRef.current.has('up'))
        const destination = destinationRef.current
        const speed = 70 * delta
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
      drawPixelCity(ctx, playerRef.current, sheet, reducedMotionRef.current ? 0 : frame, walking && !reducedMotionRef.current, facingRef.current,
        portraitAssetId.includes('sigil') ? 'sigil' : 'terririan', liveCast, homeUnlockedRef.current)
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
    const point = { x: Math.round((event.clientX - bounds.left) / bounds.width * CITY_WIDTH), y: Math.round((event.clientY - bounds.top) / bounds.height * CITY_HEIGHT) }
    const actor = nearestNpc(point, liveActorsRef.current, 14)
    if (actor) { walkToActor(actor); return }
    if (Math.hypot(point.x - PLAYER_HOME_CENTER.x, point.y - PLAYER_HOME_CENTER.y) < 31) { walkToHome(); return }
    const site = nearestSite(point, 30)
    if (site) walkToSite(site)
    else walkTo(point, null, null)
  }

  return (
    <div className="pixel-city" aria-label="Terran — mundo pixelado explorável">
      <canvas ref={canvasRef} width={CITY_WIDTH} height={CITY_HEIGHT} onPointerDown={pointerWalk}
        className="pixel-city__canvas" role="img" tabIndex={0}
        aria-label="Terran vista superior 3/4; caminhe por WASD, setas ou toque" />
      <div className="pixel-city__sites">
        {TERRAN_LOCATION_IDS.map((id) => {
          const { x, y } = getCityPoint(id)
          return <button key={id} type="button" className={`pixel-city__site ${objectiveId === id ? 'is-objective' : ''}`}
            style={{ left: `${x / CITY_WIDTH * 100}%`, top: `${(y - 31) / CITY_HEIGHT * 100}%` }}
            aria-label={`Ir para ${content.terranLocations[id].name}`}
            onClick={() => walkToSite(id)} disabled={!enabled}>
            {content.terranLocations[id].shortName}
            {objectiveId === id ? <b aria-label="Objetivo">!</b> : null}
          </button>
        })}
        <button type="button" className={`pixel-city__site pixel-city__home ${!homeUnlocked ? 'is-locked' : ''}`}
          style={{ left: `${PLAYER_HOME_CENTER.x / CITY_WIDTH * 100}%`, top: `${(PLAYER_HOME_CENTER.y - 31) / CITY_HEIGHT * 100}%` }}
          aria-label="Ir para Base do Terrírian" title="Base do Terrírian · entrar"
          onClick={walkToHome} disabled={!enabled}>Base</button>
        {actors.map((actor) => <button key={actor.id} type="button" className={`pixel-city__npc ${actor.marker === '?' ? 'pixel-city__npc--guide' : ''}`}
          ref={(button) => { if (button) npcButtonsRef.current.set(actor.id, button); else npcButtonsRef.current.delete(actor.id) }}
          style={{ left: `${actor.point.x / CITY_WIDTH * 100}%`, top: `${(actor.point.y - 9) / CITY_HEIGHT * 100}%` }}
          aria-label={`Conversar com ${actor.presence.label}`} title={actor.presence.label}
          disabled={!enabled} onClick={() => walkToActor(actor)}>
          {actor.marker ? <span className={actor.marker === '?' ? 'pixel-city__question-mark' : undefined} aria-hidden="true">{actor.marker}</span> : null}
        </button>)}
      </div>
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
        <button type="button" className="pixel-city__interact" disabled={!enabled} onClick={() => {
          const actor = nearestNpc(playerRef.current, liveActorsRef.current, 19)
          if (actor) talkRef.current(actor.locationId, actor.presence)
          else if (Math.hypot(playerRef.current.x - PLAYER_HOME_DOOR.x, playerRef.current.y - PLAYER_HOME_DOOR.y) < 28) homeEnterRef.current()
          else { const site = nearestSite(playerRef.current, 29); if (site) enterRef.current(site) }
        }}>E</button>
      </div>
    </div>
  )
}
