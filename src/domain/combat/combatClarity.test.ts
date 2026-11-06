import { describe, expect, it } from 'vitest'
import { content } from '../../content/catalog'
import { BALANCE } from '../../content/balance'
import { bindPrologueWeapon, createNewSave } from '../game/createSave'
import { calculateDamage, createBattle, submitBattleCommand } from './engine'

const create = () => {
  const save = createNewSave('owner','Nova','character.terririan.default',content)
  const bound = bindPrologueWeapon(save, content, save.updatedAt, 'bond-v057')
  if (!bound.ok) throw Error(bound.message)
  const battle = createBattle(bound.value, content.encounters.encounter_fungorro_01, content, 'damage-v057')
  battle.phase = 'AwaitingAction'
  battle.actorId = 'combatant_player'
  battle.initiativeOrder = ['combatant_player', ...battle.initiativeOrder.filter((id) => id !== 'combatant_player')]
  battle.actorCursor = 0
  const target = Object.values(battle.combatants).find((actor) => actor.side === 'enemy')!
  target.maxHp = 500
  target.hp = 500
  target.mitigation = 1
  target.attackPower = 0
  const player = battle.combatants.combatant_player
  player.attackPower = 2
  player.attackDie = 6
  player.maxHp = 500
  player.hp = 500
  return { battle, target, player }
}

describe('equação de dano transparente v0.5.7', () => {
  it('d6(6) + 2 de Poder - 1 de armadura = 7 de dano real, sem resultado decorativo', () => {
    expect(calculateDamage(6 + 2, 1)).toBe(7)
    expect(calculateDamage(1, 99)).toBe(0)
    const { battle, target } = create()
    const result = submitBattleCommand(battle, { type: 'attack', targetId: target.id }, content)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const log = result.value.log.find((item) => item.roll?.actorId === 'combatant_player' && item.roll.action === 'Ataque básico')
    expect(log?.roll?.damageBreakdown).toMatchObject({ attack: 2, skillBonus: 0, armor: 1, guard: 0 })
    expect(log?.roll?.damageBreakdown?.result).toBe((log?.roll?.face ?? 0) + 1)
    expect(log?.message).toMatch(/Poder 2.*Armadura 1/)
    expect(target.hp - result.value.combatants[target.id].hp).toBe(log?.roll?.damageBreakdown?.result)
  })

  it('a habilidade usa dado melhor, bônus próprio, mana e recarga, sem mudar o autoataque', () => {
    const { battle, target, player } = create()
    player.skillIds.push('skill_longsword_arc')
    const initialMp = player.mp
    const first = submitBattleCommand(battle, { type: 'skill', skillId: 'skill_longsword_arc', targetId: target.id }, content)
    expect(first.ok).toBe(true)
    if (!first.ok) return
    const hit = first.value.log.find((item) => item.roll?.action === 'Arco da Lâmina')
    expect(hit?.roll?.sides).toBe(8)
    expect(hit?.roll?.damageBreakdown?.skillBonus).toBe(2)
    expect(first.value.combatants.combatant_player.mp).toBe(initialMp - 2)
    const ready = first.value.combatants.combatant_player.skillReadyRound?.skill_longsword_arc
    expect(ready).toBe(battle.round + BALANCE.skillCooldownRounds + 1)
    const blocked = submitBattleCommand(first.value, { type:'skill', skillId:'skill_longsword_arc', targetId:target.id }, content)
    expect(blocked).toMatchObject({ ok:false, code:'SKILL_COOLDOWN' })
    const cooled = structuredClone(first.value)
    cooled.phase = 'AwaitingAction'
    cooled.actorId = 'combatant_player'
    cooled.round = ready!
    expect(submitBattleCommand(cooled, { type:'skill', skillId:'skill_longsword_arc', targetId:target.id }, content).ok).toBe(true)
  })

  it('Defender absorve dano sem forçar mínimo de um, e dura até a próxima ação', () => {
    const { battle } = create()
    const defended = submitBattleCommand(battle, { type:'defend' }, content)
    expect(defended.ok).toBe(true)
    if (!defended.ok) return
    expect(defended.value.combatants.combatant_player.defending).toBe(true)
    const enemyDamage = defended.value.log.filter((entry) => entry.roll && entry.roll.actorId !== 'combatant_player')
    expect(enemyDamage.every((entry) => entry.roll?.damageBreakdown?.guard === BALANCE.defendMitigation)).toBe(true)
    const next = submitBattleCommand(defended.value, {
      type:'attack', targetId:Object.values(defended.value.combatants).find((actor) => actor.side === 'enemy')!.id,
    }, content)
    expect(next.ok).toBe(true)
    if (next.ok) expect(next.value.combatants.combatant_player.defending).toBe(false)
  })
})
