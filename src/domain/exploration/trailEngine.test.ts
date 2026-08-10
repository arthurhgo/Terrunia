import { describe, expect, it } from 'vitest'
import { content } from '../../content/catalog'
import { createNewSave } from '../game/createSave'
import { completeTrailNode, resolveTrailInteraction } from './trailEngine'

const makeSaveAtEntry = () => {
  const save = createNewSave(
    'user_1',
    'Aron',
    'character.terririan.default',
    content,
    '2026-08-10T12:00:00.000Z',
    { saveId: 'save_1', characterId: 'char_1' },
  )
  save.world.trailNodeStates.astravel_entry = 'current'
  return save
}

describe('trilha sequencial', () => {
  it('conclui um nó e libera exatamente o próximo', () => {
    const result = completeTrailNode(
      makeSaveAtEntry(),
      content.trails.trail_astravel_entry,
      'astravel_entry',
      '2026-08-10T12:01:00.000Z',
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.save.world.trailNodeStates.astravel_entry).toBe('completed')
    expect(result.value.save.world.trailNodeStates.astravel_fungorro_01).toBe('current')
    expect(result.value.save.world.trailNodeStates.astravel_camp_03).toBe('locked')
  })

  it('resolve acampamento, concede consumível e preserva progressão', () => {
    const save = makeSaveAtEntry()
    save.world.trailNodeStates.astravel_entry = 'completed'
    save.world.trailNodeStates.astravel_fungorro_01 = 'completed'
    save.world.trailNodeStates.astravel_camp_03 = 'current'
    const result = resolveTrailInteraction(
      save,
      content.trails.trail_astravel_entry,
      'astravel_camp_03',
      content,
      '2026-08-10T12:02:00.000Z',
      () => 'tonic_1',
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.save.inventory[0].definitionId).toBe('consumable_minor_tonic')
    expect(result.value.save.world.trailNodeStates.astravel_spore_ambush_04).toBe('current')
    expect(result.value.save.world.worldFlags).toContain('astravel_camp_supplies_found')
  })

  it('não permite pular um nó bloqueado', () => {
    const result = completeTrailNode(
      makeSaveAtEntry(),
      content.trails.trail_astravel_entry,
      'astravel_spore_ambush_04',
      '2026-08-10T12:03:00.000Z',
    )
    expect(result.ok).toBe(false)
  })
})
