import { describe, expect, it } from 'vitest'
import { content } from '../../content/catalog'
import type { InventoryItemInstance } from '../game/types'
import { addBattleLootToInventory, canStackLoot, groupBattleLoot } from './battleLoot'

const at = '2026-11-03T15:00:00Z'
const item = (instanceId: string, definitionId: string, quantity = 1, favorite = false): InventoryItemInstance => ({
  instanceId, definitionId, quantity, rarity: content.items[definitionId].rarity,
  locked: false, favorite, acquiredAt: at,
})

describe('Espólios de batalha e empilhamento', () => {
  it('agrupa visualmente repetições mantendo quantidade real de cada tipo', () => {
    expect(groupBattleLoot(['drop_fungal_nucleus', 'drop_fungal_nucleus', 'drop_spore_cluster']))
      .toEqual([{ definitionId: 'drop_fungal_nucleus', quantity: 2 },
        { definitionId: 'drop_spore_cluster', quantity: 1 }])
  })

  it('acumula loot novo sobre pilhas anteriores sem alterar o inventário original', () => {
    const existing = [item('old-stack', 'drop_fungal_nucleus', 3)]
    const snapshot = structuredClone(existing)
    const next = addBattleLootToInventory(existing,
      ['drop_fungal_nucleus', 'drop_fungal_nucleus', 'drop_spore_cluster'],
      content, 'battle_22', 'encounter_fungorro_01', at)
    expect(next).toHaveLength(2)
    expect(next[0]).toMatchObject({ instanceId: 'old-stack', quantity: 5 })
    expect(next[1]).toMatchObject({ definitionId: 'drop_spore_cluster', quantity: 1 })
    expect(existing).toEqual(snapshot)
  })

  it('protege itens individuais, favoritos, bloqueados e equipáveis contra fusão indevida', () => {
    expect(canStackLoot('equipment_worn_linen_tunic', content)).toBe(false)
    expect(canStackLoot('quest_hunter_insignia', content)).toBe(false)
    expect(canStackLoot('drop_fungal_nucleus', content)).toBe(true)
    const inventory = [
      item('favorite', 'drop_fungal_nucleus', 7, true),
      item('armor', 'equipment_worn_linen_tunic', 1),
    ]
    const added = addBattleLootToInventory(inventory,
      ['drop_fungal_nucleus', 'equipment_worn_linen_tunic', 'equipment_worn_linen_tunic',
        'drop_fungal_nucleus', 'quest_hunter_insignia', 'quest_hunter_insignia'],
      content, 'battle_24', 'encounter_fungorro_01', at)
    expect(added.find((entry) => entry.instanceId === 'favorite')?.quantity).toBe(7)
    expect(added.filter((entry) => entry.definitionId === 'drop_fungal_nucleus')).toHaveLength(2)
    expect(added.find((entry) => entry.definitionId === 'drop_fungal_nucleus' && !entry.favorite)?.quantity).toBe(2)
    expect(added.filter((entry) => entry.definitionId === 'equipment_worn_linen_tunic')).toHaveLength(3)
    expect(added.filter((entry) => entry.definitionId === 'quest_hunter_insignia')).toHaveLength(2)
    expect(added).toHaveLength(7)
  })

  it('continua empilhando fragmentos/joias consumíveis por quantidade sem apagar instâncias', () => {
    expect(canStackLoot('fragment_mycelial_essence', content)).toBe(true)
    const next = addBattleLootToInventory([],
      ['fragment_mycelial_essence', 'fragment_mycelial_essence',
        'consumable_minor_tonic', 'consumable_minor_tonic'],
      content, 'battle_25', 'encounter_fungorro_01', at)
    expect(next).toHaveLength(2)
    expect(next.map((entry) => entry.quantity)).toEqual([2, 2])
  })
})
