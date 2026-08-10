import { describe, expect, it } from 'vitest'
import { content } from '../../content/catalog'
import { bindPrologueWeapon, createNewSave } from '../game/createSave'
import { calculateDamage, createBattle, submitBattleCommand } from './engine'

const makeSave = () => {
  const save = createNewSave(
    'user_1',
    'Aron',
    'character.terririan.default',
    content,
    '2026-08-10T12:00:00.000Z',
    { saveId: 'save_1', characterId: 'char_1' },
  )
  const bound = bindPrologueWeapon(save, content, '2026-08-10T12:01:00.000Z', 'bound_1')
  if (!bound.ok) throw new Error(bound.message)
  return bound.value
}

describe('máquina de estados de combate', () => {
  it('calcula dano fora do React com mínimo 1', () => {
    expect(calculateDamage(6, 1)).toBe(5)
    expect(calculateDamage(2, 99)).toBe(1)
  })

  it('resolve batalha determinística e encerra em vitória', () => {
    const battle = createBattle(
      makeSave(),
      content.enemies.enemy_fungorro_crawler,
      content,
      'encounter_test',
      'battle_1',
    )
    const targetId = 'combatant_enemy_fungorro_crawler'
    const first = submitBattleCommand(battle, { type: 'attack', targetId })
    expect(first.ok).toBe(true)
    if (!first.ok) return
    expect(first.value.phase).toBe('AwaitingAction')
    const second = submitBattleCommand(first.value, { type: 'attack', targetId })
    expect(second.ok).toBe(true)
    if (!second.ok) return
    expect(second.value.phase).toBe('Victory')
    expect(second.value.phaseHistory).toContain('ResolvingReactions')
    expect(second.value.phaseHistory).toContain('ApplyingStatuses')
    expect(second.value.combatants[targetId].alive).toBe(false)
  })

  it('defender reduz dano do próximo ataque', () => {
    const battle = createBattle(makeSave(), content.enemies.enemy_fungorro_crawler, content)
    const playerBefore = battle.combatants.combatant_player.hp
    const result = submitBattleCommand(battle, { type: 'defend' })
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(playerBefore - result.value.combatants.combatant_player.hp).toBe(1)
  })

  it('ação inválida não altera o estado', () => {
    const battle = createBattle(makeSave(), content.enemies.enemy_fungorro_crawler, content)
    battle.phase = 'ResolvingAction'
    const before = structuredClone(battle)
    const result = submitBattleCommand(battle, { type: 'defend' })
    expect(result.ok).toBe(false)
    expect(battle).toEqual(before)
  })
})
