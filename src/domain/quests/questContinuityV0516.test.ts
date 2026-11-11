import { describe, expect, it } from 'vitest'
import { content } from '../../content/catalog'
import { createNewSave } from '../game/createSave'
import type { GameSave } from '../game/types'
import { acceptQuest, offerQuest, refreshQuestAvailability } from './questEngine'
import { getQuestMaterialCommitmentV0516 } from '../inventory/itemPurpose'
import { getChapterContinuationV0516, getCombatQuestProgressV0516,
  getNextStoryNpcDestinationV0516 } from './questFlowV0516'

const fresh = () => createNewSave('flow-qa', 'Terrírian', 'character.terririan.default', content, '2026-11-11T13:00:00Z')
const now = '2026-11-11T13:30:00Z'

describe('v0.5.16 — continuous chapter, safe contracts, recovery and battle progress', () => {
  it('keeps chapter I playable without an unnecessary first-rastro return, without altering early access', () => {
    const save = fresh()
    save.quests.vs_astravel_first_contact.status = 'ready_to_turn_in'
    expect(getChapterContinuationV0516(save)).toContain('cinco primeiros encontros')
    expect(save.quests.vs_astravel_first_contact.status).toBe('ready_to_turn_in')
    save.world.trailNodeStates.astravel_camp_03 = 'completed'
    expect(getChapterContinuationV0516(save)).toBeNull()
  })

  it('highlights only the real next story NPC when that hand-off is available', () => {
    const save = fresh()
    save.quests.vs_astravel_first_contact.status = 'completed'
    save.quests.main_astravel_lost_hunters.status = 'available'
    expect(getNextStoryNpcDestinationV0516(save, content)).toBeNull()
    save.world.trailNodeStates.astravel_camp_03 = 'completed'
    expect(getNextStoryNpcDestinationV0516(save, content)).toBe('location_terran_vorren_post')
    save.quests.main_astravel_lost_hunters.status = 'active'
    expect(getNextStoryNpcDestinationV0516(save, content)).toBeNull()
    save.quests.main_astravel_lost_hunters.status = 'completed'
    save.quests.main_astravel_corruption.status = 'available'
    save.world.trailNodeStates.astravel_hunter_refuge_10 = 'completed'
    expect(getNextStoryNpcDestinationV0516(save, content)).toBe('location_terran_bond_workshop')
  })

  it('sums active contract commitments and never reserves unseen quests or modifies inventory', () => {
    const save = fresh()
    save.quests.delivery_arlen_nuclei.status = 'active'
    save.quests.delivery_neris_stock.status = 'locked'
    save.inventory.push({ instanceId:'fungal-1', definitionId:'drop_fungal_nucleus',
      quantity:1, rarity:content.items.drop_fungal_nucleus.rarity,
      favorite:false,locked:false,acquiredAt:now })
    const snapshot = structuredClone(save)
    expect(getQuestMaterialCommitmentV0516('drop_fungal_nucleus', save, content))
      .toMatchObject({ needed:2, held:1, reserved:1, missing:1 })
    expect(getQuestMaterialCommitmentV0516('drop_luminous_gel', save, content))
      .toMatchObject({ needed:0, reserved:0 })
    expect(save).toEqual(snapshot)
  })

  it('recovers only cleared Astravél nodes and real defeated species, idempotently and without payouts', () => {
    const save = fresh()
    save.quests.main_astravel_lost_hunters.status = 'active'
    save.quests.side_astravel_thornback_signs.status = 'active'
    save.world.trailNodeStates.astravel_moth_03 = 'completed'
    save.world.trailNodeStates.astravel_hunter_tracks_06 = 'completed'
    const before = structuredClone(save)
    const restored = refreshQuestAvailability(save, content, now)
    expect(restored.quests.main_astravel_lost_hunters.objectives.hunter_trace_1).toBe(1)
    expect(restored.quests.main_astravel_lost_hunters.status).toBe('active')
    expect(restored.quests.side_astravel_thornback_signs.status).toBe('ready_to_turn_in')
    expect(restored.wallet).toEqual(before.wallet)
    expect(restored.inventory).toEqual(before.inventory)
    expect(restored.essence).toEqual(before.essence)
    expect(refreshQuestAvailability(restored, content, now)).toEqual(restored)
    expect(save).toEqual(before)
  })

  it('accepts a field quest late and recognizes the corresponding previously defeated enemy', () => {
    const save = fresh()
    save.character.level = 2
    save.quests.vs_astravel_first_contact.status = 'completed'
    save.quests.side_astravel_thornback_signs.status = 'available'
    save.world.trailNodeStates.astravel_moth_03 = 'completed'
    const before = structuredClone(save)
    const offered = offerQuest(save, 'side_astravel_thornback_signs', content, now)
    expect(offered.ok).toBe(true)
    if (!offered.ok) return
    const accepted = acceptQuest(offered.value, 'side_astravel_thornback_signs', content, now)
    expect(accepted.ok).toBe(true)
    if (!accepted.ok) return
    expect(accepted.value.quests.side_astravel_thornback_signs.status).toBe('ready_to_turn_in')
    expect(accepted.value.quests.side_astravel_thornback_signs.objectives.thornback_combat).toBe(1)
    expect(accepted.value.wallet).toEqual(before.wallet)
    expect(accepted.value.inventory).toEqual(before.inventory)
  })

  it('shows only confirmed post-claim objectives, never guessing dice damage or unclaimed progress', () => {
    const save = fresh()
    save.quests.side_astravel_spore_shells.status = 'ready_to_turn_in'
    save.quests.side_astravel_spore_shells.objectives.spore_shells = 1
    save.battle = {
      phase:'Victory', claimed:false, encounterId:'encounter_astravel_camp_03',
      trailNodeId:'astravel_camp_03',
      combatants: { bulwark: { side:'enemy', alive:false, definitionId:'enemy_spore_bulwark' }},
      rewards:{ lootDefinitionIds:['drop_spore_chitin'] },
    } as unknown as NonNullable<GameSave['battle']>
    const snapshot = structuredClone(save)
    expect(getCombatQuestProgressV0516(save,content)).toEqual([])
    save.battle.claimed = true
    const result = getCombatQuestProgressV0516(save,content)
    expect(result).toEqual(expect.arrayContaining([
      expect.objectContaining({ questId:'side_astravel_spore_shells',ready:true }),
    ]))
    expect(save.wallet).toEqual(snapshot.wallet)
    expect(save.inventory).toEqual(snapshot.inventory)
  })
})
