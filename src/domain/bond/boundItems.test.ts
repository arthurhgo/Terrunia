import { describe, expect, it } from 'vitest'
import { content } from '../../content/catalog'
import { bindPrologueWeapon, createNewSave } from '../game/createSave'
import {
  canBindSlot,
  createBoundItem,
  getBoundSlotCapacity,
  performGradeTwoRite,
} from './boundItems'

const makeRiteSave = () => {
  const save = createNewSave(
    'user_1',
    'Aron',
    'character.terririan.default',
    content,
    '2026-08-10T12:00:00.000Z',
    { saveId: 'save_1', characterId: 'char_1' },
  )
  const bound = bindPrologueWeapon(
    save,
    content,
    '2026-08-10T12:01:00.000Z',
    'bound_1',
  )
  if (!bound.ok) throw new Error(bound.message)
  bound.value.inventory.push({
    instanceId: 'fragment_1',
    definitionId: 'fragment_mycelial_essence',
    quantity: 1,
    rarity: 'rare',
    locked: false,
    favorite: false,
    acquiredAt: '2026-08-10T12:02:00.000Z',
  })
  return bound.value
}

describe('itens vinculados', () => {
  it('aplica exatamente os slots canônicos dos sete Graus', () => {
    expect(getBoundSlotCapacity(1)).toEqual({ essences: 0, gems: 0, runes: 0, superiorRunes: 0 })
    expect(getBoundSlotCapacity(2)).toEqual({ essences: 1, gems: 0, runes: 0, superiorRunes: 0 })
    expect(getBoundSlotCapacity(3)).toEqual({ essences: 1, gems: 1, runes: 0, superiorRunes: 0 })
    expect(getBoundSlotCapacity(4)).toEqual({ essences: 1, gems: 1, runes: 1, superiorRunes: 0 })
    expect(getBoundSlotCapacity(5)).toEqual({ essences: 2, gems: 2, runes: 1, superiorRunes: 0 })
    expect(getBoundSlotCapacity(6)).toEqual({ essences: 2, gems: 2, runes: 1, superiorRunes: 1 })
    expect(getBoundSlotCapacity(7)).toEqual({ essences: 0, gems: 0, runes: 0, superiorRunes: 0 })
  })

  it('cria instância única de Grau I e registra a memória do vínculo', () => {
    const item = createBoundItem(
      'char_1',
      content.boundItemBases.bound_weapon_prologue_base,
      '2026-08-10T12:00:00.000Z',
      'bound_1',
    )
    expect(item).toMatchObject({ id: 'bound_1', ownerCharacterId: 'char_1', grade: 1, slot: 'weapon' })
    expect(item.memories[0].sourceId).toBe('prologue_bond')
  })

  it('impede substituir um vínculo existente', () => {
    const result = canBindSlot(
      { weapon: 'bound_1', shield: null, armor: null, necklace: null, bracelet: null },
      'weapon',
    )
    expect(result).toMatchObject({ ok: false, code: 'BOUND_SLOT_OCCUPIED' })
  })

  it('rejeita o Rito de Grau II sem Ressonância mínima', () => {
    const result = performGradeTwoRite(
      makeRiteSave(),
      'bound_1',
      'fragment_1',
      content,
      '2026-08-10T12:03:00.000Z',
    )
    expect(result).toMatchObject({ ok: false, code: 'BOUND_RESONANCE_REQUIRED' })
  })

  it('executa Infusão e avanço ao Grau II de forma atômica', () => {
    const save = makeRiteSave()
    save.boundItems.bound_1.resonance = 100
    const result = performGradeTwoRite(
      save,
      'bound_1',
      'fragment_1',
      content,
      '2026-08-10T12:03:00.000Z',
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.boundItems.bound_1).toMatchObject({
      grade: 2,
      resonanceThreshold: 300,
      visualStage: 2,
      components: { essences: ['essence_mycelial'] },
    })
    expect(result.value.inventory).toHaveLength(0)
    expect(result.value.boundItems.bound_1.memories).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ sourceId: 'bond_rite_grade_2' }),
      ]),
    )
    expect(result.value.world.worldFlags).toContain('bound_weapon_grade_2')
    expect(save.boundItems.bound_1.grade).toBe(1)
    expect(save.inventory).toHaveLength(1)
  })

  it('rejeita repetir a primeira Infusão', () => {
    const save = makeRiteSave()
    save.boundItems.bound_1.resonance = 100
    const first = performGradeTwoRite(
      save,
      'bound_1',
      'fragment_1',
      content,
      '2026-08-10T12:03:00.000Z',
    )
    expect(first.ok).toBe(true)
    if (!first.ok) return
    const repeated = performGradeTwoRite(
      first.value,
      'bound_1',
      'fragment_1',
      content,
      '2026-08-10T12:04:00.000Z',
    )
    expect(repeated).toMatchObject({ ok: false, code: 'BOUND_GRADE_INVALID' })
  })
})
