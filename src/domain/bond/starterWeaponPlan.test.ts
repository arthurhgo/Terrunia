import { describe, expect, it } from 'vitest'
import { content } from '../../content/catalog'
import { createNewSave, bindPrologueWeapon } from '../game/createSave'
import { adjustCharacterAttribute } from '../character/attributeProgression'
import { evaluateEquipmentRequirements } from './equipmentLoadout'
import { starterWeaponPointCost, prepareStarterWeapon } from './starterWeaponPlan'

const fresh = () => createNewSave('owner', 'Aera', 'character.terririan.default', content)
const weapons = Object.values(content.boundItemBases).filter((w) => w.slot === 'weapon' && w.id !== 'bound_weapon_prologue_base')

describe('criação com seis pontos e todas as sete armas', () => {
  it('permite iniciar com cada arma usando somente os seis pontos disponíveis', () => {
    expect(weapons).toHaveLength(7)
    for (const weapon of weapons) {
      const save = fresh()
      expect(save.character.unspentAttributePoints).toBe(6)
      expect(starterWeaponPointCost(weapon)).toBeLessThanOrEqual(6)
      const plan = prepareStarterWeapon(save, weapon, save.updatedAt)
      expect(plan.ok).toBe(true)
      if (!plan.ok) continue
      expect(evaluateEquipmentRequirements(plan.value.character, weapon).eligible).toBe(true)
      expect(plan.value.character.unspentAttributePoints).toBe(6 - starterWeaponPointCost(weapon))
      expect(plan.value.character.clan.clanId).toBeNull()
      expect(plan.value.character.classProgression.classId).toBeNull()
      const bound = bindPrologueWeapon(plan.value, content, undefined, 'starter-' + weapon.id, weapon.id)
      expect(bound.ok).toBe(true)
    }
  })
  it('redistribui sem perder pontos antes do primeiro vínculo', () => {
    const start = fresh()
    const boosted = adjustCharacterAttribute(start, 'strength', 1, start.updatedAt)
    if (!boosted.ok) throw Error(boosted.message)
    const spellbook = content.boundItemBases.bound_weapon_spellbook
    const plan = prepareStarterWeapon(boosted.value, spellbook, start.updatedAt)
    if (!plan.ok) throw Error(plan.message)
    expect(plan.value.character.attributes.strength.die).toBe(4)
    expect(plan.value.character.attributes.cunning.die).toBe(8)
    expect(plan.value.character.attributes.spirit.die).toBe(6)
    expect(plan.value.character.unspentAttributePoints).toBe(0)
    expect(start.character.attributes.cunning.die).toBe(4)
  })
})
