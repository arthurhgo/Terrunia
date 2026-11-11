import { describe, expect, it } from 'vitest'
import { content } from '../../content/catalog'
import { ENEMY_BUDGET_V05152 } from '../../content/enemyBalanceV05152'
import { bindPrologueWeapon, createNewSave } from '../game/createSave'
import { createBattle, submitBattleCommand } from './engine'
import type { BattleState } from './types'

/** BALANCE_DRAFT telemetry: real motor, real 25 species, deterministic RNG.
 * Not a gameplay gate, and NO new monster stats/abilities are introduced. */
function runEnemy(seed: string, enemyId: string) {
  const initial = createNewSave('qa-battle-matrix', 'Tester', 'character.terririan.default', content)
  const armed = bindPrologueWeapon(initial, content)
  if (!armed.ok) throw Error(armed.message)
  const save = armed.value
  save.character.level = Math.max(1, content.enemies[enemyId].level)
  const encounter = {
    ...content.encounters.encounter_fungorro_01,
    id: 'sandbox_' + enemyId,
    enemyDefinitionIds: [enemyId],
  }
  let battle: BattleState = createBattle(save, encounter, content, 'matrix-' + enemyId + '-' + seed)
  let actions = 0
  while (actions < 80 && battle.phase !== 'Victory' && battle.phase !== 'Defeat') {
    if (battle.phase === 'AwaitingInitiative') {
      const rolled = submitBattleCommand(battle, { type: 'rollInitiative' }, content)
      if (!rolled.ok) throw Error(enemyId + ': ' + rolled.message)
      battle = rolled.value
      continue
    }
    const target = Object.values(battle.combatants).find(actor => actor.side === 'enemy' && actor.alive)
    if (!target) break
    const attempt = submitBattleCommand(battle, { type: 'attack', targetId: target.id }, content)
    if (!attempt.ok) throw Error(enemyId + ': ' + attempt.code + ' · ' + attempt.message)
    battle = attempt.value
    actions++
  }
  const hero = battle.combatants.combatant_player
  return { enemyId, seed, actions, result: battle.phase,
    hp: hero.hp, maxHp: hero.maxHp, rounds: battle.round,
    damageRolls: battle.log.filter(entry => entry.tone === 'damage' && entry.roll).length }
}

describe('v0.5.15.3 — matrix of 25 encounters with real FSM and no canon changes', () => {
  it('never stalls, creates impossible HP, or changes the enemy catalog across two seeds', () => {
    const before = structuredClone(ENEMY_BUDGET_V05152)
    const ids = Object.keys(ENEMY_BUDGET_V05152).sort()
    expect(ids).toHaveLength(25)
    const results = ids.flatMap(id => ['a', 'b'].map(seed => runEnemy(seed, id)))
    expect(results).toHaveLength(50)
    for (const outcome of results) {
      expect(['Victory', 'Defeat'], outcome.enemyId).toContain(outcome.result)
      // Powerful enemies may win initiative and defeat an ungeared character
      // before their first action. This is valid battle telemetry, not a hang.
      expect(outcome.actions, outcome.enemyId).toBeGreaterThanOrEqual(0)
      if (outcome.actions === 0) expect(outcome.result).toBe('Defeat')
      expect(outcome.actions, outcome.enemyId).toBeLessThan(80)
      expect(outcome.hp, outcome.enemyId).toBeGreaterThanOrEqual(0)
      expect(outcome.hp, outcome.enemyId).toBeLessThanOrEqual(outcome.maxHp)
      expect(outcome.rounds, outcome.enemyId).toBeGreaterThanOrEqual(1)
    }
    expect(ENEMY_BUDGET_V05152).toEqual(before)
    // Logs are a QA artifact only; victory rates are not canon balance values.
    console.info('BALANCE_DRAFT_V05153_MATRIX=' + JSON.stringify(results))
  })
})
