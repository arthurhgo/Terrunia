import { describe, expect, it } from 'vitest'
import { content } from '../../content/catalog'
import { createNewSave } from '../game/createSave'
import { getRosettaGuidance, getRosettaQuestRoutes, getTrackedQuestRoute } from './rosettaGuide'

const fresh = () => createNewSave('guide-test', 'Terrírian', 'character.terririan.default', content, '2026-10-30T00:00:00Z')

describe('Rosetta orienta usando apenas dados do save', () => {
  it('mostra os responsáveis por missões realmente disponíveis sem liberar missões bloqueadas', () => {
    const save = fresh()
    const guide = getRosettaGuidance(save, content)
    expect(guide.available.some((entry) => entry.id === 'vs_astravel_first_contact')).toBe(true)
    expect(guide.available.find((entry) => entry.id === 'vs_astravel_first_contact')).toMatchObject({
      npcName: 'Eldamar', locationName: 'Casa de Eldamar',
    })
    expect(guide.available.some((entry) => entry.id === 'side_street_arlen')).toBe(false)
    expect(guide.next?.id).toBe('rosetta_tutorial_equip')
  })

  it('prioriza próximo objetivo em andamento e entrega antes de outras ofertas', () => {
    const save = fresh()
    save.quests.vs_astravel_first_contact.status = 'active'
    let guide = getRosettaGuidance(save, content)
    expect(guide.next?.instruction).toContain('Receba as instruções de Eldamar')
    expect(guide.available.some((entry) => entry.id === 'vs_astravel_first_contact')).toBe(false)
    save.quests.vs_astravel_first_contact.status = 'ready_to_turn_in'
    guide = getRosettaGuidance(save, content)
    expect(guide.next?.instruction).toContain('Retorne a Eldamar')
  })

  it('continua indicando novas missões mesmo com várias em andamento', () => {
    const save = fresh()
    for (const id of ['vs_astravel_first_contact', 'main_terran_first_home', 'main_vorren_bestiary']) {
      save.quests[id].status = 'active'
    }
    const guide = getRosettaGuidance(save, content)
    expect(guide.canReceive).toBe(true)
    expect(guide.activeCount).toBe(3)
    expect(guide.maxActive).toBeNull()
    expect(guide.next).not.toBeNull()
  })

  it('identifica a área real de um NPC de rua após desbloquear seu contrato', () => {
    const save = fresh()
    save.quests.side_street_arlen.status = 'available'
    save.world.trailNodeStates.astravel_camp_03 = 'completed'
    const guide = getRosettaGuidance(save, content)
    expect(guide.available.find((entry) => entry.id === 'side_street_arlen')).toMatchObject({
      npcName: 'Arlen', locationName: 'Ruas de Terran · Eldamar',
    })
  })

  it('liga todas as principais e secundárias acionáveis, inclui as não rastreadas e reúne destinos comuns', () => {
    const save = fresh()
    save.quests.side_street_arlen.status = 'available'
    save.quests.delivery_arlen_nuclei.status = 'offered'
    save.world.trailNodeStates.astravel_camp_03 = 'completed'
    save.quests.main_astravel_lost_hunters.status = 'completed'
    const before = structuredClone(save)
    const routes = getRosettaQuestRoutes(save, content)
    const ids = routes.flatMap((route) => route.questIds)
    expect(ids).toContain('vs_astravel_first_contact')
    expect(ids).toContain('side_street_arlen')
    expect(ids).toContain('delivery_arlen_nuclei')
    expect(ids).not.toContain('main_astravel_lost_hunters')
    expect(ids).not.toContain('main_astravel_corruption')
    expect(routes.find((route) => route.npcId === 'npc_street_arlen')?.questIds).toHaveLength(2)
    expect(new Set(ids).size).toBe(ids.length)
    expect(routes.every((route) => route.tone === 'white' && route.opacity === 0.4)).toBe(true)
    expect(save).toEqual(before)
  })

  it('orienta apenas ofertas ainda não aceitas e deixa missões ativas para rastreamento do diário', () => {
    const save = fresh()
    save.quests.side_street_arlen.status = 'available'
    save.world.trailNodeStates.astravel_camp_03 = 'completed'
    save.quests.rosetta_tutorial_equip.status = 'active'
    save.quests.rosetta_tutorial_supply.status = 'active'
    save.quests.rosetta_tutorial_refine.status = 'active'
    save.quests.vs_astravel_first_contact.status = 'active'
    save.quests.vs_astravel_first_contact.tracked = true
    save.quests.side_npc_daeryn.status = 'ready_to_turn_in'
    const offered = getRosettaQuestRoutes(save, content)
    const ids = offered.flatMap((route) => route.questIds)
    expect(ids).toContain('side_street_arlen')
    expect(ids).not.toContain('rosetta_tutorial_equip')
    expect(ids).not.toContain('rosetta_tutorial_supply')
    expect(ids).not.toContain('rosetta_tutorial_refine')
    expect(ids).not.toContain('vs_astravel_first_contact')
    expect(ids).not.toContain('side_npc_daeryn')
    expect(offered.every((route) => route.tone === 'white' && route.opacity === 0.4)).toBe(true)
    expect(getTrackedQuestRoute(save, content)?.questId).toBe('vs_astravel_first_contact')
  })
  it('resolve rota principal dourada do jogador para o objetivo e NPC de entrega', () => {
    const save = fresh()
    save.quests.vs_astravel_first_contact.status = 'active'
    save.quests.vs_astravel_first_contact.tracked = true
    expect(getTrackedQuestRoute(save, content)).toMatchObject({
      questId: 'vs_astravel_first_contact', tone: 'gold', opacity: 1,
      npcId: 'npc_eldamar', locationId: 'location_terran_eldamar_house',
      questIds: ['vs_astravel_first_contact'],
    })
    save.quests.vs_astravel_first_contact.status = 'ready_to_turn_in'
    expect(getTrackedQuestRoute(save, content)?.npcId).toBe('npc_eldamar')
    save.quests.vs_astravel_first_contact.status = 'completed'
    expect(getTrackedQuestRoute(save, content)).toBeNull()
  })

  it('usa azul claro com 20% de opacidade para secundária e direciona combate ao Portal', () => {
    const save = fresh()
    save.quests.side_street_arlen.status = 'active'
    save.quests.side_street_arlen.tracked = true
    expect(getTrackedQuestRoute(save, content)).toMatchObject({
      questId: 'side_street_arlen', tone: 'blue', opacity: 0.4,
      locationId: 'location_terran_portal_plaza',
    })
    save.quests.side_street_arlen.status = 'ready_to_turn_in'
    expect(getTrackedQuestRoute(save, content)).toMatchObject({
      npcId: 'npc_street_arlen', locationId: 'location_terran_eldamar_house',
    })
    save.quests.side_street_arlen.tracked = false
    expect(getTrackedQuestRoute(save, content)).toBeNull()
  })

  it('não inventa caminho físico quando a missão pede apenas equipar na mochila', () => {
    const save = fresh()
    save.quests.rosetta_tutorial_supply.status = 'active'
    save.quests.rosetta_tutorial_supply.tracked = true
    expect(getTrackedQuestRoute(save, content)).toBeNull()
    save.quests.rosetta_tutorial_supply.objectives.wear_armor = 1
    expect(getTrackedQuestRoute(save, content)).toMatchObject({
      locationId: 'location_terran_bond_workshop', tone: 'gold',
    })
  })

})
