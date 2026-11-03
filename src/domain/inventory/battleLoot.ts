import type { ContentCatalog } from '../../content/catalog'
import type { InventoryItemInstance } from '../game/types'

/** Only fungible resources may share an inventory slot. Never combine starter gear,
 * protected/unique quest items or separate upgraded instances.
 */
export const canStackLoot = (definitionId: string, catalog: ContentCatalog): boolean => {
  const kind = catalog.items[definitionId]?.category
  return kind === 'drop' || kind === 'material' || kind === 'fragment' ||
    kind === 'gem' || kind === 'consumable' || kind === 'trade'
}

export type LootStack = { definitionId: string; quantity: number }

export const groupBattleLoot = (definitionIds: readonly string[]): LootStack[] => {
  const groups = new Map<string, number>()
  for (const id of definitionIds) groups.set(id, (groups.get(id) ?? 0) + 1)
  return [...groups].map(([definitionId, quantity]) => ({ definitionId, quantity }))
}

export const addBattleLootToInventory = (
  inventory: readonly InventoryItemInstance[],
  definitionIds: readonly string[],
  catalog: ContentCatalog,
  battleId: string,
  encounterId: string,
  acquiredAt: string,
): InventoryItemInstance[] => {
  const result = inventory.map((item) => ({ ...item }))
  definitionIds.forEach((definitionId, index) => {
    const definition = catalog.items[definitionId]
    if (!definition) throw new Error(`Drop desconhecido: ${definitionId}`)
    const stackable = canStackLoot(definitionId, catalog)
    const existing = stackable ? result.find((item) =>
      item.definitionId === definitionId && item.rarity === definition.rarity &&
      !item.locked && !item.favorite && (item.refinementLevel ?? 0) === 0) : undefined
    if (existing) {
      existing.quantity += 1
    } else {
      result.push({
        instanceId: `${battleId}_${encounterId}_loot_${index + 1}`,
        definitionId,
        quantity: 1,
        rarity: definition.rarity,
        locked: false,
        favorite: false,
        acquiredAt,
      })
    }
  })
  return result
}
