import type { DungeonDefinition, DungeonRoomDefinition } from '../../content/types'
import type { WorldPoint } from '../terran/pixelCityArt'

export const DUNGEON_WIDTH = 384
export const DUNGEON_HEIGHT = 256
export const DUNGEON_GRID = 8
const columns = DUNGEON_WIDTH / DUNGEON_GRID
const rows = DUNGEON_HEIGHT / DUNGEON_GRID

export const getDungeonPoint = (room: DungeonRoomDefinition): WorldPoint => room.landmark

export function isDungeonWalkable(point: WorldPoint, dungeon: DungeonDefinition): boolean {
  return dungeon.rooms.some(({ rect }) => point.x >= rect.x + 8 && point.x <= rect.x + rect.width - 8
    && point.y >= rect.y + 8 && point.y <= rect.y + rect.height - 8)
}

const cellPoint = (cell: number): WorldPoint => ({
  x: (cell % columns + 0.5) * DUNGEON_GRID,
  y: (Math.floor(cell / columns) + 0.5) * DUNGEON_GRID,
})
const cellIndex = (x: number, y: number) => y * columns + x
const masks = new WeakMap<DungeonDefinition, Uint8Array>()

function walkingMask(dungeon: DungeonDefinition): Uint8Array {
  const existing = masks.get(dungeon)
  if (existing) return existing
  const mask = new Uint8Array(columns * rows)
  for (let cell = 0; cell < mask.length; cell += 1) mask[cell] = isDungeonWalkable(cellPoint(cell), dungeon) ? 1 : 0
  masks.set(dungeon, mask)
  return mask
}

function nearestCell(point: WorldPoint, mask: Uint8Array): number | null {
  const x = Math.max(0, Math.min(columns - 1, Math.floor(point.x / DUNGEON_GRID)))
  const y = Math.max(0, Math.min(rows - 1, Math.floor(point.y / DUNGEON_GRID)))
  for (let radius = 0; radius < columns + rows; radius += 1) {
    for (let dy = -radius; dy <= radius; dy += 1) {
      for (let dx = -radius; dx <= radius; dx += 1) {
        if (Math.abs(dx) + Math.abs(dy) !== radius) continue
        const nx = x + dx, ny = y + dy
        if (nx < 0 || ny < 0 || nx >= columns || ny >= rows) continue
        const cell = cellIndex(nx, ny)
        if (mask[cell]) return cell
      }
    }
  }
  return null
}

/** Pathfinding is purely spatial; dungeon progress remains in the domain engine. */
export function findDungeonPath(start: WorldPoint, goal: WorldPoint, dungeon: DungeonDefinition): WorldPoint[] {
  const mask = walkingMask(dungeon)
  const source = nearestCell(start, mask), target = nearestCell(goal, mask)
  if (source === null || target === null) return []
  if (source === target) return isDungeonWalkable(goal, dungeon) ? [goal] : []
  const previous = new Int32Array(mask.length).fill(-1)
  const queue = new Int32Array(mask.length)
  let head = 0, tail = 0
  queue[tail++] = source
  previous[source] = source
  while (head < tail && previous[target] === -1) {
    const cell = queue[head++]
    const x = cell % columns, y = Math.floor(cell / columns)
    for (const [dx, dy] of [[1, 0], [0, -1], [-1, 0], [0, 1]]) {
      const nx = x + dx, ny = y + dy
      if (nx < 0 || ny < 0 || nx >= columns || ny >= rows) continue
      const next = cellIndex(nx, ny)
      if (!mask[next] || previous[next] !== -1) continue
      previous[next] = cell
      queue[tail++] = next
    }
  }
  if (previous[target] === -1) return []
  const path: WorldPoint[] = []
  for (let cell = target; cell !== source; cell = previous[cell]) path.push(cellPoint(cell))
  path.reverse()
  const corners = path.filter((point, i) => {
    const before = i === 0 ? start : path[i - 1]
    const after = path[i + 1]
    return !after || Math.sign(point.x - before.x) !== Math.sign(after.x - point.x)
      || Math.sign(point.y - before.y) !== Math.sign(after.y - point.y)
  })
  if (isDungeonWalkable(goal, dungeon)) corners.push(goal)
  return corners
}
