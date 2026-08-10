import { BALANCE } from '../../content/balance'
import type { BoundItemBaseDefinition } from '../../content/types'
import type { BoundEquipmentInstance } from '../game/types'
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
