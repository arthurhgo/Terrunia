import { describe, expect, it } from 'vitest'
import { content } from '../../content/catalog'
import { createNewSave } from '../game/createSave'
import { getQuestJournalEntries } from './questSelectors'
import { getFeaturedSidequestsV0516, getNextPlayerStepV0516 } from './questFocusV0516'

const fresh = () => createNewSave('focus-v0516', 'Terrírian', 'character.terririan.default', content)

describe('v0.5.16 — player-guided journal without state changes', () => {
  it('does not invent progress when no quest was accepted', () => {
    expect(getNextPlayerStepV0516(fresh(), content)).toBeNull()
  })

  it('prioritizes a tracked active main quest over another hand-in', () => {
    const save = fresh()
    save.quests.vs_astravel_first_contact.status = 'active'
    save.quests.vs_astravel_first_contact.tracked = true
    save.quests.side_astravel_spore_shells.status = 'ready_to_turn_in'
    const snapshot = structuredClone(save)
    expect(getNextPlayerStepV0516(save, content)?.questId).toBe('vs_astravel_first_contact')
    expect(save).toEqual(snapshot)
  })

  it('does not bury an older tracked secondary after the chapter changes', () => {
    const save = fresh()
    const ids = Object.values(content.quests).filter(q => q.category === 'secondary').slice(0, 29).map(q => q.id)
    for (const id of ids) save.quests[id].status = 'active'
    save.quests[ids[28]].tracked = true
    save.world.trailNodeStates.astravel_camp_03 = 'completed'
    const snapshot = structuredClone(save)
    const visible = getFeaturedSidequestsV0516(save, getQuestJournalEntries(save, content)
      .filter(({ definition }) => definition.category === 'secondary'), 3)
    expect(visible).toHaveLength(3)
    expect(visible[0].definition.id).toBe(ids[28])
    expect(save).toEqual(snapshot)
  })
})
