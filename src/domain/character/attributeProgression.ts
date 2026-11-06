import { BALANCE } from '../../content/balance'
import type { AttributeId, AttributeValue, Character, GameSave } from '../game/types'
import { fail, ok, type Result } from '../shared/types'

export const getAttributeScore = (attribute: AttributeValue) => attribute.die + attribute.bonus

/** A rank transition is always exactly +2/-2 faces, never an intermediate die. */
export const nextAttributeDie = (current: AttributeValue['die'], direction: 1 | -1) =>
  BALANCE.attributeDieOrder.find((die) => die === current + BALANCE.attributeDieFaceStep * direction)

/** Each click invests one point. Two investments upgrade d4→d6 etc.
 * The stored bonus represents the intermediate invested face and contributes to stats.
 * Reimburse a single point before the first permanent Bond.
 */
export const adjustCharacterAttribute = (
  save: GameSave,
  attributeId: AttributeId,
  direction: 1 | -1,
  now: string,
): Result<GameSave> => {
  const current = save.character.attributes[attributeId]
  const upward = nextAttributeDie(current.die, 1)
  const downward = nextAttributeDie(current.die, -1)
  if (direction === 1 && !upward) {
    return fail('ATTRIBUTE_AT_MAXIMUM', 'Este atributo já alcançou d12.')
  }
  if (direction === 1 && save.character.unspentAttributePoints < 1) {
    return fail('ATTRIBUTE_POINTS_REQUIRED', 'É necessário 1 Ponto de Atributo.')
  }
  if (direction === -1 && save.character.bondedEquipment.weapon) {
    return fail('ATTRIBUTE_REFUND_LOCKED', 'A distribuição inicial torna-se permanente após o primeiro Vínculo.')
  }
  if (direction === -1 && current.die === BALANCE.defaultAttributeDie && current.bonus <= 0) {
    return fail('ATTRIBUTE_AT_MINIMUM', 'Este atributo já está no dado-base d4.')
  }

  const next = structuredClone(save)
  const attribute = next.character.attributes[attributeId]
  if (direction === 1) {
    if (attribute.bonus >= 1) {
      attribute.die = upward!
      attribute.bonus -= 1
    } else {
      attribute.bonus += 1
    }
  } else if (attribute.bonus > 0) {
    attribute.bonus -= 1
  } else {
    attribute.die = downward!
    attribute.bonus = 1
  }
  next.character.unspentAttributePoints -= direction
  next.updatedAt = now
  next.revision += 1
  next.eventLog.push(`AttributeAdjusted:${attributeId}:d${attribute.die}+${attribute.bonus}`)
  return ok(next)
}

export const gainCharacterXp = (
  character: Character,
  amount: number,
): { character: Character; levelsGained: number } => {
  const next = structuredClone(character)
  next.xp += Math.max(0, amount)
  let levelsGained = 0
  const maxLevel = BALANCE.xpThresholds.length
  // Migrate the active threshold lazily: existing saves keep XP and levels unchanged.
  next.xpRequired = BALANCE.xpThresholds[Math.min(next.level, maxLevel - 1)]

  while (next.level < maxLevel && next.xp >= next.xpRequired) {
    next.level += 1
    levelsGained += 1
    next.unspentAttributePoints += BALANCE.attributePointsPerLevel
    next.xpRequired = BALANCE.xpThresholds[Math.min(next.level, maxLevel - 1)]
  }

  return { character: next, levelsGained }
}
