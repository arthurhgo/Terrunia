import { describe, expect, it } from 'vitest'
import { content } from '../../content/catalog'
import { createNewSave } from '../game/createSave'
import { ASTRAVEL_DISCOVERIES_V0516, getExpeditionReportV0516,
  getNarrativeLeadV0516, getNpcForeshadowV0516, getQuestCadenceMetricsV0516,
  getRecordedDiscoveriesV0516 } from './questFlowV0516'
import { isQuestOfferUnlockedV0516, QUEST_CHAPTER_RELEASES_V0516 } from './questPacingV0516'

const fresh = () => createNewSave('approval-v0516', 'Explorador', 'character.terririan.default', content)

describe('v0.5.16 — narrative delivery and chapter-aware materials', () => {
  it('distributes real collection contracts along their material sources without auto-accepting', () => {
    expect(QUEST_CHAPTER_RELEASES_V0516.delivery_liora_spores).toBe('border')
    expect(QUEST_CHAPTER_RELEASES_V0516.delivery_arlen_nuclei).toBe('spores')
    expect(QUEST_CHAPTER_RELEASES_V0516.delivery_daeryn_gels).toBe('spores')
    expect(QUEST_CHAPTER_RELEASES_V0516.delivery_ruven_fibers).toBe('roots')
    expect(QUEST_CHAPTER_RELEASES_V0516.delivery_lithwynn_shards).toBe('roots')
    const save = fresh()
    save.quests.vs_astravel_first_contact.status = 'completed'
    save.quests.delivery_liora_spores.status = 'available'
    save.quests.delivery_arlen_nuclei.status = 'available'
    const prior = structuredClone(save)
    expect(isQuestOfferUnlockedV0516(save, content.quests.delivery_liora_spores)).toBe(true)
    expect(isQuestOfferUnlockedV0516(save, content.quests.delivery_arlen_nuclei)).toBe(false)
    save.world.trailNodeStates.astravel_camp_03 = 'completed'
    expect(isQuestOfferUnlockedV0516(save, content.quests.delivery_arlen_nuclei)).toBe(true)
    expect(save.quests.delivery_arlen_nuclei.status).toBe('available')
    expect(prior.quests.delivery_arlen_nuclei.status).toBe('available')
    expect(content.quests.delivery_arlen_nuclei.turnInItems).toEqual([{ itemId: 'drop_fungal_nucleus', quantity: 2 }])
  })
  it('connects the actual main story delivery to the next NPC, respecting prior gates', () => {
    const save = fresh()
    save.quests.vs_astravel_first_contact.status = 'completed'
    save.quests.main_astravel_lost_hunters.status = 'available'
    const snapshot = structuredClone(save)
    expect(getNarrativeLeadV0516(save, content)).toMatchObject({
      npcName: 'Vorren', canOffer: false, checkpoint: 'astravel_camp_03',
    })
    expect(getNpcForeshadowV0516(save, 'npc_vorren', content)?.message).toContain('marco 5')
    save.world.trailNodeStates.astravel_camp_03 = 'completed'
    expect(getNarrativeLeadV0516(save, content)).toMatchObject({ npcName: 'Vorren', canOffer: true })
    expect(getNpcForeshadowV0516(save, 'npc_vorren', content)).toBeNull()
    save.quests.main_astravel_lost_hunters.status = 'active'
    expect(getNarrativeLeadV0516(save, content)).toBeNull()
    expect(snapshot).not.toEqual(save)
    save.quests.main_astravel_lost_hunters.status = 'completed'
    save.quests.main_astravel_corruption.status = 'available'
    expect(getNarrativeLeadV0516(save, content)?.npcName).toBe('Lithwynn')
    save.world.trailNodeStates.astravel_hunter_refuge_10 = 'completed'
    expect(getNarrativeLeadV0516(save, content)).toMatchObject({ npcName: 'Lithwynn', canOffer: true })
  })
  it('reveals only checkpoints actually cleared, without recording invented lore progress', () => {
    const save = fresh()
    const before = structuredClone(save)
    expect(getRecordedDiscoveriesV0516(save)).toEqual([])
    expect(ASTRAVEL_DISCOVERIES_V0516.length).toBeGreaterThanOrEqual(6)
    for (const record of ASTRAVEL_DISCOVERIES_V0516) {
      expect(content.trails.trail_astravel_entry.nodes.some(node => node.id === record.nodeId)).toBe(true)
      expect(content.quests[record.relatedQuestId]).toBeDefined()
    }
    save.world.trailNodeStates.astravel_horror_09 = 'completed'
    expect(getRecordedDiscoveriesV0516(save).map(x => x.title)).toEqual(['Vestígios no Micélio'])
    expect(before.quests).toEqual(save.quests)
  })
  it('builds a read-only report with ready NPC deliveries, currently held materials and no rewards', () => {
    const save = fresh()
    save.world.trailNodeStates.astravel_camp_03 = 'completed'
    save.quests.side_astravel_spore_shells.status = 'ready_to_turn_in'
    save.inventory.push({instanceId:'material-1',definitionId:'drop_spore_chitin',quantity:2,rarity:'uncommon',locked:false,favorite:false,acquiredAt:save.updatedAt})
    const snapshot = structuredClone(save)
    const report = getExpeditionReportV0516(save, content)
    expect(report.completedEncounters).toBe(1)
    expect(report.totalEncounters).toBe(15)
    expect(report.deliveries.find(d => d.questId === 'side_astravel_spore_shells')?.npcName).toBe('Vorren')
    expect(report.materials.map(x => x.name)).toContain('Quitina de Esporos')
    expect(report.discoveries.some(x => x.nodeId === 'astravel_camp_03')).toBe(true)
    expect(save).toEqual(snapshot)
  })
  it('measures quest actions between combats without pretending to know elapsed minutes', () => {
    const save = fresh()
    save.eventLog = [
      'QuestAccepted:a', 'QuestAccepted:b',
      'TrailNodeCompleted:astravel_fungorro_01',
      'QuestAccepted:c', 'TrailNodeCompleted:astravel_luminous_02',
      'QuestAccepted:d', 'QuestAccepted:e', 'QuestAccepted:f',
    ]
    const snap = structuredClone(save)
    expect(getQuestCadenceMetricsV0516(save, content)).toMatchObject({
      accepted: 6, combats: 2, maxAcceptancesBetweenCombats: 3,
      elapsedMinutesBetweenCombats: null,
    })
    expect(save).toEqual(snap)
  })
})
