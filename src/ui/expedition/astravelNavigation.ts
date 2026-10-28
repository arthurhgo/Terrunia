import type { TrailDefinition, TrailNodeDefinition } from '../../content/types'
import type { WorldPoint } from '../terran/pixelCityArt'

export const ASTRAVEL_WIDTH = 384
export const ASTRAVEL_HEIGHT = 256
export const ASTRAVEL_GRID = 8
const columns = ASTRAVEL_WIDTH / ASTRAVEL_GRID
const rows = ASTRAVEL_HEIGHT / ASTRAVEL_GRID
const anchorCache = new WeakMap<TrailDefinition, WorldPoint[]>()

export const getAstravelPoint = (node: TrailNodeDefinition): WorldPoint => ({
  x: Math.round(node.position.x * ASTRAVEL_WIDTH / 100),
  y: Math.round(node.position.y * ASTRAVEL_HEIGHT / 100),
})

const getAnchors = (trail: TrailDefinition): WorldPoint[] => {
  const cached = anchorCache.get(trail)
  if (cached) return cached
  const anchors = trail.nodes.map(getAstravelPoint)
  anchorCache.set(trail, anchors)
  return anchors
}

const squaredDistanceToSegment = (point: WorldPoint, start: WorldPoint, end: WorldPoint) => {
  const dx = end.x - start.x, dy = end.y - start.y
  const divisor = dx * dx + dy * dy
  const amount = divisor === 0 ? 0 : Math.max(0, Math.min(1, ((point.x - start.x) * dx + (point.y - start.y) * dy) / divisor))
  const sx = start.x + dx * amount, sy = start.y + dy * amount
  return (point.x - sx) ** 2 + (point.y - sy) ** 2
}

/** VISUAL_DRAFT: open walking corridor follows the canonical, ordered trail nodes. */
export function isAstravelWalkable(point: WorldPoint, trail: TrailDefinition): boolean {
  if (point.x < 12 || point.x > ASTRAVEL_WIDTH - 12 || point.y < 20 || point.y > ASTRAVEL_HEIGHT - 10) return false
  const anchors = getAnchors(trail)
  return anchors.some((anchor, index) => index === 0
    ? Math.hypot(point.x - anchor.x, point.y - anchor.y) <= 22
    : squaredDistanceToSegment(point, anchors[index - 1], anchor) <= 22 ** 2)
}

const cellPoint = (cell: number): WorldPoint => ({
  x: (cell % columns + 0.5) * ASTRAVEL_GRID,
  y: (Math.floor(cell / columns) + 0.5) * ASTRAVEL_GRID,
})
const cellIndex = (x: number, y: number) => y * columns + x
const masks = new WeakMap<TrailDefinition, Uint8Array>()

function walkingMask(trail: TrailDefinition): Uint8Array {
  const cached = masks.get(trail)
  if (cached) return cached
  const mask = new Uint8Array(columns * rows)
  for (let index = 0; index < mask.length; index += 1) mask[index] = isAstravelWalkable(cellPoint(index), trail) ? 1 : 0
  masks.set(trail, mask)
  return mask
}

function findCell(point: WorldPoint, mask: Uint8Array): number | null {
  const x = Math.max(0, Math.min(columns - 1, Math.floor(point.x / ASTRAVEL_GRID)))
  const y = Math.max(0, Math.min(rows - 1, Math.floor(point.y / ASTRAVEL_GRID)))
  for (let radius = 0; radius < columns + rows; radius += 1) {
    for (let dy = -radius; dy <= radius; dy += 1) {
      for (let dx = -radius; dx <= radius; dx += 1) {
        if (Math.abs(dx) + Math.abs(dy) !== radius) continue
        const cx = x + dx, cy = y + dy
        if (cx < 0 || cy < 0 || cx >= columns || cy >= rows) continue
        const index = cellIndex(cx, cy)
        if (mask[index]) return index
      }
    }
  }
  return null
}

/** Deterministic four-way path; no node progression is performed by pathfinding. */
export function findAstravelPath(start: WorldPoint, destination: WorldPoint, trail: TrailDefinition): WorldPoint[] {
  const mask = walkingMask(trail)
  const source = findCell(start, mask)
  const goal = findCell(destination, mask)
  if (source === null || goal === null || source === goal) return []
  const prev = new Int32Array(mask.length).fill(-1)
  const queue = new Int32Array(mask.length)
  let head = 0, tail = 0
  queue[tail++] = source
  prev[source] = source
  while (head < tail && prev[goal] === -1) {
    const cell = queue[head++]
    const x = cell % columns, y = Math.floor(cell / columns)
    for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
      const nx = x + dx, ny = y + dy
      if (nx < 0 || ny < 0 || nx >= columns || ny >= rows) continue
      const next = cellIndex(nx, ny)
      if (prev[next] !== -1 || !mask[next]) continue
      prev[next] = cell
      queue[tail++] = next
    }
  }
  if (prev[goal] === -1) return []
  const reverse: WorldPoint[] = []
  for (let cursor = goal; cursor !== source; cursor = prev[cursor]) reverse.push(cellPoint(cursor))
  reverse.reverse()
  const simplified = reverse.filter((point, index) => {
    const before = index === 0 ? start : reverse[index - 1]
    const after = reverse[index + 1]
    return !after || Math.sign(point.x - before.x) !== Math.sign(after.x - point.x)
      || Math.sign(point.y - before.y) !== Math.sign(after.y - point.y)
  })
  if (isAstravelWalkable(destination, trail)) simplified.push(destination)
  return simplified
}
