import type { ContentCatalog } from '../../content/catalog'
import { BALANCE } from '../../content/balance'
import { createBoundItem, canBindSlot } from '../bond/boundItems'
import type { AttributeId, AttributeValue, GameSave, QuestProgress } from './types'
import { createQuestProgress } from '../quests/questEngine'
import { fail, ok, type Result } from '../shared/types'
import { createRandomId } from '../shared/randomId'
import { evaluateEquipmentRequirements } from '../bond/equipmentLoadout'
import { deriveCharacterStats } from '../character/derivedStats'

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
    saveId: createRandomId(),
    characterId: createRandomId(),
  },
  campaign: { campaignId: string; campaignGeneration: number } = {
    campaignId: ids.saveId,
    campaignGeneration: 0,
  },
): GameSave => {
  const quests = Object.values(catalog.quests).reduce<Record<string, QuestProgress>>(
    (result, definition) => {
      result[definition.id] = createQuestProgress(definition)
      return result
    },
    {},
  )

  const save: GameSave = {
    schemaVersion: 15,
    gameVersion: '0.13.0',
    saveId: ids.saveId,
    campaignId: campaign.campaignId,
    campaignGeneration: campaign.campaignGeneration,
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
      unspentAttributePoints: BALANCE.characterCreationAttributePoints,
      attributes: createDefaultAttributes(),
      clan: { clanId: null, rank: 0, reputation: 0, knownClanIds: [], eligibleClanIds: [] },
      classProgression: {
        classId: null,
        eligibleClassIds: [],
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
      basicArmorInstanceId: null,
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
    baseStorage: [],
    wallet: { gold: BALANCE.initialGold },
    vitals: { hp: 0, mp: 0 },
    quests,
    relationships: Object.fromEntries(Object.values(catalog.npcs).map((npc) => [
      npc.id,
      {
        npcId: npc.id,
        discovered: false,
        affinity: 0,
        trust: 0,
        reputationFlags: [],
        completedQuestIds: [],
        dialogueFlags: [],
      },
    ])),
    world: {
      currentLocationId: 'terran',
      unlockedLocationIds: ['terran'],
      trailNodeStates: Object.fromEntries(Object.values(catalog.trails).flatMap((trail) =>
        trail.nodes.map((node) => [node.id, node.type === 'boss' ? 'boss' as const : 'locked' as const]))),
      completedEncounterIds: [],
      portalWaveBest: 0,
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
  const stats = deriveCharacterStats(save, catalog)
  save.vitals = { hp: stats.life.value, mp: stats.mana.value }
  return save
}

export const bindPrologueWeapon = (
  save: GameSave,
  catalog: ContentCatalog,
  now = new Date().toISOString(),
  itemId: string = createRandomId(),
  baseItemId = 'bound_weapon_prologue_base',
): Result<GameSave> => {
  const definition = catalog.boundItemBases[baseItemId]
  if (!definition) return fail('MISSING_BOUND_BASE', 'A peça-base do prólogo não foi cadastrada.')
  if (definition.slot !== 'weapon') return fail('BOUND_BASE_NOT_WEAPON', 'O primeiro Vínculo deve ser uma Arma.')
  const canBind = canBindSlot(save.character.bondedEquipment, 'weapon')
  if (!canBind.ok) return canBind
  const eligibility = evaluateEquipmentRequirements(save.character, definition)
  if (!eligibility.eligible) {
    const missing = eligibility.requirements.filter((requirement) => !requirement.met).map((requirement) => requirement.label)
    return fail('BOUND_BASE_REQUIREMENTS', `Requisitos pendentes: ${missing.join(', ')}.`)
  }

  const next = structuredClone(save)
  const item = createBoundItem(next.character.id, definition, now, itemId)
  next.boundItems[item.id] = item
  next.character.bondedEquipment.weapon = item.id
  next.updatedAt = now
  next.revision += 1
  next.eventLog.push(`BoundItemCreated:${item.id}`, `BoundBaseChosen:${definition.id}`)
  return ok(next)
}
