import { describe, expect, it } from 'vitest'
import { BALANCE } from '../../content/balance'
import { content } from '../../content/catalog'
import { createNewSave } from '../game/createSave'
import { calculateRolledDamage, createBattle, seedFromBattleId, submitBattleCommand } from './engine'
import { rollSeededCombatDie } from './rng'
import { migrateAndValidateSave } from '../../persistence/saveSchema'
import type { CombatDie } from './types'

const dice: CombatDie[] = [4, 6, 8, 10, 12]
const makeSave = () => createNewSave('dice-account', 'Terrírian', 'character.terririan.default', content,
  '2026-11-09T18:00:00Z')
const encounterIds = [
  'encounter_fungorro_01',
  'encounter_spore_ambush_01',
  'encounter_clan_granite_golem_v05142',
] as const

const makeTestBattle = (encounterId: string, battleId: string, die: CombatDie = 4) => {
  const encounter = content.encounters[encounterId]
  if (!encounter) throw Error('Missing encounter ' + encounterId)
  const battle = createBattle(makeSave(), encounter, content, battleId, { manualInitiative: true })
  const actor = battle.combatants.combatant_player
  actor.hp = actor.maxHp = 500
  actor.mp = actor.maxMp = 200
  actor.attackPower = 9
  actor.attackDie = die
  const enemies = Object.values(battle.combatants).filter((entry) => entry.side === 'enemy')
  for (const enemy of enemies) {
    enemy.hp = enemy.maxHp = 500
    enemy.attackPower = 6
    enemy.mitigation = 2
  }
  battle.phase = 'AwaitingAction'
  battle.initiativeOrder = [actor.id, ...enemies.map((enemy) => enemy.id)]
  battle.actorId = actor.id
  battle.actorCursor = 0
  return { battle, targetId: enemies[0].id }
}

describe('v0.5.14.2 · dados justos e crítico global por face máxima', () => {
  it('d4/d6/d8/d10/d12 geram todas as faces com frequências próximas do esperado', () => {
    for (const sides of dice) {
      let seed = 973201
      const counts = Array.from({ length: sides }, () => 0)
      for (let i = 0; i < 100000; i++) {
        const roll = rollSeededCombatDie(seed, sides)
        if (roll.face < 1 || roll.face > sides || !Number.isInteger(roll.face)) {
          throw new Error(`Face inválida em d${sides}: ${roll.face}`)
        }
        seed = roll.nextSeed
        counts[roll.face - 1]++
      }
      const expected = 100000 / sides
      for (const count of counts) expect(Math.abs(count - expected) / expected).toBeLessThan(0.06)
    }
  })

  it('a semente é distinta por batalha, reproduzível após reload e nunca depende da interface', () => {
    const a = seedFromBattleId('aaa-battle')
    const b = seedFromBattleId('bbb-battle')
    expect(a).not.toBe(b)
    const seq = (seed: number) => dice.map((sides) => {
      const roll = rollSeededCombatDie(seed, sides)
      seed = roll.nextSeed
      return roll
    })
    expect(seq(a)).toEqual(seq(a))
    expect(seq(b)).not.toEqual(seq(a))
    for (const encounterId of encounterIds) {
      const { battle, targetId } = makeTestBattle(encounterId, 'replay-' + encounterId)
      const frozen = structuredClone(battle)
      const command = { type: 'attack' as const, targetId }
      const original = submitBattleCommand(battle, command, content)
      const replay = submitBattleCommand(structuredClone(battle), command, content)
      expect(original).toEqual(replay)
      expect(battle).toEqual(frozen)
      if (original.ok) expect(original.value.rngSeed).not.toBe(battle.rngSeed)
    }
  })

  it('face máxima é o único gatilho do crítico; multiplicador igual para todos os dados', () => {
    for (const sides of dice) {
      const normal = calculateRolledDamage(10, 2, sides - 1, sides)
      const critical = calculateRolledDamage(10, 2, sides, sides)
      const nonCritBase = Math.max(1, 10 + (sides - 1 - Math.floor((sides + 1) / 2)) - 2)
      const critBase = Math.max(1, 10 + (sides - Math.floor((sides + 1) / 2)) - 2)
      expect(normal.critical).toBe(false)
      expect(critical.critical).toBe(true)
      expect(normal.finalDamage).toBe(nonCritBase)
      expect(critical.finalDamage).toBe(Math.ceil(critBase * BALANCE.combatCriticalMultiplier))
      const blocked = calculateRolledDamage(10, 2, sides, sides, 0, 3)
      expect(blocked.critical).toBe(true)
      expect(blocked.guardPrevented).toBe(critical.finalDamage - blocked.finalDamage)
    }
  })

  it('jogador e monstros critam por face máxima em encontros normais, ondas, bosses e todas as armas de dados', () => {
    let playerCriticals = 0
    let enemyCriticals = 0
    for (const encounterId of encounterIds) {
      for (const die of dice) {
        let sawMax = false
        let sawNonMax = false
        for (let i = 0; i < 135; i++) {
          const { battle, targetId } = makeTestBattle(encounterId, 'crit-' + encounterId + '-' + die + '-' + i, die)
          const result = submitBattleCommand(battle, { type: 'attack', targetId }, content)
          if (!result.ok) throw new Error(result.message)
          const hits = result.value.log.filter(entry => entry.tone === 'damage' && entry.roll)
          for (const { roll, message } of hits) {
            if (!roll) continue
            expect(roll.face).toBeGreaterThanOrEqual(1)
            expect(roll.face).toBeLessThanOrEqual(roll.sides)
            expect(roll.critical).toBe(roll.face === roll.sides)
            expect(roll.damageBreakdown?.critical).toBe(roll.critical)
            if (roll.critical) {
              expect(message).toContain('ACERTO CRÍTICO!')
              if (roll.actorId === 'combatant_player') playerCriticals++
              else enemyCriticals++
            }
            if (roll.actorId === 'combatant_player') {
              sawMax ||= roll.critical === true
              sawNonMax ||= roll.critical === false
            }
          }
          if (sawMax && sawNonMax) break
        }
        expect(sawMax).toBe(true)
        expect(sawNonMax).toBe(true)
      }
    }
    expect(playerCriticals).toBeGreaterThan(10)
    expect(enemyCriticals).toBeGreaterThan(10)
  })

  it('ataques em área e habilidades usam o mesmo dado natural, sem crítico duplicado no splash', () => {
    for (const type of ['areaAttack', 'skill'] as const) {
      let sawCritical = false
      for (let index = 0; index < 120; index++) {
        const { battle, targetId } = makeTestBattle('encounter_spore_ambush_01', type + '-crit-' + index)
        battle.combatants.combatant_player.skillIds.push('skill_resonant_strike')
        const command = type === 'areaAttack'
          ? { type, targetId }
          : { type, targetId, skillId: 'skill_resonant_strike' }
        const result = submitBattleCommand(battle, command, content)
        if (!result.ok) throw Error(result.message)
        const firstHit = result.value.log.find(entry =>
          entry.tone === 'damage' && entry.roll?.actorId === 'combatant_player')
        if (!firstHit?.roll?.critical) continue
        sawCritical = true
        expect(firstHit.roll.face).toBe(firstHit.roll.sides)
        const splash = result.value.log.filter(entry =>
          entry.roll?.action === 'Splash de Área' || entry.roll?.action === 'Pulso Ressonante')
        for (const hit of splash) {
          expect(hit.roll?.face).toBe(firstHit.roll.face)
          expect(hit.roll?.critical).toBe(true)
        }
        break
      }
      expect(sawCritical).toBe(true)
    }
  })

  it('saves mantêm a face, o crítico e a semente; saves antigos dispensam o novo campo', () => {
    const save = makeSave()
    const { battle, targetId } = makeTestBattle('encounter_fungorro_01', 'saved-critical')
    battle.combatants.combatant_player.attackPower = 9
    let critSeed = 1
    while (rollSeededCombatDie(critSeed, 4).face !== 4) critSeed++
    battle.rngSeed = critSeed
    const result = submitBattleCommand(battle, { type: 'attack', targetId }, content)
    if (!result.ok) throw Error(result.message)
    save.battle = result.value
    const latest = migrateAndValidateSave(structuredClone(save))
    const hit = latest.battle?.log.find(entry => entry.roll?.actorId === 'combatant_player')
    expect(hit?.roll?.face).toBe(4)
    expect(hit?.roll?.critical).toBe(true)
    expect(hit?.roll?.damageBreakdown?.critical).toBe(true)
    expect(latest.battle?.rngSeed).toBe(result.value.rngSeed)
    const old = structuredClone(save)
    for (const entry of old.battle!.log) {
      if (entry.roll) {
        delete entry.roll.critical
        if (entry.roll.damageBreakdown) delete entry.roll.damageBreakdown.critical
      }
    }
    expect(migrateAndValidateSave(old).battle?.rngSeed).toBe(result.value.rngSeed)
  })

  it('rolagem máxima de iniciativa não cria crítico nem bônus indevido de dano', () => {
    const save = makeSave()
    for (let i = 0; i < 40; i++) {
      const battle = createBattle(save, content.encounters.encounter_fungorro_01, content,
        'initiative-max-' + i, { manualInitiative: true })
      const result = submitBattleCommand(battle, { type: 'rollInitiative' }, content)
      if (!result.ok) throw Error(result.message)
      const rolls = result.value.log.filter(entry => entry.roll?.action === 'Iniciativa')
      for (const entry of rolls) {
        expect(entry.roll?.critical).toBeUndefined()
        expect(entry.roll?.face).toBeLessThanOrEqual(entry.roll?.sides ?? 0)
      }
    }
  })
})
