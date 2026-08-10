import type { ContentCatalog } from '../../content/catalog'
import type { TrailDefinition, TrailNodeDefinition } from '../../content/types'
import type { GameSave, InventoryItemInstance } from '../game/types'
import { fail, ok, type Result } from '../shared/types'

export type TrailCompletion = {
  save: GameSave
  completedNode: TrailNodeDefinition
  nextNode: TrailNodeDefinition | null
}

export const getCurrentTrailNode = (save: GameSave, trail: TrailDefinition) =>
  trail.nodes.find((node) => save.world.trailNodeStates[node.id] === 'current') ?? null

export const getTrailByNodeId = (catalog: ContentCatalog, nodeId: string) =>
  Object.values(catalog.trails).find((trail) => trail.nodes.some((node) => node.id === nodeId)) ?? null

export const completeTrailNode = (
  save: GameSave,
  trail: TrailDefinition,
  nodeId: string,
  now: string,
): Result<TrailCompletion> => {
  const nodeIndex = trail.nodes.findIndex((node) => node.id === nodeId)
  const node = trail.nodes[nodeIndex]
  if (!node) return fail('UNKNOWN_TRAIL_NODE', 'Nó de trilha desconhecido.')
  if (save.world.trailNodeStates[node.id] !== 'current') {
    return fail('TRAIL_NODE_LOCKED', 'Este nó não é o objetivo atual da trilha.')
  }

  const next = structuredClone(save)
  next.world.trailNodeStates[node.id] = 'completed'
  const nextNode = trail.nodes[nodeIndex + 1] ?? null
  if (nextNode) {
    next.world.trailNodeStates[nextNode.id] = nextNode.type === 'boss' ? 'boss' : 'current'
  }
  next.updatedAt = now
  next.revision += 1
  next.eventLog.push(`TrailNodeCompleted:${node.id}`)
  return ok({ save: next, completedNode: node, nextNode })
}

export const resolveTrailInteraction = (
  save: GameSave,
  trail: TrailDefinition,
  nodeId: string,
  catalog: ContentCatalog,
  now: string,
  createInstanceId: (definitionId: string, index: number) => string = (definitionId) =>
    `${definitionId}_${crypto.randomUUID()}`,
): Result<TrailCompletion & { grantedItems: InventoryItemInstance[] }> => {
  const node = trail.nodes.find((candidate) => candidate.id === nodeId)
  if (!node?.interaction || !['entry', 'event', 'camp', 'npc', 'chest'].includes(node.type)) {
    return fail('NODE_NOT_INTERACTIVE', 'Este nó não possui uma interação resolvível.')
  }
  const completion = completeTrailNode(save, trail, nodeId, now)
  if (!completion.ok) return completion

  const next = completion.value.save
  const grantedItems: InventoryItemInstance[] = []
  for (const [index, definitionId] of node.interaction.grantItemDefinitionIds.entries()) {
    const definition = catalog.items[definitionId]
    if (!definition) return fail('UNKNOWN_REWARD_ITEM', `Recompensa não cadastrada: ${definitionId}`)
    const instance: InventoryItemInstance = {
      instanceId: createInstanceId(definitionId, index),
      definitionId,
      quantity: 1,
      rarity: definition.rarity,
      locked: false,
      favorite: false,
      acquiredAt: now,
    }
    grantedItems.push(instance)
    next.inventory.push(instance)
  }
  if (
    node.interaction.worldFlag &&
    !next.world.worldFlags.includes(node.interaction.worldFlag)
  ) {
    next.world.worldFlags.push(node.interaction.worldFlag)
  }
  next.eventLog.push(`TrailInteractionResolved:${node.id}`)
  return ok({ ...completion.value, save: next, grantedItems })
}
