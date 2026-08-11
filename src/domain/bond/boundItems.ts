import { BALANCE } from '../../content/balance'
import type { ContentCatalog } from '../../content/catalog'
import type { BoundItemBaseDefinition } from '../../content/types'
import type { BoundEquipmentInstance, GameSave } from '../game/types'
import { fail, ok, type BoundSlot, type Result } from '../shared/types'

export const getBoundSlotCapacity = (grade: number) => {
  if (grade <= 1) return { essences: 0, gems: 0, runes: 0, superiorRunes: 0 }
  if (grade === 2) return { essences: 1, gems: 0, runes: 0, superiorRunes: 0 }
  if (grade === 3) return { essences: 1, gems: 1, runes: 0, superiorRunes: 0 }
  if (grade === 4) return { essences: 1, gems: 1, runes: 1, superiorRunes: 0 }
  if (grade === 5) return { essences: 2, gems: 2, runes: 1, superiorRunes: 0 }
  if (grade === 6) return { essences: 2, gems: 2, runes: 1, superiorRunes: 1 }
  return { essences: 0, gems: 0, runes: 0, superiorRunes: 0 }
}

export const createBoundItem = (
  ownerCharacterId: string,
  definition: BoundItemBaseDefinition,
  now: string,
  id: string = crypto.randomUUID(),
): BoundEquipmentInstance => ({
  id,
  baseItemId: definition.id,
  ownerCharacterId,
  slot: definition.slot,
  grade: 1,
  resonance: 0,
  resonanceThreshold: BALANCE.boundGradeResonance[2],
  components: {
    essences: [],
    gems: [],
    runeId: null,
    superiorRuneId: null,
    epicSoulRuneGemId: null,
  },
  skillTree: {
    treeId: definition.treeId,
    unlockedNodeIds: [],
    discoveredNodeIds: [],
    spentEssencePoints: 0,
  },
  memories: [
    {
      id: `memory_${id}_bond`,
      type: 'bond',
      sourceId: 'prologue_bond',
      title: 'Primeiro Vínculo',
      description: 'O instante em que a peça passou a responder à assinatura da alma do Terrírian.',
      createdAt: now,
    },
  ],
  scars: [],
  visualStage: 1,
  createdAt: now,
  updatedAt: now,
})

export const canBindSlot = (
  bondedEquipment: Record<BoundSlot, string | null>,
  slot: BoundSlot,
): Result => {
  if (bondedEquipment[slot]) {
    return fail('BOUND_SLOT_OCCUPIED', 'Um item vinculado não pode ser substituído por equipamento comum.')
  }
  return ok(undefined)
}

export const gainBoundResonance = (
  item: BoundEquipmentInstance,
  amount: number,
  now: string,
): BoundEquipmentInstance => ({
  ...item,
  resonance: Math.max(0, item.resonance + amount),
  updatedAt: now,
})

export const getGradeTwoInfusionCandidates = (
  save: GameSave,
  catalog: ContentCatalog,
) =>
  save.inventory.filter((instance) => {
    const definition = catalog.items[instance.definitionId]
    return Boolean(
      definition?.canInfuseBoundItem &&
      definition.infusionComponentId &&
      catalog.essences[definition.infusionComponentId] &&
      !definition.questLocked &&
      !instance.locked &&
      !instance.favorite,
    )
  })

export const evaluateGemCompatibility = (
  item: BoundEquipmentInstance,
  gemId: string,
  catalog: ContentCatalog,
): Result => {
  const gem = catalog.gems[gemId]
  if (!gem) return fail('GEM_NOT_REGISTERED', 'A Joia selecionada não está cadastrada.')

  const essenceTags = new Set(
    item.components.essences.flatMap(
      (essenceId) => catalog.essences[essenceId]?.affinityTags ?? [],
    ),
  )
  if (essenceTags.size === 0) {
    return fail('GEM_REQUIRES_ESSENCE', 'O Grau III exige uma Essência incorporada para canalizar a Joia.')
  }

  const blockedTag = gem.compatibility.blockedEssenceTags.find((tag) => essenceTags.has(tag))
  if (blockedTag) {
    return fail('GEM_INCOMPATIBLE', `A Joia é incompatível com a afinidade ${blockedTag}.`)
  }

  if (
    gem.compatibility.anyEssenceTags.length > 0 &&
    !gem.compatibility.anyEssenceTags.some((tag) => essenceTags.has(tag))
  ) {
    return fail('GEM_INCOMPATIBLE', 'A Joia não possui afinidade compatível com a Essência incorporada.')
  }

  return ok(undefined)
}

export type GradeThreeGemCandidate = {
  inventoryInstanceId: string
  itemDefinitionId: string
  gemId: string
}

export const getGradeThreeGemCandidates = (
  save: GameSave,
  boundItemId: string,
  catalog: ContentCatalog,
): GradeThreeGemCandidate[] => {
  const item = save.boundItems[boundItemId]
  if (!item) return []

  return save.inventory.flatMap((instance) => {
    const definition = catalog.items[instance.definitionId]
    const gemId = definition?.gemComponentId
    if (
      !definition ||
      definition.category !== 'gem' ||
      !gemId ||
      !catalog.gems[gemId] ||
      definition.questLocked ||
      instance.locked ||
      instance.favorite ||
      !evaluateGemCompatibility(item, gemId, catalog).ok
    ) {
      return []
    }
    return [{
      inventoryInstanceId: instance.instanceId,
      itemDefinitionId: definition.id,
      gemId,
    }]
  })
}

export const performGradeTwoRite = (
  save: GameSave,
  boundItemId: string,
  fragmentInstanceId: string,
  catalog: ContentCatalog,
  now: string,
): Result<GameSave> => {
  if (save.world.currentLocationId !== 'terran') {
    return fail('RITE_REQUIRES_TERRAN', 'O Rito de Evolução deve ser realizado em Terran.')
  }

  const item = save.boundItems[boundItemId]
  if (!item || item.ownerCharacterId !== save.character.id) {
    return fail('BOUND_ITEM_NOT_FOUND', 'O item vinculado não pertence ao Terrírian ativo.')
  }
  if (item.grade !== 1) {
    return fail('BOUND_GRADE_INVALID', 'O primeiro Rito exige um item vinculado de Grau I.')
  }
  if (item.resonance < item.resonanceThreshold) {
    return fail(
      'BOUND_RESONANCE_REQUIRED',
      `Ressonância insuficiente: ${item.resonance}/${item.resonanceThreshold}.`,
    )
  }

  const fragmentIndex = save.inventory.findIndex(
    (instance) => instance.instanceId === fragmentInstanceId,
  )
  const fragment = save.inventory[fragmentIndex]
  const definition = fragment ? catalog.items[fragment.definitionId] : undefined
  const componentId = definition?.infusionComponentId
  if (!fragment) {
    return fail('INFUSION_FRAGMENT_NOT_FOUND', 'O Fragmento selecionado não está mais no inventário.')
  }
  if (!definition?.canInfuseBoundItem || !componentId || !catalog.essences[componentId]) {
    return fail('INFUSION_FRAGMENT_INVALID', 'O item selecionado não contém uma Essência infusível cadastrada.')
  }
  if (definition.questLocked || fragment.locked || fragment.favorite) {
    return fail('INFUSION_FRAGMENT_PROTECTED', 'O Fragmento está protegido e não pode ser consumido pelo Rito.')
  }
  if (item.components.essences.length >= getBoundSlotCapacity(2).essences) {
    return fail('ESSENCE_SLOT_OCCUPIED', 'O slot de Essência do Grau II já está ocupado.')
  }

  const next = structuredClone(save)
  const nextItem = next.boundItems[boundItemId]
  const nextFragment = next.inventory[fragmentIndex]
  if (nextFragment.quantity > 1) nextFragment.quantity -= 1
  else next.inventory.splice(fragmentIndex, 1)

  nextItem.grade = 2
  nextItem.components.essences.push(componentId)
  nextItem.resonanceThreshold = BALANCE.boundGradeResonance[3]
  nextItem.visualStage = 2
  nextItem.updatedAt = now
  nextItem.memories.push({
    id: `${boundItemId}_memory_grade_2`,
    type: 'special',
    sourceId: 'bond_rite_grade_2',
    title: 'Primeira Infusão',
    description: `O Vínculo alcançou o Grau II ao incorporar ${catalog.essences[componentId].name}.`,
    createdAt: now,
  })

  const worldFlag = `bound_${nextItem.slot}_grade_2`
  if (!next.world.worldFlags.includes(worldFlag)) next.world.worldFlags.push(worldFlag)
  next.updatedAt = now
  next.revision += 1
  next.eventLog.push(
    `BoundGradeAdvanced:${boundItemId}:2`,
    `BoundEssenceInfused:${boundItemId}:${componentId}`,
    `InventoryItemConsumed:${fragmentInstanceId}`,
  )
  return ok(next)
}

export const performGradeThreeRite = (
  save: GameSave,
  boundItemId: string,
  gemInstanceId: string,
  catalog: ContentCatalog,
  now: string,
): Result<GameSave> => {
  if (save.world.currentLocationId !== 'terran') {
    return fail('RITE_REQUIRES_TERRAN', 'O Rito de Lapidação deve ser realizado em Terran.')
  }

  const item = save.boundItems[boundItemId]
  if (!item || item.ownerCharacterId !== save.character.id) {
    return fail('BOUND_ITEM_NOT_FOUND', 'O item vinculado não pertence ao Terrírian ativo.')
  }
  if (item.grade !== 2) {
    return fail('BOUND_GRADE_INVALID', 'O Rito de Lapidação exige um item vinculado de Grau II.')
  }
  if (item.resonance < item.resonanceThreshold) {
    return fail(
      'BOUND_RESONANCE_REQUIRED',
      `Ressonância insuficiente: ${item.resonance}/${item.resonanceThreshold}.`,
    )
  }

  const gemIndex = save.inventory.findIndex((instance) => instance.instanceId === gemInstanceId)
  const gemInstance = save.inventory[gemIndex]
  const itemDefinition = gemInstance ? catalog.items[gemInstance.definitionId] : undefined
  const gemId = itemDefinition?.gemComponentId
  const gem = gemId ? catalog.gems[gemId] : undefined
  if (!gemInstance) {
    return fail('GEM_INSTANCE_NOT_FOUND', 'A Joia selecionada não está mais no inventário.')
  }
  if (itemDefinition?.category !== 'gem' || !gemId || !gem) {
    return fail('GEM_INSTANCE_INVALID', 'O item selecionado não contém uma Joia cadastrada.')
  }
  if (itemDefinition.questLocked || gemInstance.locked || gemInstance.favorite) {
    return fail('GEM_INSTANCE_PROTECTED', 'A Joia está protegida e não pode ser consumida pelo Rito.')
  }
  if (item.components.gems.length >= getBoundSlotCapacity(3).gems) {
    return fail('GEM_SLOT_OCCUPIED', 'O slot de Joia do Grau III já está ocupado.')
  }
  if (
    gem.unique &&
    Object.values(save.boundItems).some((boundItem) => boundItem.components.gems.includes(gem.id))
  ) {
    return fail('UNIQUE_GEM_ALREADY_BOUND', 'Esta Joia única já pertence a outro Vínculo.')
  }
  const compatibility = evaluateGemCompatibility(item, gem.id, catalog)
  if (!compatibility.ok) return compatibility

  const next = structuredClone(save)
  const nextItem = next.boundItems[boundItemId]
  const nextGemInstance = next.inventory[gemIndex]
  if (nextGemInstance.quantity > 1) nextGemInstance.quantity -= 1
  else next.inventory.splice(gemIndex, 1)

  nextItem.grade = 3
  nextItem.components.gems.push(gem.id)
  nextItem.resonanceThreshold = BALANCE.boundGradeResonance[4]
  nextItem.visualStage = 3
  nextItem.updatedAt = now
  for (const nodeId of gem.skillTreeHooks) {
    if (!nextItem.skillTree.discoveredNodeIds.includes(nodeId)) {
      nextItem.skillTree.discoveredNodeIds.push(nodeId)
    }
  }
  nextItem.memories.push({
    id: `${boundItemId}_memory_grade_3`,
    type: 'special',
    sourceId: 'bond_rite_grade_3',
    title: 'Primeira Lapidação',
    description: `O Vínculo alcançou o Grau III ao incorporar ${gem.name}.`,
    createdAt: now,
  })

  const worldFlag = `bound_${nextItem.slot}_grade_3`
  if (!next.world.worldFlags.includes(worldFlag)) next.world.worldFlags.push(worldFlag)
  next.updatedAt = now
  next.revision += 1
  next.eventLog.push(
    `BoundGradeAdvanced:${boundItemId}:3`,
    `BoundGemInserted:${boundItemId}:${gem.id}`,
    `InventoryItemConsumed:${gemInstanceId}`,
  )
  return ok(next)
}
