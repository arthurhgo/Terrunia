import type { ContentCatalog } from '../../content/catalog'
import { BALANCE } from '../../content/balance'
import type { EnemyDefinition } from '../../content/types'
import type { GameSave } from '../game/types'
import { fail, ok, type Result } from '../shared/types'
import { getFlatStatBonus } from '../skillTree/skillTree'
import type { BattleCommand, BattleLogEntry, BattlePhase, BattleState, Combatant } from './types'

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

export const calculateDamage = (attackPower: number, mitigation: number) =>
  Math.max(1, Math.floor(attackPower) - Math.max(0, Math.floor(mitigation)))

const derivePlayerCombatant = (save: GameSave, catalog: ContentCatalog): Combatant => {
  const character = save.character
  const weaponId = character.bondedEquipment.weapon
  const boundWeapon = weaponId ? save.boundItems[weaponId] : null
  const weaponBase = boundWeapon ? catalog.boundItemBases[boundWeapon.baseItemId] : null
  const attackPower =
    Math.floor(character.attributes.strength.die / 2) +
    (weaponBase?.basePower ?? 1) +
    getFlatStatBonus(save, catalog, 'attackPower')
  const maxHp =
    character.attributes.vigor.die * 2 + 8 + getFlatStatBonus(save, catalog, 'maxHp')

  return {
    id: 'combatant_player',
    definitionId: character.id,
    name: character.name,
    side: 'player',
    hp: maxHp,
    maxHp,
    attackPower,
    mitigation: Math.floor(character.attributes.vigor.die / 4) + getFlatStatBonus(save, catalog, 'mitigation'),
    initiative: character.attributes.agility.die + getFlatStatBonus(save, catalog, 'initiative'),
    alive: true,
    defending: false,
    statusIds: [],
  }
}

const deriveEnemyCombatant = (enemy: EnemyDefinition): Combatant => ({
  id: `combatant_${enemy.id}`,
  definitionId: enemy.id,
  name: enemy.name,
  side: 'enemy',
  hp: enemy.maxHp,
  maxHp: enemy.maxHp,
  attackPower: enemy.attackPower,
  mitigation: enemy.mitigation,
  initiative: Math.max(1, enemy.level + 3),
  alive: true,
  defending: false,
  statusIds: [],
})

export const createBattle = (
  save: GameSave,
  enemy: EnemyDefinition,
  catalog: ContentCatalog,
  encounterId = 'encounter_fungorro_01',
  id: string = crypto.randomUUID(),
): BattleState => {
  const player = derivePlayerCombatant(save, catalog)
  const enemyCombatant = deriveEnemyCombatant(enemy)
  const initiativeOrder = [player, enemyCombatant]
    .sort((a, b) => b.initiative - a.initiative || a.id.localeCompare(b.id))
    .map((combatant) => combatant.id)

  const state: BattleState = {
    id,
    encounterId,
    phase: 'Initializing',
    phaseHistory: ['Initializing'],
    round: 1,
    actorId: player.id,
    initiativeOrder,
    combatants: {
      [player.id]: player,
      [enemyCombatant.id]: enemyCombatant,
    },
    log: [],
    rewards: {
      characterXp: enemy.xpReward,
      gold: enemy.goldReward,
      lootDefinitionIds: enemy.lootDefinitionIds,
      boundResonance: enemy.boundResonanceReward,
    },
    claimed: false,
    rngSeed: 104729,
  }

  addLog(state, `${enemy.name} bloqueia a rota de Astravél.`, 'system')
  addPhase(state, 'TurnStart')
  addPhase(state, 'AwaitingAction')
  return state
}

const resolveAttack = (state: BattleState, actor: Combatant, target: Combatant) => {
  addPhase(state, 'SelectingTarget')
  addPhase(state, 'ResolvingAction')
  const defenseBonus = target.defending ? BALANCE.defendMitigation : 0
  const damage = calculateDamage(actor.attackPower, target.mitigation + defenseBonus)
  target.hp = Math.max(0, target.hp - damage)
  target.alive = target.hp > 0
  target.defending = false
  addLog(state, `${actor.name} causa ${damage} de dano em ${target.name}.`, 'damage')
  addPhase(state, 'ResolvingReactions')
  addPhase(state, 'ApplyingStatuses')
  addPhase(state, 'CheckEndConditions')
}

const resolveEnemyTurn = (state: BattleState) => {
  const player = Object.values(state.combatants).find((combatant) => combatant.side === 'player')
  const enemy = Object.values(state.combatants).find(
    (combatant) => combatant.side === 'enemy' && combatant.alive,
  )
  if (!player || !enemy || !player.alive) return

  addPhase(state, 'TurnStart')
  state.actorId = enemy.id
  resolveAttack(state, enemy, player)
  if (!player.alive) {
    addLog(state, `${player.name} não consegue prosseguir.`, 'system')
    addPhase(state, 'Defeat')
    return
  }
  addPhase(state, 'TurnEnd')
  state.round += 1
  state.actorId = player.id
  addPhase(state, 'TurnStart')
  addPhase(state, 'AwaitingAction')
}

export const submitBattleCommand = (
  battle: BattleState,
  command: BattleCommand,
): Result<BattleState> => {
  if (battle.phase !== 'AwaitingAction') {
    return fail('INVALID_BATTLE_PHASE', 'A batalha não está aguardando uma ação do jogador.')
  }

  const state = structuredClone(battle)
  const player = state.combatants[state.actorId]
  if (!player || player.side !== 'player' || !player.alive) {
    return fail('INVALID_ACTOR', 'O ator atual não pode executar comandos do jogador.')
  }

  if (command.type === 'flee') {
    return fail('FLEE_LOCKED', 'Fuga indisponível neste encontro de introdução.')
  }
  if (command.type === 'skill') {
    return fail('SKILL_LOCKED', 'Nenhuma habilidade ativa foi desbloqueada.')
  }
  if (command.type === 'item') {
    return fail('ITEM_UNAVAILABLE', 'Nenhum consumível aplicável está disponível.')
  }

  if (command.type === 'defend') {
    addPhase(state, 'ResolvingAction')
    player.defending = true
    addLog(state, `${player.name} assume uma postura defensiva.`, 'defense')
    addPhase(state, 'ResolvingReactions')
    addPhase(state, 'ApplyingStatuses')
    addPhase(state, 'CheckEndConditions')
  } else {
    const target = state.combatants[command.targetId]
    if (!target || target.side !== 'enemy' || !target.alive) {
      return fail('INVALID_TARGET', 'Escolha um alvo inimigo válido.')
    }
    resolveAttack(state, player, target)
  }

  const livingEnemies = Object.values(state.combatants).filter(
    (combatant) => combatant.side === 'enemy' && combatant.alive,
  )
  if (livingEnemies.length === 0) {
    addLog(state, 'A presença Fungorra recua. As recompensas foram preservadas.', 'reward')
    addPhase(state, 'Victory')
    return ok(state)
  }

  addPhase(state, 'TurnEnd')
  resolveEnemyTurn(state)
  return ok(state)
}
