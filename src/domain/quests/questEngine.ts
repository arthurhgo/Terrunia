import type { ContentCatalog } from '../../content/catalog'
import type { QuestDefinition } from '../../content/types'
import { addRawEssence } from '../essence/essence'
import type { GameSave, QuestProgress } from '../game/types'
import { fail, ok, type Result } from '../shared/types'
import { gainCharacterXp } from '../character/attributeProgression'
import { consumeQuestDelivery, refreshDeliveryQuestProgress } from './questInventory'

export const SLOT_OCCUPYING_QUEST_STATUSES = ['active', 'ready_to_turn_in'] as const

export const getActiveQuestCount = (save: GameSave) => Object.values(save.quests)
  .filter((progress) => SLOT_OCCUPYING_QUEST_STATUSES.includes(progress.status as typeof SLOT_OCCUPYING_QUEST_STATUSES[number])).length

/** No capacity limit; explicit offers and prerequisites still govern acceptance. */
export const canAcceptQuest = (_save: GameSave): Result<true> => ok(true)

export type QuestEvent =
  | { type: 'talk'; targetId: string; amount?: number }
  | { type: 'kill'; targetId: string; amount?: number }
  | { type: 'collect'; targetId: string; amount?: number }
  | { type: 'visit'; targetId: string; amount?: number }
  | { type: 'interact'; targetId: string; amount?: number }
  | { type: 'completeRite'; targetId: string; amount?: number }

export const createQuestProgress = (definition: QuestDefinition): QuestProgress => ({
  questId: definition.id,
  status: definition.initialStatus ?? 'available',
  tracked: false,
  objectives: Object.fromEntries(definition.objectives.map((objective) => [objective.id, 0])),
})

const prerequisitesMet = (save: GameSave, definition: QuestDefinition) =>
  (definition.prerequisites ?? []).every((requirement) => {
    switch (requirement.type) {
      case 'clanKnown': return save.character.clan.knownClanIds.includes(requirement.clanId)
      case 'questCompleted': return save.quests[requirement.questId]?.status === 'completed'
      case 'clanJoined': return save.character.clan.clanId === requirement.clanId
      case 'noClan': return save.character.clan.clanId === null
      case 'noClass': return save.character.classProgression.classId === null
      case 'hasClan': return save.character.clan.clanId !== null
      case 'hasClass': return save.character.classProgression.classId !== null
    }
  })

export const refreshQuestAvailability = (save: GameSave, catalog: ContentCatalog, now: string): GameSave => {
  const next = structuredClone(save)
  let changed = false
  for (const definition of Object.values(catalog.quests)) {
    const progress = next.quests[definition.id]
    if (!progress || progress.status !== 'locked' || !prerequisitesMet(next, definition)) continue
    progress.status = 'available'
    changed = true
    next.eventLog.push(`QuestAvailable:${definition.id}`)
  }
  if (changed) {
    next.updatedAt = now
    next.revision += 1
  }
  return changed ? next : save
}

export const offerQuest = (
  save: GameSave,
  questId: string,
  catalog: ContentCatalog,
  now: string,
): Result<GameSave> => {
  if (!catalog.quests[questId]) return fail('UNKNOWN_QUEST', 'Missão desconhecida.')
  const progress = save.quests[questId]
  if (!progress || progress.status !== 'available') {
    return fail('QUEST_NOT_AVAILABLE', 'Esta missão não está disponível para oferta.')
  }
  if (!prerequisitesMet(save, catalog.quests[questId])) {
    return fail('QUEST_PREREQUISITES_NOT_MET', 'Os requisitos desta missão não estão mais válidos.')
  }
  const next = structuredClone(save)
  next.quests[questId].status = 'offered'
  next.updatedAt = now
  next.revision += 1
  next.eventLog.push(`QuestOffered:${questId}`)
  return ok(next)
}

export const declineQuest = (save: GameSave, questId: string, now: string): Result<GameSave> => {
  const progress = save.quests[questId]
  if (!progress || progress.status !== 'offered') {
    return fail('QUEST_NOT_OFFERED', 'Esta missão não possui uma oferta aberta.')
  }
  const next = structuredClone(save)
  next.quests[questId].status = 'available'
  next.updatedAt = now
  next.revision += 1
  next.eventLog.push(`QuestDeclined:${questId}`)
  return ok(next)
}

export const acceptQuest = (
  save: GameSave,
  questId: string,
  catalog: ContentCatalog,
  now: string,
): Result<GameSave> => {
  const definition = catalog.quests[questId]
  if (!definition) return fail('UNKNOWN_QUEST', 'Missão desconhecida.')
  const progress = save.quests[questId]
  if (!progress || progress.status !== 'offered') {
    return fail('QUEST_NOT_OFFERED', 'Leia a oferta antes de aceitar esta missão.')
  }
  const capacity = canAcceptQuest(save)
  if (!capacity.ok) return capacity
  const next = structuredClone(save)
  next.quests[questId].status = 'active'
  next.quests[questId].tracked = true
  next.quests[questId].acceptedAt = now
  next.updatedAt = now
  next.revision += 1
  next.eventLog.push(`QuestAccepted:${questId}`)
  // A recovered landmark is permanent evidence. Late acceptance and migrated
  // campaigns must not require replaying one-time story combats.
  let reconciled = next
  for (const objective of definition.objectives) {
    if (objective.type === 'visit' && next.world.trailNodeStates[objective.targetId] === 'completed') {
      reconciled = applyQuestEvent(reconciled, { type: 'visit', targetId: objective.targetId, amount: objective.required }, catalog, now)
    }
  }
  return ok(refreshDeliveryQuestProgress(reconciled, catalog, now))
}

export const setQuestTracked = (
  save: GameSave,
  questId: string,
  tracked: boolean,
  now: string,
): Result<GameSave> => {
  const progress = save.quests[questId]
  if (!progress || !['active', 'ready_to_turn_in'].includes(progress.status)) {
    return fail('QUEST_NOT_JOURNALED', 'Somente missões do Journal podem ser rastreadas.')
  }
  if (progress.tracked === tracked) return ok(save)
  const next = structuredClone(save)
  next.quests[questId].tracked = tracked
  next.updatedAt = now
  next.revision += 1
  next.eventLog.push(`QuestTrackingChanged:${questId}:${tracked}`)
  return ok(next)
}

const applyQuestRewards = (save: GameSave, definition: QuestDefinition) => {
  for (const reward of definition.rewards) {
    if (reward.type === 'characterXp') {
      const gain = gainCharacterXp(save.character, reward.value)
      save.character = gain.character
      if (gain.levelsGained > 0) save.eventLog.push(`CharacterLevelGained:${gain.levelsGained}`)
    }
    if (reward.type === 'gold') save.wallet.gold += reward.value
    if (reward.type === 'rawEssence') {
      const gain = addRawEssence(save.essence, reward.value)
      if (gain.ok) {
        save.essence = gain.value.progress
        save.eventLog.push(`RawEssenceReward:${reward.value}`, `EssencePointsGained:${gain.value.gainedPoints}`)
      } else save.eventLog.push(`RawEssenceRewardRejected:${reward.value}`)
    }
  }
  for (const outcome of definition.outcomes ?? []) {
    if (outcome.type === 'clanEligibility' && !save.character.clan.eligibleClanIds.includes(outcome.clanId)) {
      save.character.clan.eligibleClanIds.push(outcome.clanId)
    }
    if (outcome.type === 'classEligibility' && !save.character.classProgression.eligibleClassIds.includes(outcome.classId)) {
      save.character.classProgression.eligibleClassIds.push(outcome.classId)
    }
    if (outcome.type === 'clanReputation' && save.character.clan.knownClanIds.includes(outcome.clanId)) {
      save.character.clan.reputation += outcome.value
    }
    if (outcome.type === 'worldFlag' && !save.world.worldFlags.includes(outcome.flag)) {
      save.world.worldFlags.push(outcome.flag)
    }
  }
}

export const turnInQuest = (
  save: GameSave,
  questId: string,
  npcId: string,
  catalog: ContentCatalog,
  now: string,
): Result<GameSave> => {
  const definition = catalog.quests[questId]
  const progress = save.quests[questId]
  if (!definition || !progress) return fail('UNKNOWN_QUEST', 'Missão desconhecida.')
  if (progress.status !== 'ready_to_turn_in') return fail('QUEST_NOT_READY', 'Os objetivos desta missão ainda não foram concluídos.')
  if (definition.turnInNpcId !== npcId) return fail('WRONG_TURN_IN_NPC', 'Esta missão deve ser entregue a outro NPC.')

  const delivery = consumeQuestDelivery(save, definition, catalog)
  if (!delivery.ok) return delivery
  const next = delivery.value
  applyQuestRewards(next, definition)
  next.quests[questId].status = 'completed'
  next.quests[questId].tracked = false
  next.quests[questId].completedAt = now
  const relationship = next.relationships[npcId]
  if (relationship && !relationship.completedQuestIds.includes(questId)) relationship.completedQuestIds.push(questId)
  next.updatedAt = now
  next.revision += 1
  next.eventLog.push(`QuestCompleted:${questId}`)
  return ok(refreshDeliveryQuestProgress(refreshQuestAvailability(next, catalog, now), catalog, now))
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
    if (definition.turnInItems?.length && event.type === 'collect') continue
    for (const objective of definition.objectives) {
      if (objective.type !== event.type || objective.targetId !== event.targetId) continue
      progress.objectives[objective.id] = Math.min(objective.required, (progress.objectives[objective.id] ?? 0) + (event.amount ?? 1))
      changed = true
    }
    if (definition.objectives.every((objective) => (progress.objectives[objective.id] ?? 0) >= objective.required)) {
      progress.status = 'ready_to_turn_in'
      progress.tracked = true
      next.eventLog.push(`QuestReadyToTurnIn:${definition.id}`)
    }
  }
  if (changed) {
    next.updatedAt = now
    next.revision += 1
  }
  return refreshDeliveryQuestProgress(next, catalog, now)
}
