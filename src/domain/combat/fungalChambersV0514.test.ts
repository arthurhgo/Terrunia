import { describe, expect, it } from 'vitest'
import { content } from '../../content/catalog'
import { bindPrologueWeapon, createNewSave } from '../game/createSave'
import type { InventoryItemInstance } from '../game/types'
import { createBattle, isProtectedBoss, submitBattleCommand } from './engine'
import { previewCombatSkill } from './skillPreview'

const makeSave = () => createNewSave('test-v0514', 'Sentinela', 'character.terririan.default', content)
const bossEncounter = content.encounters.encounter_fungal_core_sentinel

function readyBoss(id: string) {
  const battle = createBattle(makeSave(), bossEncounter, content, id, { manualInitiative: true })
  const player = battle.combatants.combatant_player
  battle.phase = 'AwaitingAction'
  battle.initiativeOrder = [player.id, ...battle.initiativeOrder.filter((actorId) => actorId !== player.id)]
  battle.actorId = player.id
  battle.actorCursor = 0
  player.maxHp = player.hp = 1000
  player.maxMp = player.mp = 100
  player.attackPower = 28
  player.skillIds.push('skill_resonant_strike')
  return battle
}
const enemies = (battle: ReturnType<typeof readyBoss>) =>
  Object.values(battle.combatants).filter((combatant) => combatant.side === 'enemy')

describe('v0.5.14 · combate das Câmaras Fúngicas', () => {
  it('protege a Sentinela contra ataques diretos e Golpe Ressonante enquanto existem fungos', () => {
    const battle = readyBoss('boss-protected')
    const boss = enemies(battle).find((actor) => actor.definitionId === 'enemy_ruin_corrupted_sentinel')!
    expect(isProtectedBoss(battle, boss)).toBe(true)
    expect(submitBattleCommand(battle, { type: 'attack', targetId: boss.id }, content))
      .toMatchObject({ ok: false, code: 'INVALID_TARGET' })
    expect(submitBattleCommand(battle,
      { type: 'skill', skillId: 'skill_resonant_strike', targetId: boss.id }, content))
      .toMatchObject({ ok: false, code: 'INVALID_TARGET' })

    const area = submitBattleCommand(battle, { type: 'areaAttack' }, content)
    expect(area.ok).toBe(true)
    if (!area.ok) return
    expect(area.value.combatants[boss.id].hp).toBe(boss.hp)
    expect(area.value.log.some((entry) => entry.message.includes('Ataque em Área'))).toBe(true)

    for (const actor of enemies(battle).filter((actor) => actor.id !== boss.id)) {
      actor.hp = 0
      actor.alive = false
    }
    expect(isProtectedBoss(battle, boss)).toBe(false)
    expect(submitBattleCommand(battle, { type: 'attack', targetId: boss.id }, content).ok).toBe(true)
  })

  it('Golpe Ressonante propaga 5% do dano final para outros fungos, nunca para a Sentinela blindada', () => {
    const battle = readyBoss('resonant-area')
    const boss = enemies(battle).find((actor) => actor.definitionId === 'enemy_ruin_corrupted_sentinel')!
    const guards = enemies(battle).filter((actor) => actor.id !== boss.id)
    for (const guard of guards) guard.maxHp = guard.hp = 100
    const outcome = submitBattleCommand(battle, { type: 'skill', skillId: 'skill_resonant_strike',
      targetId: guards[0].id }, content)
    expect(outcome.ok).toBe(true)
    if (!outcome.ok) return
    const splash = outcome.value.log.filter((entry) => entry.message.includes('por Pulso Ressonante'))
    expect(splash).toHaveLength(2)
    const main = outcome.value.log.find((entry) =>
      entry.roll?.actorId === 'combatant_player' && entry.roll?.action === 'Golpe Ressonante')
    const damage = main?.roll?.damageBreakdown?.finalDamage ?? 0
    expect(damage).toBeGreaterThan(0)
    for (const entry of splash) {
      expect(entry.roll?.targetId).not.toBe(boss.id)
      expect(entry.message).toContain(`causa ${Math.max(1, Math.ceil(damage * 0.05))} de dano`)
    }
    expect(outcome.value.combatants[boss.id].hp).toBe(boss.hp)
  })

  it('regenera 5% do HP máximo dos fungos a cada 2 rounds e ressuscita um no round 5', () => {
    const battle = readyBoss('sentinel-cycles')
    const boss = enemies(battle).find((actor) => actor.definitionId === 'enemy_ruin_corrupted_sentinel')!
    const guard = enemies(battle).find((actor) => actor.id !== boss.id)!
    guard.hp = 1
    const healing = submitBattleCommand(battle, { type: 'defend' }, content)
    expect(healing.ok).toBe(true)
    if (!healing.ok) return
    expect(healing.value.round).toBe(2)
    expect(healing.value.log.some((entry) => entry.message.includes('A Sentinela recupera'))).toBe(true)

    const next = readyBoss('sentinel-respawn')
    next.round = 4
    const guardToRevive = enemies(next).find((actor) => actor.definitionId !== 'enemy_ruin_corrupted_sentinel')!
    guardToRevive.alive = false
    guardToRevive.hp = 0
    const revived = submitBattleCommand(next, { type: 'defend' }, content)
    expect(revived.ok).toBe(true)
    if (!revived.ok) return
    expect(revived.value.round).toBe(5)
    expect(revived.value.combatants[guardToRevive.id].alive).toBe(true)
    expect(enemies(revived.value).filter((actor) => actor.alive && actor.id !== boss.id)).toHaveLength(3)
    expect(revived.value.log.some((entry) => entry.message.includes('A Sentinela ressuscita'))).toBe(true)
  })

  it('poção é gratuita, exige item real, não adianta turno e cura 10% imediatamente', () => {
    const battle = createBattle(makeSave(), content.encounters.encounter_fungorro_01,
      content, 'potion-free-action', { manualInitiative: true })
    const player = battle.combatants.combatant_player
    battle.phase = 'AwaitingAction'
    battle.actorId = player.id
    battle.initiativeOrder = [player.id, ...battle.initiativeOrder.filter((id) => id !== player.id)]
    battle.actorCursor = 0
    player.maxHp = 31
    player.hp = 18
    const monster = Object.values(battle.combatants).find((actor) => actor.side === 'enemy')!
    monster.maxHp = monster.hp = 1000
    const item: InventoryItemInstance = { instanceId: 'healing-1',
      definitionId: 'consumable_fungal_healing_potion', quantity: 1, rarity: 'uncommon',
      locked: false, favorite: false, acquiredAt: '2026-11-09T13:00:00Z' }
    const rejected = submitBattleCommand(battle, { type: 'item',
      itemInstanceId: item.instanceId, targetId: player.id }, content)
    expect(rejected).toMatchObject({ ok: false, code: 'ITEM_UNAVAILABLE' })
    const applied = submitBattleCommand(battle, { type: 'item', itemInstanceId: item.instanceId,
      targetId: player.id }, content, [item])
    expect(applied.ok).toBe(true)
    if (!applied.ok) return
    expect(applied.value.phase).toBe('AwaitingAction')
    expect(applied.value.round).toBe(1)
    expect(applied.value.combatants.combatant_player.hp).toBe(22)
    expect(applied.value.combatants.combatant_player.potionHealingRemaining).toBe(0)
    expect(applied.value.consumedItemInstanceIds).toEqual(['healing-1'])
    expect(submitBattleCommand(applied.value,
      { type: 'item', itemInstanceId: item.instanceId, targetId: player.id }, content, [item]))
      .toMatchObject({ ok: false, code: 'POTION_COOLDOWN' })

    const first = submitBattleCommand(applied.value, { type: 'defend' }, content)
    expect(first.ok).toBe(true)
    if (!first.ok) return
    expect(first.value.combatants.combatant_player.potionHealingRemaining).toBe(0)
    const second = submitBattleCommand(first.value, { type: 'defend' }, content)
    expect(second.ok).toBe(true)
    if (!second.ok) return
    expect(second.value.combatants.combatant_player.potionHealingRemaining).toBe(0)
    expect(second.value.combatants.combatant_player.potionCooldown).toBe(0)
    const logs = applied.value.log.filter((entry) => entry.message.includes('recupera 4 de Vida'))
    expect(logs).toHaveLength(1)
    expect(applied.value.log.some(e=>e.message.includes('sem gastar a ação'))).toBe(true)
  })

  it('arma vinculada aplica dado adicional verdadeiro e informa prévia sem consumir RNG', () => {
    const base = makeSave()
    base.character.attributes.strength.die = 8
    const prepared = bindPrologueWeapon(base, content, undefined, 'weapon-v0514', 'bound_weapon_long_sword')
    expect(prepared.ok).toBe(true)
    if (!prepared.ok) return
    const battle = createBattle(prepared.value, content.encounters.encounter_fungorro_01, content,
      'attack-bonus-die')
    const player = battle.combatants.combatant_player
    expect(player.weaponBonusDie).toBe(4)
    const target = Object.values(battle.combatants).find((actor) => actor.side === 'enemy')!
    const skill = content.combatSkills.skill_longsword_arc
    const preview = previewCombatSkill(player, target, skill, content)
    expect(preview.weaponBonusDie).toBe(4)
    const result = submitBattleCommand(battle, { type: 'attack', targetId: target.id }, content)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const roll = result.value.log.find((entry) =>
      entry.roll?.actorId === player.id && entry.roll.weaponBonusRoll)?.roll
    expect(roll?.weaponBonusRoll?.sides).toBe(4)
    expect(roll?.weaponBonusRoll?.face).toBeGreaterThanOrEqual(1)
    expect(roll?.weaponBonusRoll?.face).toBeLessThanOrEqual(4)
  })
})
