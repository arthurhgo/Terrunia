import { describe, expect, it } from 'vitest'
import { content } from '../../content/catalog'
import { bindPrologueWeapon, createNewSave } from '../game/createSave'
import { gainCharacterXp, adjustCharacterAttribute } from '../character/attributeProgression'
import { deriveCharacterStats } from '../character/derivedStats'
import { equipBasicArmor } from '../inventory/basicArmor'
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
        return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi) || a.hp - b.hp
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
  it('compares three legal allocations of the six creation points, without changing catalog balance', () => {
    const patterns = [
      { name: 'defesa_4v_2f', points: ['vigor', 'vigor', 'vigor', 'vigor', 'strength', 'strength'] },
      { name: 'ofensiva_4f_2v', points: ['strength', 'strength', 'strength', 'strength', 'vigor', 'vigor'] },
      { name: 'mista_3v_3f', points: ['vigor', 'vigor', 'vigor', 'strength', 'strength', 'strength'] },
    ] as const
    for (const pattern of patterns) {
      let candidate = createNewSave('natural-' + pattern.name, 'Terrírian', 'character.terririan.default', content)
      for (const attributeId of pattern.points) {
        const value = adjustCharacterAttribute(candidate, attributeId, 1, candidate.createdAt)
        expect(value.ok).toBe(true)
        if (!value.ok) throw new Error(value.message)
        candidate = value.value
      }
      expect(candidate.character.unspentAttributePoints).toBe(0)
      const linked = bindPrologueWeapon(candidate, content, candidate.createdAt, 'qa-' + pattern.name)
      expect(linked.ok).toBe(true)
      if (!linked.ok) continue
      const metrics = deriveCharacterStats(linked.value, content)
      const cleared = [0, 0, 0, 0, 0]
      const failedAt: Record<string, number> = {}
      for (let seed = 0; seed < 16; seed++) {
        const save = structuredClone(linked.value)
        for (let i = 0; i < stages.length; i++) {
          const node = stages[i]
          const outcome = battleWithoutStatOverrides(save, node.encounterId!,
            'natural-v0516-' + pattern.name + '-' + seed + '-' + node.id)
          save.vitals.hp = outcome.hp
          if (outcome.phase !== 'Victory') {
            failedAt[node.id] = (failedAt[node.id] ?? 0) + 1
            break
          }
          cleared[i]++
          const recovery = content.encounters[node.encounterId!].rewards
          save.character = gainCharacterXp(save.character, recovery.characterXp).character
          const derived = deriveCharacterStats(save, content)
          save.vitals.hp = Math.min(derived.life.value, save.vitals.hp + (recovery.fieldRecovery?.hp ?? 0))
        }
      }
      console.info('QA_NATURAL_ALLOCATION_V0516 ' + JSON.stringify({
        build: pattern.name,
        hp: metrics.life.value, attack: metrics.primaryAttack.value, defense: metrics.defense.value,
        stagesClearedBy16Runs: cleared, fullClear: cleared.at(-1), failedAt,
        rules: '6 legitimate creation points, starter bound weapon, normal dice, normal enemies, no heal items or rest',
      }))
      expect(cleared[0]).toBeGreaterThan(0)
    }
  })

  it('measures the lawful tutorial tunic and the tonic actually dropped after stage 2', () => {
    let ready = createNewSave('supplies-v0516', 'Terrírian', 'character.terririan.default', content)
    for (const id of ['vigor','vigor','vigor','vigor','strength','strength'] as const) {
      const applied = adjustCharacterAttribute(ready, id, 1, ready.createdAt)
      expect(applied.ok).toBe(true)
      if (!applied.ok) return
      ready = applied.value
    }
    const bound = bindPrologueWeapon(ready, content, ready.createdAt, 'qa-supplies-weapon')
    expect(bound.ok).toBe(true)
    if (!bound.ok) return
    ready = bound.value
    const armor = content.items.equipment_worn_linen_tunic
    // A pre-Astravél Rosetta tutorial grants this actual item. The test uses
    // the real equip action, not a forged defense value or bound armor.
    ready.inventory.push({ instanceId: 'qa-tutorial-linen', definitionId: armor.id,
      quantity: 1, rarity: armor.rarity, locked: false, favorite: false, acquiredAt: ready.createdAt })
    const dressed = equipBasicArmor(ready, 'qa-tutorial-linen', content, ready.createdAt)
    expect(dressed.ok).toBe(true)
    if (!dressed.ok) return
    ready = dressed.value
    const results = [] as { config: string; clearedByStage: number[]; tonicsConsumed: number; fullClear: number }[]
    for (const allowTonic of [false, true]) {
      const clears = [0,0,0,0,0]
      let tonicUses = 0
      for (let seed = 0; seed < 16; seed++) {
        const save = structuredClone(ready)
        const carried: string[] = []
        for (let i = 0; i < stages.length; i++) {
          const node = stages[i]
          let battle = createBattle(save, content.encounters[node.encounterId!], content,
            'natural-tunic-' + allowTonic + '-' + seed + '-' + node.id, { manualInitiative: true })
          const initiative = submitBattleCommand(battle, { type: 'rollInitiative' }, content)
          expect(initiative.ok).toBe(true)
          if (!initiative.ok) return
          battle = initiative.value
          let actions = 0
          while (battle.phase !== 'Victory' && battle.phase !== 'Defeat' && actions < 100) {
            if (battle.phase !== 'AwaitingAction') throw new Error('combat did not return action phase: ' + battle.phase)
            const player = battle.combatants.combatant_player
            if (allowTonic && carried.length > 0 && player.maxHp - player.hp >= 8) {
              const itemInstanceId = carried[0]
              const use = submitBattleCommand(battle, { type: 'item', itemInstanceId,
                targetId:'combatant_player' }, content, [
                  { instanceId:itemInstanceId, definitionId:'consumable_minor_tonic',
                    quantity:1, rarity:content.items.consumable_minor_tonic.rarity,
                    locked:false, favorite:false, acquiredAt:save.createdAt },
                ])
              if (use.ok) {
                battle = use.value
                carried.shift()
                tonicUses++
              }
            }
            const target = Object.values(battle.combatants)
              .filter(actor => actor.side === 'enemy' && actor.alive && !isProtectedBoss(battle, actor))
              .sort((a,b) => Number(b.definitionId === 'enemy_spore_sower') -
                Number(a.definitionId === 'enemy_spore_sower') || a.hp - b.hp)[0]
            if (!target) throw new Error('No valid target at ' + node.id)
            const result = submitBattleCommand(battle, { type: 'attack', targetId:target.id }, content)
            expect(result.ok).toBe(true)
            if (!result.ok) return
            battle = result.value
            actions++
          }
          expect(['Victory','Defeat']).toContain(battle.phase)
          save.vitals.hp = battle.combatants.combatant_player.hp
          if (battle.phase === 'Defeat') break
          clears[i]++
          const loot = content.encounters[node.encounterId!].rewards
          for (const itemId of loot.lootDefinitionIds) if (itemId === 'consumable_minor_tonic')
            carried.push('qa-tonic-' + seed + '-' + i)
          save.character = gainCharacterXp(save.character, loot.characterXp).character
          const derived = deriveCharacterStats(save, content)
          save.vitals.hp = Math.min(derived.life.value, save.vitals.hp + (loot.fieldRecovery?.hp ?? 0))
        }
      }
      results.push({ config: allowTonic ? 'tunic_plus_found_tonic' : 'tunic_only',
        clearedByStage:clears, tonicsConsumed:tonicUses, fullClear:clears[4] })
    }
    console.info('QA_NATURAL_TUTORIAL_PREP_V0516 ' + JSON.stringify({
      results, seedsPerConfig:16, stats:deriveCharacterStats(ready,content).defense.value,
      description:'4 vigor + 2 strength, starter bound weapon, actual Rosetta linen tunic and optionally only tonic found after stage 2; no resting, manual defense/skills or forge upgrade',
    }))
    expect(results).toHaveLength(2)
  })

})
