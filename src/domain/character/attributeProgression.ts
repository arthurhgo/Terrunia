import { BALANCE } from '../../content/balance'
import type { AttributeId, AttributeValue, Character, GameSave } from '../game/types'
import { fail, ok, type Result } from '../shared/types'

export const getAttributeScore = (attribute: AttributeValue) => attribute.die + attribute.bonus

/** A rank transition is always exactly +2/-2 faces, never an intermediate die. */
export const nextAttributeDie = (current: AttributeValue['die'], direction: 1 | -1) =>
  BALANCE.attributeDieOrder.find((die) => die === current + BALANCE.attributeDieFaceStep * direction)

export const adjustCharacterAttribute = (
  save: GameSave,
  attributeId: AttributeId,
  direction: 1 | -1,
  now: string,
): Result<GameSave> => {
  const current = save.character.attributes[attributeId]
  const targetDie = nextAttributeDie(current.die, direction)
  if (!targetDie) {
    return fail(
      direction === 1 ? 'ATTRIBUTE_AT_MAXIMUM' : 'ATTRIBUTE_AT_MINIMUM',
      direction === 1 ? 'Este atributo já alcançou d12.' : 'Este atributo já está no dado-base d4.',
    )
  }
  if (direction === 1 && save.character.unspentAttributePoints < BALANCE.attributePointsPerDieUpgrade) {
    return fail('ATTRIBUTE_POINTS_REQUIRED', `São necessários ${BALANCE.attributePointsPerDieUpgrade} Pontos de Atributo para avançar um dado.`)
  }
  if (direction === -1 && save.character.bondedEquipment.weapon) {
    return fail('ATTRIBUTE_REFUND_LOCKED', 'A distribuição inicial torna-se permanente após o primeiro Vínculo.')
  }

  const next = structuredClone(save)
  next.character.attributes[attributeId].die = targetDie
  next.character.unspentAttributePoints -= direction * BALANCE.attributePointsPerDieUpgrade
  next.updatedAt = now
  next.revision += 1
  next.eventLog.push(`AttributeAdjusted:${attributeId}:d${targetDie}`)
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

  while (next.level < maxLevel && next.xp >= next.xpRequired) {
    next.level += 1
    levelsGained += 1
    next.unspentAttributePoints += BALANCE.attributePointsPerLevel
    next.xpRequired = BALANCE.xpThresholds[Math.min(next.level, maxLevel - 1)]
  }

  return { character: next, levelsGained }
}
