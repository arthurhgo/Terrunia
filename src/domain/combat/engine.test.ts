import { describe, expect, it } from 'vitest'
import { content } from '../../content/catalog'
import type { InventoryItemInstance } from '../game/types'
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

const firstEncounter = content.encounters.encounter_fungorro_01
const firstTargetId = 'combatant_enemy_fungorro_crawler_1'

describe('máquina de estados de combate', () => {
  it('calcula dano fora do React com mínimo 1', () => {
    expect(calculateDamage(6, 1)).toBe(5)
    expect(calculateDamage(2, 99)).toBe(1)
  })

  it('resolve batalha determinística e encerra em vitória', () => {
    const battle = createBattle(makeSave(), firstEncounter, content, 'battle_1')
    const first = submitBattleCommand(
      battle,
      { type: 'attack', targetId: firstTargetId },
      content,
    )
    expect(first.ok).toBe(true)
    if (!first.ok) return
    expect(first.value.phase).toBe('AwaitingAction')
    const second = submitBattleCommand(
      first.value,
      { type: 'attack', targetId: firstTargetId },
      content,
    )
    expect(second.ok).toBe(true)
    if (!second.ok) return
    expect(second.value.phase).toBe('Victory')
    expect(second.value.phaseHistory).toContain('ResolvingReactions')
    expect(second.value.phaseHistory).toContain('ApplyingStatuses')
    expect(second.value.combatants[firstTargetId].alive).toBe(false)
  })

  it('defender reduz dano do próximo ataque', () => {
    const battle = createBattle(makeSave(), firstEncounter, content)
    const playerBefore = battle.combatants.combatant_player.hp
    const result = submitBattleCommand(battle, { type: 'defend' }, content)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(playerBefore - result.value.combatants.combatant_player.hp).toBe(1)
  })

  it('suporta encontro com três inimigos e alvos independentes', () => {
    const battle = createBattle(
      makeSave(),
      content.encounters.encounter_spore_ambush_01,
      content,
      'battle_multi',
    )
    const enemies = Object.values(battle.combatants).filter((combatant) => combatant.side === 'enemy')
    expect(enemies).toHaveLength(3)
    const targetId = enemies[1].id
    const result = submitBattleCommand(battle, { type: 'attack', targetId }, content)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.combatants[targetId].hp).toBeLessThan(enemies[1].hp)
    expect(result.value.combatants[enemies[0].id].hp).toBe(enemies[0].hp)
  })

  it('habilidade do Vínculo consome Mana e aplica status temporário', () => {
    const save = makeSave()
    save.boundItems.bound_1.skillTree.unlockedNodeIds.push('weapon_bond_core')
    const battle = createBattle(save, firstEncounter, content, 'battle_skill')
    battle.combatants[firstTargetId].hp = 20
    battle.combatants[firstTargetId].maxHp = 20
    const mpBefore = battle.combatants.combatant_player.mp
    const result = submitBattleCommand(
      battle,
      { type: 'skill', skillId: 'skill_resonant_strike', targetId: firstTargetId },
      content,
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.combatants.combatant_player.mp).toBe(mpBefore - 3)
    expect(result.value.combatants[firstTargetId].statusEffects[0]).toMatchObject({
      definitionId: 'status_resonant_fracture',
      remainingTurns: 1,
    })
  })

  it('consumível recupera Vida e registra consumo sem mutar o inventário de entrada', () => {
    const inventory: InventoryItemInstance[] = [{
      instanceId: 'tonic_1',
      definitionId: 'consumable_minor_tonic',
      quantity: 1,
      rarity: 'common',
      locked: false,
      favorite: false,
      acquiredAt: '2026-08-10T12:05:00.000Z',
    }]
    const battle = createBattle(makeSave(), firstEncounter, content, 'battle_item')
    battle.combatants.combatant_player.hp = 10
    const result = submitBattleCommand(
      battle,
      { type: 'item', itemInstanceId: 'tonic_1', targetId: 'combatant_player' },
      content,
      inventory,
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.combatants.combatant_player.hp).toBe(16)
    expect(result.value.log.some((entry) => entry.message.includes('recupera 8'))).toBe(true)
    expect(result.value.consumedItemInstanceIds).toContain('tonic_1')
    expect(inventory).toHaveLength(1)
  })

  it('IA usa Esporos Nocivos no segundo turno de combate', () => {
    let battle = createBattle(
      makeSave(),
      content.encounters.encounter_spore_ambush_01,
      content,
      'battle_status',
    )
    const crawler = 'combatant_enemy_fungorro_crawler_1'
    const first = submitBattleCommand(battle, { type: 'attack', targetId: crawler }, content)
    expect(first.ok).toBe(true)
    if (!first.ok) return
    battle = first.value
    const second = submitBattleCommand(battle, { type: 'attack', targetId: crawler }, content)
    expect(second.ok).toBe(true)
    if (!second.ok) return
    expect(second.value.combatants.combatant_player.statusEffects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ definitionId: 'status_spore_poison' }),
      ]),
    )
  })

  it('ação inválida não altera o estado', () => {
    const battle = createBattle(makeSave(), firstEncounter, content)
    battle.phase = 'ResolvingAction'
    const before = structuredClone(battle)
    const result = submitBattleCommand(battle, { type: 'defend' }, content)
    expect(result.ok).toBe(false)
    expect(battle).toEqual(before)
  })
})
