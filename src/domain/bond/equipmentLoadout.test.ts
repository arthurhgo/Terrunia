import { describe, expect, it } from 'vitest'
import { content } from '../../content/catalog'
import type { BoundItemBaseDefinition } from '../../content/types'
import { adjustCharacterAttribute, gainCharacterXp } from '../character/attributeProgression'
import { createBattle } from '../combat/engine'
import { bindPrologueWeapon, createNewSave } from '../game/createSave'
import type { GameSave } from '../game/types'
import {
  deriveWeaponPreview,
  evaluateEquipmentRequirements,
  getBoundItemSkillIds,
} from './equipmentLoadout'

const weapons = Object.values(content.boundItemBases).filter(
  (definition) => definition.slot === 'weapon' && definition.id !== 'bound_weapon_prologue_base',
)

const allocateFor = (initial: GameSave, definition: BoundItemBaseDefinition) => {
  let save = initial
  for (const [attributeId, requiredDie] of Object.entries(definition.requirements.attributes)) {
    while (save.character.attributes[attributeId as keyof typeof save.character.attributes].die < requiredDie) {
      const result = adjustCharacterAttribute(
        save,
        attributeId as keyof typeof save.character.attributes,
        1,
        '2026-10-29T12:00:00.000Z',
      )
      if (!result.ok) throw new Error(result.message)
      save = result.value
    }
  }
  return save
}

describe('arsenal livre e progressão de atributos', () => {
  it('oferece os sete tipos de arma e permite cumprir todos sem Clã ou Classe', () => {
    expect(weapons).toHaveLength(7)
    for (const weapon of weapons) {
      const base = createNewSave('owner', 'Nira', 'character.terririan.default', content)
      const prepared = allocateFor(base, weapon)
      expect(prepared.character.clan.clanId).toBeNull()
      expect(prepared.character.classProgression.classId).toBeNull()
      expect(evaluateEquipmentRequirements(prepared.character, weapon).eligible).toBe(true)
      const bound = bindPrologueWeapon(prepared, content, '2026-10-29T12:01:00.000Z', `item_${weapon.id}`, weapon.id)
      expect(bound.ok).toBe(true)
    }
  })

  it('usa apenas nível e atributos como requisitos, sem trava de Clã ou Classe', () => {
    const weapon = content.boundItemBases.bound_weapon_long_sword
    const prepared = allocateFor(
      createNewSave('owner', 'Nira', 'character.terririan.default', content),
      weapon,
    )
    const before = evaluateEquipmentRequirements(prepared.character, weapon)
    prepared.character.clan.clanId = 'dunavar'
    prepared.character.classProgression.classId = 'sentinel_of_light'
    const after = evaluateEquipmentRequirements(prepared.character, weapon)
    expect(after).toEqual(before)
    expect(after.requirements.map((requirement) => requirement.id)).toEqual(['level', 'strength'])
  })

  it('permite redistribuir antes do primeiro Vínculo e bloqueia o reembolso depois', () => {
    const base = createNewSave('owner', 'Nira', 'character.terririan.default', content)
    const raised = adjustCharacterAttribute(base, 'strength', 1, '2026-10-29T12:00:00.000Z')
    expect(raised.ok && raised.value.character.attributes.strength.die).toBe(6)
    if (!raised.ok) return
    const refunded = adjustCharacterAttribute(raised.value, 'strength', -1, '2026-10-29T12:00:01.000Z')
    expect(refunded.ok && refunded.value.character.unspentAttributePoints).toBe(3)
    const prepared = allocateFor(raised.value, content.boundItemBases.bound_weapon_long_sword)
    const bound = bindPrologueWeapon(prepared, content, '2026-10-29T12:01:00.000Z', 'sword_1', 'bound_weapon_long_sword')
    if (!bound.ok) throw new Error(bound.message)
    expect(adjustCharacterAttribute(bound.value, 'strength', -1, '2026-10-29T12:02:00.000Z')).toMatchObject({
      ok: false,
      code: 'ATTRIBUTE_REFUND_LOCKED',
    })
  })

  it('soma base, escala e bônus e libera a técnica própria da arma', () => {
    const definition = content.boundItemBases.bound_weapon_arcane_scepter
    const prepared = allocateFor(
      createNewSave('owner', 'Nira', 'character.terririan.default', content),
      definition,
    )
    const preview = deriveWeaponPreview(prepared, content, definition)
    expect(preview.totalAttack).toBe(
      definition.basePower + preview.attributeContribution + preview.clanContribution,
    )
    expect(preview.skills[0].projectedPower).toBeGreaterThan(preview.totalAttack)
    const bound = bindPrologueWeapon(prepared, content, '2026-10-29T12:01:00.000Z', 'scepter_1', definition.id)
    if (!bound.ok) throw new Error(bound.message)
    expect(getBoundItemSkillIds(bound.value, content, 'weapon')).toContain('skill_scepter_arc_pulse')
    const battle = createBattle(bound.value, content.encounters.encounter_fungorro_01, content, 'battle_scepter')
    expect(battle.combatants.combatant_player).toMatchObject({
      attackPower: preview.totalAttack,
      skillIds: expect.arrayContaining(['skill_scepter_arc_pulse']),
    })
  })

  it('concede um novo ponto de atributo ao subir de nível', () => {
    const save = createNewSave('owner', 'Nira', 'character.terririan.default', content)
    const progression = gainCharacterXp(save.character, 250)
    expect(progression.levelsGained).toBe(1)
    expect(progression.character.level).toBe(2)
    expect(progression.character.unspentAttributePoints).toBe(4)
    expect(progression.character.xpRequired).toBe(750)
  })
})
