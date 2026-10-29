import { content } from '../../content/catalog'
import { TERRAN_LOCATION_IDS, type TerranLocationId } from '../../content/terran'
import type { TerranNpcPresence } from '../../content/types'
import type { GameSave } from '../../domain/game/types'
import { getVisibleNpcsInLocation } from '../../domain/terran/cityNpcs'
import type { WorldPoint } from './pixelCityArt'

export const TERRAN_INTERIOR_IDS: readonly TerranLocationId[] =
  TERRAN_LOCATION_IDS.filter((id) => content.terranLocations[id].category === 'institution')

export const hasTerranInterior = (id: TerranLocationId): boolean =>
  TERRAN_INTERIOR_IDS.includes(id)

export type InteriorResident = {
  presence: TerranNpcPresence
  position: WorldPoint
  palette: string
  marker: '!' | '✓' | null
}

export const INTERIOR_EXIT: WorldPoint = { x: 192, y: 231 }
export const INTERIOR_SERVICES: WorldPoint = { x: 317, y: 202 }
export const INTERIOR_SPAWN: WorldPoint = { x: 192, y: 214 }

const positions: readonly WorldPoint[] = [
  { x: 75, y: 116 }, { x: 151, y: 116 }, { x: 233, y: 116 }, { x: 309, y: 116 },
  { x: 108, y: 167 }, { x: 192, y: 167 }, { x: 276, y: 167 },
]

const paletteByTone: Record<string, string> = {
  knowledge: 'knowledge', exploration: 'exploration', bond: 'bond',
  defense: 'defense', clan: 'clan', healing: 'healing',
}

/** Layout is independent of sprite paths and of quest/combat logic. */
export function getInteriorResidents(save: GameSave, id: TerranLocationId): InteriorResident[] {
  if (!hasTerranInterior(id)) return []
  const location = content.terranLocations[id]
  return getVisibleNpcsInLocation(save, id).slice(0, positions.length).map(({ presence }, index) => {
    const npc = presence.npcId ? content.npcs[presence.npcId] : undefined
    const statuses = npc?.questIds.map((questId) => save.quests[questId]?.status) ?? []
    return {
      presence,
      position: positions[index],
      palette: paletteByTone[location.tone] ?? 'knowledge',
      marker: statuses.includes('ready_to_turn_in') ? '✓' : statuses.some((status) => status === 'available' || status === 'offered') ? '!' : null,
    }
  })
}

/** A tiny navigational grid; collision shape follows furniture, never sprite pixels. */
export function isInteriorWalkable(p: WorldPoint): boolean {
  if (p.x < 26 || p.x > 358 || p.y < 94 || p.y > 239) return false
  return !(p.x > 170 && p.x < 213 && p.y > 126 && p.y < 145)
}

const CELL = 8
const WIDTH = 384 / CELL
const HEIGHT = 256 / CELL
const toPoint = (id: number): WorldPoint => ({
  x: (id % WIDTH + 0.5) * CELL,
  y: (Math.floor(id / WIDTH) + 0.5) * CELL,
})

function closestValid(point: WorldPoint): number | null {
  const cx = Math.max(0, Math.min(WIDTH - 1, Math.floor(point.x / CELL)))
  const cy = Math.max(0, Math.min(HEIGHT - 1, Math.floor(point.y / CELL)))
  for (let radius = 0; radius <= 12; radius++) {
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if (Math.abs(dx) + Math.abs(dy) !== radius) continue
        const x = cx + dx, y = cy + dy
        if (x < 0 || x >= WIDTH || y < 0 || y >= HEIGHT) continue
        const id = y * WIDTH + x
        if (isInteriorWalkable(toPoint(id))) return id
      }
    }
  }
  return null
}

export function findInteriorPath(start: WorldPoint, goal: WorldPoint): WorldPoint[] {
  const a = closestValid(start), b = closestValid(goal)
  if (a === null || b === null || a === b) return []
  const visited = new Int32Array(WIDTH * HEIGHT).fill(-1)
  const queue = new Int32Array(WIDTH * HEIGHT)
  let head = 0, tail = 0
  visited[a] = a
  queue[tail++] = a
  while (head < tail && visited[b] === -1) {
    const id = queue[head++], x = id % WIDTH, y = Math.floor(id / WIDTH)
    for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
      const nx = x + dx, ny = y + dy
      if (nx < 0 || ny < 0 || nx >= WIDTH || ny >= HEIGHT) continue
      const next = ny * WIDTH + nx
      if (visited[next] !== -1 || !isInteriorWalkable(toPoint(next))) continue
      visited[next] = id
      queue[tail++] = next
    }
  }
  if (visited[b] === -1) return []
  const path: WorldPoint[] = []
  for (let at = b; at !== a; at = visited[at]) path.push(toPoint(at))
  path.reverse()
  const corners = path.filter((point, index) => {
    const prior = index === 0 ? start : path[index - 1]
    const next = path[index + 1]
    return !next || Math.sign(point.x - prior.x) !== Math.sign(next.x - point.x)
      || Math.sign(point.y - prior.y) !== Math.sign(next.y - point.y)
  })
  if (isInteriorWalkable(goal)) corners.push(goal)
  return corners
}
