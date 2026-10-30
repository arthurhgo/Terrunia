import { content } from '../../content/catalog'
import { TERRAN_LOCATION_IDS, type TerranLocationId } from '../../content/terran'
import type { TerranNpcPresence } from '../../content/types'
import type { GameSave } from '../../domain/game/types'
import { getNpcQuestMarker, getVisibleNpcsInLocation } from '../../domain/terran/cityNpcs'
import type { NpcWorldMarker } from '../../domain/quests/questSelectors'
import { PLAYER_HOME_INTERIOR_ID, type TerranInteriorId } from './roomContent'
import type { WorldPoint } from './pixelCityArt'
import { getRoomPlan, isRoomWalkable } from './roomGeometry'

export const TERRAN_INTERIOR_IDS: readonly TerranLocationId[] =
  TERRAN_LOCATION_IDS.filter((id) => content.terranLocations[id].category === 'institution')

export const hasTerranInterior = (id: TerranLocationId): boolean =>
  TERRAN_INTERIOR_IDS.includes(id)

export type InteriorResident = {
  presence: TerranNpcPresence
  position: WorldPoint
  palette: string
  marker: NpcWorldMarker
}

/** Backwards-compatible workshop coordinates for older callers/tests. */
export const INTERIOR_EXIT = getRoomPlan('location_terran_bond_workshop').exit
export const INTERIOR_SERVICES = getRoomPlan('location_terran_bond_workshop').service
export const INTERIOR_SPAWN = getRoomPlan('location_terran_bond_workshop').spawn

const paletteByTone: Record<string, string> = {
  knowledge: 'knowledge', exploration: 'exploration', bond: 'bond',
  defense: 'defense', clan: 'clan', healing: 'healing',
}

/** Layout is independent of sprite paths and of quest/combat logic. */
export function getInteriorResidents(save: GameSave, id: TerranInteriorId): InteriorResident[] {
  if (id === PLAYER_HOME_INTERIOR_ID || !hasTerranInterior(id)) return []
  const location = content.terranLocations[id]
  const positions = getRoomPlan(id).residents
  return getVisibleNpcsInLocation(save, id).slice(0, positions.length).map(({ presence }, index) => {
    return {
      presence,
      position: positions[index],
      palette: paletteByTone[location.tone] ?? 'knowledge',
      marker: getNpcQuestMarker(save, presence),
    }
  })
}

/** Navigation is calculated from the same data-driven footprint drawn on canvas. */
export function isInteriorWalkable(p: WorldPoint, roomId: TerranInteriorId = 'location_terran_bond_workshop'): boolean {
  return isRoomWalkable(roomId, p)
}

const CELL = 8
const WIDTH = 384 / CELL
const HEIGHT = 256 / CELL
const toPoint = (id: number): WorldPoint => ({
  x: (id % WIDTH + 0.5) * CELL,
  y: (Math.floor(id / WIDTH) + 0.5) * CELL,
})

function closestValid(point: WorldPoint, roomId: TerranInteriorId): number | null {
  const cx = Math.max(0, Math.min(WIDTH - 1, Math.floor(point.x / CELL)))
  const cy = Math.max(0, Math.min(HEIGHT - 1, Math.floor(point.y / CELL)))
  for (let radius = 0; radius <= 12; radius++) {
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if (Math.abs(dx) + Math.abs(dy) !== radius) continue
        const x = cx + dx, y = cy + dy
        if (x < 0 || x >= WIDTH || y < 0 || y >= HEIGHT) continue
        const id = y * WIDTH + x
        if (isInteriorWalkable(toPoint(id), roomId)) return id
      }
    }
  }
  return null
}

export function findInteriorPath(start: WorldPoint, goal: WorldPoint, roomId: TerranInteriorId = 'location_terran_bond_workshop'): WorldPoint[] {
  const a = closestValid(start, roomId), b = closestValid(goal, roomId)
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
      if (visited[next] !== -1 || !isInteriorWalkable(toPoint(next), roomId)) continue
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
  if (isInteriorWalkable(goal, roomId)) corners.push(goal)
  return corners
}
