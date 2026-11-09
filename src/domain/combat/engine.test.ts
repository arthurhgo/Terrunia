import { describe, expect, it } from 'vitest'
import { content } from '../../content/catalog'
import type { InventoryItemInstance } from '../game/types'
import { bindPrologueWeapon, createNewSave } from '../game/createSave'
import { calculateDamage, calculateRolledDamage, createBattle, seedFromBattleId, submitBattleCommand } from './engine'

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

  it('não inclui IA indefinida no Fungorro Rastejante ao montar a batalha', () => {
    const battle = createBattle(makeSave(), firstEncounter, content, 'battle_firestore_safe')
    expect(battle.combatants[firstTargetId]).not.toHaveProperty('aiSkillEveryRounds')
    const sporeBattle = createBattle(makeSave(), content.encounters.encounter_spore_ambush_01, content)
    const sower = Object.values(sporeBattle.combatants).find(
      (combatant) => combatant.definitionId === 'enemy_spore_sower',
    )
    expect(sower?.aiSkillEveryRounds).toBe(2)
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
    // A real enemy reaction may occur after the tonic. Verify healing without
    // assuming a fixed enemy die face or ignoring the maximum-HP cap.
    expect(result.value.combatants.combatant_player.hp).toBeGreaterThan(10)
    expect(result.value.combatants.combatant_player.hp)
      .toBeLessThanOrEqual(battle.combatants.combatant_player.maxHp)
    expect(result.value.log.some((entry) => entry.message.includes('recupera 8'))).toBe(true)
    expect(result.value.consumedItemInstanceIds).toContain('tonic_1')
    expect(inventory).toHaveLength(1)
  })

  it('permite escolher Éter ou Antídoto conforme recurso e estados atuais', () => {
    const inventory: InventoryItemInstance[] = [
      { instanceId: 'ether_1', definitionId: 'consumable_simple_ether', quantity: 1, rarity: 'common', locked: false, favorite: false, acquiredAt: '2026-10-29T10:00:00Z' },
      { instanceId: 'antidote_1', definitionId: 'consumable_antidote', quantity: 1, rarity: 'common', locked: false, favorite: false, acquiredAt: '2026-10-29T10:00:00Z' },
    ]
    let battle = createBattle(makeSave(), firstEncounter, content)
    battle.combatants.combatant_player.mp = 1
    battle.combatants.combatant_player.statusEffects.push({ definitionId: 'status_spore_poison', sourceId: 'enemy', remainingTurns: 6 })
    const ether = submitBattleCommand(battle, { type: 'item', itemInstanceId: 'ether_1', targetId: 'combatant_player' }, content, inventory)
    expect(ether.ok).toBe(true)
    if (!ether.ok) return
    expect(ether.value.combatants.combatant_player.mp).toBeGreaterThan(1)
    battle = ether.value
    const antidote = submitBattleCommand(battle, { type: 'item', itemInstanceId: 'antidote_1', targetId: 'combatant_player' }, content, inventory)
    expect(antidote.ok).toBe(true)
    if (!antidote.ok) return
    expect(antidote.value.combatants.combatant_player.statusEffects.some((effect) => effect.definitionId === 'status_spore_poison')).toBe(false)
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

  it('carrega o novo totem arcano como chefe data-driven com recompensa de Vínculo', () => {
    const battle = createBattle(
      makeSave(),
      content.encounters.encounter_fungal_core_sentinel,
      content,
      'battle_boss',
    )
    const bossId = 'combatant_enemy_ruin_corrupted_sentinel_1'
    expect(battle.combatants[bossId]).toMatchObject({
      name: 'Sentinela Corrompida · Núcleo da Ruína',
      maxHp: 42,
    })
    expect(battle.rewards).toMatchObject({
      boundResonance: 256,
      lootDefinitionIds: [
        'fragment_mycelial_essence',
        'item_gem_esmeralda_crescimento',
      ],
      worldFlags: ['colossus_mycelium_defeated', 'fungal_chambers_first_clear', 'astravel_route_cleared'],
    })

    battle.combatants.combatant_player.attackPower = 99
    const result = submitBattleCommand(
      battle,
      { type: 'attack', targetId: bossId },
      content,
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.phase).toBe('Victory')
  })

  it('aguarda comando manual e resolve iniciativa real determinística para todos', () => {
    const battle = createBattle(makeSave(), firstEncounter, content, 'battle_manual_initiative', { manualInitiative: true })
    expect(battle.phase).toBe('AwaitingInitiative')
    expect(battle.log.some((entry) => entry.roll)).toBe(false)
    const base = Object.fromEntries(Object.values(battle.combatants).map((actor) => [actor.id, actor.initiative]))
    const rolled = submitBattleCommand(battle, { type: 'rollInitiative' }, content)
    expect(rolled.ok).toBe(true)
    if (!rolled.ok) return
    const results = rolled.value.log.filter((entry) => entry.roll?.action === 'Iniciativa')
    expect(results).toHaveLength(Object.keys(battle.combatants).length)
    expect(results.some((entry) => entry.roll?.actorId === 'combatant_player')).toBe(true)
    expect(results[0].roll?.actorId).toBe('combatant_player')
    for (const entry of results) {
      const roll = entry.roll!
      expect(roll.face).toBeGreaterThanOrEqual(1)
      expect(roll.face).toBeLessThanOrEqual(roll.sides)
      expect(rolled.value.combatants[roll.actorId].initiative).toBe(base[roll.actorId] + roll.face)
    }
    expect(rolled.value.initiativeOrder.map((id) => rolled.value.combatants[id].initiative))
      .toEqual([...rolled.value.initiativeOrder.map((id) => rolled.value.combatants[id].initiative)].sort((a, b) => b - a))
    expect(battle.phase).toBe('AwaitingInitiative')
    expect(submitBattleCommand(rolled.value, { type: 'rollInitiative' }, content))
      .toMatchObject({ ok: false, code: 'INITIATIVE_ALREADY_ROLLED' })
  })

  it('registra rolagens reais do jogador e dos monstros no log', () => {
    const battle = createBattle(makeSave(), firstEncounter, content, 'battle_real_dice')
    const result = submitBattleCommand(battle, { type: 'attack', targetId: firstTargetId }, content)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const damageEntries = result.value.log.filter((entry) => entry.tone === 'damage' && entry.roll)
    expect(damageEntries.length).toBeGreaterThanOrEqual(2)
    expect(damageEntries.some((entry) => entry.roll?.actorId === 'combatant_player')).toBe(true)
    expect(damageEntries.some((entry) => entry.roll?.actorId !== 'combatant_player')).toBe(true)
    for (const entry of damageEntries) {
      expect(entry.roll!.face).toBeGreaterThanOrEqual(1)
      expect(entry.roll!.face).toBeLessThanOrEqual(entry.roll!.sides)
    }
  })

  it('ação inválida não altera o estado', () => {
    const battle = createBattle(makeSave(), firstEncounter, content)
    battle.phase = 'ResolvingAction'
    const before = structuredClone(battle)
    const result = submitBattleCommand(battle, { type: 'defend' }, content)
    expect(result.ok).toBe(false)
    expect(battle).toEqual(before)
  })
  it('arremessáveis atingem inimigos e runas de campo respeitam alvo, sem trocar o Vínculo', () => {
    const supplies: InventoryItemInstance[] = [
      { instanceId: 'throw-1', definitionId: 'consumable_resonance_flask', quantity: 1, rarity: 'common', locked: false, favorite: false, acquiredAt: '2026-10-29T22:00:00Z' },
      { instanceId: 'rune-1', definitionId: 'consumable_field_rune', quantity: 1, rarity: 'uncommon', locked: false, favorite: false, acquiredAt: '2026-10-29T22:00:00Z' },
    ]
    const battle = createBattle(makeSave(), firstEncounter, content)
    battle.combatants[firstTargetId].hp = 40
    battle.combatants[firstTargetId].maxHp = 40
    const wrong = submitBattleCommand(battle, { type: 'item', itemInstanceId: 'throw-1', targetId: 'combatant_player' }, content, supplies)
    expect(wrong.ok).toBe(false)
    const thrown = submitBattleCommand(battle, { type: 'item', itemInstanceId: 'throw-1', targetId: firstTargetId }, content, supplies)
    expect(thrown.ok).toBe(true)
    if (!thrown.ok) return
    expect(thrown.value.combatants[firstTargetId].hp).toBeLessThan(40)
    expect(thrown.value.consumedItemInstanceIds).toContain('throw-1')
    const guarded = submitBattleCommand(thrown.value, { type: 'item', itemInstanceId: 'rune-1', targetId: 'combatant_player' }, content, supplies)
    expect(guarded.ok).toBe(true)
    if (!guarded.ok) return
    expect(guarded.value.combatants.combatant_player.statusEffects.some((effect) => effect.definitionId === 'status_rune_ward')).toBe(true)
  })

  it('face real muda o dano e a guarda registra quanto foi evitado', () => {
    const low = calculateRolledDamage(12, 3, 1, 4)
    const high = calculateRolledDamage(12, 3, 4, 4)
    expect(high.finalDamage).toBeGreaterThan(low.finalDamage)
    expect(high.dieAdjustment - low.dieAdjustment).toBe(3)
    const defended = calculateRolledDamage(12, 3, 4, 4, 2, 2)
    expect(defended.finalDamage).toBe(high.finalDamage)
    expect(defended.guardPrevented).toBe(2)

    const first = createBattle(makeSave(), firstEncounter, content, 'roll_reproducible')
    const a = submitBattleCommand(first, { type: 'attack', targetId: firstTargetId }, content)
    const b = submitBattleCommand(first, { type: 'attack', targetId: firstTargetId }, content)
    expect(a).toEqual(b)
    if (!a.ok) return
    const damage = a.value.log.find((entry) => entry.roll?.actorId === 'combatant_player' && entry.roll.damageBreakdown)
    expect(damage?.roll?.damageBreakdown?.finalDamage).toBeGreaterThan(0)
    expect(damage?.message).toContain(`d${damage?.roll?.sides}=${damage?.roll?.face}`)
  })

  it('bloqueia habilidade durante cooldown sem consumir Mana nem turno na rejeição', () => {
    const save = makeSave()
    save.boundItems.bound_1.skillTree.unlockedNodeIds.push('weapon_bond_core')
    const battle = createBattle(save, firstEncounter, content, 'cooldown_test')
    const enemy = battle.combatants[firstTargetId]
    enemy.maxHp = enemy.hp = 300
    battle.combatants.combatant_player.maxHp = battle.combatants.combatant_player.hp = 300
    battle.combatants.combatant_player.maxMp = battle.combatants.combatant_player.mp = 30
    const skill = { type: 'skill' as const, skillId: 'skill_resonant_strike', targetId: firstTargetId }
    const first = submitBattleCommand(battle, skill, content)
    expect(first.ok).toBe(true)
    if (!first.ok) return
    expect(first.value.combatants.combatant_player.skillCooldowns?.[skill.skillId]).toBe(2)
    const frozen = structuredClone(first.value)
    expect(submitBattleCommand(first.value, skill, content)).toMatchObject({ ok: false, code: 'SKILL_COOLDOWN' })
    expect(first.value).toEqual(frozen)
    const one = submitBattleCommand(first.value, { type: 'attack', targetId: firstTargetId }, content)
    expect(one.ok).toBe(true)
    if (!one.ok) return
    expect(one.value.combatants.combatant_player.skillCooldowns?.[skill.skillId]).toBe(1)
    const two = submitBattleCommand(one.value, { type: 'attack', targetId: firstTargetId }, content)
    expect(two.ok).toBe(true)
    if (!two.ok) return
    expect(two.value.combatants.combatant_player.skillCooldowns?.[skill.skillId] ?? 0).toBe(0)
    expect(submitBattleCommand(two.value, skill, content).ok).toBe(true)
  })

  it('cada batalha recebe semente própria, estável no save e diferente entre IDs', () => {
    expect(seedFromBattleId('roll-A')).not.toBe(seedFromBattleId('roll-B'))
    const first = createBattle(makeSave(), firstEncounter, content, 'roll-A', { manualInitiative: true })
    const second = createBattle(makeSave(), firstEncounter, content, 'roll-B', { manualInitiative: true })
    expect(first.rngSeed).not.toBe(second.rngSeed)
    const a = submitBattleCommand(first, { type: 'rollInitiative' }, content)
    const replay = submitBattleCommand(structuredClone(first), { type: 'rollInitiative' }, content)
    expect(a).toEqual(replay)
  })

  it('o registro do dano identifica o alvo real da rolagem', () => {
    const battle = createBattle(makeSave(), firstEncounter, content, 'target-roll')
    const result = submitBattleCommand(battle, { type: 'attack', targetId: firstTargetId }, content)
    if (!result.ok) throw Error(result.message)
    const hit = result.value.log.find((entry) => entry.roll?.targetId === firstTargetId)
    expect(hit?.roll?.damageBreakdown?.finalDamage).toBeGreaterThan(0)
  })

})
