import type { ContentCatalog } from '../../content/catalog'
import type { BoundItemBaseDefinition } from '../../content/types'
import type { AttributeId, Character, GameSave } from '../game/types'
import { getAttributeScore } from '../character/attributeProgression'
import { getFlatStatBonus } from '../skillTree/skillTree'

export type EquipmentRequirementState = {
  id: string
  label: string
  met: boolean
}

const attributeLabels: Record<AttributeId, string> = {
  cunning: 'Astúcia',
  agility: 'Agilidade',
  strength: 'Força',
  vigor: 'Vigor',
  spirit: 'Espírito',
}

export const evaluateEquipmentRequirements = (
  character: Character,
  definition: BoundItemBaseDefinition,
) => {
  const requirements: EquipmentRequirementState[] = [
    {
      id: 'level',
      label: `Nível ${definition.requirements.level}`,
      met: character.level >= definition.requirements.level,
    },
    ...Object.entries(definition.requirements.attributes).map(([id, requiredDie]) => {
      const attributeId = id as AttributeId
      return {
        id: attributeId,
        label: `${attributeLabels[attributeId]} d${requiredDie}`,
        met: character.attributes[attributeId].die >= requiredDie,
      }
    }),
  ]
  return { eligible: requirements.every((requirement) => requirement.met), requirements }
}

export const getBoundItemSkillIds = (
  save: GameSave,
  catalog: ContentCatalog,
  slot: 'weapon' | 'shield' | 'armor' | 'necklace' | 'bracelet',
) => {
  const itemId = save.character.bondedEquipment[slot]
  const item = itemId ? save.boundItems[itemId] : null
  const definition = item ? catalog.boundItemBases[item.baseItemId] : null
  if (!item || !definition) return []
  return definition.skillUnlocks
    .filter((unlock) => unlock.grade <= item.grade)
    .map((unlock) => unlock.skillId)
}

export const deriveWeaponPreview = (
  save: GameSave,
  catalog: ContentCatalog,
  definition: BoundItemBaseDefinition,
) => {
  const attribute = save.character.attributes[definition.scalingAttribute]
  const attributeContribution = Math.floor(getAttributeScore(attribute) / 2)
  const clan = save.character.clan.clanId ? catalog.clans[save.character.clan.clanId] : null
  const clanContribution = definition.powerType === 'magical'
    ? clan?.bonuses.magicalAttack ?? 0
    : clan?.bonuses.physicalAttack ?? 0
  const skillTreeContribution = getFlatStatBonus(save, catalog, 'attackPower')
  const totalAttack = definition.basePower + attributeContribution + skillTreeContribution + clanContribution
  const skills = definition.skillUnlocks.map((unlock) => ({
    ...unlock,
    definition: catalog.combatSkills[unlock.skillId],
    projectedPower: totalAttack + (catalog.combatSkills[unlock.skillId]?.effects
      .filter((effect) => effect.type === 'damage')
      .reduce((sum, effect) => sum + effect.powerBonus, 0) ?? 0),
  }))
  return {
    totalAttack,
    attributeContribution,
    skillTreeContribution,
    clanContribution,
    skills,
    scalingAttribute: definition.scalingAttribute,
  }
}
