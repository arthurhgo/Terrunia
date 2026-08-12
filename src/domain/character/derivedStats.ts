import type { ContentCatalog } from '../../content/catalog'
import { BALANCE } from '../../content/balance'
import type { GameSave } from '../game/types'
import { getFlatStatBonus } from '../skillTree/skillTree'

export type StatContribution = { label: string; value: number }
export type DerivedStat = { value: number; contributions: StatContribution[] }

const sum = (contributions: StatContribution[]): DerivedStat => ({
  value: contributions.reduce((total, contribution) => total + contribution.value, 0),
  contributions,
})

export const deriveCharacterStats = (save: GameSave, catalog: ContentCatalog) => {
  const { attributes, bondedEquipment } = save.character
  const weapon = bondedEquipment.weapon ? save.boundItems[bondedEquipment.weapon] : null
  const weaponBase = weapon ? catalog.boundItemBases[weapon.baseItemId] : null
  const maxHpBonus = getFlatStatBonus(save, catalog, 'maxHp')
  const attackBonus = getFlatStatBonus(save, catalog, 'attackPower')
  const defenseBonus = getFlatStatBonus(save, catalog, 'mitigation')
  const clanBonuses = save.character.clan.clanId
    ? catalog.clans[save.character.clan.clanId]?.bonuses ?? {}
    : {}

  return {
    life: sum([
      { label: 'Base do personagem', value: BALANCE.baseHp },
      { label: 'Vigor', value: attributes.vigor.die * BALANCE.vigorHpMultiplier },
      { label: 'Vínculos e Skills', value: maxHpBonus },
      { label: 'Clã', value: clanBonuses.maxHp ?? 0 },
    ]),
    mana: sum([
      { label: 'Base do personagem', value: BALANCE.baseMana },
      { label: 'Espírito', value: attributes.spirit.die * BALANCE.spiritManaMultiplier },
      { label: 'Clã', value: clanBonuses.mana ?? 0 },
    ]),
    defense: sum([
      { label: 'Vigor', value: Math.floor(attributes.vigor.die / 4) },
      { label: 'Vínculos e Skills', value: defenseBonus },
      { label: 'Clã', value: clanBonuses.mitigation ?? 0 },
    ]),
    physicalAttack: sum([
      { label: 'Força', value: Math.floor(attributes.strength.die / 2) },
      { label: weaponBase?.name ?? 'Arma não vinculada', value: weaponBase?.basePower ?? 1 },
      { label: 'Vínculos e Skills', value: attackBonus },
      { label: 'Clã', value: clanBonuses.physicalAttack ?? 0 },
    ]),
    magicalAttack: sum([
      // BALANCE_DRAFT: leitura informativa até o primeiro sistema de magia jogável.
      { label: 'Espírito', value: Math.floor(attributes.spirit.die / 2) },
      { label: 'Clã', value: clanBonuses.magicalAttack ?? 0 },
    ]),
  }
}
