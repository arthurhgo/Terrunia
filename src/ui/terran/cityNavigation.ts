import { TERRAN_LOCATION_IDS } from '../../content/terran'
import { CITY_HEIGHT, CITY_WIDTH, getCityPoint, type WorldPoint } from './pixelCityArt'
import { PLAYER_HOME_CENTER } from './roomContent'

/** VISUAL_DRAFT: collision belongs to the drawn city, never to gameplay rules or asset files. */
export const NAV_GRID = 8
const columns = CITY_WIDTH / NAV_GRID
const rows = CITY_HEIGHT / NAV_GRID

export function isCityWalkable(point: WorldPoint): boolean {
  if (point.x < 12 || point.x > CITY_WIDTH - 12 || point.y < 28 || point.y > CITY_HEIGHT - 8) return false
  if (Math.abs(point.x - PLAYER_HOME_CENTER.x) < 24
    && point.y > PLAYER_HOME_CENTER.y - 25 && point.y < PLAYER_HOME_CENTER.y + 20) return false
  return !TERRAN_LOCATION_IDS.some((id) => {
    const center = getCityPoint(id)
    const portal = id === 'location_terran_portal_plaza'
    const halfWidth = portal ? 32 : 24
    const roofTop = portal ? 19 : 25
    const bottom = portal ? 15 : 20
    return Math.abs(point.x - center.x) < halfWidth && point.y > center.y - roofTop && point.y < center.y + bottom
  })
}

const indexOf = (x: number, y: number) => y * columns + x
const cellPoint = (index: number): WorldPoint => ({
  x: (index % columns + 0.5) * NAV_GRID,
  y: (Math.floor(index / columns) + 0.5) * NAV_GRID,
})

function accessibleCell(point: WorldPoint): number | null {
  const x = Math.max(0, Math.min(columns - 1, Math.floor(point.x / NAV_GRID)))
  const y = Math.max(0, Math.min(rows - 1, Math.floor(point.y / NAV_GRID)))
  for (let radius = 0; radius <= 8; radius += 1) {
    for (let dy = -radius; dy <= radius; dy += 1) {
      for (let dx = -radius; dx <= radius; dx += 1) {
        if (Math.abs(dx) + Math.abs(dy) !== radius) continue
        const cx = x + dx, cy = y + dy
        if (cx < 0 || cy < 0 || cx >= columns || cy >= rows) continue
        const index = indexOf(cx, cy)
        if (isCityWalkable(cellPoint(index))) return index
      }
    }
  }
  return null
}

/** Four-way breadth-first path; stable, deterministic and cheap for 48×32 cells. */
export function findCityPath(start: WorldPoint, destination: WorldPoint): WorldPoint[] {
  const origin = accessibleCell(start)
  const goal = accessibleCell(destination)
  if (origin === null || goal === null || origin === goal) return []
  const cameFrom = new Int32Array(columns * rows).fill(-1)
  const queue = new Int32Array(columns * rows)
  let head = 0, tail = 0
  queue[tail++] = origin
  cameFrom[origin] = origin
  while (head < tail && cameFrom[goal] === -1) {
    const cell = queue[head++]
    const x = cell % columns, y = Math.floor(cell / columns)
    for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
      const nx = x + dx, ny = y + dy
      if (nx < 0 || ny < 0 || nx >= columns || ny >= rows) continue
      const next = indexOf(nx, ny)
      if (cameFrom[next] !== -1 || !isCityWalkable(cellPoint(next))) continue
      cameFrom[next] = cell
      queue[tail++] = next
    }
  }
  if (cameFrom[goal] === -1) return []
  const reverse: WorldPoint[] = []
  for (let cursor = goal; cursor !== origin; cursor = cameFrom[cursor]) reverse.push(cellPoint(cursor))
  reverse.reverse()

  // Keep corners and the final stop, avoiding one animation target per 8px cell.
  const path = reverse.filter((point, index) => {
    const previous = index === 0 ? start : reverse[index - 1]
    const following = reverse[index + 1]
    return !following || Math.sign(point.x - previous.x) !== Math.sign(following.x - point.x)
      || Math.sign(point.y - previous.y) !== Math.sign(following.y - point.y)
  })
  if (isCityWalkable(destination)) path.push(destination)
  return path
}
