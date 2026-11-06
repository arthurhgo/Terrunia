import { describe, expect, it } from 'vitest'
import { content } from '../../content/catalog'
import { createNewSave, bindPrologueWeapon } from '../game/createSave'
import { createBattle, seedBattleRng, submitBattleCommand } from './engine'
import { BALANCE } from '../../content/balance'

const saved = () => {
  const save = createNewSave('owner', 'Vinnie', 'character.terririan.default', content)
  const bound = bindPrologueWeapon(save, content, undefined, 'weapon_1')
  if (!bound.ok) throw new Error(bound.message)
  return bound.value
}
const encounter = content.encounters.encounter_fungorro_01
const target = 'combatant_enemy_fungorro_crawler_1'

describe('combat fairness v0.5.7', () => {
  it('usa a face real do dado na equação e permite auditar defesa e bônus da skill', () => {
    const battle = createBattle(saved(), encounter, content, 'fairness')
    battle.combatants[target].hp = 99
    battle.combatants[target].maxHp = 99
    const result = submitBattleCommand(battle, { type: 'attack', targetId: target }, content)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const hit = result.value.log.find((entry) => entry.roll?.actorId === 'combatant_player')
    expect(hit?.roll).toBeDefined()
    if (!hit?.roll) return
    const { face, attackBonus, skillBonus, armor } = hit.roll
    expect(attackBonus).toBeDefined()
    expect(skillBonus).toBe(0)
    expect(armor).toBeDefined()
    const damage = Math.max(1, face + (attackBonus ?? 0) + (skillBonus ?? 0) - (armor ?? 0))
    expect(hit.message).toContain(`causa ${damage} de dano`)
    expect(hit.message).toContain('Poder')
    expect(hit.message).toContain('Armadura')
  })

  it('bloqueia o primeiro golpe defensivamente, sem afetar golpes posteriores', () => {
    const battle = createBattle(saved(), encounter, content, 'guard-fairness')
    const guarded = submitBattleCommand(battle, { type: 'defend' }, content)
    expect(guarded.ok).toBe(true)
    if (!guarded.ok) return
    expect(guarded.value.log.some((entry) => entry.tone === 'defense' && entry.message.includes('bloqueia'))).toBe(true)
    expect(guarded.value.log.some((entry) => entry.roll?.blocked === true)).toBe(true)
    expect(guarded.value.combatants.combatant_player.defending).toBe(false)
  })

  it('skills criam recarga real e não podem ser usadas até completá-la', () => {
    const save = saved()
    save.boundItems.weapon_1.skillTree.unlockedNodeIds.push('weapon_bond_core')
    const battle = createBattle(save, encounter, content, 'cooldown-test')
    battle.combatants[target].hp = 100
    battle.combatants[target].maxHp = 100
    const attack = submitBattleCommand(battle, { type: 'skill', skillId: 'skill_resonant_strike', targetId: target }, content)
    expect(attack.ok).toBe(true)
    if (!attack.ok) return
    expect(attack.value.combatants.combatant_player.skillCooldowns?.skill_resonant_strike).toBe(BALANCE.defaultPlayerSkillCooldownTurns)
    expect(submitBattleCommand(attack.value, { type: 'skill', skillId: 'skill_resonant_strike', targetId: target }, content))
      .toMatchObject({ ok: false, code: 'SKILL_COOLDOWN' })
  })

  it('não repete o mesmo estado inicial do RNG em todos os encontros', () => {
    expect(seedBattleRng('battle_001')).not.toBe(seedBattleRng('battle_002'))
    expect(seedBattleRng('battle_001')).toBe(seedBattleRng('battle_001'))
    expect(createBattle(saved(), encounter, content, 'battle_001').rngSeed)
      .not.toBe(createBattle(saved(), encounter, content, 'battle_002').rngSeed)
  })
})
