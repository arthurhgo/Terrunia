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
}

export type BattleRewards = {
  characterXp: number
  gold: number
  lootDefinitionIds: string[]
  boundResonance: number
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
