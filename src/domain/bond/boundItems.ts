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
