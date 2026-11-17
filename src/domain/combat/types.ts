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
  activeDefense?: import('../../content/combatStylesV0517').DefenseModeV0517
  defenseDice?: Record<import('../../content/combatStylesV0517').DefenseModeV0517, CombatDie>
  defenseModuleBonuses?:Record<import('../../content/combatStylesV0517').DefenseModeV0517,number>
  shieldBashBonus?:number
  hasBoundShield?: boolean
  weaponArchetype?: string
  offhandKind?: import('./layeredDefenseV0517').OffhandKindV0517
  combatProfile?: import('./layeredDefenseV0517').CombatProfileV0517
  physicalGuard?: number
  arcaneGuard?: number
  maxArcaneGuard?: number
  /** Save preserves the original rolled total without temporary status bonuses. */
  initiativeRolledBase?: number
  initiativeAppliedDieSteps?: number
  skillIds: string[]
  /** Optional for compatibility with battles serialized before v0.5.7. */
  skillCooldowns?: Record<string, number>
  statusEffects: ActiveStatus[]
  aiSkillEveryRounds?: number
  attackDie?: CombatDie
  weaponBonusDie?: CombatDie
  potionCooldown?: number
  potionHealingTicks?: number
  potionHealingRemaining?: number
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
  /** Authoritative motor result, only for damage dice; undefined in historical saves. */
  critical?: boolean
  /** v0.5.7: the actual face determines damage; all fields are motor-produced. */
  weaponBonusRoll?: { sides: CombatDie; face: number }
  damageBreakdown?: {
    baseAttack: number
    skillBonus: number
    dieAdjustment: number
    mitigation: number
    guardMitigation: number
    guardPrevented: number
    finalDamage: number
    damageAspect?: import('./layeredDefenseV0517').DamageTypeV0517
    shieldAbsorbed?: number
    arcaneAbsorbed?: number
    armorAbsorbed?: number
    affinityDelta?: number
    resistancePercent?: number
    critical?: boolean
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
  clanTrialQuestId?: string
  clanTrialRunId?: string
  clanBossQuestId?: string
  bossMechanics?: {
    bossId: string
    guardDefinitionIds: string[]
    maxAlive: number
    summonEveryRounds: number
    healEveryRounds: number
    healFraction: number
    buffEveryRounds: number
    buffDurationTurns: number
  }
  phase: BattlePhase
  phaseHistory: BattlePhase[]
  round: number
  actorId: string
  actorCursor: number
  initiativeOrder: string[]
  /** Only reorder next rounds after a status affects initiative. */
  initiativeStatusOrderModified?: boolean
  combatants: Record<string, Combatant>
  log: BattleLogEntry[]
  rewards: BattleRewards
  claimed: boolean
  canFlee: boolean
  consumedItemInstanceIds: string[]
  rngSeed: number
  modularLootRollV05171?:import('./modularLootV05171').ModularLootRollV05171
}

export type BattleCommand =
  | { type: 'rollInitiative' }
  | { type: 'attack'; targetId: string }
  | { type: 'areaAttack'; targetId?: string }
  | { type: 'defend' }
  | { type: 'skill'; skillId: string; targetId: string }
  | { type: 'item'; itemInstanceId: string; targetId: string }
  | { type: 'flee' }
