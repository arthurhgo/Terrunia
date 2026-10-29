import { useEffect, useRef, type PointerEvent } from 'react'
import { resolveAsset } from '../../assets/assetRegistry'
import { getRoomName, roomFurniture, type RoomFurniture, type TerranInteriorId, PLAYER_HOME_INTERIOR_ID } from './roomContent'
import type { TerranNpcPresence } from '../../content/types'
import { findInteriorPath, getInteriorResidents, isInteriorWalkable, type InteriorResident } from './interiorLayout'
import { getRoomPlan } from './roomGeometry'
import { drawTerranInterior } from './interiorArt'
import type { WorldPoint } from './pixelCityArt'
import type { ActorFacing } from './pixelActorArt'
import type { GameSave } from '../../domain/game/types'

type Interaction = 'exit' | 'services' | string | null
type Destination = { path: WorldPoint[]; interaction: Interaction; target: WorldPoint }
type Direction = ActorFacing

const directions: Record<string, Direction> = {
  w: 'up', arrowup: 'up', a: 'left', arrowleft: 'left',
  s: 'down', arrowdown: 'down', d: 'right', arrowright: 'right',
}
const distance = (a: WorldPoint, b: WorldPoint) => Math.hypot(a.x - b.x, a.y - b.y)

/**
 * The six institutions are explorable pixel rooms, not navigational pages.
 * NPC interaction only fires on arrival: clicking a resident walks over first.
 * A saved visit remains tied to the official Terran location ID.
 */
export function PixelInteriorCanvas({
  save, locationId, enabled, onTalk, onServices, onExit, onFurniture,
}: {
  save: GameSave
  locationId: TerranInteriorId
  enabled: boolean
  onTalk: (presence: TerranNpcPresence) => void
  onServices: () => void
  onExit: () => void
  onFurniture: (furniture: RoomFurniture) => void
}) {
  const residents = getInteriorResidents(save, locationId)
  const furniture = roomFurniture[locationId]
  const plan = getRoomPlan(locationId)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const playerRef = useRef<WorldPoint>({ ...plan.spawn })
  const faceRef = useRef<Direction>('up')
  const keysRef = useRef(new Set<Direction>())
  const destinationRef = useRef<Destination | null>(null)
  const enabledRef = useRef(enabled)
  const reducedRef = useRef(save.settings.reducedMotion)
  const residentsRef = useRef<InteriorResident[]>(residents)
  const talkRef = useRef(onTalk)
  const exitRef = useRef(onExit)
  const servicesRef = useRef(onServices)
  const furnitureRef = useRef(onFurniture)
  enabledRef.current = enabled
  reducedRef.current = save.settings.reducedMotion
  residentsRef.current = residents
  talkRef.current = onTalk
  exitRef.current = onExit
  servicesRef.current = onServices
  furnitureRef.current = onFurniture

  const interact = (interaction: Interaction) => {
    if (!interaction || !enabledRef.current) return
    if (interaction === 'exit') { exitRef.current(); return }
    if (interaction === 'services') { servicesRef.current(); return }
    const item = roomFurniture[locationId].find((entry) => entry.id === interaction)
    if (item) { furnitureRef.current(item); return }
    const resident = residentsRef.current.find((entry) => entry.presence.id === interaction)
    if (resident) talkRef.current(resident.presence)
  }
  const nearestInteraction = () => {
    const resident = residentsRef.current.find((entry) => distance(entry.position, playerRef.current) < 21)
    if (resident) return resident.presence.id
    const item = roomFurniture[locationId].find((entry) => distance(entry.point, playerRef.current) < 21)
    if (item) return item.id
    if (distance(plan.exit, playerRef.current) < 21) return 'exit'
    if (distance(plan.service, playerRef.current) < 22) return 'services'
    return null
  }
  const walkTo = (point: WorldPoint, interaction: Interaction = null) => {
    if (!enabledRef.current) return
    const next: Destination = {
      path: findInteriorPath(playerRef.current, point, locationId),
      interaction, target: point,
    }
    if (distance(playerRef.current, point) < (interaction ? 21 : 4)) {
      interact(interaction)
    } else if (next.path.length > 0) destinationRef.current = next
  }

  const interactRef = useRef(interact)
  const nearestRef = useRef(nearestInteraction)
  interactRef.current = interact
  nearestRef.current = nearestInteraction

  useEffect(() => {
    if (!enabled) { keysRef.current.clear(); destinationRef.current = null }
  }, [enabled])

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    const sprite = new Image()
    sprite.src = resolveAsset('character.terririan.map').path
    sprite.onerror = () => { sprite.onerror = null; sprite.src = resolveAsset('character.terririan.map').fallback }
    let frame = 0, raf = 0, last = 0
    const keydown = (event: KeyboardEvent) => {
      if (!enabledRef.current || event.altKey || event.ctrlKey || event.metaKey) return
      const target = event.target
      if (target instanceof HTMLElement && (
        ['INPUT', 'TEXTAREA', 'BUTTON', 'SELECT'].includes(target.tagName) || target.isContentEditable
      )) return
      const key = event.key.toLowerCase()
      if (directions[key]) {
        keysRef.current.add(directions[key])
        destinationRef.current = null
        event.preventDefault()
      } else if (key === 'e' || key === 'enter') {
        interactRef.current(nearestRef.current())
        event.preventDefault()
      }
    }
    const keyup = (event: KeyboardEvent) => {
      const dir = directions[event.key.toLowerCase()]
      if (dir) keysRef.current.delete(dir)
    }
    const clearKeys = () => keysRef.current.clear()
    const tick = (now: number) => {
      const dt = Math.min(.05, last ? (now - last) / 1000 : 0)
      last = now
      frame += 1
      let dx = Number(keysRef.current.has('right')) - Number(keysRef.current.has('left'))
      let dy = Number(keysRef.current.has('down')) - Number(keysRef.current.has('up'))
      let walking = false
      const speed = dt * 70
      if (enabledRef.current) {
        const dest = destinationRef.current
        if (!dx && !dy && dest) {
          const next = dest.path[0]
          if (!next) {
            destinationRef.current = null
            interactRef.current(dest.interaction)
          } else {
            const d = distance(next, playerRef.current)
            if (d < speed + .4) {
              playerRef.current = { ...next }
              dest.path.shift()
              if (dest.interaction && distance(playerRef.current, dest.target) < 21) {
                destinationRef.current = null
                interactRef.current(dest.interaction)
              } else if (!dest.path.length) destinationRef.current = null
            } else {
              dx = (next.x - playerRef.current.x) / d
              dy = (next.y - playerRef.current.y) / d
            }
          }
        }
        if (dx || dy) {
          const length = Math.hypot(dx, dy)
          faceRef.current = Math.abs(dx) > Math.abs(dy) ? dx > 0 ? 'right' : 'left' : dy > 0 ? 'down' : 'up'
          const next = {
            x: playerRef.current.x + dx / length * speed,
            y: playerRef.current.y + dy / length * speed,
          }
          if (isInteriorWalkable(next, locationId)) { playerRef.current = next; walking = true }
          else if (isInteriorWalkable({ x: next.x, y: playerRef.current.y }, locationId)) { playerRef.current.x = next.x; walking = true }
          else if (isInteriorWalkable({ x: playerRef.current.x, y: next.y }, locationId)) { playerRef.current.y = next.y; walking = true }
          else if (destinationRef.current) destinationRef.current = null
        }
      }
      drawTerranInterior(ctx, locationId, playerRef.current, sprite,
        reducedRef.current ? 0 : frame, faceRef.current, walking && !reducedRef.current,
        save.character.portraitAssetId, residentsRef.current)
      raf = requestAnimationFrame(tick)
    }
    window.addEventListener('keydown', keydown)
    window.addEventListener('keyup', keyup)
    window.addEventListener('blur', clearKeys)
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('keydown', keydown)
      window.removeEventListener('keyup', keyup)
      window.removeEventListener('blur', clearKeys)
    }
  }, [locationId, save.character.portraitAssetId])

  const pointerWalk = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!enabled) return
    const rect = event.currentTarget.getBoundingClientRect()
    if (!rect.width || !rect.height) return
    const point = {
      x: Math.round((event.clientX - rect.left) / rect.width * 384),
      y: Math.round((event.clientY - rect.top) / rect.height * 256),
    }
    const resident = residents.find((entry) => distance(point, entry.position) < 17)
    if (resident) walkTo({ x: resident.position.x, y: resident.position.y + 10 }, resident.presence.id)
    else {
      const item = roomFurniture[locationId].find((entry) => distance(point, entry.point) < 23)
      if (item) { walkTo(item.point, item.id); return }
      if (distance(point, plan.exit) < 25) walkTo(plan.exit, 'exit')
      else if (distance(point, plan.service) < 27) walkTo(plan.service, 'services')
      else walkTo(point)
    }
  }

  return <div className={`pixel-interior ${save.settings.reducedMotion ? 'pixel-interior--static' : ''}`} aria-label="Interior explorável de Terran">
    <canvas ref={canvasRef} width={384} height={256} role="img" tabIndex={0}
      className="pixel-interior__canvas" onPointerDown={pointerWalk}
      aria-label={`Interior pixelado de ${getRoomName(locationId)}; caminhe, aproxime-se dos NPCs e pressione E`} />
    <div className="pixel-interior__locations">
      <strong className="pixel-interior__name">INTERIOR · {getRoomName(locationId).toUpperCase()}</strong>
      {residents.map((resident) =>
        <button type="button" key={resident.presence.id} disabled={!enabled}
          className="pixel-interior__npc"
          title={resident.presence.label}
          aria-label={`Falar com ${resident.presence.label} dentro do local`}
          style={{ left: resident.position.x / 384 * 100 + '%', top: (resident.position.y - 9) / 256 * 100 + '%' }}
          onClick={() => walkTo({ x: resident.position.x, y: resident.position.y + 10 }, resident.presence.id)}>
          {resident.marker ? <span>{resident.marker}</span> : null}
        </button>)}
      {furniture.map((item) => <button type="button" key={item.id}
        className="pixel-interior__furniture" disabled={!enabled}
        aria-label={`Interagir com ${item.name}`} title={item.description}
        style={{ left: item.point.x / 384 * 100 + '%', top: (item.point.y - 9) / 256 * 100 + '%' }}
        onClick={() => walkTo(item.point, item.id)}>
        <span aria-hidden="true">✦</span>
      </button>)}
      <button type="button" disabled={!enabled}
        className="pixel-interior__service"
        style={{ left: `${plan.service.x / 384 * 100}%`, top: `${plan.service.y / 256 * 100}%` }}
        aria-label={locationId === PLAYER_HOME_INTERIOR_ID ? 'Abrir serviços da casa' : 'Abrir serviços do local'}
        onClick={onServices}>
        {locationId === PLAYER_HOME_INTERIOR_ID ? 'Casa' : 'Serviços'}
      </button>
      <button type="button" disabled={!enabled}
        className="pixel-interior__exit"
        style={{ left: `${plan.exit.x / 384 * 100}%`, top: `${plan.exit.y / 256 * 100}%` }}
        aria-label="Sair do interior para as ruas de Terran"
        onClick={() => { exitRef.current() }}>
        ↧ Sair para Terran
      </button>
    </div>
    <div className="pixel-city__dpad" aria-label="Controles do interior">
      {(['up', 'left', 'down', 'right'] as const).map((direction) =>
        <button type="button" key={direction} className={`pixel-city__direction pixel-city__direction--${direction}`}
          disabled={!enabled} aria-label={`Mover ${direction}`}
          onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); keysRef.current.add(direction); destinationRef.current = null }}
          onPointerUp={() => keysRef.current.delete(direction)} onPointerCancel={() => keysRef.current.delete(direction)}
          onLostPointerCapture={() => keysRef.current.delete(direction)}>
          {{ up: '▲', left: '◀', down: '▼', right: '▶' }[direction]}
        </button>)}
      <button type="button" className="pixel-city__interact" disabled={!enabled} onClick={() => interact(nearestInteraction())}>E</button>
    </div>
  </div>
}
