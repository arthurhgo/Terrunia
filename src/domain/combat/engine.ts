import type { ContentCatalog } from '../../content/catalog'
import { BALANCE } from '../../content/balance'
import type {
  CombatEffectDefinition,
  CombatSkillDefinition,
  EncounterDefinition,
  ItemDefinition,
} from '../../content/types'
import type { GameSave, InventoryItemInstance } from '../game/types'
import { fail, ok, type Result } from '../shared/types'
import { collectUnlockedEffects, getFlatStatBonus } from '../skillTree/skillTree'
import type {
  BattleCommand,
  BattleLogEntry,
  BattlePhase,
  BattleState,
  Combatant,
} from './types'

const addPhase = (state: BattleState, phase: BattlePhase) => {
  state.phase = phase
  state.phaseHistory.push(phase)
}

const addLog = (
  state: BattleState,
  message: string,
  tone: BattleLogEntry['tone'] = 'neutral',
) => {
  state.log.push({
    id: `${state.id}_log_${state.log.length + 1}`,
    round: state.round,
    message,
    tone,
  })
}

const rollChance = (state: BattleState, chance: number) => {
  state.rngSeed = (state.rngSeed * 48271) % 2147483647
  return state.rngSeed / 2147483647 <= chance
}

const getStatusModifier = (
  combatant: Combatant,
  catalog: ContentCatalog,
  key: 'attackModifier' | 'mitigationModifier',
) =>
  combatant.statusEffects.reduce(
    (total, active) => total + (catalog.statusEffects[active.definitionId]?.[key] ?? 0),
    0,
  )

export const getEffectiveAttackPower = (combatant: Combatant, catalog: ContentCatalog) =>
  Math.max(0, combatant.attackPower + getStatusModifier(combatant, catalog, 'attackModifier'))

export const getEffectiveMitigation = (combatant: Combatant, catalog: ContentCatalog) =>
  Math.max(0, combatant.mitigation + getStatusModifier(combatant, catalog, 'mitigationModifier'))

export const calculateDamage = (attackPower: number, mitigation: number) =>
  Math.max(1, Math.floor(attackPower) - Math.max(0, Math.floor(mitigation)))

const derivePlayerCombatant = (save: GameSave, catalog: ContentCatalog): Combatant => {
  const character = save.character
  const weaponId = character.bondedEquipment.weapon
  const boundWeapon = weaponId ? save.boundItems[weaponId] : null
  const weaponBase = boundWeapon ? catalog.boundItemBases[boundWeapon.baseItemId] : null
  const unlockedSkillIds = collectUnlockedEffects(save, catalog)
    .filter((effect): effect is Extract<typeof effect, { type: 'unlockSkill' }> => effect.type === 'unlockSkill')
    .map((effect) => effect.skillId)
  const maxHp =
    BALANCE.baseHp +
    character.attributes.vigor.die * BALANCE.vigorHpMultiplier +
    getFlatStatBonus(save, catalog, 'maxHp')
  const maxMp =
    BALANCE.baseMana + character.attributes.spirit.die * BALANCE.spiritManaMultiplier

  return {
    id: 'combatant_player',
    definitionId: character.id,
    name: character.name,
    side: 'player',
    hp: maxHp,
    maxHp,
    mp: maxMp,
    maxMp,
    attackPower:
      Math.floor(character.attributes.strength.die / 2) +
      (weaponBase?.basePower ?? 1) +
      getFlatStatBonus(save, catalog, 'attackPower'),
    mitigation:
      Math.floor(character.attributes.vigor.die / 4) +
      getFlatStatBonus(save, catalog, 'mitigation'),
    initiative:
      character.attributes.agility.die + getFlatStatBonus(save, catalog, 'initiative'),
    alive: true,
    defending: false,
    skillIds: [...new Set(unlockedSkillIds)],
    statusEffects: [],
  }
}

const deriveEnemyCombatant = (
  definitionId: string,
  index: number,
  catalog: ContentCatalog,
): Combatant => {
  const enemy = catalog.enemies[definitionId]
  if (!enemy) throw new Error(`Inimigo não cadastrado: ${definitionId}`)
  return {
    id: `combatant_${enemy.id}_${index + 1}`,
    definitionId: enemy.id,
    name: enemy.name,
    side: 'enemy',
    hp: enemy.maxHp,
    maxHp: enemy.maxHp,
    mp: 0,
    maxMp: 0,
    attackPower: enemy.attackPower,
    mitigation: enemy.mitigation,
    initiative: Math.max(1, enemy.level + 3),
    alive: true,
    defending: false,
    skillIds: enemy.skillIds,
    statusEffects: [],
    aiSkillEveryRounds: enemy.aiSkillEveryRounds,
  }
}

const validTarget = (actor: Combatant, target: Combatant, targetType: 'enemy' | 'self') =>
  target.alive && (targetType === 'self' ? target.id === actor.id : target.side !== actor.side)

const applyStatus = (
  state: BattleState,
  actor: Combatant,
  target: Combatant,
  effect: Extract<CombatEffectDefinition, { type: 'applyStatus' }>,
  catalog: ContentCatalog,
) => {
  const definition = catalog.statusEffects[effect.statusId]
  if (!definition || !rollChance(state, effect.chance)) return
  const current = target.statusEffects.find((status) => status.definitionId === definition.id)
  if (current) {
    current.remainingTurns = Math.max(current.remainingTurns, effect.durationTurns)
    current.sourceId = actor.id
  } else {
    target.statusEffects.push({
      definitionId: definition.id,
      sourceId: actor.id,
      remainingTurns: effect.durationTurns,
    })
  }
  addLog(state, `${target.name} recebe ${definition.name} por ${effect.durationTurns} turnos.`, 'system')
}

const applyCombatEffects = (
  state: BattleState,
  actor: Combatant,
  target: Combatant,
  effects: CombatEffectDefinition[],
  catalog: ContentCatalog,
) => {
  for (const effect of effects) {
    if (effect.type === 'damage') {
      const defenseBonus = target.defending ? BALANCE.defendMitigation : 0
      const damage = calculateDamage(
        getEffectiveAttackPower(actor, catalog) + effect.powerBonus,
        getEffectiveMitigation(target, catalog) + defenseBonus,
      )
      target.hp = Math.max(0, target.hp - damage)
      target.alive = target.hp > 0
      target.defending = false
      addLog(state, `${actor.name} causa ${damage} de dano em ${target.name}.`, 'damage')
    }
    if (effect.type === 'restoreHp') {
      const restored = Math.min(effect.value, target.maxHp - target.hp)
      target.hp += restored
      addLog(state, `${target.name} recupera ${restored} de Vida.`, 'reward')
    }
    if (effect.type === 'applyStatus' && target.alive) {
      applyStatus(state, actor, target, effect, catalog)
    }
  }
}

const resolveAttack = (
  state: BattleState,
  actor: Combatant,
  target: Combatant,
  catalog: ContentCatalog,
) => {
  addPhase(state, 'SelectingTarget')
  addPhase(state, 'ResolvingAction')
  applyCombatEffects(state, actor, target, [{ type: 'damage', powerBonus: 0 }], catalog)
  addPhase(state, 'ResolvingReactions')
  addPhase(state, 'ApplyingStatuses')
  addPhase(state, 'CheckEndConditions')
}

const resolveSkill = (
  state: BattleState,
  actor: Combatant,
  target: Combatant,
  skill: CombatSkillDefinition,
  catalog: ContentCatalog,
) => {
  addPhase(state, 'SelectingTarget')
  addPhase(state, 'ResolvingAction')
  actor.mp -= skill.mpCost
  addLog(state, `${actor.name} usa ${skill.name}.`, 'system')
  applyCombatEffects(state, actor, target, skill.effects, catalog)
  addPhase(state, 'ResolvingReactions')
  addPhase(state, 'ApplyingStatuses')
  addPhase(state, 'CheckEndConditions')
}

const resolveItem = (
  state: BattleState,
  actor: Combatant,
  target: Combatant,
  item: ItemDefinition,
  catalog: ContentCatalog,
) => {
  addPhase(state, 'SelectingTarget')
  addPhase(state, 'ResolvingAction')
  addLog(state, `${actor.name} usa ${item.name}.`, 'system')
  applyCombatEffects(state, actor, target, item.combatEffects, catalog)
  addPhase(state, 'ResolvingReactions')
  addPhase(state, 'ApplyingStatuses')
  addPhase(state, 'CheckEndConditions')
}

const applyStartStatuses = (
  state: BattleState,
  actor: Combatant,
  catalog: ContentCatalog,
) => {
  addPhase(state, 'ApplyingStatuses')
  for (const active of actor.statusEffects) {
    const definition = catalog.statusEffects[active.definitionId]
    if (!definition || definition.startTurnDamage <= 0) continue
    actor.hp = Math.max(0, actor.hp - definition.startTurnDamage)
    actor.alive = actor.hp > 0
    addLog(
      state,
      `${definition.name} causa ${definition.startTurnDamage} de dano em ${actor.name}.`,
      'damage',
    )
  }
}

const tickStatuses = (actor: Combatant) => {
  actor.statusEffects = actor.statusEffects
    .map((active) => ({ ...active, remainingTurns: active.remainingTurns - 1 }))
    .filter((active) => active.remainingTurns > 0)
}

const checkBattleEnd = (state: BattleState) => {
  const player = Object.values(state.combatants).find((combatant) => combatant.side === 'player')
  if (!player?.alive) {
    addLog(state, `${player?.name ?? 'O Terrírian'} não consegue prosseguir.`, 'system')
    addPhase(state, 'Defeat')
    return true
  }
  const livingEnemies = Object.values(state.combatants).filter(
    (combatant) => combatant.side === 'enemy' && combatant.alive,
  )
  if (livingEnemies.length === 0) {
    addLog(state, 'A presença Fungorra recua. As recompensas foram preservadas.', 'reward')
    addPhase(state, 'Victory')
    return true
  }
  return false
}

const resolveEnemyAction = (
  state: BattleState,
  actor: Combatant,
  catalog: ContentCatalog,
) => {
  const player = Object.values(state.combatants).find(
    (combatant) => combatant.side === 'player' && combatant.alive,
  )
  if (!player) return
  const skillId =
    actor.aiSkillEveryRounds && state.round % actor.aiSkillEveryRounds === 0
      ? actor.skillIds[0]
      : undefined
  const skill = skillId ? catalog.combatSkills[skillId] : undefined
  if (skill && actor.mp >= skill.mpCost && validTarget(actor, player, skill.target)) {
    resolveSkill(state, actor, player, skill, catalog)
  } else {
    resolveAttack(state, actor, player, catalog)
  }
}

const advanceUntilPlayer = (state: BattleState, catalog: ContentCatalog) => {
  const current = state.combatants[state.actorId]
  if (current) tickStatuses(current)
  addPhase(state, 'TurnEnd')

  for (let attempts = 0; attempts < state.initiativeOrder.length * 2; attempts += 1) {
    const previousCursor = state.actorCursor
    state.actorCursor = (state.actorCursor + 1) % state.initiativeOrder.length
    if (state.actorCursor <= previousCursor) state.round += 1
    state.actorId = state.initiativeOrder[state.actorCursor]
    const actor = state.combatants[state.actorId]
    if (!actor?.alive) continue

    addPhase(state, 'TurnStart')
    applyStartStatuses(state, actor, catalog)
    addPhase(state, 'CheckEndConditions')
    if (checkBattleEnd(state)) return

    if (actor.side === 'player') {
      addPhase(state, 'AwaitingAction')
      return
    }

    resolveEnemyAction(state, actor, catalog)
    if (checkBattleEnd(state)) return
    tickStatuses(actor)
    addPhase(state, 'TurnEnd')
  }
}

export const createBattle = (
  save: GameSave,
  encounter: EncounterDefinition,
  catalog: ContentCatalog,
  id: string = crypto.randomUUID(),
): BattleState => {
  const player = derivePlayerCombatant(save, catalog)
  const enemies = encounter.enemyDefinitionIds.map((definitionId, index) =>
    deriveEnemyCombatant(definitionId, index, catalog),
  )
  const combatants = [player, ...enemies]
  const initiativeOrder = combatants
    .sort((a, b) => b.initiative - a.initiative || a.id.localeCompare(b.id))
    .map((combatant) => combatant.id)
  const actorId = initiativeOrder[0]

  const state: BattleState = {
    id,
    encounterId: encounter.id,
    trailNodeId: encounter.trailNodeId,
    phase: 'Initializing',
    phaseHistory: ['Initializing'],
    round: 1,
    actorId,
    actorCursor: 0,
    initiativeOrder,
    combatants: Object.fromEntries(combatants.map((combatant) => [combatant.id, combatant])),
    log: [],
    rewards: structuredClone(encounter.rewards),
    claimed: false,
    canFlee: encounter.canFlee,
    consumedItemInstanceIds: [],
    rngSeed: 104729,
  }

  addLog(state, `${encounter.name} bloqueia o avanço em Astravél.`, 'system')
  const actor = state.combatants[state.actorId]
  addPhase(state, 'TurnStart')
  applyStartStatuses(state, actor, catalog)
  if (actor.side === 'player') {
    addPhase(state, 'AwaitingAction')
  } else {
    resolveEnemyAction(state, actor, catalog)
    if (!checkBattleEnd(state)) advanceUntilPlayer(state, catalog)
  }
  return state
}

const findInventoryItem = (
  inventory: InventoryItemInstance[],
  itemInstanceId: string,
  catalog: ContentCatalog,
) => {
  const instance = inventory.find((item) => item.instanceId === itemInstanceId)
  const definition = instance ? catalog.items[instance.definitionId] : undefined
  return { instance, definition }
}

export const submitBattleCommand = (
  battle: BattleState,
  command: BattleCommand,
  catalog: ContentCatalog,
  inventory: InventoryItemInstance[] = [],
): Result<BattleState> => {
  if (battle.phase !== 'AwaitingAction') {
    return fail('INVALID_BATTLE_PHASE', 'A batalha não está aguardando uma ação do jogador.')
  }

  const currentPlayer = battle.combatants[battle.actorId]
  if (!currentPlayer || currentPlayer.side !== 'player' || !currentPlayer.alive) {
    return fail('INVALID_ACTOR', 'O ator atual não pode executar comandos do jogador.')
  }

  if (command.type === 'flee') {
    return fail(
      battle.canFlee ? 'FLEE_NOT_IMPLEMENTED' : 'FLEE_LOCKED',
      battle.canFlee
        ? 'A resolução de fuga permanece indisponível neste build.'
        : 'Fuga indisponível neste encontro.',
    )
  }

  let target: Combatant | undefined
  let skill: CombatSkillDefinition | undefined
  let item: ItemDefinition | undefined

  if (command.type === 'attack') {
    target = battle.combatants[command.targetId]
    if (!target || !validTarget(currentPlayer, target, 'enemy')) {
      return fail('INVALID_TARGET', 'Escolha um alvo inimigo válido.')
    }
  }

  if (command.type === 'skill') {
    skill = catalog.combatSkills[command.skillId]
    target = battle.combatants[command.targetId]
    if (!skill || !currentPlayer.skillIds.includes(command.skillId)) {
      return fail('SKILL_LOCKED', 'Esta habilidade ainda não foi desbloqueada pelo Vínculo.')
    }
    if (currentPlayer.mp < skill.mpCost) {
      return fail('INSUFFICIENT_MP', 'Mana insuficiente para esta habilidade.')
    }
    if (!target || !validTarget(currentPlayer, target, skill.target)) {
      return fail('INVALID_TARGET', 'Escolha um alvo válido para a habilidade.')
    }
  }

  if (command.type === 'item') {
    const lookup = findInventoryItem(inventory, command.itemInstanceId, catalog)
    target = battle.combatants[command.targetId]
    item = lookup.definition
    if (
      !lookup.instance ||
      !item ||
      item.category !== 'consumable' ||
      item.combatEffects.length === 0 ||
      battle.consumedItemInstanceIds.includes(command.itemInstanceId)
    ) {
      return fail('ITEM_UNAVAILABLE', 'Este consumível não está disponível para uso em combate.')
    }
    if (!target || !validTarget(currentPlayer, target, 'self')) {
      return fail('INVALID_TARGET', 'O consumível deve ser usado no Terrírian ativo.')
    }
  }

  const state = structuredClone(battle)
  const player = state.combatants[state.actorId]
  const resolvedTarget = target ? state.combatants[target.id] : undefined

  if (command.type === 'defend') {
    addPhase(state, 'ResolvingAction')
    player.defending = true
    addLog(state, `${player.name} assume uma postura defensiva.`, 'defense')
    addPhase(state, 'ResolvingReactions')
    addPhase(state, 'ApplyingStatuses')
    addPhase(state, 'CheckEndConditions')
  }
  if (command.type === 'attack' && resolvedTarget) {
    resolveAttack(state, player, resolvedTarget, catalog)
  }
  if (command.type === 'skill' && resolvedTarget && skill) {
    resolveSkill(state, player, resolvedTarget, skill, catalog)
  }
  if (command.type === 'item' && resolvedTarget && item) {
    resolveItem(state, player, resolvedTarget, item, catalog)
    state.consumedItemInstanceIds.push(command.itemInstanceId)
  }

  if (checkBattleEnd(state)) return ok(state)
  advanceUntilPlayer(state, catalog)
  return ok(state)
}
