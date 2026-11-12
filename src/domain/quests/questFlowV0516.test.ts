import { describe, expect, it } from 'vitest'
import { content } from '../../content/catalog'
import { createNewSave } from '../game/createSave'
import { ASTRAVEL_DISCOVERIES_V0516, getExpeditionReportV0516,
  getNarrativeLeadV0516, getNpcForeshadowV0516, getQuestCadenceMetricsV0516,
  getFungalChambersClanNoticeV0516, getAstravelChapterCountV0516,
  getAstravelChapterDebriefV0516, getAstravelRouteBlockerV0516,
  getRecordedDiscoveriesV0516 } from './questFlowV0516'
import { isQuestOfferUnlockedV0516, QUEST_CHAPTER_RELEASES_V0516 } from './questPacingV0516'

const fresh = () => createNewSave('approval-v0516', 'Explorador', 'character.terririan.default', content)

describe('v0.5.16 — narrative delivery and chapter-aware materials', () => {
  it('warns from chapter II about the existing late Clan requirement, without auto-affiliating', () => {
    const save = fresh()
    expect(getFungalChambersClanNoticeV0516(save)).toBeNull()
    save.world.trailNodeStates.astravel_camp_03 = 'completed'
    const before = structuredClone(save)
    expect(getFungalChambersClanNoticeV0516(save)).toContain('nível 4')
    save.character.level = 4
    expect(getFungalChambersClanNoticeV0516(save)).toContain('Rosetta')
    expect(getFungalChambersClanNoticeV0516(save)).toContain('Salão dos Clãs')
    expect(save.character.clan.clanId).toBeNull()
    save.character.clan.clanId = Object.keys(content.clans)[0]
    expect(getFungalChambersClanNoticeV0516(save)).toBeNull()
    expect(before.character.clan.clanId).toBeNull()
  })

  it('counts only cleared checkpoint nodes and names the final actual boss correctly', () => {
    const save = fresh()
    expect(getAstravelChapterCountV0516(save, content)).toMatchObject({
      chapter: 'border', cleared: 0, total: 5,
    })
    save.world.trailNodeStates.astravel_fungorro_01 = 'completed'
    save.world.trailNodeStates.astravel_luminous_02 = 'completed'
    expect(getAstravelChapterCountV0516(save, content)).toMatchObject({
      chapter: 'border', cleared: 2, total: 5,
    })
    save.world.trailNodeStates.astravel_camp_03 = 'completed'
    expect(getAstravelChapterCountV0516(save, content)).toMatchObject({
      chapter: 'spores', cleared: 0, total: 5,
    })
    expect(content.quests.main_astravel_corruption.summary).toContain('Sentinela Corrompida')
    expect(content.quests.main_astravel_corruption.summary).not.toContain('Colosso Micélio')
    expect(content.quests.main_astravel_corruption.objectives.at(-1)?.label).toContain('Sentinela Corrompida')
  })


  it('only celebrates a chapter when all five real nodes are complete and never grants rewards', () => {
    const save = fresh()
    save.quests.vs_astravel_first_contact.status = 'ready_to_turn_in'
    const chapterOne = content.trails.trail_astravel_entry.nodes.filter(node => node.index >= 1 && node.index <= 5)
    save.world.trailNodeStates.astravel_camp_03 = 'completed'
    expect(getAstravelChapterDebriefV0516(save, content)).toBeNull()
    for (const node of chapterOne) save.world.trailNodeStates[node.id] = 'completed'
    const untouched = structuredClone(save)
    expect(getAstravelChapterDebriefV0516(save, content)).toMatchObject({
      label: 'Capítulo I · Borda Luminescente', completed: 5, total: 5,
    })
    expect(getAstravelChapterDebriefV0516(save, content)?.nextStep).toContain('Eldamar')
    expect(save).toEqual(untouched)
    save.quests.vs_astravel_first_contact.status = 'completed'
    save.quests.main_astravel_lost_hunters.status = 'active'
    expect(getAstravelChapterDebriefV0516(save, content)?.nextStep).toContain('Relatório entregue')
    for (const node of content.trails.trail_astravel_entry.nodes.filter(node => node.index >= 6 && node.index <= 10))
      save.world.trailNodeStates[node.id] = 'completed'
    save.quests.main_astravel_lost_hunters.status = 'ready_to_turn_in'
    expect(getAstravelChapterDebriefV0516(save, content)).toMatchObject({
      label: 'Capítulo II · Território dos Esporos', completed: 5, total: 5,
    })
    expect(getAstravelChapterDebriefV0516(save, content)?.nextStep).toContain('Vorren')
    for (const node of content.trails.trail_astravel_entry.nodes.filter(node => node.index >= 11 && node.index <= 15))
      save.world.trailNodeStates[node.id] = 'completed'
    save.quests.main_astravel_corruption.status = 'ready_to_turn_in'
    expect(getAstravelChapterDebriefV0516(save, content)?.nextStep).toContain('Lithwynn')
    save.quests.main_astravel_corruption.status = 'completed'
    expect(getAstravelChapterDebriefV0516(save, content)?.nextStep).toContain('história principal')
  })

  it('distinguishes hand-in, offered quest, next-NPC acceptance and Clan gate', () => {
    const save = fresh()
    const nodes = content.trails.trail_astravel_entry.nodes
    const nodeSix = nodes.find(node => node.index === 6)!
    const nodeEleven = nodes.find(node => node.index === 11)!
    const boss = nodes.find(node => node.index === 15)!
    save.quests.vs_astravel_first_contact.status = 'ready_to_turn_in'
    save.quests.main_astravel_lost_hunters.status = 'locked'
    const snap = structuredClone(save)
    expect(getAstravelRouteBlockerV0516(save, nodeSix, content)).toContain('Eldamar')
    expect(getAstravelRouteBlockerV0516(save, nodeSix, content)).toContain('está pronta')
    save.quests.vs_astravel_first_contact.status = 'completed'
    expect(getAstravelRouteBlockerV0516(save, nodeSix, content)).toContain('marco 5')
    save.world.trailNodeStates.astravel_camp_03 = 'completed'
    save.quests.main_astravel_lost_hunters.status = 'offered'
    expect(getAstravelRouteBlockerV0516(save, nodeSix, content)).toContain('escolha aceitar')
    save.quests.main_astravel_lost_hunters.status = 'active'
    expect(getAstravelRouteBlockerV0516(save, nodeSix, content)).toBeNull()
    save.quests.main_astravel_lost_hunters.status = 'ready_to_turn_in'
    save.quests.main_astravel_corruption.status = 'locked'
    expect(getAstravelRouteBlockerV0516(save, nodeEleven, content)).toContain('Vorren')
    save.quests.main_astravel_corruption.status = 'active'
    expect(getAstravelRouteBlockerV0516(save, nodeEleven, content)).toBeNull()
    save.world.trailNodeStates.astravel_hunter_refuge_10 = 'completed'
    expect(getAstravelRouteBlockerV0516(save, boss, content)).toContain('Clã')
    save.character.clan.clanId = Object.keys(content.clans)[0]
    expect(getAstravelRouteBlockerV0516(save, boss, content)).toBeNull()
    expect(snap.wallet).toEqual(save.wallet)
    expect(snap.inventory).toEqual(save.inventory)
  })

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
