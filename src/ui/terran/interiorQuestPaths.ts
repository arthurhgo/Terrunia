import type { RosettaQuestRoute } from '../../domain/terran/rosettaGuide'
import type { WorldPoint } from './pixelCityArt'
import type { InteriorResident } from './interiorLayout'
import { findInteriorPath } from './interiorLayout'
import { getRoomPlan } from './roomGeometry'
import type { TerranInteriorId } from './roomContent'

export type InteriorQuestPath = {
  id: string
  questIds: string[]
  tone: 'gold' | 'blue' | 'green'
  opacity: number
  targetKind: 'npc' | 'service' | 'exit'
  d: string
}

/** Continuation of an outdoor route through a real room: NPC -> actual resident;
 * another building -> exit; non-NPC objective at this address -> service point.
 */
export const resolveInteriorRouteTarget = (
  roomId: TerranInteriorId,
  residents: readonly InteriorResident[],
  route: RosettaQuestRoute,
): { point: WorldPoint; kind: InteriorQuestPath['targetKind'] } | null => {
  if (route.player) return null // Equipping is an inventory action, never a map destination.
  const plan = getRoomPlan(roomId)
  if (route.locationId !== roomId) return { point: plan.exit, kind: 'exit' }
  if (!route.npcId) return { point: plan.service, kind: 'service' }
  const resident = residents.find((entry) => entry.presence.npcId === route.npcId)
  // Never invent a resident position: missing/off-stage NPC means the room's exit.
  return resident
    ? { point: { x: resident.position.x, y: resident.position.y + 11 }, kind: 'npc' }
    : { point: plan.exit, kind: 'exit' }
}

export const getInteriorQuestPaths = (
  roomId: TerranInteriorId,
  from: WorldPoint,
  residents: readonly InteriorResident[],
  routes: readonly RosettaQuestRoute[],
): InteriorQuestPath[] => routes.flatMap((route) => {
  const target = resolveInteriorRouteTarget(roomId, residents, route)
  if (!target) return []
  const waypoints = findInteriorPath(from, target.point, roomId)
  if (!waypoints.length) return []
  const vertices = [from, ...waypoints]
  return [{
    id: route.id,
    questIds: route.questIds,
    tone: route.tone ?? 'gold',
    opacity: route.opacity ?? 1,
    targetKind: target.kind,
    d: vertices.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`).join(' '),
  }]
})
