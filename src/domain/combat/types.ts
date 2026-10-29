export type BattlePhase =
  | 'Initializing'
  | 'TurnStart'
  | 'AwaitingAction'
  | 'SelectingTarget'
  | 'ResolvingAction'
  | 'ResolvingReactions'
  | 'ApplyingStatuses'
  | 'CheckEndConditions'
  | 'TurnEnd'
  | 'Victory'
  | 'Defeat'

export type CombatantSide = 'player' | 'enemy'

export type ActiveStatus = {
  definitionId: string
  sourceId: string
  remainingTurns: number
}

export type Combatant = {
  id: string
  definitionId: string
  name: string
  side: CombatantSide
  hp: number
  maxHp: number
  mp: number
  maxMp: number
  attackPower: number
  mitigation: number
  initiative: number
  alive: boolean
  defending: boolean
  skillIds: string[]
  statusEffects: ActiveStatus[]
  aiSkillEveryRounds?: number
}

export type BattleLogEntry = {
  id: string
  round: number
  message: string
  tone: 'neutral' | 'damage' | 'defense' | 'reward' | 'system'
  event?: BattlePresentationEvent
}

/**
 * Structured facts emitted by the domain machine for audiovisual presentation.
 * React may replay them, but never decides their order or combat result.
 */
export type BattlePresentationEvent =
  | { type: 'turnStarted'; actorId: string; side: CombatantSide }
  | { type: 'damage'; sourceId: string; targetId: string; value: number }
  | { type: 'heal'; sourceId: string; targetId: string; value: number }
  | { type: 'defend'; actorId: string }
  | { type: 'skillUsed'; actorId: string; targetId: string; skillId: string }
  | { type: 'itemUsed'; actorId: string; targetId: string; itemDefinitionId: string }

export type BattleRewards = {
  characterXp: number
  gold: number
  lootDefinitionIds: string[]
  boundResonance: number
  worldFlags?: string[]
  boundMemory?: {
    type: 'boss' | 'quest' | 'survival' | 'bond' | 'ruin' | 'special'
    sourceId: string
    title: string
    description: string
  }
}

export type BattleState = {
  id: string
  encounterId: string
  trailNodeId: string
  phase: BattlePhase
  phaseHistory: BattlePhase[]
  round: number
  actorId: string
  actorCursor: number
  initiativeOrder: string[]
  combatants: Record<string, Combatant>
  log: BattleLogEntry[]
  rewards: BattleRewards
  claimed: boolean
  canFlee: boolean
  consumedItemInstanceIds: string[]
  rngSeed: number
}

export type BattleCommand =
  | { type: 'attack'; targetId: string }
  | { type: 'defend' }
  | { type: 'skill'; skillId: string; targetId: string }
  | { type: 'item'; itemInstanceId: string; targetId: string }
  | { type: 'flee' }
