import { describe, expect, it } from 'vitest'
import { TERRAN_LOCATION_IDS } from '../../content/terran'
import { content } from '../../content/catalog'
import { createNewSave } from '../../domain/game/createSave'
import { getRoomPlan, isRoomWalkable } from './roomGeometry'
import { roomFurniture, PLAYER_HOME_INTERIOR_ID } from './roomContent'
import { findInteriorPath, getInteriorResidents } from './interiorLayout'

const save = createNewSave('owner', 'Terrírian', 'character.terririan.default', content, '2026-10-29T20:00:00Z')
const rooms = [...TERRAN_LOCATION_IDS.filter((id) => content.terranLocations[id].category === 'institution'), PLAYER_HOME_INTERIOR_ID]

describe('Plantas distintas e circulação de Terran', () => {
  it('inclui a forja entre oito plantas distintas e mantém portas acessíveis', () => {
    expect(rooms).toHaveLength(8)
    expect(new Set(rooms.map((id) => JSON.stringify(getRoomPlan(id).floor))).size).toBe(8)
    expect(new Set(rooms.map((id) => getRoomPlan(id).exit.x)).size).toBeGreaterThanOrEqual(4)
    expect(getRoomPlan('location_terran_portal_plaza').floor).toEqual([])
  })
  for (const id of rooms) {
    it(`permite circular, falar e interagir em ${id}`, () => {
      const plan = getRoomPlan(id)
      for (const point of [plan.spawn, plan.exit, plan.service,
        ...getInteriorResidents(save, id).map((npc) => npc.position),
        ...roomFurniture[id].map((item) => item.point)]) {
        expect(isRoomWalkable(id, point), `${id}: ${JSON.stringify(point)}`).toBe(true)
        if (point.x === plan.spawn.x && point.y === plan.spawn.y) continue
        expect(findInteriorPath(plan.spawn, point, id).length, `Rota: ${id} → ${JSON.stringify(point)}`).toBeGreaterThan(0)
      }
    })
  }
})
