import type { ContentCatalog } from '../../content/catalog'
import { addRawEssence } from '../essence/essence'
import type { EssenceProgress, InventoryItemInstance } from '../game/types'
import { fail, ok, type Result } from '../shared/types'

export type ConversionResult = {
  inventory: InventoryItemInstance[]
  essence: EssenceProgress
  rawEssence: number
  gainedPoints: number
  removedInstanceIds: string[]
}

export const convertInventoryItems = (
  inventory: InventoryItemInstance[],
  essence: EssenceProgress,
  selectedInstanceIds: string[],
  catalog: ContentCatalog,
): Result<ConversionResult> => {
  const selected = new Set(selectedInstanceIds)
  if (selected.size === 0) return fail('EMPTY_SELECTION', 'Selecione pelo menos um item para converter.')

  let rawEssence = 0
  const removedInstanceIds: string[] = []

  for (const instance of inventory) {
    if (!selected.has(instance.instanceId)) continue
    const definition = catalog.items[instance.definitionId]
    if (!definition) return fail('UNKNOWN_ITEM', `Item desconhecido: ${instance.definitionId}`)
    if (instance.locked || instance.favorite || definition.questLocked || !definition.convertToEssence) {
      return fail('ITEM_PROTECTED', `${definition.name} está protegido e não pode ser convertido.`)
    }
    rawEssence += definition.essenceValue * instance.quantity
    removedInstanceIds.push(instance.instanceId)
  }

  if (removedInstanceIds.length !== selected.size) {
    return fail('ITEM_NOT_FOUND', 'Um ou mais itens selecionados não existem no inventário.')
  }

  const gain = addRawEssence(essence, rawEssence)
  if (!gain.ok) return gain

  return ok({
    inventory: inventory.filter((instance) => !selected.has(instance.instanceId)),
    essence: gain.value.progress,
    rawEssence,
    gainedPoints: gain.value.gainedPoints,
    removedInstanceIds,
  })
}

export type SaleResult = {
  inventory: InventoryItemInstance[]
  gold: number
  gainedGold: number
  removedInstanceIds: string[]
}

export const sellInventoryItems = (
  inventory: InventoryItemInstance[],
  gold: number,
  selectedInstanceIds: string[],
  catalog: ContentCatalog,
): Result<SaleResult> => {
  const selected = new Set(selectedInstanceIds)
  if (selected.size === 0) return fail('EMPTY_SELECTION', 'Selecione pelo menos um item para vender.')

  let gainedGold = 0
  const removedInstanceIds: string[] = []
  for (const instance of inventory) {
    if (!selected.has(instance.instanceId)) continue
    const definition = catalog.items[instance.definitionId]
    if (!definition) return fail('UNKNOWN_ITEM', `Item desconhecido: ${instance.definitionId}`)
    if (instance.locked || instance.favorite || definition.questLocked || !definition.sellable) {
      return fail('ITEM_PROTECTED', `${definition.name} está protegido e não pode ser vendido.`)
    }
    gainedGold += definition.sellValue * instance.quantity
    removedInstanceIds.push(instance.instanceId)
  }

  if (removedInstanceIds.length !== selected.size) {
    return fail('ITEM_NOT_FOUND', 'Um ou mais itens selecionados não existem no inventário.')
  }

  return ok({
    inventory: inventory.filter((instance) => !selected.has(instance.instanceId)),
    gold: gold + gainedGold,
    gainedGold,
    removedInstanceIds,
  })
}
