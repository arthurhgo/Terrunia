import { describe, expect, it } from 'vitest'
import { getRoomPlan, ROOM_PLANS } from './roomGeometry'
import type { TerranInteriorId } from './roomContent'
import { createInteriorProjection } from './interiorProjection'
import { buildInteriorRoom } from './interiorRoomModel'
import { getInteriorQuestPaths } from './interiorQuestPaths'

describe('isometric room geometry', () => {
  const rooms = (Object.keys(ROOM_PLANS) as TerranInteriorId[]).filter(id => getRoomPlan(id).floor.length)

  it.each(rooms)('retains world coordinates when clicking the floor in %s', (id) => {
    const plan = getRoomPlan(id)
    const projection = createInteriorProjection(plan, { width: 384, height: 256 })
    for (const point of [plan.spawn, plan.exit, plan.service, ...plan.residents]) {
      const screen = projection.project(point)
      expect(screen.x).toBeGreaterThan(0)
      expect(screen.x).toBeLessThan(384)
      const ground = projection.ground(screen)
      expect(ground.x).toBeCloseTo(point.x)
      expect(ground.y).toBeCloseTo(point.y)
    }
    const { faces } = buildInteriorRoom(id, false)
    expect(faces.length).toBeGreaterThan(50)
    expect(faces.some(face => face.corners.some(([, , height]) => height > 30))).toBe(true)
  })

  it('projects every waypoint of the existing quest route along the floor', () => {
    const id = 'location_terran_bond_workshop'
    const plan = getRoomPlan(id)
    const projection = createInteriorProjection(plan, { width: 384, height: 256 })
    const [route] = getInteriorQuestPaths(id, plan.spawn, [], [{
      id: 'route', locationId: id, npcId: null, player: false, questIds: ['quest'], titles: ['Missão'], tone: 'gold',
    }], point => projection.project(point, 1))
    const start = projection.project(plan.spawn, 1)
    expect(route.d.startsWith(`M ${start.x.toFixed(1)} ${start.y.toFixed(1)}`)).toBe(true)
    expect(route.targetKind).toBe('service')
  })
})
