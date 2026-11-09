export type BattlePhase =
  | 'Initializing'
  | 'AwaitingInitiative'
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
  /** Optional for compatibility with battles serialized before v0.5.7. */
  skillCooldowns?: Record<string, number>
  statusEffects: ActiveStatus[]
  aiSkillEveryRounds?: number
  attackDie?: CombatDie
  initiativeDie?: CombatDie
}

export type CombatDie = 4 | 6 | 8 | 10 | 12
export type CombatRoll = {
  actorId: string
  /** Exact affected combatant for staged hit and defeat VFX. */
  targetId?: string
  sides: CombatDie
  face: number
  action: string
  /** v0.5.7: the actual face determines damage; all fields are motor-produced. */
  damageBreakdown?: {
    baseAttack: number
    skillBonus: number
    dieAdjustment: number
    mitigation: number
    guardMitigation: number
    guardPrevented: number
    finalDamage: number
  }
}

export type BattleLogEntry = {
  id: string
  round: number
  message: string
  tone: 'neutral' | 'damage' | 'defense' | 'reward' | 'system'
  roll?: CombatRoll
}

export type BattleRewards = {
  characterXp: number
  gold: number
  lootDefinitionIds: string[]
  boundResonance: number
  fieldRecovery?: { hp: number; mp: number }
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
  /** Present only on repeatable Portal waves; absent for campaign encounters. */
  waveIndex?: number
  /** Repeatable Portal hunt; not a story trail node. */
  portalHuntId?: string
  /** v0.5.14 stage identity; keeps trail boss progression separate from stage victories. */
  dungeonEncounterId?: string
  dungeonRunId?: string
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
  | { type: 'rollInitiative' }
  | { type: 'attack'; targetId: string }
  | { type: 'defend' }
  | { type: 'skill'; skillId: string; targetId: string }
  | { type: 'item'; itemInstanceId: string; targetId: string }
  | { type: 'flee' }
