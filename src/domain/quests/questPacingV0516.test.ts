import { describe, expect, it } from 'vitest'
import { content } from '../../content/catalog'
import { createNewSave } from '../game/createSave'
import { migrateAndValidateSave } from '../../persistence/saveSchema'
import { acceptQuest, offerQuest } from './questEngine'
import { getNpcQuestBadgeCounts, getNpcActionableQuests, getPrioritizedQuestEntries } from './questSelectors'
import { currentQuestChapterV0516, isQuestOfferUnlockedV0516, QUEST_CHAPTER_RELEASES_V0516 } from './questPacingV0516'

const now = '2026-11-11T11:00:00.000Z'
const fresh = () => createNewSave('v0516-qa', 'Terrírian', 'character.terririan.default', content, now)

describe('v0.5.16 — narrative release of offers at actual trail milestones', () => {
  it('checks that all named quest gates reference existing IDs and preserves first-contact', () => {
    for (const id of Object.keys(QUEST_CHAPTER_RELEASES_V0516))
      expect(content.quests[id], id).toBeDefined()
    const save = fresh()
    expect(currentQuestChapterV0516(save)).toBe('border')
    expect(isQuestOfferUnlockedV0516(save, content.quests.vs_astravel_first_contact)).toBe(true)
  })

  it('unlocks Vorren chapter II only after the actual node 5, and Lithwynn chapter III after node 10', () => {
    const save = fresh()
    save.quests.vs_astravel_first_contact.status = 'completed'
    save.quests.main_astravel_lost_hunters.status = 'available'
    save.quests.main_astravel_corruption.status = 'available'
    expect(getNpcActionableQuests(save, 'npc_vorren', content)).not.toContain(content.quests.main_astravel_lost_hunters)
    expect(offerQuest(save, 'main_astravel_lost_hunters', content, now))
      .toMatchObject({ ok: false, code: 'QUEST_CHAPTER_NOT_REACHED' })
    save.world.trailNodeStates.astravel_camp_03 = 'completed'
    expect(currentQuestChapterV0516(save)).toBe('spores')
    expect(offerQuest(save, 'main_astravel_lost_hunters', content, now))
      .toMatchObject({ ok: true })
    expect(offerQuest(save, 'main_astravel_corruption', content, now))
      .toMatchObject({ ok: false, code: 'QUEST_PREREQUISITES_NOT_MET' })
    save.quests.main_astravel_lost_hunters.status = 'completed'
    save.world.trailNodeStates.astravel_hunter_refuge_10 = 'completed'
    expect(currentQuestChapterV0516(save)).toBe('roots')
    expect(offerQuest(save, 'main_astravel_corruption', content, now)).toMatchObject({ ok: true })
  })

  it('offers only stage-matching NPC missions while preserving available status in old saves', () => {
    const save = fresh()
    save.quests.vs_astravel_first_contact.status = 'completed'
    for (const id of ['side_street_liora', 'side_street_arlen', 'delivery_neris_stock'])
      save.quests[id].status = 'available'
    const snapshot = structuredClone(save)
    expect(getNpcQuestBadgeCounts(save, 'npc_street_arlen', content).secondary).toBe(0)
    expect(getNpcQuestBadgeCounts(save, 'npc_street_liora', content).secondary).toBe(1)
    expect(getNpcQuestBadgeCounts(save, 'npc_neris', content).secondary).toBe(0)
    expect(getPrioritizedQuestEntries(save, content).map(x => x.definition.id)).not.toContain('side_street_arlen')
    expect(offerQuest(save, 'side_street_arlen', content, now))
      .toMatchObject({ ok: false, code: 'QUEST_CHAPTER_NOT_REACHED' })
    expect(save).toEqual(snapshot)
    save.world.trailNodeStates.astravel_camp_03 = 'completed'
    expect(offerQuest(save, 'side_street_arlen', content, now)).toMatchObject({ ok: true })
    expect(save.quests.side_street_arlen.status).toBe('available')
  })

  it('uses real recorded checkpoint evidence so side reports never force a replay', () => {
    const save = fresh()
    save.character.level = 3
    save.quests.vs_astravel_first_contact.status = 'completed'
    save.quests.main_vorren_bestiary.status = 'completed'
    save.quests.side_astravel_spore_shells.status = 'available'
    save.world.trailNodeStates.astravel_camp_03 = 'completed'
    const offer = offerQuest(save, 'side_astravel_spore_shells', content, now)
    expect(offer.ok).toBe(true)
    if (!offer.ok) return
    const accepted = acceptQuest(offer.value, 'side_astravel_spore_shells', content, now)
    expect(accepted.ok).toBe(true)
    if (!accepted.ok) return
    expect(accepted.value.quests.side_astravel_spore_shells.status).toBe('ready_to_turn_in')
    expect(accepted.value.quests.side_astravel_spore_shells.objectives.spore_shells).toBe(1)
    expect(accepted.value.wallet).toEqual(save.wallet)
    expect(accepted.value.inventory).toEqual(save.inventory)
  })

  it('reconciles old accepted objectives without replaying an already cleared node', () => {
    const save = fresh()
    save.quests.side_astravel_spore_shells.status = 'active'
    save.quests.side_astravel_spore_shells.objectives.spore_shells = 0
    save.world.trailNodeStates.astravel_camp_03 = 'completed'
    const snapshot = structuredClone(save)
    const migrated = migrateAndValidateSave(save)
    expect(migrated.quests.side_astravel_spore_shells.status).toBe('ready_to_turn_in')
    expect(migrated.quests.side_astravel_spore_shells.objectives.spore_shells).toBe(1)
    expect(migrated.wallet).toEqual(snapshot.wallet)
    expect(migrated.inventory).toEqual(snapshot.inventory)
    expect(migrated.essence).toEqual(snapshot.essence)
    expect(migrateAndValidateSave(migrated)).toEqual(migrated)
  })

  it('rewards only one encounter for early fauna studies, not a repeated Portal farm', () => {
    expect(content.quests.side_astravel_thornback_signs.objectives[0])
      .toMatchObject({ type: 'kill', targetId: 'enemy_fungorro_thornback', required: 1 })
    expect(content.quests.side_street_liora.objectives[0])
      .toMatchObject({ type: 'kill', targetId: 'enemy_spore_sower', required: 1 })
    expect(content.quests.side_astravel_forge_chitin.turnInItems)
      .toEqual([{ itemId: 'drop_spore_chitin', quantity: 1 }])
  })

  it('grandfathers existing offers and 29 accepted quests with no changes to progress or inventory', () => {
    const save = fresh()
    save.quests.vs_astravel_first_contact.status = 'completed'
    save.quests.side_street_arlen.status = 'offered'
    const a = acceptQuest(save, 'side_street_arlen', content, now)
    expect(a.ok).toBe(true)
    if (!a.ok) return
    const ids = Object.keys(a.value.quests).filter(id => content.quests[id]?.category === 'secondary').slice(0, 29)
    for (const id of ids) a.value.quests[id].status = 'active'
    const prior = structuredClone(a.value)
    const migrated = migrateAndValidateSave(a.value)
    expect(ids).toHaveLength(29)
    expect(ids.every(id => migrated.quests[id].status === 'active')).toBe(true)
    expect(migrated.character).toEqual(prior.character)
    expect(migrated.inventory).toEqual(prior.inventory)
    expect(migrated.wallet).toEqual(prior.wallet)
    expect(migrated.essence).toEqual(prior.essence)
  })
})
