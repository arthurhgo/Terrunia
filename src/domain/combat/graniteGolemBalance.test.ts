import { describe, expect, it } from 'vitest'
import { content } from '../../content/catalog'
import { createNewSave } from '../game/createSave'
import { createBattle, submitBattleCommand } from './engine'
import { GRANITE_GOLEM_BALANCE, GRANITE_GOLEM_ENCOUNTER_ID, GRANITE_GOLEM_ENEMY_ID } from '../../content/clanProgressionV05142'

const encounter = content.encounters[GRANITE_GOLEM_ENCOUNTER_ID]
const fresh = () => createNewSave('golem-balance', 'Terrírian', 'character.terririan.default', content, '2026-11-09T18:00:00Z')
const getGolem = (battle: ReturnType<typeof createBattle>) =>
  Object.values(battle.combatants).find(actor => actor.definitionId === GRANITE_GOLEM_ENEMY_ID)!

const playerTurnBattle = (id: string) => {
  const battle = createBattle(fresh(), encounter, content, id, { manualInitiative: true })
  const golem = getGolem(battle)
  battle.phase = 'AwaitingAction'
  battle.actorId = 'combatant_player'
  battle.actorCursor = 0
  battle.initiativeOrder = ['combatant_player', golem.id]
  return { battle, golemId: golem.id }
}

describe('Golem de Granito v0.5.14.2 — duelo tático +10%', () => {
  it('escala a Vida e o Ataque a 110% do jogador, sem inventar novas regras globais', () => {
    const save = fresh()
    const battle = createBattle(save, encounter, content, 'granite-scale', { manualInitiative: true })
    const player = battle.combatants.combatant_player
    const golem = getGolem(battle)
    expect(golem.maxHp).toBe(Math.ceil(player.maxHp * GRANITE_GOLEM_BALANCE.playerStatMultiplier))
    expect(golem.attackPower).toBe(Math.ceil(player.attackPower * GRANITE_GOLEM_BALANCE.playerStatMultiplier))
    expect(golem.mitigation).toBe(player.mitigation)
    expect(golem.initiative).toBe(Math.ceil(Math.max(1, player.initiative) * 1.1))
    expect(battle.phase).toBe('AwaitingInitiative')
    expect(battle.canFlee).toBe(false)
    const bigger = fresh()
    bigger.character.attributes.vigor.bonus += 8
    bigger.character.attributes.strength.bonus += 8
    const biggerFight = createBattle(bigger, encounter, content, 'granite-scaled-bigger')
    expect(getGolem(biggerFight).maxHp).toBeGreaterThan(golem.maxHp)
    expect(getGolem(biggerFight).attackPower).toBeGreaterThan(golem.attackPower)
    const normal = createBattle(save, content.encounters.encounter_fungorro_01, content, 'normal-encounter')
    expect(Object.values(normal.combatants).some(actor => actor.definitionId === GRANITE_GOLEM_ENEMY_ID)).toBe(false)
  })

  it('avisa a pedra no turno anterior e não ataca enquanto prepara o arremesso', () => {
    const { battle, golemId } = playerTurnBattle('granite-windup')
    const golem = battle.combatants[golemId]
    golem.hp = golem.maxHp = 999
    const first = submitBattleCommand(battle, { type: 'attack', targetId: golemId }, content)
    expect(first.ok).toBe(true)
    if (!first.ok) return
    expect(first.value.round).toBe(2)
    const afterFirst = first.value.combatants.combatant_player.hp
    const second = submitBattleCommand(first.value, { type: 'attack', targetId: golemId }, content)
    expect(second.ok).toBe(true)
    if (!second.ok) return
    expect(second.value.round).toBe(3)
    expect(second.value.combatants.combatant_player.hp).toBe(afterFirst)
    expect(second.value.log.some(e => e.message.includes('ergue uma rocha'))).toBe(true)
  })

  it('bloqueio após aviso reduz a pedrada e impede Abalado pelo Granito', () => {
    const { battle, golemId } = playerTurnBattle('granite-defense')
    battle.combatants[golemId].hp = battle.combatants[golemId].maxHp = 999
    const one = submitBattleCommand(battle, { type: 'attack', targetId: golemId }, content)
    if (!one.ok) throw new Error(one.message)
    const two = submitBattleCommand(one.value, { type: 'attack', targetId: golemId }, content)
    if (!two.ok) throw new Error(two.message)
    const guarded = submitBattleCommand(two.value, { type: 'defend' }, content)
    const unguarded = submitBattleCommand(two.value, { type: 'attack', targetId: golemId }, content)
    expect(guarded.ok && unguarded.ok).toBe(true)
    if (!guarded.ok || !unguarded.ok) return
    const defendedPlayer = guarded.value.combatants.combatant_player
    const exposedPlayer = unguarded.value.combatants.combatant_player
    expect(defendedPlayer.hp).toBeGreaterThan(exposedPlayer.hp)
    expect(defendedPlayer.statusEffects.some(status => status.definitionId === 'status_granite_shaken')).toBe(false)
    expect(exposedPlayer.statusEffects.some(status => status.definitionId === 'status_granite_shaken')).toBe(true)
    expect(guarded.value.log.some(e => e.message.includes('Defesa perfeita'))).toBe(true)
    expect(guarded.value.log.some(e => e.message.includes('Arremesso de Granito'))).toBe(true)
  })

  it('crítico do Golem também segue a face máxima do dado, sem chance separada', () => {
    let criticalFound = false
    for (let index = 0; index < 120; index++) {
      const { battle, golemId } = playerTurnBattle('granite-crit-' + index)
      battle.combatants[golemId].hp = battle.combatants[golemId].maxHp = 999
      const result = submitBattleCommand(battle, { type: 'attack', targetId: golemId }, content)
      if (!result.ok) throw new Error(result.message)
      const hit = result.value.log.find(entry => entry.message.includes('ACERTO CRÍTICO!'))
      if (!hit) continue
      criticalFound = true
      expect(hit.roll?.face).toBe(hit.roll?.sides)
      expect(hit.roll?.critical).toBe(true)
      expect(hit.roll?.damageBreakdown?.finalDamage).toBeGreaterThan(1)
      expect(hit.message).toContain('causa ' + hit.roll?.damageBreakdown?.finalDamage + ' de dano')
      break
    }
    expect(criticalFound).toBe(true)
  })

  it('poção continua gratuita e restaura Vida imediatamente durante o boss', () => {
    const { battle } = playerTurnBattle('granite-potion')
    const player = battle.combatants.combatant_player
    player.hp -= 6
    const potion = content.items.consumable_fungal_healing_potion
    const inventory = [{
      instanceId: 'potion-unit', definitionId: potion.id, quantity: 1, rarity: potion.rarity,
      locked: false, favorite: false, acquiredAt: '2026-11-09T18:00:00Z',
    }]
    const potionResult = submitBattleCommand(battle,
      { type: 'item', itemInstanceId: 'potion-unit', targetId: player.id }, content, inventory)
    expect(potionResult.ok).toBe(true)
    if (!potionResult.ok) return
    expect(potionResult.value.phase).toBe('AwaitingAction')
    expect(potionResult.value.combatants.combatant_player.hp)
      .toBe(player.hp + Math.ceil(player.maxHp * 0.1))
    expect(potionResult.value.consumedItemInstanceIds).toContain('potion-unit')
    expect(potionResult.value.round).toBe(1)
  })
  it('é possível vencer usando poções, defesa e críticos em combate reproduzível', () => {
    let tacticalVictory = false
    const potion = content.items.consumable_fungal_healing_potion
    for (let seed = 0; seed < 90 && !tacticalVictory; seed++) {
      const battle = createBattle(fresh(), encounter, content,
        'granite-gameplay-' + seed, { manualInitiative: true })
      const rolled = submitBattleCommand(battle, { type: 'rollInitiative' }, content)
      if (!rolled.ok) throw new Error(rolled.message)
      let state = rolled.value
      const golemId = getGolem(state).id
      const inventory = Array.from({ length: 4 }, (_, index) => ({
        instanceId: 'golem-potion-' + index, definitionId: potion.id, quantity: 1,
        rarity: potion.rarity, locked: false, favorite: false, acquiredAt: '2026-11-09T18:00:00Z',
      }))
      let potions = 0
      let defenses = 0
      for (let turn = 0; turn < 32 && state.phase === 'AwaitingAction'; turn++) {
        const player = state.combatants.combatant_player
        if (player.hp <= player.maxHp - 3 && potions < inventory.length &&
          !(player.potionCooldown ?? 0) && !(player.potionHealingTicks ?? 0)) {
          const potionResult = submitBattleCommand(state,
            { type: 'item', itemInstanceId: inventory[potions].instanceId, targetId: player.id },
            content, inventory)
          if (!potionResult.ok) throw new Error(potionResult.message)
          state = potionResult.value
          potions++
        }
        const lastStoneEvent = [...state.log].reverse().find(entry =>
          entry.message.includes('O Golem ergue uma rocha') || entry.roll?.action === 'Arremesso de Granito')
        const block = Boolean(lastStoneEvent?.message.includes('O Golem ergue uma rocha'))
        if (block) defenses++
        const action = block
          ? { type: 'defend' as const }
          : { type: 'attack' as const, targetId: golemId }
        const outcome = submitBattleCommand(state, action, content)
        if (!outcome.ok) throw new Error(outcome.message)
        state = outcome.value
      }
      const critical = state.log.some(entry => entry.message.includes('ACERTO CRÍTICO!'))
      tacticalVictory = state.phase === 'Victory' && potions > 0 && defenses > 0 && critical
    }
    expect(tacticalVictory).toBe(true)
  })

})
