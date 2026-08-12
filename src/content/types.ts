import type { DraftStatus, Effect, Rarity } from '../domain/shared/types'
import type { BoundSlot } from '../domain/shared/types'

export type CombatEffectDefinition =
  | { type: 'damage'; powerBonus: number }
  | { type: 'restoreHp'; value: number }
  | { type: 'applyStatus'; statusId: string; durationTurns: number; chance: number }

export type ItemDefinition = {
  id: string
  name: string
  description: string
  category: 'drop' | 'material' | 'fragment' | 'gem' | 'consumable' | 'quest' | 'lore' | 'trade'
  rarity: Rarity
  convertToEssence: boolean
  essenceValue: number
  sellable: boolean
  sellValue: number
  questLocked: boolean
  canInfuseBoundItem: boolean
  infusionComponentId?: string
  gemComponentId?: string
  combatEffects: CombatEffectDefinition[]
  affinityTags: string[]
  iconAssetId: string
  status: DraftStatus
}

export type BoundItemBaseDefinition = {
  id: string
  name: string
  slot: BoundSlot
  archetype: string
  basePower: number
  treeId: string
  assetIdByGrade: Partial<Record<1 | 2 | 3 | 4 | 5 | 6 | 7, string>>
  status: DraftStatus
}

export type EssenceComponentDefinition = {
  id: string
  name: string
  description: string
  affinityTags: string[]
  skillTreeHooks: string[]
  visualTags: string[]
  status: DraftStatus
}

export type GemComponentDefinition = {
  id: string
  name: string
  description: string
  rarity: Rarity
  tier: 1 | 2 | 3 | 4
  modifiers: Effect[]
  activeEffectIds: string[]
  skillTreeHooks: string[]
  affinityTags: string[]
  compatibility: {
    anyEssenceTags: string[]
    blockedEssenceTags: string[]
  }
  visualTags: string[]
  unique: boolean
  iconAssetId: string
  status: DraftStatus
  mechanicsStatus: DraftStatus
}

export type EnemyDefinition = {
  id: string
  name: string
  level: number
  maxHp: number
  mitigation: number
  attackPower: number
  xpReward: number
  goldReward: number
  boundResonanceReward: number
  lootDefinitionIds: string[]
  skillIds: string[]
  aiSkillEveryRounds?: number
  boss?: boolean
  weaknessTags: string[]
  assetId: string
  status: DraftStatus
}

export type CombatSkillDefinition = {
  id: string
  name: string
  description: string
  target: 'enemy' | 'self'
  mpCost: number
  effects: CombatEffectDefinition[]
  status: DraftStatus
}

export type StatusEffectDefinition = {
  id: string
  name: string
  description: string
  tone: 'beneficial' | 'harmful'
  startTurnDamage: number
  attackModifier: number
  mitigationModifier: number
  status: DraftStatus
}

export type EncounterDefinition = {
  id: string
  name: string
  locationLabel: string
  victoryTitle: string
  victorySummary: string
  trailNodeId: string
  enemyDefinitionIds: string[]
  canFlee: boolean
  rewards: {
    characterXp: number
    gold: number
    boundResonance: number
    lootDefinitionIds: string[]
    worldFlags?: string[]
    boundMemory?: {
      type: 'boss' | 'quest' | 'survival' | 'bond' | 'ruin' | 'special'
      sourceId: string
      title: string
      description: string
    }
  }
  status: DraftStatus
}

export type NPCDefinition = {
  id: string
  name: string
  title: string
  settlementId: string
  roles: Array<
    | 'clanRecruiter'
    | 'clanMaster'
    | 'classTrainer'
    | 'bondMaster'
    | 'questGiver'
    | 'vendor'
    | 'artisan'
    | 'rival'
    | 'lore'
    | 'normal'
  >
  questIds: string[]
  portraitAssetId: string
  dialogue: string[]
  status: DraftStatus
}

export type ClanDefinition = {
  id: string
  name: string
  philosophy: string
  recruiterNpcId: string
  recruitmentQuestIds: [string, string, string]
  classIds: [string, string, string]
  bonusLabel: string
  bonuses: Partial<Record<'maxHp' | 'mana' | 'mitigation' | 'physicalAttack' | 'magicalAttack', number>>
  status: DraftStatus
}

export type CharacterClassDefinition = {
  id: string
  clanId: string
  name: string
  role: string
  principle: string
  masterNpcId: string
  trialQuestId: string
  status: DraftStatus
}

export type QuestObjectiveDefinition = {
  id: string
  type: 'talk' | 'kill' | 'collect' | 'visit' | 'interact' | 'completeRite'
  targetId: string
  required: number
  label: string
}

export type QuestCategory = 'main' | 'clan' | 'class' | 'secondary' | 'bounty'

export type QuestPrerequisite =
  | { type: 'clanKnown'; clanId: string }
  | { type: 'questCompleted'; questId: string }
  | { type: 'clanJoined'; clanId: string }
  | { type: 'noClan' }
  | { type: 'noClass' }
  | { type: 'hasClan' }
  | { type: 'hasClass' }

export type QuestNarrativeVariant = {
  title?: string
  summary: string
}

export type QuestProgressionOutcome =
  | { type: 'clanEligibility'; clanId: string }
  | { type: 'classEligibility'; classId: string }
  | { type: 'clanReputation'; clanId: string; value: number }

export type QuestDefinition = {
  id: string
  title: string
  summary: string
  giverNpcId: string
  turnInNpcId: string
  category: QuestCategory
  objectives: QuestObjectiveDefinition[]
  rewards: Array<
    | { type: 'characterXp'; value: number }
    | { type: 'rawEssence'; value: number }
    | { type: 'gold'; value: number }
  >
  prerequisites?: QuestPrerequisite[]
  outcomes?: QuestProgressionOutcome[]
  classVariants?: Record<string, QuestNarrativeVariant>
  initialStatus?: 'available' | 'locked'
  terranFlow?: Partial<Record<'active' | 'ready_to_turn_in', string>>
  status: DraftStatus
}

export type TerranNpcPresence = {
  id: string
  label: string
  npcId?: string
  presence: 'resident' | 'conditional' | 'visitor' | 'progressive' | 'institution'
  roleLabel: string
}

export type TerranServiceDefinition = {
  id: string
  name: string
  description: string
  state: 'available' | 'progressive' | 'ownerDecision'
  route?: string
}

export type TerranLocationDefinition = {
  id: string
  settlementId: 'city_terran'
  name: string
  shortName: string
  verb: string
  role: string
  description: string
  category: 'institution' | 'portal'
  viewKind: 'eldamar' | 'vorren' | 'workshop' | 'zareth' | 'clanHall' | 'daeryn' | 'portal'
  iconId: 'book' | 'compass' | 'anvil' | 'shield' | 'clan' | 'flask' | 'portal'
  tone: 'knowledge' | 'exploration' | 'bond' | 'defense' | 'clan' | 'healing' | 'portal'
  mapPosition: { x: number; y: number }
  services: TerranServiceDefinition[]
  npcPresences: TerranNpcPresence[]
  status: DraftStatus
}

export type Requirement =
  | { type: 'boundItemPresent'; slot: BoundSlot }
  | { type: 'boundItemGrade'; slot: BoundSlot; value: number }
  | { type: 'boundItemResonance'; slot: BoundSlot; value: number }
  | { type: 'previousNode'; nodeId: string }
  | { type: 'hasEssenceTag'; slot: BoundSlot; value: string }
  | { type: 'hasJewelId'; slot: BoundSlot; value: string }
  | { type: 'hasRuneId'; slot: BoundSlot; value: string }
  | { type: 'characterLevel'; value: number }
  | { type: 'clanId'; value: string }
  | { type: 'clanRank'; value: number }
  | { type: 'classId'; value: string }
  | { type: 'questCompleted'; questId: string }
  | { type: 'npcDiscovered'; npcId: string }
  | { type: 'memory'; slot: BoundSlot; memoryId: string }
  | { type: 'worldFlag'; flag: string }

export type SkillTreeNodeDefinition = {
  id: string
  treeId: string
  context: 'nexus' | 'clan' | 'class' | BoundSlot
  name: string
  description: string
  category:
    | 'attribute'
    | 'passive'
    | 'activeSkill'
    | 'reaction'
    | 'modifier'
    | 'synergy'
    | 'transformation'
    | 'component'
    | 'memory'
    | 'ascension'
    | 'epic'
  costEssencePoints: number
  requires: Requirement[]
  hiddenUntil: Requirement[]
  effects: Effect[]
  position: { x: number; y: number }
  iconAssetId: string
  status: DraftStatus
}

export type TrailNodeDefinition = {
  id: string
  index: number
  type: 'entry' | 'battle' | 'event' | 'chest' | 'camp' | 'npc' | 'boss'
  label: string
  actionLabel?: string
  encounterId?: string
  requiresQuestId?: string
  position: { x: number; y: number }
  interaction?: {
    actionLabel: string
    completionMessage: string
    grantItemDefinitionIds: string[]
    worldFlag?: string
  }
}

export type TrailDefinition = {
  id: string
  name: string
  regionId: string
  actLabel: string
  nodes: TrailNodeDefinition[]
  status: DraftStatus
}
