import type { ContentCatalog } from '../../content/catalog'
import type { Requirement, SkillTreeNodeDefinition } from '../../content/types'
import type { BoundEquipmentInstance, GameSave } from '../game/types'
import { fail, ok, type BoundSlot, type Effect, type Result } from '../shared/types'

export type SkillNodeState = 'hidden' | 'locked' | 'discovered' | 'available' | 'unlocked'

const getBoundItem = (save: GameSave, slot: BoundSlot): BoundEquipmentInstance | null => {
  const itemId = save.character.bondedEquipment[slot]
  return itemId ? save.boundItems[itemId] ?? null : null
}

const allUnlockedNodeIds = (save: GameSave) => {
  const ids = new Set<string>()
  for (const progress of Object.values(save.skillTrees)) {
    progress.unlockedNodeIds.forEach((id) => ids.add(id))
  }
  for (const item of Object.values(save.boundItems)) {
    item.skillTree.unlockedNodeIds.forEach((id) => ids.add(id))
  }
  return ids
}

export const evaluateRequirement = (
  save: GameSave,
  requirement: Requirement,
  catalog: ContentCatalog,
): boolean => {
  switch (requirement.type) {
    case 'boundItemPresent':
      return getBoundItem(save, requirement.slot) !== null
    case 'boundItemGrade':
      return (getBoundItem(save, requirement.slot)?.grade ?? 0) >= requirement.value
    case 'boundItemResonance':
      return (getBoundItem(save, requirement.slot)?.resonance ?? 0) >= requirement.value
    case 'previousNode':
      return allUnlockedNodeIds(save).has(requirement.nodeId)
    case 'hasEssenceTag': {
      const item = getBoundItem(save, requirement.slot)
      return (
        item?.components.essences.some((essenceId) =>
          catalog.essences[essenceId]?.affinityTags.includes(requirement.value),
        ) ?? false
      )
    }
    case 'hasJewelId':
      return getBoundItem(save, requirement.slot)?.components.gems.includes(requirement.value) ?? false
    case 'hasRuneId':
      return getBoundItem(save, requirement.slot)?.components.runeId === requirement.value
    case 'characterLevel':
      return save.character.level >= requirement.value
    case 'clanId':
      return save.character.clan.clanId === requirement.value
    case 'clanRank':
      return save.character.clan.rank >= requirement.value
    case 'classId':
      return save.character.classProgression.classId === requirement.value
    case 'questCompleted':
      return save.quests[requirement.questId]?.status === 'completed'
    case 'npcDiscovered':
      return save.relationships[requirement.npcId]?.discovered === true
    case 'memory':
      return (
        getBoundItem(save, requirement.slot)?.memories.some(
          (memory) => memory.id === requirement.memoryId || memory.sourceId === requirement.memoryId,
        ) ?? false
      )
    case 'worldFlag':
      return save.world.worldFlags.includes(requirement.flag)
  }
}

const isNodeUnlocked = (save: GameSave, node: SkillTreeNodeDefinition) => {
  if (node.context === 'nexus' || node.context === 'clan' || node.context === 'class') {
    return save.skillTrees[node.treeId]?.unlockedNodeIds.includes(node.id) ?? false
  }
  return getBoundItem(save, node.context)?.skillTree.unlockedNodeIds.includes(node.id) ?? false
}

export const getSkillNodeState = (
  save: GameSave,
  node: SkillTreeNodeDefinition,
  catalog: ContentCatalog,
): SkillNodeState => {
  if (isNodeUnlocked(save, node)) return 'unlocked'
  if (!node.hiddenUntil.every((requirement) => evaluateRequirement(save, requirement, catalog))) {
    return 'hidden'
  }
  const requirementsMet = node.requires.every((requirement) =>
    evaluateRequirement(save, requirement, catalog),
  )
  if (requirementsMet) return 'available'
  return node.hiddenUntil.length > 0 ? 'discovered' : 'locked'
}

const getNodeProgress = (save: GameSave, node: SkillTreeNodeDefinition) => {
  if (node.context === 'nexus' || node.context === 'clan' || node.context === 'class') {
    return save.skillTrees[node.treeId]
  }
  return getBoundItem(save, node.context)?.skillTree
}

export const unlockSkillNode = (
  save: GameSave,
  node: SkillTreeNodeDefinition,
  catalog: ContentCatalog,
  now: string,
): Result<GameSave> => {
  const state = getSkillNodeState(save, node, catalog)
  if (state === 'unlocked') return fail('NODE_ALREADY_UNLOCKED', 'Este node já está desbloqueado.')
  if (state !== 'available') return fail('NODE_REQUIREMENTS', 'Os requisitos deste node ainda não foram cumpridos.')
  if (save.essence.essencePoints < node.costEssencePoints) {
    return fail('INSUFFICIENT_ESSENCE_POINTS', 'Pontos de Essência insuficientes.')
  }

  const next = structuredClone(save)
  const progress = getNodeProgress(next, node)
  if (!progress) return fail('TREE_NOT_AVAILABLE', 'A árvore correspondente ainda não está vinculada.')

  progress.unlockedNodeIds.push(node.id)
  progress.spentEssencePoints += node.costEssencePoints
  next.essence.essencePoints -= node.costEssencePoints
  next.updatedAt = now
  next.revision += 1
  next.eventLog.push(`SkillNodeUnlocked:${node.id}`)
  return ok(next)
}

export const collectUnlockedEffects = (save: GameSave, catalog: ContentCatalog): Effect[] => {
  const unlocked = allUnlockedNodeIds(save)
  const effects: Effect[] = []
  for (const node of Object.values(catalog.skillTreeNodes)) {
    if (unlocked.has(node.id)) effects.push(...(node.effects as Effect[]))
  }
  return effects
}

export const getFlatStatBonus = (
  save: GameSave,
  catalog: ContentCatalog,
  stat: Extract<Effect, { type: 'statModifier' }>['stat'],
) =>
  collectUnlockedEffects(save, catalog)
    .filter(
      (effect): effect is Extract<Effect, { type: 'statModifier' }> =>
        effect.type === 'statModifier' && effect.stat === stat && effect.operation === 'flat',
    )
    .reduce((total, effect) => total + effect.value, 0)
