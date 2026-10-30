import { useEffect, useRef, type PointerEvent } from 'react'
import { resolveAsset } from '../../assets/assetRegistry'
import type { DungeonDefinition, DungeonRoomDefinition } from '../../content/types'
import type { ActorFacing } from '../terran/pixelActorArt'
import type { WorldPoint } from '../terran/pixelCityArt'
import { dungeonRoomFlag } from '../../domain/exploration/dungeonEngine'
import { DUNGEON_HEIGHT, DUNGEON_WIDTH, findDungeonPath, getDungeonPoint, isDungeonWalkable } from './dungeonNavigation'
import { drawFungalDungeon } from './fungalDungeonArt'

type Destination = { path: WorldPoint[]; roomId: string | null }
type Props = {
  dungeon: DungeonDefinition
  discoveredFlags: string[]
  bossDefeated: boolean
  portraitAssetId: string
  reducedMotion: boolean
  enabled: boolean
  onDiscover: (roomId: string) => void
  onInspect: (roomId: string) => void
  onTravelStart: () => void
}

const directions: Record<string, ActorFacing> = {
  arrowup: 'up', w: 'up', arrowdown: 'down', s: 'down',
  arrowleft: 'left', a: 'left', arrowright: 'right', d: 'right',
}

function nearbyRoom(point: WorldPoint, dungeon: DungeonDefinition, radius: number): DungeonRoomDefinition | null {
  let closest: DungeonRoomDefinition | null = null, shortest = radius
  for (const room of dungeon.rooms) {
    const distance = Math.hypot(room.landmark.x - point.x, room.landmark.y - point.y)
    if (distance < shortest) { closest = room; shortest = distance }
  }
  return closest
}

export function FungalDungeonCanvas({ dungeon, discoveredFlags, bossDefeated, portraitAssetId, reducedMotion, enabled, onDiscover, onInspect, onTravelStart }: Props) {
  const discovered = new Set(dungeon.rooms.filter((room) => discoveredFlags.includes(dungeonRoomFlag(room.id))).map((room) => room.id))
  const startingRoom = [...dungeon.rooms].reverse().find((room) => discovered.has(room.id)) ?? dungeon.rooms[0]
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const playerRef = useRef<WorldPoint>(getDungeonPoint(startingRoom))
  const facingRef = useRef<ActorFacing>('down')
  const heldRef = useRef(new Set<ActorFacing>())
  const destinationRef = useRef<Destination | null>(null)
  const enabledRef = useRef(enabled)
  const discoveredRef = useRef(discovered)
  const defeatedRef = useRef(bossDefeated)
  const inspectRef = useRef(onInspect)
  const discoverRef = useRef(onDiscover)
  const travelRef = useRef(onTravelStart)
  enabledRef.current = enabled
  discoveredRef.current = discovered
  defeatedRef.current = bossDefeated
  inspectRef.current = onInspect
  discoverRef.current = onDiscover
  travelRef.current = onTravelStart

  useEffect(() => {
    if (!enabled) { heldRef.current.clear(); destinationRef.current = null }
  }, [enabled])

  const walkTo = (point: WorldPoint, roomId: string | null) => {
    if (!enabledRef.current) return
    if (Math.hypot(playerRef.current.x - point.x, playerRef.current.y - point.y) < (roomId ? 18 : 4)) {
      if (roomId) inspectRef.current(roomId)
      return
    }
    const path = findDungeonPath(playerRef.current, point, dungeon)
    if (path.length) { destinationRef.current = { path, roomId }; travelRef.current() }
  }

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    const sheet = new Image()
    sheet.src = resolveAsset(portraitAssetId).path
    sheet.onerror = () => { sheet.onerror = null; sheet.src = resolveAsset(portraitAssetId).fallback }
    let raf = 0, frame = 0, previous = 0
    const keydown = (event: KeyboardEvent) => {
      if (!enabledRef.current || event.altKey || event.metaKey || event.ctrlKey) return
      const target = event.target
      if (target instanceof HTMLElement && (['BUTTON', 'INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName) || target.isContentEditable)) return
      const key = event.key.toLowerCase()
      if (directions[key]) {
        if (!heldRef.current.size) travelRef.current()
        heldRef.current.add(directions[key]); destinationRef.current = null; event.preventDefault()
      }
      if (key === 'e' || key === 'enter') {
        const room = nearbyRoom(playerRef.current, dungeon, 24)
        if (room) inspectRef.current(room.id)
        event.preventDefault()
      }
    }
    const keyup = (event: KeyboardEvent) => { const facing = directions[event.key.toLowerCase()]; if (facing) heldRef.current.delete(facing) }
    const blur = () => heldRef.current.clear()
    const tick = (now: number) => {
      const dt = Math.min(0.05, previous ? (now - previous) / 1000 : 0)
      previous = now
      frame++
      let dx = 0, dy = 0, walking = false
      if (enabledRef.current) {
        dx = Number(heldRef.current.has('right')) - Number(heldRef.current.has('left'))
        dy = Number(heldRef.current.has('down')) - Number(heldRef.current.has('up'))
        const target = destinationRef.current
        const speed = 78 * dt
        if (!dx && !dy && target) {
          const waypoint = target.path[0]
          if (!waypoint) { destinationRef.current = null; if (target.roomId) inspectRef.current(target.roomId) }
          else {
            const distance = Math.hypot(waypoint.x - playerRef.current.x, waypoint.y - playerRef.current.y)
            if (distance <= speed + 0.4) {
              playerRef.current = { ...waypoint }
              target.path.shift()
              if (!target.path.length) { destinationRef.current = null; if (target.roomId) inspectRef.current(target.roomId) }
            } else { dx = (waypoint.x - playerRef.current.x) / distance; dy = (waypoint.y - playerRef.current.y) / distance }
          }
        }
        const magnitude = Math.hypot(dx, dy)
        if (magnitude) {
          facingRef.current = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up')
          const next = { x: playerRef.current.x + dx / magnitude * speed, y: playerRef.current.y + dy / magnitude * speed }
          if (isDungeonWalkable(next, dungeon)) { playerRef.current = next; walking = true }
          else if (isDungeonWalkable({ x: next.x, y: playerRef.current.y }, dungeon)) { playerRef.current.x = next.x; walking = true }
          else if (isDungeonWalkable({ x: playerRef.current.x, y: next.y }, dungeon)) { playerRef.current.y = next.y; walking = true }
          else destinationRef.current = null
        }
        for (let i = 1; i < dungeon.rooms.length; i++) {
          const room = dungeon.rooms[i]
          const { rect } = room
          const pos = playerRef.current
          if (discoveredRef.current.has(room.id) || !discoveredRef.current.has(dungeon.rooms[i - 1].id)) continue
          if (pos.x >= rect.x + 8 && pos.x <= rect.x + rect.width - 8 && pos.y >= rect.y + 8 && pos.y <= rect.y + rect.height - 8) {
            discoveredRef.current.add(room.id)
            discoverRef.current(room.id)
            break
          }
        }
      }
      drawFungalDungeon(ctx, dungeon, playerRef.current, sheet, reducedMotion ? 0 : frame,
        walking && !reducedMotion, facingRef.current, portraitAssetId.includes('sigil') ? 'sigil' : 'terririan',
        { discovered: discoveredRef.current, defeated: defeatedRef.current })
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
  }, [dungeon, reducedMotion, portraitAssetId])

  const pointerWalk = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!enabled) return
    const rect = event.currentTarget.getBoundingClientRect()
    if (!rect.width || !rect.height) return
    const point = { x: Math.round((event.clientX - rect.left) / rect.width * DUNGEON_WIDTH), y: Math.round((event.clientY - rect.top) / rect.height * DUNGEON_HEIGHT) }
    const room = nearbyRoom(point, dungeon, 15)
    walkTo(room?.landmark ?? point, room?.id ?? null)
  }

  return <div className="pixel-city dungeon-field" aria-label="Exploração pixelada do interior das Câmaras Fúngicas">
    <canvas ref={canvasRef} width={DUNGEON_WIDTH} height={DUNGEON_HEIGHT} className="pixel-city__canvas"
      role="img" tabIndex={0} aria-label="Dungeon em pixels, quatro salas; caminhe com WASD, setas ou toque" onPointerDown={pointerWalk} />
    <div className="dungeon-field__nodes">
      {dungeon.rooms.map((room, index) => <button key={room.id} type="button" disabled={!enabled}
        className={`dungeon-field__node ${discovered.has(room.id) ? 'dungeon-field__node--discovered' : ''}`}
        style={{ left: `${room.landmark.x / DUNGEON_WIDTH * 100}%`, top: `${(room.landmark.y - 27) / DUNGEON_HEIGHT * 100}%` }}
        aria-label={`Aproximar-se de ${room.name}`} onClick={() => walkTo(room.landmark, room.id)}>
        <strong>{index + 1}</strong><span>{room.name}</span>
      </button>)}
    </div>
    <div className="pixel-city__dpad" aria-label="Controle de movimento da dungeon">
      {(['up', 'left', 'down', 'right'] as const).map((direction) => <button key={direction} type="button"
        className={`pixel-city__direction pixel-city__direction--${direction}`} aria-label={`Mover ${direction}`} disabled={!enabled}
        onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); heldRef.current.add(direction); destinationRef.current = null; travelRef.current() }}
        onPointerUp={() => heldRef.current.delete(direction)} onPointerCancel={() => heldRef.current.delete(direction)}
        onLostPointerCapture={() => heldRef.current.delete(direction)}>
        {{ up: '▲', left: '◀', down: '▼', right: '▶' }[direction]}
      </button>)}
      <button type="button" className="pixel-city__interact" disabled={!enabled} onClick={() => {
        const room = nearbyRoom(playerRef.current, dungeon, 24)
        if (room) inspectRef.current(room.id)
      }} aria-label="Interagir com sala próxima">E</button>
    </div>
  </div>
}
