import { BALANCE } from '../../content/balance'
import type { BoundItemBaseDefinition } from '../../content/types'
import { adjustCharacterAttribute } from '../character/attributeProgression'
import { ATTRIBUTE_IDS, type GameSave } from '../game/types'
import { fail, ok, type Result } from '../shared/types'
import { evaluateEquipmentRequirements } from './equipmentLoadout'

/** Minimum point investment from neutral d4 to unlock this starter weapon. */
export function starterWeaponPointCost(weapon: BoundItemBaseDefinition): number {
  return Object.values(weapon.requirements.attributes).reduce((sum, die) =>
    sum + Math.max(0, (die - BALANCE.defaultAttributeDie) / 2) * BALANCE.attributePointsPerDieUpgrade, 0)
}

/** Atomic recommended allocation. Reallocate ONLY before the first bond. */
export function prepareStarterWeapon(save: GameSave, weapon: BoundItemBaseDefinition, now: string): Result<GameSave> {
  if (save.character.bondedEquipment.weapon) return fail('ATTRIBUTE_REFUND_LOCKED', 'O primeiro Vínculo já foi realizado.')
  if (weapon.slot !== 'weapon') return fail('INVALID_WEAPON', 'Selecione uma arma inicial válida.')
  if (weapon.requirements.level > save.character.level) return fail('REQUIRES_LEVEL', 'Esta arma exige nível maior.')
  const available = save.character.unspentAttributePoints + ATTRIBUTE_IDS.reduce(
    (sum, id) => sum + Math.max(0, (save.character.attributes[id].die - BALANCE.defaultAttributeDie) / 2) * BALANCE.attributePointsPerDieUpgrade, 0)
  if (starterWeaponPointCost(weapon) > available) return fail('ATTRIBUTE_POINTS_REQUIRED', 'Pontos insuficientes para a arma selecionada.')
  let draft = save
  for (const id of ATTRIBUTE_IDS) while (draft.character.attributes[id].die > BALANCE.defaultAttributeDie) {
    const result = adjustCharacterAttribute(draft, id, -1, now)
    if (!result.ok) return result
    draft = result.value
  }
  for (const id of ATTRIBUTE_IDS) {
    const required = weapon.requirements.attributes[id] ?? BALANCE.defaultAttributeDie
    while (draft.character.attributes[id].die < required) {
      const result = adjustCharacterAttribute(draft, id, 1, now)
      if (!result.ok) return result
      draft = result.value
    }
  }
  if (!evaluateEquipmentRequirements(draft.character, weapon).eligible) {
    return fail('REQUIREMENTS_UNMET', 'Distribuição não atende à arma.')
  }
  return ok(draft)
}
