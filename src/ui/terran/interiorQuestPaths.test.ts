import { describe, expect, it } from 'vitest'
import { content } from '../../content/catalog'
import { createNewSave } from '../../domain/game/createSave'
import { getRosettaQuestRoutes, getTrackedQuestRoute } from '../../domain/terran/rosettaGuide'
import { getInteriorResidents, isInteriorWalkable } from './interiorLayout'
import { getInteriorQuestPaths, resolveInteriorRouteTarget } from './interiorQuestPaths'
import { getRoomPlan } from './roomGeometry'

const fresh = () => createNewSave('interior-route', 'Lysa', 'character.terririan.default', content, '2026-11-03T18:00:00Z')

describe('Rastreamento de missões dentro de casas', () => {
  it('continua o caminho dourado até Eldamar no interior e respeita as colisões da sala', () => {
    const save = fresh()
    save.quests.vs_astravel_first_contact.status = 'active'
    save.quests.vs_astravel_first_contact.tracked = true
    const room = 'location_terran_eldamar_house' as const
    const route = getTrackedQuestRoute(save, content)!
    expect(route).toMatchObject({ npcId: 'npc_eldamar', tone: 'gold', opacity: 1 })
    const residents = getInteriorResidents(save, room)
    const goal = resolveInteriorRouteTarget(room, residents, route)!
    expect(goal.kind).toBe('npc')
    expect(isInteriorWalkable(goal.point, room)).toBe(true)
    const paths = getInteriorQuestPaths(room, getRoomPlan(room).spawn, residents, [route])
    expect(paths).toHaveLength(1)
    expect(paths[0]).toMatchObject({ questIds: ['vs_astravel_first_contact'], targetKind: 'npc', tone: 'gold', opacity: 1 })
    expect(paths[0].d).toMatch(/^M /)
    expect(paths[0].d).toContain(' L ')
  })

  it('leva entregas verdes (100%) até o NPC interno correto ou até a porta de saída', () => {
    const save = fresh()
    const room = 'location_terran_daeryn_house' as const
    const residents = getInteriorResidents(save, room)
    save.quests.side_npc_daeryn.status = 'ready_to_turn_in'
    save.quests.side_npc_daeryn.tracked = true
    const route = getTrackedQuestRoute(save, content)!
    expect(route.tone).toBe('green')
    expect(route.opacity).toBe(1)
    const towardNpc = getInteriorQuestPaths(room, getRoomPlan(room).spawn, residents, [route])
    expect(towardNpc).toHaveLength(1)
    expect(towardNpc[0]).toMatchObject({ targetKind: 'npc', tone: 'green', opacity: 1 })
    const elsewhere = getInteriorQuestPaths('location_terran_eldamar_house',
      getRoomPlan('location_terran_eldamar_house').spawn,
      getInteriorResidents(save, 'location_terran_eldamar_house'), [route])
    expect(elsewhere[0]).toMatchObject({ targetKind: 'exit', tone: 'green', opacity: 1 })
  })

  it('Rosetta continua preview das missões dentro da casa e não inventa rota ao equipar', () => {
    const save = fresh()
    save.quests.side_npc_daeryn.status = 'available'
    save.quests.vs_astravel_first_contact.status = 'active'
    const room = 'location_terran_daeryn_house' as const
    const paths = getInteriorQuestPaths(room, getRoomPlan(room).spawn,
      getInteriorResidents(save, room), getRosettaQuestRoutes(save, content))
    expect(paths.some((route) => route.tone === 'white' && route.opacity === 0.4)).toBe(true)
    expect(paths.every((route) => route.tone === 'white')).toBe(true)
    const equip = { id: 'equip-in-mochila', npcId: null, locationId: room, player: true, questIds: ['equip'], titles: ['Equipar'] }
    expect(resolveInteriorRouteTarget(room, getInteriorResidents(save, room), equip)).toBeNull()
  })
})
