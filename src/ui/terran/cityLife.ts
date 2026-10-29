import { isCityWalkable } from './cityNavigation'
import type { CityActor } from './cityCast'
import type { WorldPoint } from './pixelCityArt'
import type { ActorFacing } from './pixelActorArt'

export type MovingCityActor = CityActor & { facing: ActorFacing; moving: boolean }

const patrolOffsets: readonly WorldPoint[] = [
  { x: -12, y: 5 }, { x: 11, y: 3 }, { x: -8, y: 10 },
]
const clearPatrolCache = new Map<string, boolean>()

function isPatrolClear(actor: CityActor, offset: WorldPoint): boolean {
  const key = `${actor.id}:${actor.point.x}:${actor.point.y}:${actor.variant}`
  const cached = clearPatrolCache.get(key)
  if (cached !== undefined) return cached
  const segments = Math.ceil(Math.hypot(offset.x, offset.y) / 2)
  const clear = Array.from({ length: segments + 1 }, (_, index) => {
    const fraction = index / segments
    return { x: actor.point.x + offset.x * fraction, y: actor.point.y + offset.y * fraction }
  }).every(isCityWalkable)
  clearPatrolCache.set(key, clear)
  return clear
}

/** VISUAL_DRAFT: predictable ambient patrols; NPCs never move the story or change the save. */
export function getNpcPatrol(actor: CityActor, timeSeconds: number): MovingCityActor {
  const offset = patrolOffsets[actor.variant % patrolOffsets.length]
  const start = actor.point
  const end = { x: start.x + offset.x, y: start.y + offset.y }

  // Cached static collision scan; the 60 FPS animation does not redo path checks.
  if (!isPatrolClear(actor, offset)) return { ...actor, facing: 'down', moving: false }

  // Every NPC rests at the original coordinate on the first frame. Stable periods
  // prevent the entire cast from moving in sync, without random state or save data.
  const hash = [...actor.id].reduce((sum, char) => sum + char.charCodeAt(0), 0)
  const pause = 1.5 + (hash % 5) * 0.3
  const travel = 1.2 + (hash % 3) * 0.25
  const cycle = pause * 2 + travel * 2
  const phase = ((Math.max(0, timeSeconds) % cycle) + cycle) % cycle
  let progress = 0
  let moving = false
  let returning = false
  if (phase < pause) progress = 0
  else if (phase < pause + travel) { progress = (phase - pause) / travel; moving = true }
  else if (phase < pause * 2 + travel) progress = 1
  else { progress = 1 - (phase - (pause * 2 + travel)) / travel; moving = true; returning = true }
  const position = { x: start.x + (end.x - start.x) * progress, y: start.y + (end.y - start.y) * progress }
  const dominantX = Math.abs(offset.x) >= Math.abs(offset.y)
  const facing: ActorFacing = !moving ? 'down' : dominantX
    ? (offset.x > 0) !== returning ? 'right' : 'left'
    : (offset.y > 0) !== returning ? 'down' : 'up'
  return { ...actor, point: position, facing, moving }
}
