import { describe, expect, it } from 'vitest'
import { content } from '../../content/catalog'
import { createNewSave } from '../game/createSave'
import { isFieldConsumable, useFieldConsumable } from './fieldConsumables'

const now = '2026-11-06T16:00:00.000Z'
const makeSave = () => {
  const save = createNewSave('owner-field-test', 'Iria', 'character.terririan.default', content, now)
  save.world.currentLocationId = 'astravel_fungorro_01'
  save.vitals.hp = 2
  save.inventory.push({
    instanceId: 'field-tonic',
    definitionId: 'consumable_minor_tonic',
    quantity: 2,
    rarity: 'common',
    locked: false,
    favorite: false,
    acquiredAt: now,
  })
  return save
}

describe('consumíveis de campo — Astravél v0.5.7', () => {
  it('aplica cura real, consome só uma unidade e preserva a localização do save', () => {
    const save = makeSave()
    const oldRevision = save.revision
    const oldHp = save.vitals.hp
    const result = useFieldConsumable(save, 'field-tonic', content, now)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.vitals.hp).toBeGreaterThan(oldHp)
    expect(result.value.vitals.hp).toBeLessThanOrEqual(20)
    expect(result.value.inventory.find((item) => item.instanceId === 'field-tonic')?.quantity).toBe(1)
    expect(result.value.world.currentLocationId).toBe(save.world.currentLocationId)
    expect(result.value.revision).toBe(oldRevision + 1)
    expect(result.value.eventLog).toContain('FieldConsumableUsed:consumable_minor_tonic')
    expect(save.vitals.hp).toBe(oldHp)
    expect(save.inventory.find((item) => item.instanceId === 'field-tonic')?.quantity).toBe(2)
  })

  it('bloqueia uso em combate e fora de Astravél, sem alterar o save', () => {
    const save = makeSave()
    const before = structuredClone(save)
    save.world.currentLocationId = 'terran'
    expect(useFieldConsumable(save, 'field-tonic', content, now)).toMatchObject({ ok: false, code: 'FIELD_NOT_IN_ASTRAVEL' })
    save.world.currentLocationId = before.world.currentLocationId
    save.battle = { id: 'active-battle' } as typeof save.battle
    expect(useFieldConsumable(save, 'field-tonic', content, now)).toMatchObject({ ok: false, code: 'FIELD_IN_BATTLE' })
    expect(save.inventory).toEqual(before.inventory)
  })

  it('não permite gastar item de missão, ofensivo ou recurso que já está cheio', () => {
    const save = makeSave()
    save.inventory.push({
      instanceId: 'field-throw', definitionId: 'consumable_resonance_flask',
      quantity: 1, rarity: 'common', locked: false, favorite: false, acquiredAt: now,
    })
    expect(isFieldConsumable(save, 'field-throw', content)).toBe(false)
    expect(useFieldConsumable(save, 'field-throw', content, now))
      .toMatchObject({ ok: false, code: 'FIELD_ITEM_UNAVAILABLE' })

    save.vitals.hp = 100
    save.vitals.mp = 100
    const result = useFieldConsumable(save, 'field-tonic', content, now)
    expect(result).toMatchObject({ ok: false, code: 'FIELD_RESOURCES_FULL' })
    expect(save.inventory.find((item) => item.instanceId === 'field-tonic')?.quantity).toBe(2)
  })
})
