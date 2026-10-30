import type { ContentCatalog } from '../../content/catalog'
import type { QuestDefinition } from '../../content/types'
import type { GameSave } from '../game/types'
import { fail, ok, type Result } from '../shared/types'

export function getDeliverableCount(save: GameSave, itemId: string, catalog: ContentCatalog): number {
  const item = catalog.items[itemId]
  if (!item || !item.sellable || item.questLocked || item.canInfuseBoundItem || item.gemComponentId) return 0
  return save.inventory.filter((entry) => entry.definitionId === itemId && !entry.locked && !entry.favorite)
    .reduce((sum, entry) => sum + entry.quantity, 0)
}

/** Delivery progress is the current usable inventory, never cumulative acquisition. */
export function refreshDeliveryQuestProgress(save: GameSave, catalog: ContentCatalog, now: string): GameSave {
  const next = structuredClone(save)
  let changed = false
  for (const progress of Object.values(next.quests)) {
    if (!['active', 'ready_to_turn_in'].includes(progress.status)) continue
    const definition = catalog.quests[progress.questId]
    if (!definition?.turnInItems?.length) continue
    for (const objective of definition.objectives) {
      if (objective.type !== 'collect') continue
      const count = Math.min(objective.required, getDeliverableCount(next, objective.targetId, catalog))
      if (progress.objectives[objective.id] !== count) { progress.objectives[objective.id] = count; changed = true }
    }
    const ready = definition.objectives.every((objective) => (progress.objectives[objective.id] ?? 0) >= objective.required)
    const status = ready ? 'ready_to_turn_in' : 'active'
    if (progress.status !== status) {
      progress.status = status; changed = true
      next.eventLog.push(`${ready ? 'QuestReadyToTurnIn' : 'QuestMaterialsMissing'}:${definition.id}`)
    }
  }
  if (!changed) return save
  next.updatedAt = now; next.revision += 1
  return next
}

/** Validate all inputs before consuming any stack; bound and protected components are excluded. */
export function consumeQuestDelivery(save: GameSave, definition: QuestDefinition, catalog: ContentCatalog): Result<GameSave> {
  for (const input of definition.turnInItems ?? []) {
    if (getDeliverableCount(save, input.itemId, catalog) < input.quantity) {
      return fail('QUEST_DELIVERY_MISSING', `Separe ${input.quantity} × ${catalog.items[input.itemId]?.name ?? input.itemId} na mochila. Itens favoritos ou protegidos não são entregues.`)
    }
  }
  const next = structuredClone(save)
  for (const input of definition.turnInItems ?? []) {
    let remaining = input.quantity
    for (const item of next.inventory) {
      if (item.definitionId !== input.itemId || item.locked || item.favorite || remaining === 0) continue
      const used = Math.min(item.quantity, remaining)
      item.quantity -= used; remaining -= used
    }
  }
  next.inventory = next.inventory.filter((item) => item.quantity > 0)
  return ok(next)
}
