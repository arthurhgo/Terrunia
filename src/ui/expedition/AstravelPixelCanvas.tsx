import { useCallback, useEffect, useRef, useState, type PointerEvent } from 'react'
import { content } from '../../content/catalog'
import { resolveAsset } from '../../assets/assetRegistry'
import type { TrailDefinition, TrailNodeDefinition } from '../../content/types'
import type { TrailNodeStatus } from '../../domain/game/types'
import type { ActorFacing } from '../terran/pixelActorArt'
import type { WorldPoint } from '../terran/pixelCityArt'
import { drawAstravel } from './astravelArt'
import { ASTRAVEL_HEIGHT, ASTRAVEL_WIDTH, ASTRAVEL_VIEW_WIDTH, ASTRAVEL_VIEW_HEIGHT, getAstravelCamera, findAstravelPath, getAstravelPoint, isAstravelWalkable } from './astravelNavigation'

type Destination = { path: WorldPoint[]; nodeId: string | null }
type Props = {
  trail: TrailDefinition
  statuses: Record<string, TrailNodeStatus>
  currentLocationId: string
  portraitAssetId: string
  reducedMotion: boolean
  enabled: boolean
  onInspect: (nodeId: string) => void
  onEngage: (nodeId: string) => boolean
  onTravelStart: () => void
}

const keys: Record<string, ActorFacing> = {
  arrowup: 'up', w: 'up', arrowdown: 'down', s: 'down',
  arrowleft: 'left', a: 'left', arrowright: 'right', d: 'right',
}
const reachable = (status: TrailNodeStatus | undefined) => ['completed', 'current', 'bossCurrent'].includes(status ?? '')

function nearestReachableNode(point: WorldPoint, radius: number, trail: TrailDefinition, statuses: Record<string, TrailNodeStatus>): TrailNodeDefinition | null {
  let closest: TrailNodeDefinition | null = null, shortest = radius
  for (const node of trail.nodes) {
    if (!reachable(statuses[node.id])) continue
    const candidate = getAstravelPoint(node)
    const distance = Math.hypot(candidate.x - point.x, candidate.y - point.y)
    if (distance < shortest) { closest = node; shortest = distance }
  }
  return closest
}

export function AstravelPixelCanvas({ trail, statuses, currentLocationId, portraitAssetId, reducedMotion, enabled, onInspect, onEngage, onTravelStart }: Props) {
  const start = trail.nodes.find((node) => node.id === currentLocationId)
    ?? [...trail.nodes].reverse().find((node) => statuses[node.id] === 'completed')
    ?? trail.nodes[0]
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [view, setView] = useState(() => ({ ...getAstravelCamera(getAstravelPoint(start)), player: getAstravelPoint(start) }))
  const viewRef = useRef(view)
  const [nearbyActiveBattleId, setNearbyActiveBattleId] = useState<string | null>(null)
  const nearbyActiveBattleRef = useRef<string | null>(null)
  const playerRef = useRef<WorldPoint>(getAstravelPoint(start))
  const facingRef = useRef<ActorFacing>('down')
  const directionsRef = useRef(new Set<ActorFacing>())
  const destinationRef = useRef<Destination | null>(null)
  const enabledRef = useRef(enabled)
  const statusesRef = useRef(statuses)
  const inspectRef = useRef(onInspect)
  const engageRef = useRef(onEngage)
  const engagingRef = useRef<string | null>(null)
  const autoAttemptedRef = useRef<string | null>(null)
  const travelRef = useRef(onTravelStart)
  enabledRef.current = enabled
  statusesRef.current = statuses
  inspectRef.current = onInspect
  engageRef.current = onEngage
  travelRef.current = onTravelStart

  useEffect(() => {
    if (!enabled) { directionsRef.current.clear(); destinationRef.current = null }
  }, [enabled])

  /**
   * Active combat landmarks are encounter triggers, not a two-click inspection
   * drawer. Completed/locked landmarks cannot spawn another encounter.
   */
  const activateNode = useCallback((nodeId: string) => {
    if (!enabledRef.current || engagingRef.current) return
    const node = trail.nodes.find((candidate) => candidate.id === nodeId)
    if (!node || !reachable(statusesRef.current[nodeId])) return
    if (node.type === 'battle' && statusesRef.current[nodeId] === 'current') {
      // Lock only after the battle actually starts. Failed preconditions (HP,
      // quest, encounter state) must never permanently disable interaction.
      if (engageRef.current(nodeId)) {
        engagingRef.current = nodeId
        destinationRef.current = null
        directionsRef.current.clear()
      }
    } else inspectRef.current(nodeId)
  }, [trail])

  const walkTo = (point: WorldPoint, nodeId: string | null) => {
    if (!enabledRef.current) return
    if (Math.hypot(playerRef.current.x - point.x, playerRef.current.y - point.y) < (nodeId ? 18 : 4)) {
      if (nodeId) activateNode(nodeId)
      return
    }
    const path = findAstravelPath(playerRef.current, point, trail)
    if (path.length) { destinationRef.current = { path, nodeId }; travelRef.current() }
  }
  const walkToNode = (node: TrailNodeDefinition) => {
    if (reachable(statusesRef.current[node.id])) walkTo(getAstravelPoint(node), node.id)
  }

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    let raf = 0, frame = 0, previous = 0
    const sheet = new Image()
    sheet.src = resolveAsset(portraitAssetId).path
    sheet.onerror = () => { sheet.onerror = null; sheet.src = resolveAsset(portraitAssetId).fallback }
    const enemySprites: Record<string, HTMLImageElement> = {}
    for (const node of trail.nodes) {
      const encounter = node.encounterId ? content.encounters[node.encounterId] : null
      const enemy = encounter ? content.enemies[encounter.enemyDefinitionIds[0]] : null
      if (!enemy) continue
      const image = new Image()
      const asset = resolveAsset(enemy.assetId)
      image.src = asset.path
      image.onerror = () => { image.onerror = null; image.src = asset.fallback }
      enemySprites[node.id] = image
    }
    const keydown = (event: KeyboardEvent) => {
      if (!enabledRef.current || event.altKey || event.ctrlKey || event.metaKey) return
      const target = event.target
      if (target instanceof HTMLElement && (['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON'].includes(target.tagName) || target.isContentEditable)) return
      const key = event.key.toLowerCase()
      if (keys[key]) {
        if (directionsRef.current.size === 0) travelRef.current()
        directionsRef.current.add(keys[key]); destinationRef.current = null; event.preventDefault()
      }
      if (key === 'e' || key === 'enter') {
        const nearby = nearestReachableNode(playerRef.current, 27, trail, statusesRef.current)
        if (nearby) { activateNode(nearby.id); event.preventDefault() }
      }
    }
    const keyup = (event: KeyboardEvent) => {
      const direction = keys[event.key.toLowerCase()]
      if (direction) directionsRef.current.delete(direction)
    }
    const blur = () => directionsRef.current.clear()
    const tick = (now: number) => {
      const dt = Math.min(0.05, previous ? (now - previous) / 1000 : 0)
      previous = now
      frame += 1
      let dx = 0, dy = 0, walking = false
      if (enabledRef.current) {
        dx = Number(directionsRef.current.has('right')) - Number(directionsRef.current.has('left'))
        dy = Number(directionsRef.current.has('down')) - Number(directionsRef.current.has('up'))
        const destination = destinationRef.current
        const speed = 72 * dt
        if (dx === 0 && dy === 0 && destination) {
          const waypoint = destination.path[0]
          if (!waypoint) { destinationRef.current = null; if (destination.nodeId) activateNode(destination.nodeId) }
          else {
            const distance = Math.hypot(waypoint.x - playerRef.current.x, waypoint.y - playerRef.current.y)
            if (distance <= speed + 0.4) {
              playerRef.current = { ...waypoint }
              destination.path.shift()
              if (!destination.path.length) {
                destinationRef.current = null
                if (destination.nodeId) activateNode(destination.nodeId)
              }
            } else { dx = (waypoint.x - playerRef.current.x) / distance; dy = (waypoint.y - playerRef.current.y) / distance }
          }
        }
        const magnitude = Math.hypot(dx, dy)
        if (magnitude > 0) {
          facingRef.current = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : (dy > 0 ? 'down' : 'up')
          const next = { x: playerRef.current.x + dx / magnitude * speed, y: playerRef.current.y + dy / magnitude * speed }
          if (isAstravelWalkable(next, trail)) { playerRef.current = next; walking = true }
          else if (isAstravelWalkable({ x: next.x, y: playerRef.current.y }, trail)) { playerRef.current.x = next.x; walking = true }
          else if (isAstravelWalkable({ x: playerRef.current.x, y: next.y }, trail)) { playerRef.current.y = next.y; walking = true }
          else destinationRef.current = null
        }
        // Check proximity regardless of input mode. Previously arriving by
        // mouse/touch or stopping a step short could leave the player stuck at
        // the marker without entering the encounter.
        if (!engagingRef.current) {
          const nearest = nearestReachableNode(playerRef.current, 26, trail, statusesRef.current)
          const battleId = nearest?.type === 'battle' && statusesRef.current[nearest.id] === 'current'
            ? nearest.id : null
          if (nearbyActiveBattleRef.current !== battleId) {
            nearbyActiveBattleRef.current = battleId
            setNearbyActiveBattleId(battleId)
          }
          if (battleId && autoAttemptedRef.current !== battleId) {
            autoAttemptedRef.current = battleId
            activateNode(battleId)
          } else if (!battleId) autoAttemptedRef.current = null
        }
      }
      const camera = getAstravelCamera(playerRef.current)
      const player = { x: Math.round(playerRef.current.x), y: Math.round(playerRef.current.y) }
      if (viewRef.current.x !== camera.x || viewRef.current.y !== camera.y
        || viewRef.current.player.x !== player.x || viewRef.current.player.y !== player.y) {
        const nextView = { ...camera, player }
        viewRef.current = nextView
        setView(nextView)
      }
      drawAstravel(ctx, trail, statusesRef.current, playerRef.current, sheet, reducedMotion ? 0 : frame,
        walking && !reducedMotion, facingRef.current, portraitAssetId.includes('sigil') ? 'sigil' : 'terririan', camera, enemySprites)
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
  }, [trail, portraitAssetId, reducedMotion, activateNode])

  const pointerWalk = (event: PointerEvent<HTMLCanvasElement>) => {
    if (!enabled) return
    const bounds = event.currentTarget.getBoundingClientRect()
    if (!bounds.width || !bounds.height) return
    const point = { x: Math.round((event.clientX - bounds.left) / bounds.width * ASTRAVEL_VIEW_WIDTH + viewRef.current.x), y: Math.round((event.clientY - bounds.top) / bounds.height * ASTRAVEL_VIEW_HEIGHT + viewRef.current.y) }
    const node = nearestReachableNode(point, 16, trail, statusesRef.current)
    if (node) walkToNode(node)
    else walkTo(point, null)
  }

  return <div className="pixel-city astravel-field" aria-label="Exploração pixelada da Floresta de Astravél">
    <canvas ref={canvasRef} width={ASTRAVEL_VIEW_WIDTH} height={ASTRAVEL_VIEW_HEIGHT} className="pixel-city__canvas"
      role="img" tabIndex={0} aria-label="Astravél em pixels, vista superior 3/4; caminhe por WASD, setas ou toque" onPointerDown={pointerWalk} />
    <div className="astravel-field__nodes">
      {trail.nodes.map((node) => {
        const point = getAstravelPoint(node)
        const status = statuses[node.id] ?? 'locked'
        return <button key={node.id} type="button" disabled={!enabled || !reachable(status)}
          aria-label={`Aproximar-se de ${node.label}`} title={`${node.label} — ${status === 'current' && node.type === 'battle' ? 'encontro de combate' : status}`}
          className={`astravel-field__node astravel-field__node--${status}`}
          style={{ left: `${(point.x - view.x) / ASTRAVEL_VIEW_WIDTH * 100}%`, top: `${(point.y - view.y - 35) / ASTRAVEL_VIEW_HEIGHT * 100}%`,
            display: point.x < view.x + 12 || point.x > view.x + ASTRAVEL_VIEW_WIDTH - 12
              || point.y < view.y + 42 || point.y > view.y + ASTRAVEL_VIEW_HEIGHT ? 'none' : undefined }}
          onClick={() => walkToNode(node)}>
          <strong>{node.index}</strong><span>{node.label}</span>
        </button>
      })}
    </div>
    <div className="astravel-minimap" aria-label="Minimapa de Astravél: 15 encontros conectados">
      <svg viewBox={`0 0 ${ASTRAVEL_WIDTH} ${ASTRAVEL_HEIGHT}`} role="img" aria-label="Posição do jogador e sequência dos encontros">
        <polyline points={trail.nodes.map((node) => { const point = getAstravelPoint(node); return `${point.x},${point.y}` }).join(' ')} fill="none" stroke="#6d8078" strokeWidth="5" />
        {trail.nodes.map((node) => { const point = getAstravelPoint(node); const status = statuses[node.id]; return <circle key={node.id} cx={point.x} cy={point.y} r={node.type === 'boss' ? 11 : 8}
          fill={status === 'completed' ? '#88c8a4' : ['current', 'bossCurrent'].includes(status ?? '') ? '#f4d38d' : '#475a59'} /> })}
        <rect x={view.x} y={view.y} width={ASTRAVEL_VIEW_WIDTH} height={ASTRAVEL_VIEW_HEIGHT} fill="none" stroke="#a8c7bc" strokeWidth="3" />
        <circle cx={view.player.x} cy={view.player.y} r="9" fill="#fff2c8" stroke="#162323" strokeWidth="3" />
      </svg><span>ASTRAVÉL · 15 ENCONTROS</span>
    </div>
    {enabled && trail.nodes.some((node) => ['current', 'bossCurrent'].includes(statuses[node.id] ?? '')) && <button type="button"
      className="astravel-follow" onClick={() => {
        const active = trail.nodes.find((node) => ['current', 'bossCurrent'].includes(statuses[node.id] ?? ''))
        if (active) walkToNode(active)
      }}>Seguir objetivo <span>→</span></button>}
    {nearbyActiveBattleId && enabled && <button type="button"
      className="astravel-field__fight-action"
      aria-label="Enfrentar Fungorro próximo"
      onClick={() => activateNode(nearbyActiveBattleId)}>
      ⚔ Enfrentar {trail.nodes.find((node) => node.id === nearbyActiveBattleId)?.label ?? 'inimigo'}
    </button>}
    <div className="pixel-city__dpad" aria-label="Controle de movimento da trilha">
      {(['up', 'left', 'down', 'right'] as const).map((direction) => <button key={direction} type="button"
        className={`pixel-city__direction pixel-city__direction--${direction}`} aria-label={`Mover ${direction}`} disabled={!enabled}
        onPointerDown={(event) => { event.currentTarget.setPointerCapture(event.pointerId); directionsRef.current.add(direction); destinationRef.current = null; travelRef.current() }}
        onPointerUp={() => directionsRef.current.delete(direction)} onPointerCancel={() => directionsRef.current.delete(direction)}
        onLostPointerCapture={() => directionsRef.current.delete(direction)}>
        {{ up: '▲', left: '◀', down: '▼', right: '▶' }[direction]}
      </button>)}
      <button type="button" className="pixel-city__interact" disabled={!enabled} onClick={() => {
        const nearby = nearestReachableNode(playerRef.current, 27, trail, statusesRef.current)
        if (nearby) activateNode(nearby.id)
      }} aria-label="Interagir com ponto próximo">E</button>
    </div>
  </div>
}
