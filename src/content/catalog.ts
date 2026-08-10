import { z } from 'zod'
import { boundItemBaseDefinitions, itemDefinitions } from './items'
import { combatSkillDefinitions, encounterDefinitions, statusEffectDefinitions } from './combat'
import { enemyDefinitions } from './enemies'
import { essenceComponentDefinitions } from './essences'
import { npcDefinitions } from './npcs'
import { questDefinitions } from './quests'
import { skillTreeNodeDefinitions } from './skillTrees'
import { trailDefinitions } from './trails'
import type {
  BoundItemBaseDefinition,
  CombatSkillDefinition,
  EnemyDefinition,
  EncounterDefinition,
  EssenceComponentDefinition,
  ItemDefinition,
  NPCDefinition,
  QuestDefinition,
  SkillTreeNodeDefinition,
  StatusEffectDefinition,
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
validateStableIds('combatSkills', combatSkillDefinitions)
validateStableIds('statusEffects', statusEffectDefinitions)
validateStableIds('encounters', encounterDefinitions)
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
  combatSkills: Record<string, CombatSkillDefinition>
  statusEffects: Record<string, StatusEffectDefinition>
  encounters: Record<string, EncounterDefinition>
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
  combatSkills: indexById(combatSkillDefinitions),
  statusEffects: indexById(statusEffectDefinitions),
  encounters: indexById(encounterDefinitions),
  enemies: indexById(enemyDefinitions),
  essences: indexById(essenceComponentDefinitions),
  npcs: indexById(npcDefinitions),
  quests: indexById(questDefinitions),
  skillTreeNodes: indexById(skillTreeNodeDefinitions),
  trails: indexById(trailDefinitions),
}

const assertReference = (exists: unknown, label: string) => {
  if (!exists) throw new Error(`Referência de conteúdo inválida: ${label}`)
}

for (const skill of Object.values(content.combatSkills)) {
  for (const effect of skill.effects) {
    if (effect.type === 'applyStatus') {
      assertReference(content.statusEffects[effect.statusId], `${skill.id} → ${effect.statusId}`)
    }
  }
}

for (const item of Object.values(content.items)) {
  if (item.infusionComponentId) {
    assertReference(
      content.essences[item.infusionComponentId],
      `${item.id} → ${item.infusionComponentId}`,
    )
    if (!item.canInfuseBoundItem) {
      throw new Error(`Item ${item.id} referencia Infusão sem permitir canInfuseBoundItem.`)
    }
  }
}

for (const enemy of Object.values(content.enemies)) {
  for (const skillId of enemy.skillIds) {
    assertReference(content.combatSkills[skillId], `${enemy.id} → ${skillId}`)
  }
}

for (const node of Object.values(content.skillTreeNodes)) {
  for (const effect of node.effects) {
    if (effect.type === 'unlockSkill') {
      assertReference(content.combatSkills[effect.skillId], `${node.id} → ${effect.skillId}`)
    }
  }
}

for (const encounter of Object.values(content.encounters)) {
  for (const enemyId of encounter.enemyDefinitionIds) {
    assertReference(content.enemies[enemyId], `${encounter.id} → ${enemyId}`)
  }
  for (const itemId of encounter.rewards.lootDefinitionIds) {
    assertReference(content.items[itemId], `${encounter.id} → ${itemId}`)
  }
}

for (const trail of Object.values(content.trails)) {
  for (const node of trail.nodes) {
    if (node.encounterId) {
      const encounter = content.encounters[node.encounterId]
      assertReference(encounter, `${node.id} → ${node.encounterId}`)
      if (encounter?.trailNodeId !== node.id) {
        throw new Error(`Encontro ${encounter?.id} aponta para outro nó: ${node.id}`)
      }
    }
    for (const itemId of node.interaction?.grantItemDefinitionIds ?? []) {
      assertReference(content.items[itemId], `${node.id} → ${itemId}`)
    }
  }
}
