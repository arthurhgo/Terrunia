import { describe, expect, it } from 'vitest'
import { content } from '../../content/catalog'
import { bindPrologueWeapon, createNewSave } from '../game/createSave'
import { createBattle, calculateRolledDamage, getEffectiveAttackPower, getEffectiveMitigation, selectDamageDie } from './engine'
import { previewCombatSkill } from './skillPreview'

describe('v0.5.13 preview de habilidades', () => {
  it('usa os mesmos dados e dano mínimo/máximo do motor, sem consumir RNG', () => {
    const base = createNewSave('test', 'Terrírian', 'character.terririan.default', content)
    const bound = bindPrologueWeapon(base, content, undefined, 'weapon-test')
    if (!bound.ok) throw new Error(bound.message)
    const battle = createBattle(bound.value, content.encounters.encounter_fungorro_01, content,
      'preview-damage', { manualInitiative: true })
    const before = structuredClone(battle)
    const player = battle.combatants.combatant_player
    const enemy = Object.values(battle.combatants).find((c) => c.side === 'enemy')!
    const skill = content.combatSkills.skill_axe_sunder
    const preview = previewCombatSkill(player, enemy, skill, content)
    const sides = selectDamageDie(player, skill)
    const power = skill.effects.find((e) => e.type === 'damage')
    if (!power || power.type !== 'damage') throw new Error('Efeito de dano ausente')
    expect(preview.die).toBe(sides)
    expect(preview.ranges).toEqual([{
      minimum: calculateRolledDamage(getEffectiveAttackPower(player, content),
        getEffectiveMitigation(enemy, content), 1, sides, power.powerBonus).finalDamage,
      maximum: calculateRolledDamage(getEffectiveAttackPower(player, content),
        getEffectiveMitigation(enemy, content), sides, sides, power.powerBonus).finalDamage,
    }])
    expect(battle).toEqual(before)
    enemy.defending = true
    const guarded = previewCombatSkill(player, enemy, skill, content)
    expect(guarded.ranges[0].maximum).toBeLessThanOrEqual(preview.ranges[0].maximum)
  })
  it('exibe cura e efeitos sem inventar dados ou dano', () => {
    const base = createNewSave('test', 'Terrírian', 'character.terririan.default', content)
    const battle = createBattle(base, content.encounters.encounter_fungorro_01, content,
      'preview-heal', { manualInitiative: true })
    const player = battle.combatants.combatant_player
    const healing = content.combatSkills.skill_clan_dunavar_guard
    const preview = previewCombatSkill(player, player, healing, content)
    expect(preview.die).toBeNull()
    expect(preview.ranges).toEqual([])
    expect(preview.effects.some((effect) => effect.includes('Cura'))).toBe(true)
  })
})
