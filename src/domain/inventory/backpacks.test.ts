import { describe, expect, it } from 'vitest'
import { content } from '../../content/catalog'
import { createNewSave } from '../game/createSave'
import { BACKPACK_UPGRADES, backpackFlag, getBackpackCapacity, routeNewItemOverflow } from './backpacks'

const save = () => createNewSave('owner', 'Asha', 'character.terririan.default', content, '2026-11-04T12:00:00Z')

describe('mochilas e slots de inventário', () => {
  it('expande o limite somente com melhorias persistidas', () => {
    const player = save()
    expect(getBackpackCapacity(player)).toBe(12)
    player.world.worldFlags.push(backpackFlag(BACKPACK_UPGRADES[0].id))
    expect(getBackpackCapacity(player)).toBe(18)
    player.world.worldFlags.push(backpackFlag(BACKPACK_UPGRADES[2].id))
    expect(getBackpackCapacity(player)).toBe(36)
  })

  it('preserva loot novo excedente no baú, sem perder itens de saves legados', () => {
    const old = save()
    old.inventory = Array.from({ length: 12 }, (_, i) => ({
      instanceId: 'old_' + i, definitionId: 'drop_fungal_core', quantity: 1, rarity: 'common' as const,
      locked: false, favorite: false, acquiredAt: '2026-11-04T12:00:00Z',
    }))
    const next = structuredClone(old)
    next.inventory.push({
      instanceId: 'new_1', definitionId: 'drop_fungal_core', quantity: 1, rarity: 'common',
      locked: false, favorite: false, acquiredAt: '2026-11-04T12:00:00Z',
    })
    const routed = routeNewItemOverflow(old, next)
    expect(routed.inventory).toHaveLength(12)
    expect(routed.baseStorage.map((item) => item.instanceId)).toContain('new_1')
    expect(old.baseStorage).toHaveLength(0)
  })
})
