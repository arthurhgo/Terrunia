import { describe, expect, it } from 'vitest'
import { content } from '../../content/catalog'
import { createNewSave } from '../game/createSave'
import { getRosettaGuidance, getRosettaQuestRoutes } from './rosettaGuide'

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
    const guide = getRosettaGuidance(save, content)
    expect(guide.available.find((entry) => entry.id === 'side_street_arlen')).toMatchObject({
      npcName: 'Arlen', locationName: 'Ruas de Terran · Eldamar',
    })
  })

  it('liga todas as principais e secundárias acionáveis, inclui as não rastreadas e reúne destinos comuns', () => {
    const save = fresh()
    save.quests.side_street_arlen.status = 'available'
    save.quests.delivery_arlen_nuclei.status = 'offered'
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
    expect(save).toEqual(before)
  })

  it('leva o tutorial à mochila, Mercado e forja e leva combate ao Portal e entrega ao responsável', () => {
    const save = fresh()
    save.quests.rosetta_tutorial_equip.status = 'active'
    save.quests.rosetta_tutorial_supply.status = 'active'
    save.quests.rosetta_tutorial_refine.status = 'active'
    save.quests.vs_astravel_first_contact.status = 'active'
    save.quests.vs_astravel_first_contact.objectives.talk_eldamar = 1
    save.quests.side_street_arlen.status = 'ready_to_turn_in'
    const routes = getRosettaQuestRoutes(save, content)
    expect(routes.find((route) => route.questIds.includes('rosetta_tutorial_equip'))?.player).toBe(true)
    expect(routes.find((route) => route.questIds.includes('rosetta_tutorial_supply'))?.locationId).toBe('location_terran_bond_workshop')
    expect(routes.find((route) => route.questIds.includes('rosetta_tutorial_refine'))?.locationId).toBe('location_terran_forge')
    expect(routes.find((route) => route.questIds.includes('vs_astravel_first_contact'))?.locationId).toBe('location_terran_portal_plaza')
    expect(routes.find((route) => route.questIds.includes('side_street_arlen'))?.npcId).toBe('npc_street_arlen')
  })
})
