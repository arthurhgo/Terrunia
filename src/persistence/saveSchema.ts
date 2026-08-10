import { z } from 'zod'
import type { GameSave } from '../domain/game/types'

export const CURRENT_SAVE_SCHEMA = 2

const idSchema = z.string().min(1)
const nonnegativeNumber = z.number().finite().nonnegative()
const nonnegativeInteger = z.number().int().nonnegative()
const positiveInteger = z.number().int().positive()
const boundSlotSchema = z.enum(['weapon', 'shield', 'armor', 'necklace', 'bracelet'])
const raritySchema = z.enum(['common', 'uncommon', 'rare', 'epic', 'legendary', 'unique'])
const attributeDieSchema = z.union([
  z.literal(4),
  z.literal(6),
  z.literal(8),
  z.literal(10),
  z.literal(12),
])

const attributeSchema = z.object({
  die: attributeDieSchema,
  bonus: z.number().finite(),
})

const essenceSchema = z.object({
  current: nonnegativeNumber,
  required: z.number().finite().positive(),
  essencePoints: nonnegativeInteger,
  lifetimeEssence: nonnegativeNumber,
  cycle: nonnegativeInteger,
})

const characterSchema = z.object({
  id: idSchema,
  name: z.string().trim().min(2).max(28),
  raceId: z.literal('terririan'),
  portraitAssetId: idSchema,
  level: positiveInteger,
  xp: nonnegativeNumber,
  xpRequired: z.number().finite().positive(),
  attributes: z.object({
    cunning: attributeSchema,
    agility: attributeSchema,
    strength: attributeSchema,
    vigor: attributeSchema,
    spirit: attributeSchema,
  }),
  clan: z.object({
    clanId: z.string().nullable(),
    rank: nonnegativeInteger,
    reputation: nonnegativeNumber,
    initiationQuestId: z.string().optional(),
    joinedAt: z.string().optional(),
  }),
  classProgression: z.object({
    classId: z.string().nullable(),
    masteryLevel: nonnegativeInteger,
    masteryXp: nonnegativeNumber,
    unlockedNodeIds: z.array(idSchema),
  }),
  bondedEquipment: z.object({
    weapon: z.string().nullable(),
    shield: z.string().nullable(),
    armor: z.string().nullable(),
    necklace: z.string().nullable(),
    bracelet: z.string().nullable(),
  }),
})

const boundComponentsSchema = z.object({
  essences: z.array(idSchema),
  gems: z.array(idSchema),
  runeId: z.string().nullable(),
  superiorRuneId: z.string().nullable(),
  epicSoulRuneGemId: z.string().nullable(),
})

const treeProgressSchema = z.object({
  treeId: idSchema.optional(),
  unlockedNodeIds: z.array(idSchema),
  discoveredNodeIds: z.array(idSchema),
  spentEssencePoints: nonnegativeInteger,
})

const boundItemSchema = z.object({
  id: idSchema,
  baseItemId: idSchema,
  ownerCharacterId: idSchema,
  slot: boundSlotSchema,
  grade: z.union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(5),
    z.literal(6),
    z.literal(7),
  ]),
  resonance: nonnegativeNumber,
  resonanceThreshold: nonnegativeNumber,
  components: boundComponentsSchema,
  skillTree: treeProgressSchema.extend({ treeId: idSchema }),
  memories: z.array(z.object({
    id: idSchema,
    type: z.enum(['boss', 'quest', 'survival', 'bond', 'ruin', 'special']),
    sourceId: idSchema,
    title: z.string(),
    description: z.string(),
    createdAt: z.string(),
  })),
  scars: z.array(z.object({
    id: idSchema,
    sourceId: idSchema,
    description: z.string(),
    effectIds: z.array(idSchema),
  })),
  visualStage: nonnegativeInteger,
  customName: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
})

const inventoryItemSchema = z.object({
  instanceId: idSchema,
  definitionId: idSchema,
  quantity: positiveInteger,
  rarity: raritySchema,
  locked: z.boolean(),
  favorite: z.boolean(),
  acquiredAt: z.string(),
})

const questProgressSchema = z.object({
  questId: idSchema,
  status: z.enum(['available', 'active', 'completed', 'failed']),
  objectives: z.record(z.string(), nonnegativeNumber),
  acceptedAt: z.string().optional(),
  completedAt: z.string().optional(),
})

const relationshipSchema = z.object({
  npcId: idSchema,
  discovered: z.boolean(),
  affinity: z.number().finite(),
  trust: z.number().finite(),
  reputationFlags: z.array(z.string()),
  completedQuestIds: z.array(idSchema),
  dialogueFlags: z.array(z.string()),
})

const worldSchema = z.object({
  currentLocationId: idSchema,
  unlockedLocationIds: z.array(idSchema),
  trailNodeStates: z.record(
    z.string(),
    z.enum(['completed', 'current', 'locked', 'boss']),
  ),
  completedEncounterIds: z.array(idSchema),
  worldFlags: z.array(z.string()),
})

const battlePhaseSchema = z.enum([
  'Initializing',
  'TurnStart',
  'AwaitingAction',
  'SelectingTarget',
  'ResolvingAction',
  'ResolvingReactions',
  'ApplyingStatuses',
  'CheckEndConditions',
  'TurnEnd',
  'Victory',
  'Defeat',
])

const combatantSchema = z.object({
  id: idSchema,
  definitionId: idSchema,
  name: z.string().min(1),
  side: z.enum(['player', 'enemy']),
  hp: nonnegativeNumber,
  maxHp: z.number().finite().positive(),
  mp: nonnegativeNumber,
  maxMp: nonnegativeNumber,
  attackPower: nonnegativeNumber,
  mitigation: nonnegativeNumber,
  initiative: z.number().finite(),
  alive: z.boolean(),
  defending: z.boolean(),
  skillIds: z.array(idSchema),
  statusEffects: z.array(z.object({
    definitionId: idSchema,
    sourceId: idSchema,
    remainingTurns: positiveInteger,
  })),
  aiSkillEveryRounds: positiveInteger.optional(),
})

const battleSchema = z.object({
  id: idSchema,
  encounterId: idSchema,
  trailNodeId: idSchema,
  phase: battlePhaseSchema,
  phaseHistory: z.array(battlePhaseSchema).min(1),
  round: positiveInteger,
  actorId: idSchema,
  actorCursor: nonnegativeInteger,
  initiativeOrder: z.array(idSchema).min(1),
  combatants: z.record(z.string(), combatantSchema),
  log: z.array(z.object({
    id: idSchema,
    round: positiveInteger,
    message: z.string(),
    tone: z.enum(['neutral', 'damage', 'defense', 'reward', 'system']),
  })),
  rewards: z.object({
    characterXp: nonnegativeNumber,
    gold: nonnegativeNumber,
    lootDefinitionIds: z.array(idSchema),
    boundResonance: nonnegativeNumber,
  }),
  claimed: z.boolean(),
  canFlee: z.boolean(),
  consumedItemInstanceIds: z.array(idSchema),
  rngSeed: z.number().int(),
})

export const gameSaveSchema = z.object({
  schemaVersion: z.literal(CURRENT_SAVE_SCHEMA),
  gameVersion: z.string().min(1),
  saveId: idSchema,
  ownerId: idSchema,
  revision: positiveInteger,
  createdAt: z.string().min(1),
  updatedAt: z.string().min(1),
  character: characterSchema,
  essence: essenceSchema,
  boundItems: z.record(z.string(), boundItemSchema),
  skillTrees: z.record(z.string(), treeProgressSchema.omit({ treeId: true })),
  inventory: z.array(inventoryItemSchema),
  wallet: z.object({ gold: nonnegativeNumber }),
  quests: z.record(z.string(), questProgressSchema),
  relationships: z.record(z.string(), relationshipSchema),
  world: worldSchema,
  battle: battleSchema.nullable(),
  settings: z.object({
    reducedMotion: z.boolean(),
    soundEnabled: z.boolean(),
    textScale: z.enum(['normal', 'large']),
  }),
  eventLog: z.array(z.string()),
}).superRefine((save, context) => {
  if (save.essence.current >= save.essence.required) {
    context.addIssue({
      code: 'custom',
      path: ['essence', 'current'],
      message: 'A Essência acumulada deve ser menor que o limiar atual.',
    })
  }

  const inventoryIds = new Set<string>()
  for (const [index, item] of save.inventory.entries()) {
    if (inventoryIds.has(item.instanceId)) {
      context.addIssue({
        code: 'custom',
        path: ['inventory', index, 'instanceId'],
        message: 'IDs de instância do inventário devem ser únicos.',
      })
    }
    inventoryIds.add(item.instanceId)
  }

  for (const [itemId, item] of Object.entries(save.boundItems)) {
    if (item.id !== itemId || item.ownerCharacterId !== save.character.id) {
      context.addIssue({
        code: 'custom',
        path: ['boundItems', itemId],
        message: 'O Vínculo deve corresponder à chave e ao personagem proprietário.',
      })
    }
  }

  for (const [slot, itemId] of Object.entries(save.character.bondedEquipment)) {
    if (!itemId) continue
    const item = save.boundItems[itemId]
    if (!item || item.slot !== slot) {
      context.addIssue({
        code: 'custom',
        path: ['character', 'bondedEquipment', slot],
        message: 'O slot vinculado deve apontar para um item existente do mesmo tipo.',
      })
    }
  }

  if (save.battle && !save.battle.combatants[save.battle.actorId]) {
    context.addIssue({
      code: 'custom',
      path: ['battle', 'actorId'],
      message: 'O ator atual precisa existir entre os combatentes.',
    })
  }
  if (
    save.battle &&
    save.battle.initiativeOrder[save.battle.actorCursor] !== save.battle.actorId
  ) {
    context.addIssue({
      code: 'custom',
      path: ['battle', 'actorCursor'],
      message: 'O cursor de iniciativa deve apontar para o ator atual.',
    })
  }
})

type LegacySave = Partial<GameSave> & { schemaVersion?: number }

const migrateV0ToV1 = (legacy: LegacySave): unknown => ({
  ...legacy,
  schemaVersion: 1,
  gameVersion: legacy.gameVersion ?? '0.1.0',
  revision: Math.max(1, legacy.revision ?? 1),
  skillTrees: legacy.skillTrees ?? {},
  relationships: legacy.relationships ?? {},
  eventLog: [...(legacy.eventLog ?? []), 'SaveMigrated:0->1'],
})

const migrateV1ToV2 = (legacy: Record<string, unknown>): unknown => {
  const world = (legacy.world ?? {}) as Partial<GameSave['world']>
  const oldStates = { ...(world.trailNodeStates ?? {}) }
  delete oldStates.astravel_locked_03
  const completedEncounters = world.completedEncounterIds ?? []
  const firstEncounterCompleted =
    oldStates.astravel_fungorro_01 === 'completed' ||
    completedEncounters.includes('encounter_fungorro_01')

  return {
    ...legacy,
    schemaVersion: 2,
    gameVersion: '0.2.0',
    battle: null,
    world: {
      ...world,
      trailNodeStates: {
        ...oldStates,
        astravel_entry: oldStates.astravel_entry ?? 'locked',
        astravel_fungorro_01: oldStates.astravel_fungorro_01 ?? 'locked',
        astravel_camp_03:
          oldStates.astravel_camp_03 ?? (firstEncounterCompleted ? 'current' : 'locked'),
        astravel_spore_ambush_04: oldStates.astravel_spore_ambush_04 ?? 'locked',
        astravel_ruin_threshold_05: oldStates.astravel_ruin_threshold_05 ?? 'locked',
        astravel_boss_preview: 'boss',
      },
    },
    eventLog: [
      ...(((legacy.eventLog as string[] | undefined) ?? [])),
      'SaveMigrated:1->2',
      ...(legacy.battle ? ['ActiveBattleRecoveredToTrail'] : []),
    ],
  }
}

export const migrateAndValidateSave = (input: unknown): GameSave => {
  let candidate = input
  let version =
    typeof candidate === 'object' && candidate !== null && 'schemaVersion' in candidate
      ? Number((candidate as { schemaVersion?: unknown }).schemaVersion ?? 0)
      : 0

  if (version === 0) {
    candidate = migrateV0ToV1(candidate as LegacySave)
    version = 1
  }
  if (version === 1) {
    candidate = migrateV1ToV2(candidate as Record<string, unknown>)
    version = 2
  }
  if (version > CURRENT_SAVE_SCHEMA) {
    throw new Error(`Save usa schema ${version}, superior ao suportado (${CURRENT_SAVE_SCHEMA}).`)
  }

  return gameSaveSchema.parse(candidate) as GameSave
}
