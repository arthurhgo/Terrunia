import type { ContentCatalog } from '../../content/catalog'
import { BALANCE } from '../../content/balance'
import { createBoundItem, canBindSlot } from '../bond/boundItems'
import type { AttributeId, AttributeValue, GameSave, QuestProgress } from './types'
import { createQuestProgress } from '../quests/questEngine'
import { fail, ok, type Result } from '../shared/types'

const createDefaultAttributes = (): Record<AttributeId, AttributeValue> => ({
  cunning: { die: BALANCE.defaultAttributeDie, bonus: 0 },
  agility: { die: BALANCE.defaultAttributeDie, bonus: 0 },
  strength: { die: BALANCE.defaultAttributeDie, bonus: 0 },
  vigor: { die: BALANCE.defaultAttributeDie, bonus: 0 },
  spirit: { die: BALANCE.defaultAttributeDie, bonus: 0 },
})

export const createNewSave = (
  ownerId: string,
  characterName: string,
  portraitAssetId: string,
  catalog: ContentCatalog,
  now = new Date().toISOString(),
  ids: { saveId: string; characterId: string } = {
    saveId: crypto.randomUUID(),
    characterId: crypto.randomUUID(),
  },
): GameSave => {
  const quests = Object.values(catalog.quests).reduce<Record<string, QuestProgress>>(
    (result, definition) => {
      result[definition.id] = createQuestProgress(definition)
      return result
    },
    {},
  )

  return {
    schemaVersion: 5,
    gameVersion: '0.5.0',
    saveId: ids.saveId,
    ownerId,
    revision: 1,
    createdAt: now,
    updatedAt: now,
    character: {
      id: ids.characterId,
      name: characterName.trim(),
      raceId: 'terririan',
      portraitAssetId,
      titleIds: [],
      level: 1,
      xp: 0,
      xpRequired: 250,
      attributes: createDefaultAttributes(),
      clan: { clanId: null, rank: 0, reputation: 0 },
      classProgression: {
        classId: null,
        masteryLevel: 0,
        masteryXp: 0,
        unlockedNodeIds: [],
      },
      bondedEquipment: {
        weapon: null,
        shield: null,
        armor: null,
        necklace: null,
        bracelet: null,
      },
    },
    essence: {
      current: 0,
      required: BALANCE.essenceThresholds[0],
      essencePoints: 0,
      lifetimeEssence: 0,
      cycle: 0,
    },
    boundItems: {},
    skillTrees: {
      tree_nexus_foundation: {
        unlockedNodeIds: [],
        discoveredNodeIds: [],
        spentEssencePoints: 0,
      },
      tree_clan: { unlockedNodeIds: [], discoveredNodeIds: [], spentEssencePoints: 0 },
      tree_class: { unlockedNodeIds: [], discoveredNodeIds: [], spentEssencePoints: 0 },
    },
    inventory: [],
    wallet: { gold: BALANCE.initialGold },
    quests,
    relationships: {
      npc_eldamar: {
        npcId: 'npc_eldamar',
        discovered: false,
        affinity: 0,
        trust: 0,
        reputationFlags: [],
        completedQuestIds: [],
        dialogueFlags: [],
      },
    },
    world: {
      currentLocationId: 'terran',
      unlockedLocationIds: ['terran'],
      trailNodeStates: {
        astravel_entry: 'locked',
        astravel_fungorro_01: 'locked',
        astravel_camp_03: 'locked',
        astravel_spore_ambush_04: 'locked',
        astravel_ruin_threshold_05: 'locked',
        astravel_boss_preview: 'boss',
      },
      completedEncounterIds: [],
      worldFlags: [],
    },
    battle: null,
    settings: {
      reducedMotion: false,
      soundEnabled: true,
      textScale: 'normal',
    },
    eventLog: ['CharacterCreated'],
  }
}

export const bindPrologueWeapon = (
  save: GameSave,
  catalog: ContentCatalog,
  now = new Date().toISOString(),
  itemId: string = crypto.randomUUID(),
): Result<GameSave> => {
  const definition = catalog.boundItemBases.bound_weapon_prologue_base
  if (!definition) return fail('MISSING_BOUND_BASE', 'A peça-base do prólogo não foi cadastrada.')
  const canBind = canBindSlot(save.character.bondedEquipment, 'weapon')
  if (!canBind.ok) return canBind

  const next = structuredClone(save)
  const item = createBoundItem(next.character.id, definition, now, itemId)
  next.boundItems[item.id] = item
  next.character.bondedEquipment.weapon = item.id
  next.updatedAt = now
  next.revision += 1
  next.eventLog.push(`BoundItemCreated:${item.id}`)
  return ok(next)
}
