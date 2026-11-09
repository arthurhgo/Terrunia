import type { BattleState } from '../combat/types'
import type { CharacterAppearance } from '../character/appearance'
import type { BoundSlot, ComplementarySlot, Rarity } from '../shared/types'

export const ATTRIBUTE_IDS = ['cunning', 'agility', 'strength', 'vigor', 'spirit'] as const
export type AttributeId = (typeof ATTRIBUTE_IDS)[number]
export type AttributeDie = 4 | 6 | 8 | 10 | 12

export type AttributeValue = {
  die: AttributeDie
  bonus: number
}

export type Character = {
  id: string
  name: string
  raceId: 'terririan'
  portraitAssetId: string
  /** Optional: old saves keep their assetRegistry portrait. */
  appearance?: CharacterAppearance
  titleIds: string[]
  level: number
  xp: number
  xpRequired: number
  unspentAttributePoints: number
  attributes: Record<AttributeId, AttributeValue>
  clan: {
    clanId: string | null
    rank: number
    reputation: number
    knownClanIds: string[]
    eligibleClanIds: string[]
    initiationQuestId?: string
    joinedAt?: string
  }
  classProgression: {
    classId: string | null
    eligibleClassIds: string[]
    masteryLevel: number
    masteryXp: number
    unlockedNodeIds: string[]
  }
  bondedEquipment: Record<BoundSlot, string | null>
  basicArmorInstanceId: string | null
}

export type EssenceProgress = {
  current: number
  required: number
  essencePoints: number
  lifetimeEssence: number
  cycle: number
}

export type BoundComponents = {
  essences: string[]
  gems: string[]
  runeId: string | null
  superiorRuneId: string | null
  epicSoulRuneGemId: string | null
}

export type BoundItemMemory = {
  id: string
  type: 'boss' | 'quest' | 'survival' | 'bond' | 'ruin' | 'special'
  sourceId: string
  title: string
  description: string
  createdAt: string
}

export type BoundItemScar = {
  id: string
  sourceId: string
  description: string
  effectIds: string[]
}

export type BoundEquipmentInstance = {
  id: string
  baseItemId: string
  ownerCharacterId: string
  slot: BoundSlot
  grade: 1 | 2 | 3 | 4 | 5 | 6 | 7
  resonance: number
  resonanceThreshold: number
  components: BoundComponents
  skillTree: {
    treeId: string
    unlockedNodeIds: string[]
    discoveredNodeIds: string[]
    spentEssencePoints: number
  }
  memories: BoundItemMemory[]
  forging?: { upgradeIds: string[] }
  scars: BoundItemScar[]
  visualStage: number
  customName?: string
  createdAt: string
  updatedAt: string
}

export type InventoryItemInstance = {
  instanceId: string
  definitionId: string
  quantity: number
  rarity: Rarity
  locked: boolean
  favorite: boolean
  acquiredAt: string
  refinementLevel?: number
}

export type QuestStatus =
  | 'locked'
  | 'available'
  | 'offered'
  | 'active'
  | 'ready_to_turn_in'
  | 'completed'

export type QuestProgress = {
  questId: string
  status: QuestStatus
  tracked: boolean
  objectives: Record<string, number>
  acceptedAt?: string
  completedAt?: string
}

export type NPCRelationshipState = {
  npcId: string
  discovered: boolean
  affinity: number
  trust: number
  reputationFlags: string[]
  completedQuestIds: string[]
  dialogueFlags: string[]
}

export type TrailNodeStatus = 'completed' | 'current' | 'locked' | 'boss' | 'bossCurrent'

export type DungeonRunState = {
  runId: string
  dungeonId: 'dungeon_fungal_chambers'
  roomIndex: number
  stageIndex: 1 | 2 | 3
  mode: 'stages' | 'boss' | 'won'
  completedStageIds: string[]
  clearedRoomIds: string[]
  activeEncounterId: string | null
  createdAt: string
}

export type WorldProgress = {
  currentLocationId: string
  unlockedLocationIds: string[]
  trailNodeStates: Record<string, TrailNodeStatus>
  completedEncounterIds: string[]
  /** Personal best of the repeatable Portal waves. BALANCE_DRAFT. */
  portalWaveBest?: number
  worldFlags: string[]
}

export type PlayerSettings = {
  reducedMotion: boolean
  soundEnabled: boolean
  textScale: 'normal' | 'large'
}

export type GameSave = {
  schemaVersion: number
  gameVersion: string
  saveId: string
  campaignId: string
  campaignGeneration: number
  ownerId: string
  revision: number
  createdAt: string
  updatedAt: string
  character: Character
  essence: EssenceProgress
  boundItems: Record<string, BoundEquipmentInstance>
  skillTrees: Record<
    string,
    {
      unlockedNodeIds: string[]
      discoveredNodeIds: string[]
      spentEssencePoints: number
    }
  >
  inventory: InventoryItemInstance[]
  /** Distinct worn slot: an equipped temporary armor is NOT backpack inventory. */
  equippedBasicArmor: InventoryItemInstance | null
  /** Optional for pre-v0.5.11 saves; no bonuses from complementary pieces. */
  equippedComplementary?: Partial<Record<ComplementarySlot, InventoryItemInstance>>
  baseStorage: InventoryItemInstance[]
  wallet: { gold: number }
  // Vida/Mana atuais persistem; máximos continuam derivados do personagem.
  vitals: { hp: number; mp: number }
  quests: Record<string, QuestProgress>
  relationships: Record<string, NPCRelationshipState>
  world: WorldProgress
  battle: BattleState | null
  /** Optional, run-local state. Old campaign saves start fresh when entering the dungeon. */
  dungeonRun?: DungeonRunState | null
  settings: PlayerSettings
  eventLog: string[]
}
