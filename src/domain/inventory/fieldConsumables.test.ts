import { describe, expect, it } from 'vitest'
import { content } from '../../content/catalog'
import { createNewSave } from '../game/createSave'
import { deriveCharacterStats } from '../character/derivedStats'
import { useFieldConsumable } from './fieldConsumables'

const make = () => {
  const save = createNewSave('owner','Teri','character.terririan.default',content)
  save.inventory.push({
    instanceId:'potion-v057',definitionId:'consumable_minor_tonic',quantity:2,
    rarity:'common',locked:false,favorite:false,acquiredAt:save.updatedAt,
  })
  return save
}

describe('poções durante exploração', () => {
  it('restaura HP, preserva atributos e consome só uma dose', () => {
    const save = make()
    const maxHp = deriveCharacterStats(save,content).life.value
    save.vitals.hp = maxHp - 10
    const before = structuredClone(save)
    const result = useFieldConsumable(save,'potion-v057',content,save.updatedAt)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.vitals.hp).toBe(maxHp - 2)
    expect(result.value.inventory.find((item) => item.instanceId === 'potion-v057')?.quantity).toBe(1)
    expect(result.value.character).toEqual(before.character)
    expect(result.value.essence).toEqual(before.essence)
    expect(save.inventory[0].quantity).toBe(2)
  })

  it('recusa poção inútil em vida cheia e não gasta itens', () => {
    const save = make()
    const result = useFieldConsumable(save,'potion-v057',content,save.updatedAt)
    expect(result).toMatchObject({ok:false,code:'FIELD_RECOVERY_FULL'})
    expect(save.inventory[0].quantity).toBe(2)
  })

  it('não permite usar a ação de exploração com batalha ativa', () => {
    const save = make()
    save.battle = {} as typeof save.battle
    expect(useFieldConsumable(save,'potion-v057',content,save.updatedAt))
      .toMatchObject({ok:false,code:'FIELD_ITEM_IN_COMBAT'})
  })
})
