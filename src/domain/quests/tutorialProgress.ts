import type { ContentCatalog } from '../../content/catalog'
import type { GameSave } from '../game/types'

/** Reconcile real purchases/equipment, including actions done before a lesson was accepted. No rewards here. */
export function refreshTutorialQuestProgress(save: GameSave, catalog: ContentCatalog, now: string): GameSave {
  const armor = save.inventory.find((item) => item.instanceId === save.character.basicArmorInstanceId)
  let next: GameSave | undefined
  for (const definition of Object.values(catalog.quests)) {
    if (!definition.id.startsWith('rosetta_tutorial_') || save.quests[definition.id]?.status !== 'active') continue
    for (const objective of definition.objectives) {
      const met = objective.type === 'purchase' ? save.eventLog.some((event) => event.startsWith('MarketPurchase:') && event.split(':')[2] === objective.targetId)
        : objective.type === 'equip' ? Boolean(save.character.bondedEquipment.armor || (armor && catalog.items[armor.definitionId]?.basicArmor &&
          (objective.targetId === 'basic_armor' || armor.definitionId === objective.targetId)))
        : objective.type === 'refine' ? save.inventory.some((item) => catalog.items[item.definitionId]?.basicArmor && (item.refinementLevel ?? 0) >= 1)
          || save.eventLog.some((event) => event.startsWith('BasicArmorRefined:')) : false
      if (!met || (save.quests[definition.id].objectives[objective.id] ?? 0) >= objective.required) continue
      next ??= structuredClone(save)
      next.quests[definition.id].objectives[objective.id] = objective.required
    }
    const progress = next?.quests[definition.id] ?? save.quests[definition.id]
    if (definition.objectives.every((objective) => (progress.objectives[objective.id] ?? 0) >= objective.required)) {
      next ??= structuredClone(save)
      next.quests[definition.id].status = 'ready_to_turn_in'
      next.quests[definition.id].tracked = true
      next.eventLog.push(`QuestReadyToTurnIn:${definition.id}`)
    }
  }
  if (!next) return save
  next.updatedAt = now; next.revision += 1
  return next
}
