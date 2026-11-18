import { useEffect, useRef, useState } from 'react'
import { content } from '../../content/catalog'
import { TERRAN_LOCATION_IDS, type TerranLocationId } from '../../content/terran'
import { terranLandmarks, type TerranLandmark } from '../../content/terranExploration'
import type { TerranNpcPresence } from '../../content/types'
import type { GameSave } from '../../domain/game/types'
import { getPresencePortrait } from '../../content/npcVisuals'
import { EquippedCharacter } from '../characters/EquippedCharacter'
import { AssetImage } from '../components/AssetImage'
import { type CityActor } from './cityCast'
import { CITY_WIDTH, CITY_HEIGHT, PLAYER_HOME_CENTER, PLAYER_HOME_DOOR, getCityDoor, getCityPoint, getCityDistrict, getLandmarkApproach, type WorldPoint } from './cityWorld'
import { findCityPath, isCityWalkable } from './cityNavigation'
import { findInteriorPath, getInteriorResidents, isInteriorWalkable } from './interiorLayout'
import { getRoomPlan } from './roomGeometry'
import { roomFurniture, getRoomName, type RoomFurniture, type TerranInteriorId } from './roomContent'
import { CLAN_HALL_MINI_PORTAL_ID } from '../../content/clanCastlesV05142'
import './isometricPlayable.css'

type Action = string | null
type Destination = { path: WorldPoint[]; goal: WorldPoint; action: Action }
const distance = (a: WorldPoint, b: WorldPoint) => Math.hypot(a.x - b.x, a.y - b.y)
const position = (point: WorldPoint, width: number, height: number) => ({
  left: String(point.x * 100 / width) + '%',
  top: String(point.y * 100 / height) + '%',
})
const directionKeys: Record<string, WorldPoint> = {
  w: { x: 0, y: -1 }, arrowup: { x: 0, y: -1 },
  s: { x: 0, y: 1 }, arrowdown: { x: 0, y: 1 },
  a: { x: -1, y: 0 }, arrowleft: { x: -1, y: 0 },
  d: { x: 1, y: 0 }, arrowright: { x: 1, y: 0 },
}

/**
 * One navigation adapter used by city and interiors; the domain actions remain
 * in TerranScene. This never writes a position to GameSave and never grants rewards.
 */
export function useIsoMovement({
  initial, enabled, speed, pathTo, walkable, onInteract, nearest,
}: {
  initial: WorldPoint; enabled: boolean; speed: number
  pathTo: (start: WorldPoint, goal: WorldPoint) => WorldPoint[]
  walkable: (point: WorldPoint) => boolean
  onInteract: (action: string) => void
  nearest: (point: WorldPoint) => Action
}) {
  const [player, setPlayer] = useState<WorldPoint>(() => ({ ...initial }))
  const heroRef = useRef(player)
  heroRef.current = player
  const keysRef = useRef(new Set<string>())
  const destinationRef = useRef<Destination | null>(null)
  const latestRef = useRef({ enabled, speed, pathTo, walkable, onInteract, nearest })
  latestRef.current = { enabled, speed, pathTo, walkable, onInteract, nearest }

  const travelTo = (goal: WorldPoint, action: Action = null) => {
    if (!latestRef.current.enabled) return
    const distanceTo = distance(heroRef.current, goal)
    if (action && distanceTo < 20) { latestRef.current.onInteract(action); return }
    const path = latestRef.current.pathTo(heroRef.current, goal)
    if (path.length > 0) destinationRef.current = { path, goal, action }
  }

  useEffect(() => {
    if (!enabled) { keysRef.current.clear(); destinationRef.current = null }
  }, [enabled])

  useEffect(() => {
    let last = 0
    let raf = 0
    const down = (event: KeyboardEvent) => {
      if (!latestRef.current.enabled || event.altKey || event.ctrlKey || event.metaKey) return
      const target = event.target
      if (target instanceof HTMLElement && (['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable || (target.tagName === 'BUTTON' && !target.closest('.iso-play')))) return
      const key = event.key.toLowerCase()
      if (directionKeys[key]) { keysRef.current.add(key); destinationRef.current = null; event.preventDefault() }
      if (key === 'e' || key === 'enter') {
        const action = latestRef.current.nearest(heroRef.current)
        if (action) latestRef.current.onInteract(action)
        event.preventDefault()
      }
    }
    const up = (event: KeyboardEvent) => keysRef.current.delete(event.key.toLowerCase())
    const blur = () => keysRef.current.clear()
    const tick = (now: number) => {
      const cfg = latestRef.current
      const dt = Math.min(.05, last ? (now - last) / 1000 : 0)
      last = now
      if (cfg.enabled && dt > 0) {
        let dx = Number(keysRef.current.has('d') || keysRef.current.has('arrowright')) -
          Number(keysRef.current.has('a') || keysRef.current.has('arrowleft'))
        let dy = Number(keysRef.current.has('s') || keysRef.current.has('arrowdown')) -
          Number(keysRef.current.has('w') || keysRef.current.has('arrowup'))
        const destination = destinationRef.current
        const stepSize = cfg.speed * dt
        if (dx === 0 && dy === 0 && destination) {
          const point = destination.path[0]
          if (!point) {
            destinationRef.current = null
            if (destination.action && distance(heroRef.current, destination.goal) < 30) cfg.onInteract(destination.action)
          } else {
            const remaining = distance(heroRef.current, point)
            if (remaining <= stepSize + .3) {
              heroRef.current = { ...point }
              setPlayer(heroRef.current)
              destination.path.shift()
              if (!destination.path.length) {
                destinationRef.current = null
                if (destination.action) cfg.onInteract(destination.action)
              }
            } else {
              dx = (point.x - heroRef.current.x) / remaining
              dy = (point.y - heroRef.current.y) / remaining
            }
          }
        }
        const magnitude = Math.hypot(dx, dy)
        if (magnitude) {
          const next = { x: heroRef.current.x + dx / magnitude * stepSize,
            y: heroRef.current.y + dy / magnitude * stepSize }
          if (cfg.walkable(next)) { heroRef.current = next; setPlayer(next) }
          else if (cfg.walkable({ x: next.x, y: heroRef.current.y })) {
            heroRef.current = { x: next.x, y: heroRef.current.y }; setPlayer(heroRef.current)
          } else if (cfg.walkable({ x: heroRef.current.x, y: next.y })) {
            heroRef.current = { x: heroRef.current.x, y: next.y }; setPlayer(heroRef.current)
          } else destinationRef.current = null
        }
      }
      raf = window.requestAnimationFrame(tick)
    }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', blur)
    raf = window.requestAnimationFrame(tick)
    return () => {
      window.cancelAnimationFrame(raf)
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', blur)
    }
  }, [])
  return { player, travelTo }
}

function Hero({ save, player, room = false }: { save: GameSave; player: WorldPoint; room?: boolean }) {
  return <div className="iso-play__hero" aria-label="Personagem na cena isométrica"
    style={position(player, room ? 384 : CITY_WIDTH, room ? 256 : CITY_HEIGHT)}>
    <span className="iso-play__aura" aria-hidden="true" />
    <EquippedCharacter save={save} facing="down" />
  </div>
}

function Npc({ presence, marker, point, width, height, onClick }: {
  presence: TerranNpcPresence; marker: string | null; point: WorldPoint; width: number; height: number; onClick: () => void
}) {
  return <button className="iso-play__npc" type="button" style={position(point, width, height)}
    onClick={onClick} aria-label={'Conversar com ' + presence.label}>
    <AssetImage assetId={getPresencePortrait(presence)} alt="" />
    <span>{presence.label}</span>
    {marker ? <b className="iso-play__quest">{marker}</b> : null}
  </button>
}

export function IsometricCityCanvas({ save, enabled, actors, spawnPoint, currentLocationId,
  onEnter, onEnterHome, onTalk, onInspectLandmark,
}: {
  save: GameSave; enabled: boolean; actors: readonly CityActor[]; spawnPoint?: WorldPoint | null; currentLocationId: string
  onEnter: (id: TerranLocationId) => void; onEnterHome: () => void
  onTalk: (id: TerranLocationId, presence: TerranNpcPresence) => void
  onInspectLandmark: (landmark: TerranLandmark) => void
}) {
  const action = (id: string) => {
    if (id === 'home') { onEnterHome(); return }
    if (id.startsWith('site:')) {
      const value = id.slice(5) as TerranLocationId
      if (TERRAN_LOCATION_IDS.includes(value)) onEnter(value)
    }
    if (id.startsWith('npc:')) {
      const npc = actors.find((entry) => entry.id === id.slice(4))
      if (npc) onTalk(npc.locationId, npc.presence)
    }
    if (id.startsWith('landmark:')) {
      const landmark = terranLandmarks.find((entry) => entry.id === id.slice(9))
      if (landmark) onInspectLandmark(landmark)
    }
  }
  const nearest = (point: WorldPoint) => {
    const npc = actors.find((entry) => distance(point, entry.point) < 22)
    if (npc) return 'npc:' + npc.id
    if (distance(point, PLAYER_HOME_DOOR) < 26) return 'home'
    const site = TERRAN_LOCATION_IDS.find((id) => distance(point, getCityDoor(id)) < 27)
    if (site) return 'site:' + site
    const landmark = terranLandmarks.find((entry) => distance(point, getLandmarkApproach(entry)) < 22)
    return landmark ? 'landmark:' + landmark.id : null
  }
  const spawnId = TERRAN_LOCATION_IDS.find((id) => id === currentLocationId) ?? 'location_terran_portal_plaza'
  const { player, travelTo } = useIsoMovement({
    initial: spawnPoint ?? getCityDoor(spawnId),
    enabled, speed: 94, walkable: isCityWalkable, pathTo: findCityPath, onInteract: action, nearest,
  })
  return <section className="iso-play iso-play--city" role="region" aria-label="Cenário isométrico jogável de Terran"
    data-testid="iso-terran-playable">
    <div className="iso-play__heads-up"><strong>{getCityDistrict(player)}</strong><span>WASD / Setas · E interagir · Clique para caminhar</span></div>
    <div className="iso-play__perspective">
      <div className="iso-play__map">
        <div className="iso-play__road iso-play__road--x" /><div className="iso-play__road iso-play__road--y" />
        {TERRAN_LOCATION_IDS.map((id) => {
          const site = content.terranLocations[id]
          return <button key={id} type="button" className={'iso-play__building' + (id === 'location_terran_portal_plaza' ? ' iso-play__building--portal' : '')}
            style={position(getCityPoint(id), CITY_WIDTH, CITY_HEIGHT)}
            onClick={() => travelTo(getCityDoor(id), 'site:' + id)}
            aria-label={'Entrar em ' + site.name}>
            <span className="iso-play__building-body"><i /></span>
            <span className="iso-play__billboard">{site.shortName}</span>
          </button>
        })}
        <button type="button" className="iso-play__building iso-play__building--home"
          onClick={() => travelTo(PLAYER_HOME_DOOR, 'home')}
          aria-label="Entrar na Base do Terrírian" style={position(PLAYER_HOME_CENTER, CITY_WIDTH, CITY_HEIGHT)}>
          <span className="iso-play__building-body"><i /></span><span className="iso-play__billboard">Minha Base</span>
        </button>
        {terranLandmarks.map((landmark) => <button key={landmark.id} type="button"
          className="iso-play__landmark" style={position(landmark.point, CITY_WIDTH, CITY_HEIGHT)}
          onClick={() => travelTo(getLandmarkApproach(landmark), 'landmark:' + landmark.id)}
          aria-label={'Inspecionar ' + landmark.name}>✧</button>)}
        {actors.map((actor) => <Npc key={actor.id} presence={actor.presence}
          marker={actor.marker ? String(actor.marker) : null} point={actor.point}
          width={CITY_WIDTH} height={CITY_HEIGHT}
          onClick={() => travelTo(actor.point, 'npc:' + actor.id)} />)}
        <Hero save={save} player={player} />
      </div>
    </div>
    <div className="iso-play__actions">
      <button type="button" disabled={!enabled || !nearest(player)}
        onClick={() => { const near = nearest(player); if (near) action(near) }}>Interagir (E)</button>
      <span>Visual experimental · mesmos serviços, NPCs e quests do modo clássico</span>
    </div>
  </section>
}

export function IsometricInteriorCanvas({ save, locationId, enabled, onTalk, onServices, onExit, onFurniture }: {
  save: GameSave; locationId: TerranInteriorId; enabled: boolean
  onTalk: (presence: TerranNpcPresence) => void; onServices: () => void
  onExit: () => void; onFurniture: (furniture: RoomFurniture) => void
}) {
  const plan = getRoomPlan(locationId)
  const residents = getInteriorResidents(save, locationId)
  const furniture = roomFurniture[locationId].filter((item) => item.id !== CLAN_HALL_MINI_PORTAL_ID || Boolean(save.character.clan.clanId))
  const action = (id: string) => {
    if (id === 'exit') { onExit(); return }
    if (id === 'services') { onServices(); return }
    const object = furniture.find((item) => item.id === id)
    if (object) { onFurniture(object); return }
    const person = residents.find((item) => item.presence.id === id)
    if (person) onTalk(person.presence)
  }
  const nearest = (point: WorldPoint) => {
    const npc = residents.find((item) => distance(point, item.position) < 21)
    if (npc) return npc.presence.id
    const object = furniture.find((item) => distance(point, item.point) < 22)
    if (object) return object.id
    if (distance(point, plan.exit) < 23) return 'exit'
    if (distance(point, plan.service) < 22) return 'services'
    return null
  }
  const { player, travelTo } = useIsoMovement({
    initial: plan.spawn, enabled, speed: 88, pathTo: (a, b) => findInteriorPath(a, b, locationId),
    walkable: (point) => isInteriorWalkable(point, locationId), onInteract: action, nearest,
  })
  return <section className="iso-play iso-play--room" role="region" aria-label={'Interior isométrico jogável: ' + getRoomName(locationId)}
    data-testid="iso-interior-playable">
    <div className="iso-play__heads-up"><strong>{getRoomName(locationId)}</strong><span>WASD / Setas · E interagir · Clique nos objetos</span></div>
    <div className="iso-play__perspective">
      <div className={'iso-play__map iso-play__map--room iso-play__map--' + plan.tile}>
        <div className="iso-play__wall iso-play__wall--top" /><div className="iso-play__wall iso-play__wall--left" />
        {plan.obstacles.map((rect, i) => <div className="iso-play__obstacle" key={i}
          style={{ left: String(rect.x / 384 * 100) + '%', top: String(rect.y / 256 * 100) + '%',
            width: String(rect.w / 384 * 100) + '%', height: String(rect.h / 256 * 100) + '%' }} />)}
        {furniture.map((item) =>
          <button key={item.id} type="button" className="iso-play__furniture"
            style={position(item.point, 384, 256)} onClick={() => travelTo(item.point, item.id)}
            title={item.description} aria-label={'Interagir com ' + item.name}>
            <span className="iso-play__furniture-body" /><span className="iso-play__billboard">{item.name}</span>
          </button>)}
        {residents.map(({ presence, position: npcPosition, marker }) =>
          <Npc key={presence.id} presence={presence} marker={marker ? String(marker) : null}
            point={npcPosition} width={384} height={256}
            onClick={() => travelTo(npcPosition, presence.id)} />)}
        <button type="button" className="iso-play__exit" style={position(plan.exit, 384, 256)}
          onClick={() => travelTo(plan.exit, 'exit')} aria-label="Sair para Terran">↩ Saída</button>
        <button type="button" className="iso-play__services" style={position(plan.service, 384, 256)}
          onClick={() => travelTo(plan.service, 'services')} aria-label="Abrir serviços do interior">Serviços</button>
        <Hero save={save} room player={player} />
      </div>
    </div>
    <div className="iso-play__actions">
      <button type="button" disabled={!enabled || !nearest(player)}
        onClick={() => { const near = nearest(player); if (near) action(near) }}>Interagir (E)</button>
      <span>NPCs, ritos, loja, missões, cama e baú acionam os mesmos handlers do jogo</span>
    </div>
  </section>
}
