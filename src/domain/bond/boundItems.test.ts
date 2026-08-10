import { describe, expect, it } from 'vitest'
import { content } from '../../content/catalog'
import { canBindSlot, createBoundItem, getBoundSlotCapacity } from './boundItems'

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
})
