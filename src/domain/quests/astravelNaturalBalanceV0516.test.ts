import { describe, expect, it } from 'vitest'
import { content } from '../../content/catalog'
import { bindPrologueWeapon, createNewSave } from '../game/createSave'
import { gainCharacterXp } from '../character/attributeProgression'
import { deriveCharacterStats } from '../character/derivedStats'
import { createBattle, isProtectedBoss, submitBattleCommand } from '../combat/engine'
import type { GameSave } from '../game/types'

/** Regression/measurement only, never canon balance criteria. This uses:
 * - real new-character attributes, HP, MP and weapon base
 * - deterministic real initiative, dice, enemy AI and HP persistence
 * - no inflated stats, free consumables, mid-expedition rest or level gifts
 * - one basic attack per player turn, focusing the spore threat first
 *
 * It is intentionally an impoverished strategy stress test, not a claim that
 * players cannot win using skills, runes, exploration loot and preparation.
 */
const stages = content.trails.trail_astravel_entry.nodes
  .filter(node => node.type === 'battle')
  .slice(0, 5)

type FightOutcome = {
  phase: string
  actions: number
  hp: number
  maxHp: number
  initiativeLost: boolean
}

function battleWithoutStatOverrides(save: GameSave, encounterId: string, seed: string): FightOutcome {
  const encounter = content.encounters[encounterId]
  expect(encounter).toBeDefined()
  const starting = createBattle(save, encounter, content, seed, { manualInitiative: true })
  const rolled = submitBattleCommand(starting, { type: 'rollInitiative' }, content)
  expect(rolled.ok).toBe(true)
  if (!rolled.ok) throw new Error(rolled.message)
  let battle = rolled.value
  const initiativeLost = battle.initiativeOrder[0] !== 'combatant_player'
  let actions = 0
  while (battle.phase !== 'Victory' && battle.phase !== 'Defeat' && actions < 100) {
    if (battle.phase !== 'AwaitingAction') throw new Error('Combat loop stalled: ' + battle.phase)
    const priority = ['enemy_spore_sower', 'enemy_mycelial_stalker']
    const enemies = Object.values(battle.combatants)
      .filter(actor => actor.side === 'enemy' && actor.alive && !isProtectedBoss(battle, actor))
      .sort((a, b) => {
        const ai = priority.indexOf(a.definitionId), bi = priority.indexOf(b.definitionId)
        return (ai === -1 ? 999 : ai) - (bi === -1 ? 999) || a.hp - b.hp
      })
    const target = enemies[0]
    if (!target) throw new Error('No enemy target is available')
    const action = submitBattleCommand(battle, { type: 'attack', targetId: target.id }, content)
    expect(action.ok).toBe(true)
    if (!action.ok) throw new Error(action.message)
    battle = action.value
    actions++
  }
  expect(['Victory','Defeat']).toContain(battle.phase)
  const player = battle.combatants.combatant_player
  return { phase: battle.phase, actions, hp: player.hp, maxHp: player.maxHp, initiativeLost }
}

describe('v0.5.16 — auditoria de dificuldade sem atributos artificiais', () => {
  it('mede o primeiro encontro de um Terrírian com a arma inicial real em 24 iniciativas', () => {
    const fresh = createNewSave('natural-v0516', 'Terrírian', 'character.terririan.default', content)
    expect(fresh.character.level).toBe(1)
    expect(fresh.character.clan.clanId).toBeNull()
    expect(fresh.character.classProgression.classId).toBeNull()
    const equipped = bindPrologueWeapon(fresh, content, fresh.createdAt, 'qa-v0516-starter-weapon')
    expect(equipped.ok).toBe(true)
    if (!equipped.ok) return
    const save = equipped.value
    const base = deriveCharacterStats(save, content)
    let wins = 0, defeats = 0, totalActions = 0, initiativeLosses = 0
    for (let n = 0; n < 24; n++) {
      const result = battleWithoutStatOverrides(save, stages[0].encounterId!, 'natural-v0516-start-' + n)
      wins += Number(result.phase === 'Victory')
      defeats += Number(result.phase === 'Defeat')
      initiativeLosses += Number(result.initiativeLost)
      totalActions += result.actions
    }
    expect(wins + defeats).toBe(24)
    // A zero-win first fight would be a hard gameplay blocker, not a balance target.
    expect(wins).toBeGreaterThan(0)
    console.info('QA_NATURAL_START_V0516 ' + JSON.stringify({
      hp: base.life.value, atk: base.primaryAttack.value, defense: base.defense.value,
      wins, defeats, initiativeLosses,
      averagePlayerActions: +(totalActions / 24).toFixed(2),
      characterLevel: save.character.level,
      attributePointsUnspent: save.character.unspentAttributePoints,
      assumption: 'bound starter weapon; basic attacks; no potions, skill tree or attribute spending',
    }))
  })

  it('mede os cinco primeiros confrontos em sequência sem cura entre encontros (limite inferior)', () => {
    let initial = createNewSave('natural-sequence-v0516', 'Terrírian', 'character.terririan.default', content)
    const bound = bindPrologueWeapon(initial, content, initial.createdAt, 'qa-v0516-sequence-weapon')
    expect(bound.ok).toBe(true)
    if (!bound.ok) return
    initial = bound.value
    const results: { seed: number; cleared: number; hpOnExit: number; stoppedAt: string | null }[] = []
    for (let seed = 0; seed < 16; seed++) {
      const save = structuredClone(initial)
      let cleared = 0, stoppedAt: string | null = null
      for (const node of stages) {
        const result = battleWithoutStatOverrides(save, node.encounterId!, 'natural-v0516-route-' + seed + '-' + node.id)
        save.vitals.hp = result.hp
        if (result.phase !== 'Victory') { stoppedAt = node.id; break }
        cleared++
        const reward = content.encounters[node.encounterId!].rewards
        save.character = gainCharacterXp(save.character, reward.characterXp).character
        // Exactly the field recovery authorized for this specific encounter.
        const stats = deriveCharacterStats(save, content)
        save.vitals.hp = Math.min(stats.life.value,
          save.vitals.hp + (reward.fieldRecovery?.hp ?? 0))
        save.vitals.mp = Math.min(stats.mana.value,
          save.vitals.mp + (reward.fieldRecovery?.mp ?? 0))
        if (save.vitals.hp < 1) { stoppedAt = node.id; break }
      }
      results.push({ seed, cleared, stoppedAt, hpOnExit: save.vitals.hp })
    }
    expect(results).toHaveLength(16)
    const counts = stages.map((node, index) => ({ node: node.id,
      reachedAndCleared: results.filter(row => row.cleared >= index + 1).length,
      stoppedHere: results.filter(row => row.stoppedAt === node.id).length }))
    const fullClear = results.filter(row => row.cleared === stages.length).length
    console.info('QA_NATURAL_CHAPTER1_V0516 ' + JSON.stringify({
      counts, fullClear, seeds: results.length,
      assumption: 'no rest, healing items or gear upgrades; 6 creation attribute points unspent',
    }))
    // This check is deliberately measurement only; difficulty values remain OWNER_DECISION.
    expect(counts[0].reachedAndCleared).toBeGreaterThan(0)
  })
})
