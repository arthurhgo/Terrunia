import type { ContentCatalog } from '../../content/catalog'
import type { QuestDefinition } from '../../content/types'
import { addRawEssence } from '../essence/essence'
import type { GameSave, QuestProgress } from '../game/types'
import { fail, ok, type Result } from '../shared/types'

export type QuestEvent =
  | { type: 'talk'; targetId: string; amount?: number }
  | { type: 'kill'; targetId: string; amount?: number }
  | { type: 'collect'; targetId: string; amount?: number }
  | { type: 'visit'; targetId: string; amount?: number }
  | { type: 'interact'; targetId: string; amount?: number }
  | { type: 'completeRite'; targetId: string; amount?: number }

export const createQuestProgress = (definition: QuestDefinition): QuestProgress => ({
  questId: definition.id,
  status: 'available',
  objectives: Object.fromEntries(definition.objectives.map((objective) => [objective.id, 0])),
})

export const acceptQuest = (
  save: GameSave,
  questId: string,
  catalog: ContentCatalog,
  now: string,
): Result<GameSave> => {
  const definition = catalog.quests[questId]
  if (!definition) return fail('UNKNOWN_QUEST', 'Missão desconhecida.')
  const progress = save.quests[questId]
  if (!progress || progress.status !== 'available') {
    return fail('QUEST_NOT_AVAILABLE', 'Esta missão não está disponível para aceitação.')
  }

  const next = structuredClone(save)
  next.quests[questId].status = 'active'
  next.quests[questId].acceptedAt = now
  next.updatedAt = now
  next.revision += 1
  next.eventLog.push(`QuestAccepted:${questId}`)
  return ok(next)
}

const applyQuestRewards = (
  save: GameSave,
  definition: QuestDefinition,
  now: string,
) => {
  for (const reward of definition.rewards) {
    if (reward.type === 'characterXp') save.character.xp += reward.value
    if (reward.type === 'gold') save.wallet.gold += reward.value
    if (reward.type === 'rawEssence') {
      const gain = addRawEssence(save.essence, reward.value)
      if (gain.ok) {
        save.essence = gain.value.progress
        save.eventLog.push(
          `RawEssenceReward:${reward.value}`,
          `EssencePointsGained:${gain.value.gainedPoints}`,
        )
      } else {
        save.eventLog.push(`RawEssenceRewardRejected:${reward.value}`)
      }
    }
  }
  save.quests[definition.id].completedAt = now
  save.eventLog.push(`QuestCompleted:${definition.id}`)
}

export const applyQuestEvent = (
  save: GameSave,
  event: QuestEvent,
  catalog: ContentCatalog,
  now: string,
): GameSave => {
  const next = structuredClone(save)
  let changed = false

  for (const progress of Object.values(next.quests)) {
    if (progress.status !== 'active') continue
    const definition = catalog.quests[progress.questId]
    if (!definition) continue

    for (const objective of definition.objectives) {
      if (objective.type !== event.type || objective.targetId !== event.targetId) continue
      progress.objectives[objective.id] = Math.min(
        objective.required,
        (progress.objectives[objective.id] ?? 0) + (event.amount ?? 1),
      )
      changed = true
    }

    const complete = definition.objectives.every(
      (objective) => (progress.objectives[objective.id] ?? 0) >= objective.required,
    )
    if (complete) {
      progress.status = 'completed'
      applyQuestRewards(next, definition, now)
    }
  }

  if (changed) {
    next.updatedAt = now
    next.revision += 1
  }
  return next
}
