import { describe, expect, it } from 'vitest'
import { content } from '../../content/catalog'
import { bindPrologueWeapon, createNewSave } from '../game/createSave'
import { getNextCutscene } from './cutscenes'

const playable = () => {
  const save = createNewSave('owner', 'Terrírian', 'character.terririan.default', content, '2026-08-12T10:00:00Z')
  const result = bindPrologueWeapon(save, content, '2026-08-12T10:01:00Z', 'cutscene-test-weapon')
  if (!result.ok) throw new Error(result.message)
  return result.value
}

describe('cutscenes de progressão', () => {
  it('não interrompe a criação sem o Vínculo inicial', () => {
    const save = createNewSave('owner', 'Terrírian', 'character.terririan.default', content, '2026-08-12T10:00:00Z')
    expect(getNextCutscene(save)).toBeNull()
  })

  it('introduz Terran uma única vez e respeita a memória no save', () => {
    const save = playable()
    expect(getNextCutscene(save)?.id).toBe('terran_arrival')
    save.eventLog.push('CutsceneViewed:terran_arrival')
    expect(getNextCutscene(save)).toBeNull()
  })

  it('mostra a etapa atual, sem forçar cenas antigas depois de progredir', () => {
    const save = playable()
    save.quests.vs_astravel_first_contact.status = 'active'
    expect(getNextCutscene(save)?.id).toBe('astravel_call')
    save.world.worldFlags.push('fungal_chambers_threshold_discovered')
    expect(getNextCutscene(save)?.id).toBe('ruins_threshold')
    save.world.worldFlags.push('colossus_mycelium_defeated')
    expect(getNextCutscene(save)?.id).toBe('colossus_aftermath')
    save.eventLog.push('CutsceneViewed:colossus_aftermath')
    expect(getNextCutscene(save)).toBeNull()
  })
})
