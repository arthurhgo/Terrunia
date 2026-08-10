import { describe, expect, it } from 'vitest'
import { content } from '../../content/catalog'
import type { EssenceProgress, InventoryItemInstance } from '../game/types'
import { convertInventoryItems, sellInventoryItems } from './inventory'

const essence: EssenceProgress = {
  current: 0,
  required: 100,
  essencePoints: 0,
  lifetimeEssence: 0,
  cycle: 0,
}

const item = (definitionId: string, overrides: Partial<InventoryItemInstance> = {}): InventoryItemInstance => ({
  instanceId: `instance_${definitionId}`,
  definitionId,
  quantity: 1,
  rarity: content.items[definitionId]?.rarity ?? 'common',
  locked: false,
  favorite: false,
  acquiredAt: '2026-08-10T12:00:00.000Z',
  ...overrides,
})

describe('inventário de drops', () => {
  it('converte drop em Essência sem equipá-lo', () => {
    const drop = item('drop_fungal_nucleus')
    const result = convertInventoryItems([drop], essence, [drop.instanceId], content)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.inventory).toHaveLength(0)
    expect(result.value.gainedPoints).toBe(1)
  })

  it('impede conversão e venda de item protegido por quest', () => {
    const questItem = item('quest_astravel_record')
    expect(convertInventoryItems([questItem], essence, [questItem.instanceId], content)).toMatchObject({
      ok: false,
      code: 'ITEM_PROTECTED',
    })
    expect(sellInventoryItems([questItem], 0, [questItem.instanceId], content)).toMatchObject({
      ok: false,
      code: 'ITEM_PROTECTED',
    })
  })

  it('favorito bloqueia destruição acidental', () => {
    const favorite = item('drop_fungal_nucleus', { favorite: true })
    expect(convertInventoryItems([favorite], essence, [favorite.instanceId], content).ok).toBe(false)
  })
})
