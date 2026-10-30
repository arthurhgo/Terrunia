import type { ContentCatalog } from '../../content/catalog'
import { forgeUpgradeDefinitions } from '../../content/forge'
import { BALANCE } from '../../content/balance'
import type { GameSave } from '../game/types'
import { getFlatStatBonus } from '../skillTree/skillTree'
import { getAttributeScore } from './attributeProgression'

export type StatContribution = { label: string; value: number }
export type DerivedStat = { value: number; contributions: StatContribution[] }

const attributeLabels = {
  cunning: 'Astúcia',
  agility: 'Agilidade',
  strength: 'Força',
  vigor: 'Vigor',
  spirit: 'Espírito',
} as const

const sum = (contributions: StatContribution[]): DerivedStat => ({
  value: contributions.reduce((total, contribution) => total + contribution.value, 0),
  contributions,
})

export const deriveCharacterStats = (save: GameSave, catalog: ContentCatalog) => {
  const { attributes, bondedEquipment } = save.character
  const weapon = bondedEquipment.weapon ? save.boundItems[bondedEquipment.weapon] : null
  const weaponBase = weapon ? catalog.boundItemBases[weapon.baseItemId] : null
  const boundDefinitions = Object.values(bondedEquipment)
    .map((itemId) => itemId ? save.boundItems[itemId] : null)
    .map((item) => item ? catalog.boundItemBases[item.baseItemId] : null)
    .filter((definition): definition is NonNullable<typeof definition> => Boolean(definition))
  const equipmentBonus = (stat: 'maxHp' | 'maxMp' | 'mitigation' | 'initiative') =>
    boundDefinitions.reduce((total, definition) => total + (definition.statBonuses[stat] ?? 0), 0)
  const forging = Object.values(save.boundItems).filter((item) => bondedEquipment[item.slot] === item.id)
    .flatMap((item) => item.forging?.upgradeIds ?? []).flatMap((id) => forgeUpgradeDefinitions.filter((upgrade) => upgrade.id === id))
  const forgeAttack = forging.reduce((sum, upgrade) => sum + upgrade.attackPower, 0)
  const forgeLife = forging.reduce((sum, upgrade) => sum + upgrade.maxHp, 0)
  const maxHpBonus = getFlatStatBonus(save, catalog, 'maxHp')
  const attackBonus = getFlatStatBonus(save, catalog, 'attackPower')
  const defenseBonus = getFlatStatBonus(save, catalog, 'mitigation')
  const clanBonuses = save.character.clan.clanId
    ? catalog.clans[save.character.clan.clanId]?.bonuses ?? {}
    : {}
  const weaponAttribute = weaponBase ? attributes[weaponBase.scalingAttribute] : attributes.strength
  const weaponAttributeContribution = Math.floor(getAttributeScore(weaponAttribute) / 2)
  const weaponClanContribution = weaponBase?.powerType === 'magical'
    ? clanBonuses.magicalAttack ?? 0
    : clanBonuses.physicalAttack ?? 0
  const primaryAttack = sum([
    { label: weaponBase ? `Escala de ${attributeLabels[weaponBase.scalingAttribute]}` : 'Força', value: weaponAttributeContribution },
    { label: weaponBase?.name ?? 'Sem Arma vinculada', value: weaponBase?.basePower ?? 1 },
    { label: 'Vínculos e Skills', value: attackBonus },
    { label: 'Forja de Durnan', value: forgeAttack },
    { label: 'Clã', value: weaponClanContribution },
  ])

  return {
    life: sum([
      { label: 'Base do personagem', value: BALANCE.baseHp },
      { label: 'Vigor', value: getAttributeScore(attributes.vigor) * BALANCE.vigorHpMultiplier },
      { label: 'Equipamentos', value: equipmentBonus('maxHp') },
      { label: 'Vínculos e Skills', value: maxHpBonus },
      { label: 'Forja de Durnan', value: forgeLife },
      { label: 'Clã', value: clanBonuses.maxHp ?? 0 },
    ]),
    mana: sum([
      { label: 'Base do personagem', value: BALANCE.baseMana },
      { label: 'Espírito', value: getAttributeScore(attributes.spirit) * BALANCE.spiritManaMultiplier },
      { label: 'Equipamentos', value: equipmentBonus('maxMp') },
      { label: 'Clã', value: clanBonuses.mana ?? 0 },
    ]),
    defense: sum([
      { label: 'Vigor', value: Math.floor(getAttributeScore(attributes.vigor) / 4) },
      { label: 'Equipamentos', value: equipmentBonus('mitigation') },
      { label: 'Vínculos e Skills', value: defenseBonus },
      { label: 'Clã', value: clanBonuses.mitigation ?? 0 },
    ]),
    physicalAttack: sum([
      { label: 'Força', value: Math.floor(getAttributeScore(attributes.strength) / 2) },
      { label: weaponBase?.powerType === 'physical' ? weaponBase.name : 'Ataque desarmado', value: weaponBase?.powerType === 'physical' ? weaponBase.basePower : 1 },
      { label: 'Vínculos e Skills', value: attackBonus },
      { label: 'Forja de Durnan', value: weaponBase?.powerType === 'physical' ? forgeAttack : 0 },
      { label: 'Clã', value: clanBonuses.physicalAttack ?? 0 },
    ]),
    magicalAttack: sum([
      // BALANCE_DRAFT: leitura informativa até o primeiro sistema de magia jogável.
      { label: weaponBase ? `Escala de ${attributeLabels[weaponBase.scalingAttribute]}` : 'Astúcia', value: weaponBase?.powerType === 'magical' ? weaponAttributeContribution : Math.floor(getAttributeScore(attributes.cunning) / 2) },
      { label: weaponBase?.powerType === 'magical' ? weaponBase.name : 'Sem foco mágico', value: weaponBase?.powerType === 'magical' ? weaponBase.basePower : 0 },
      { label: 'Forja de Durnan', value: weaponBase?.powerType === 'magical' ? forgeAttack : 0 },
      { label: 'Clã', value: clanBonuses.magicalAttack ?? 0 },
    ]),
    primaryAttack,
    initiative: sum([
      { label: 'Agilidade', value: getAttributeScore(attributes.agility) },
      { label: 'Equipamentos', value: equipmentBonus('initiative') },
      { label: 'Vínculos e Skills', value: getFlatStatBonus(save, catalog, 'initiative') },
    ]),
  }
}
