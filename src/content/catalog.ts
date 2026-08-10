import { z } from 'zod'
import { boundItemBaseDefinitions, itemDefinitions } from './items'
import { enemyDefinitions } from './enemies'
import { essenceComponentDefinitions } from './essences'
import { npcDefinitions } from './npcs'
import { questDefinitions } from './quests'
import { skillTreeNodeDefinitions } from './skillTrees'
import { trailDefinitions } from './trails'
import type {
  BoundItemBaseDefinition,
  EnemyDefinition,
  EssenceComponentDefinition,
  ItemDefinition,
  NPCDefinition,
  QuestDefinition,
  SkillTreeNodeDefinition,
  TrailDefinition,
} from './types'

const stableIdSchema = z.string().min(3).regex(/^[a-z0-9_.-]+$/)

const validateStableIds = (label: string, entries: ReadonlyArray<{ id: string }>) => {
  const ids = new Set<string>()
  for (const entry of entries) {
    stableIdSchema.parse(entry.id)
    if (ids.has(entry.id)) throw new Error(`Conteúdo duplicado em ${label}: ${entry.id}`)
    ids.add(entry.id)
  }
}

validateStableIds('items', itemDefinitions)
validateStableIds('boundItemBases', boundItemBaseDefinitions)
validateStableIds('enemies', enemyDefinitions)
validateStableIds('essences', essenceComponentDefinitions)
validateStableIds('npcs', npcDefinitions)
validateStableIds('quests', questDefinitions)
validateStableIds('skillTreeNodes', skillTreeNodeDefinitions)
validateStableIds('trails', trailDefinitions)

const indexById = <T extends { id: string }>(entries: readonly T[]) =>
  Object.fromEntries(entries.map((entry) => [entry.id, entry])) as Record<string, T>

export type ContentCatalog = {
  items: Record<string, ItemDefinition>
  boundItemBases: Record<string, BoundItemBaseDefinition>
  enemies: Record<string, EnemyDefinition>
  essences: Record<string, EssenceComponentDefinition>
  npcs: Record<string, NPCDefinition>
  quests: Record<string, QuestDefinition>
  skillTreeNodes: Record<string, SkillTreeNodeDefinition>
  trails: Record<string, TrailDefinition>
}

export const content: ContentCatalog = {
  items: indexById(itemDefinitions),
  boundItemBases: indexById(boundItemBaseDefinitions),
  enemies: indexById(enemyDefinitions),
  essences: indexById(essenceComponentDefinitions),
  npcs: indexById(npcDefinitions),
  quests: indexById(questDefinitions),
  skillTreeNodes: indexById(skillTreeNodeDefinitions),
  trails: indexById(trailDefinitions),
}
