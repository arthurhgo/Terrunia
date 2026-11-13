import { enterBiomeTrail } from '../domain/exploration/biomeAccess'
import { BACKPACK_UPGRADES, routeNewItemOverflow } from '../domain/inventory/backpacks'
import { executeForgeRecipe, executeGoldForgeUpgrade } from '../domain/terran/forge'
import {commitAssemblyV05171,purchaseModularPartV05171} from '../domain/terran/modularAssemblyV05171'
import { equipBasicArmor, refineBasicArmor } from '../domain/inventory/basicArmor'
import { purchaseGear, equipGearStyle, refineCatalogGear } from '../domain/inventory/equipmentV0515'
import { purchaseAndEquipGear, purchaseAndEquipStarterArmor } from '../domain/inventory/marketQuickEquipV05153'
import { gearSetById, gearOfferById } from '../content/equipmentV0515'
import { equipComplementaryItem } from '../domain/inventory/complementaryEquipment'
import { refreshTutorialQuestProgress } from '../domain/quests/tutorialProgress'
import { create } from 'zustand'
import { playGameplaySfx } from '../services/gameplaySfx'
import { getNarrativeLeadV0516 } from '../domain/quests/questFlowV0516'
import { content } from '../content/catalog'
import { BALANCE } from '../content/balance'
import {
  gainBoundResonance,
  performGradeThreeRite,
  performGradeTwoRite,
} from '../domain/bond/boundItems'
import { createBattle, submitBattleCommand } from '../domain/combat/engine'
import { useFieldConsumable as applyFieldConsumable } from '../domain/exploration/fieldConsumables'
import { createWaveBattle } from '../domain/combat/waves'
import { applyVictoryRecovery } from '../domain/combat/victoryRecoveryV05152'
import { canStartPortalHunt } from '../domain/combat/portalHunts'
import type { BattleCommand } from '../domain/combat/types'
import {
  completeTrailNode,
  checkTrailQuestGate,
  getActiveTrailNode,
  getCurrentTrailNode,
  getTrailByNodeId,
  resolveTrailInteraction,
} from '../domain/exploration/trailEngine'
import { discoverDungeonRoom, enterDungeon, exitDungeon, FUNGAL_DUNGEON_ID,
  startDungeonEncounter as prepareDungeonEncounter, claimDungeonEncounter } from '../domain/exploration/dungeonEngine'
import { FUNGAL_BOSS_ENCOUNTER_ID } from '../content/fungalChambers'
import { GRANITE_GOLEM_ENCOUNTER_ID, clanGolemQuestId, clanTableQuestId, MAIN_CLAN_AFFILIATION_QUEST, CLAN_AFFILIATION_RITE_ID, CLAN_RECRUITMENT_WAVE, GRANITE_HEART_INSTANCE_ID } from '../content/clanProgressionV05142'
import { ROSETTA_CLAN_QUEST } from '../domain/progression/clanOrientation'
import { enterClanCastle as enterClanCastleDomain, leaveClanCastle as leaveClanCastleDomain } from '../domain/progression/clanCastle'
import { chooseClanCandidate as chooseClanCandidateDomain, chooseInitialClanSpell as chooseInitialClanSpellDomain } from '../domain/progression/clanOrientation'
import { startClanTrialWave as prepareClanWave, claimClanTrialWave } from '../domain/progression/clanTrials'
import { bindPrologueWeapon, createNewSave } from '../domain/game/createSave'
import { prepareStarterWeapon } from '../domain/bond/starterWeaponPlan'
import {performOffhandRiteV0517} from '../domain/bond/offhandRiteV0517'
import { requestCampaignReset } from '../domain/game/campaignReset'
import { ATTRIBUTE_IDS, type AttributeId, type GameSave } from '../domain/game/types'
import type { BoundSlot, ComplementarySlot } from '../domain/shared/types'
import type { CharacterAppearance } from '../domain/character/appearance'
import { convertInventoryItems, sellInventoryItems } from '../domain/inventory/inventory'
import { addBattleLootToInventory } from '../domain/inventory/battleLoot'
import { refreshDeliveryQuestProgress } from '../domain/quests/questInventory'
import {
  acceptQuest as acceptQuestDomain,
  applyQuestEvent,
  refreshQuestAvailability,
  declineQuest as declineQuestDomain,
  offerQuest as offerQuestDomain,
  setQuestTracked as setQuestTrackedDomain,
  turnInQuest as turnInQuestDomain,
} from '../domain/quests/questEngine'
import { unlockSkillNode } from '../domain/skillTree/skillTree'
import {
  discoverClan as discoverClanDomain,
  joinClan as joinClanDomain,
  unlockClass as unlockClassDomain,
} from '../domain/progression/progressionEngine'
import { discoverCityLandmark, visitTerranLocation } from '../domain/terran/cityEngine'
import { buyFromSylwen, receiveDaerynAid, restAtHome } from '../domain/terran/services'
import { canCompleteQuestObjectActivity } from '../domain/terran/questActivities'
import { buyMarketItem, MARKET_LOCATION_ID } from '../domain/terran/market'
import { enterPlayerBase, unlockPlayerBaseWithDaerynKey, leavePlayerBase, respawnDefeatedPlayer, transferBaseChestItem } from '../domain/terran/base'
import {
  loadCampaignSeed,
  loadSynchronizedSave,
  resetCampaignEverywhere,
  saveEverywhere,
  type CampaignSeed,
  type SyncMode,
} from '../services/sync/syncService'
import { loadAccountSettings, saveAccountSettings } from '../services/settings/accountSettings'
import { createRandomId } from '../domain/shared/randomId'
import { cutscenes, type CutsceneId } from '../domain/terran/cutscenes'
import { adjustCharacterAttribute, gainCharacterXp } from '../domain/character/attributeProgression'
import { deriveCharacterStats } from '../domain/character/derivedStats'

type GameStatus = 'idle' | 'loading' | 'ready' | 'error'
type SyncStatus = 'idle' | 'saving' | 'saved' | 'error'
export type CharacterAccessStatus = 'idle' | 'required' | 'granted' | 'creating'

export type GameNotification = {
  id: number
  title: string
  message: string
  tone: 'info' | 'success' | 'warning' | 'error' | 'neutral'
}

type GameState = {
  status: GameStatus
  syncStatus: SyncStatus
  syncMode: SyncMode | null
  ownerId: string | null
  save: GameSave | null
  characterAccess: CharacterAccessStatus
  campaignSeed: CampaignSeed | null
  preservedSettings: GameSave['settings'] | null
  error: string | null
  notification: GameNotification | null
  boot: (ownerId: string) => Promise<void>
  continueCharacter: () => void
  createGame: (name: string, portraitAssetId: string, appearance?: CharacterAppearance, investments?: Partial<Record<AttributeId, number>>) => Promise<boolean>
  bindPrologueWeapon: (baseItemId?: string) => boolean
  prepareStarterWeapon: (baseItemId: string) => boolean
  adjustAttribute: (attributeId: AttributeId, direction: 1 | -1) => void
  discoverEldamar: () => void
  discoverClan: (clanId: string) => void
  chooseClanCandidate: (clanId: string) => void
  chooseInitialClanSpell: (skillId: string) => void
  startClanTrialWave: (questId: string) => void
  startClanGolemBattle: (questId: string) => void
  offerQuest: (questId: string) => void
  declineQuest: (questId: string) => void
  acceptQuest: (questId: string) => void
  turnInQuest: (questId: string, npcId: string, choiceItemId?: string) => void
  setQuestTracked: (questId: string, tracked: boolean) => void
  performSocialTrial: (questId: string) => void
  joinClan: (clanId: string) => void
  unlockClass: (classId: string) => void
  travelInTerran: (locationId: string) => void
  enterClanCastle: () => boolean
  leaveClanCastle: () => boolean
  inspectCityLandmark: (landmarkId: string) => void
  preparePlayerHome: () => void
  performTerranQuestTask: (questId: string, objectId?: string, completedSteps?: readonly string[]) => boolean
  restAtHome: () => void
  enterBase: () => boolean
  unlockBaseWithKey: () => boolean
  acknowledgeBaseIntroduction: () => void
  leaveBase: () => void
  transferBaseItem: (direction: 'deposit' | 'withdraw', instanceId: string, quantity: number) => void
  receiveDaerynAid: () => void
  buyFromSylwen: (itemId: string, quantity?: number) => void
  forge: (recipeId: string) => void
  assembleBoundPart:(slot:'weapon'|'shield',partId:string,revision:number)=>void
  purchaseModularPart:(partId:string)=>void
  goldForge: (slot: BoundSlot) => void
  equipArmor: (instanceId: string | null) => void
  equipComplementary: (slot: ComplementarySlot, instanceId: string | null) => void
  refineArmor: (instanceId: string) => void
  recordMarketSpecialistConversation: (npcId: string) => void
  buyFromMarket: (npcId: string, itemId: string, quantity?: number) => void
  bindOffhandAtWorkshop: (baseId: string) => void
  buyAndEquipGear: (merchantId: string, offerId: string) => void
  buyAndEquipMarketArmor: (merchantId: string, itemId: string) => void
  buyGear: (merchantId: string, offerIds: string[]) => void
  buyGearSet: (merchantId: string, setId: string) => void
  equipGearStyle: (slot: BoundSlot, instanceId: string | null) => void
  refineGear: (instanceId: string) => void
  recordCutsceneViewed: (sceneId: CutsceneId) => void
  enterAstravel: () => void
  enterBiome: (biomeId: string) => void
  enterFungalChambers: () => void
  startDungeonStage: (roomId: string) => void
  discoverFungalRoom: (roomId: string) => void
  exitFungalChambers: () => void
  resolveCurrentTrailNode: () => void
  consumeFieldItem: (instanceId: string) => void
  consumeVictoryItem: (instanceId: string) => void
  startBattle: (nodeId?: string) => void
  startPortalWaves: () => void
  startPortalHunt: (encounterId: string) => void
  continuePortalWave: () => void
  submitBattleCommand: (command: BattleCommand) => void
  claimBattleRewards: () => void
  finishBattleIntoExpedition: () => void
  returnToTerran: () => void
  convertItems: (instanceIds: string[]) => void
  sellItems: (instanceIds: string[]) => void
  toggleFavorite: (instanceId: string) => void
  performGradeTwoRite: (boundItemId: string, fragmentInstanceId: string) => void
  performGradeThreeRite: (boundItemId: string, gemInstanceId: string) => void
  unlockNode: (nodeId: string) => void
  resetCampaign: () => Promise<boolean>
  setSoundEnabled: (enabled: boolean) => void
  clearNotification: () => void
  resetSession: () => void
}

const nowIso = () => new Date().toISOString()
let persistenceQueue = Promise.resolve<void>(undefined)
let activeBootSequence = 0

export const flushPersistence = () => persistenceQueue

export const useGameStore = create<GameState>((set, get) => {
  let notificationId = 0

  const show = (
    title: string,
    message: string,
    tone: GameNotification['tone'] = 'info',
  ) => {
    notificationId += 1
    set({ notification: { id: notificationId, title, message, tone } })
    if (tone === 'success' && get().save?.settings.soundEnabled) {
      const cue = /compra|adquirid|equipad/i.test(title) ? 'purchase'
        : /forja|aprimor|refin|rito|grau/i.test(title) ? 'upgrade'
          : /missão|lição|recompensa/i.test(title) ? 'quest' : 'success'
      playGameplaySfx(cue, true)
    }
  }

  const persist = (save: GameSave) => {
    set({ syncStatus: 'saving' })
    persistenceQueue = persistenceQueue.then(async () => {
      try {
        const mode = await saveEverywhere(save)
        if (get().save?.revision === save.revision) {
          set({ syncStatus: 'saved', syncMode: mode })
        }
      } catch (error) {
        set({
          syncStatus: 'error',
          error: error instanceof Error ? error.message : 'Falha ao salvar o jogo.',
        })
      }
    })
    return persistenceQueue
  }

  const commit = (candidate: GameSave) => {
    const save = routeNewItemOverflow(get().save, refreshTutorialQuestProgress(refreshDeliveryQuestProgress(candidate, content, candidate.updatedAt), content, candidate.updatedAt))
    const maxima = deriveCharacterStats(save, content)
    save.vitals.hp = Math.min(save.vitals.hp, maxima.life.value)
    save.vitals.mp = Math.min(save.vitals.mp, maxima.mana.value)
    set({ save, status: 'ready', error: null })
    return persist(save)
  }

  const failAction = (message: string) => show('Ação indisponível', message, 'warning')

  return {
    status: 'idle',
    syncStatus: 'idle',
    syncMode: null,
    ownerId: null,
    save: null,
    characterAccess: 'idle',
    campaignSeed: null,
    preservedSettings: null,
    error: null,
    notification: null,

    boot: async (ownerId) => {
      const bootSequence = ++activeBootSequence
      set({ status: 'loading', ownerId, save: null, campaignSeed: null, characterAccess: 'idle', error: null })
      try {
        const [save, campaignSeed] = await Promise.all([
          loadSynchronizedSave(ownerId),
          loadCampaignSeed(ownerId),
        ])
        if (bootSequence !== activeBootSequence || get().ownerId !== ownerId) return
        if (save && save.ownerId !== ownerId) throw new Error('O mundo salvo pertence a outra conta.')
        set({
          status: 'ready',
          save,
          campaignSeed: save
            ? { campaignId: save.campaignId, campaignGeneration: save.campaignGeneration }
            : campaignSeed,
          preservedSettings: save?.settings ?? loadAccountSettings(ownerId),
          characterAccess: save ? 'required' : 'creating',
          error: null,
          syncStatus: save ? 'saved' : 'idle',
        })
      } catch (error) {
        if (bootSequence !== activeBootSequence || get().ownerId !== ownerId) return
        set({
          status: 'error',
          save: null,
          characterAccess: 'idle',
          error: error instanceof Error ? error.message : 'Falha ao carregar o save.',
        })
      }
    },

    continueCharacter: () => {
      const { ownerId, save } = get()
      if (!ownerId || !save || save.ownerId !== ownerId) {
        return failAction('Nenhum Terrírian desta conta está disponível para continuar.')
      }
      set({ characterAccess: 'granted' })
    },

    createGame: async (name, portraitAssetId, appearance, investments) => {
      const ownerId = get().ownerId
      const campaignSeed = get().campaignSeed
      const preservedSettings = get().preservedSettings
      const cleanName = name.trim()
      if (!ownerId) {
        failAction('Nenhum usuário ativo.')
        return false
      }
      if (get().save) {
        failAction('Esta conta já possui um Terrírian ativo. Use “Criar outro” para substituir a campanha atual.')
        return false
      }
      if (cleanName.length < 2 || cleanName.length > 28) {
        failAction('O nome deve possuir entre 2 e 28 caracteres.')
        return false
      }
      const save = createNewSave(
        ownerId,
        cleanName,
        portraitAssetId,
        content,
        nowIso(),
        undefined,
        campaignSeed ?? { campaignId: createRandomId(), campaignGeneration: 0 },
        appearance,
      )
      // The initial six points are committed atomically with the new character.
      // Existing callers without investments retain the legacy prologue allocation.
      if (investments) {
        const spent = ATTRIBUTE_IDS.reduce((sum, id) => sum + (investments[id] ?? 0), 0)
        if (spent !== BALANCE.characterCreationAttributePoints ||
            ATTRIBUTE_IDS.some((id) => !Number.isInteger(investments[id]) || (investments[id] ?? 0) < 0 || (investments[id] ?? 0) > 8)) {
          failAction('Distribua exatamente seis pontos, um por clique, antes de criar o Terrírian.')
          return false
        }
        let prepared = save
        for (const id of ATTRIBUTE_IDS) for (let i = 0; i < (investments[id] ?? 0); i++) {
          const result = adjustCharacterAttribute(prepared, id, 1, nowIso())
          if (!result.ok) { failAction(result.message); return false }
          prepared = result.value
        }
        save.character = prepared.character
        save.eventLog = prepared.eventLog
        save.revision = prepared.revision
        const derived = deriveCharacterStats(save, content)
        save.vitals = { hp: derived.life.value, mp: derived.mana.value }
      }
      if (preservedSettings) save.settings = preservedSettings
      await commit(save)
      set({ characterAccess: 'granted' })
      show('Terrírian criado', 'Você começa sem Clã, sem Classe e sem build pronta.', 'success')
      return true
    },

    prepareStarterWeapon: (baseItemId) => {
      const save = get().save
      const weapon = content.boundItemBases[baseItemId]
      if (!save || !weapon) { failAction('Arma inicial não encontrada.'); return false }
      const result = prepareStarterWeapon(save, weapon, nowIso())
      if (!result.ok) { failAction(result.message); return false }
      commit(result.value)
      show('Atributos preparados', `Requisitos de ${weapon.name} atendidos. Você ainda pode personalizar os dados antes do Vínculo.`, 'success')
      return true
    },

    bindPrologueWeapon: (baseItemId = 'bound_weapon_prologue_base') => {
      const save = get().save
      if (!save) {
        failAction('Crie um Terrírian antes de iniciar o prólogo.')
        return false
      }
      const result = bindPrologueWeapon(save, content, undefined, undefined, baseItemId)
      if (!result.ok) {
        failAction(result.message)
        return false
      }
      commit(result.value)
      show('Primeiro Vínculo', `${content.boundItemBases[baseItemId]?.name ?? 'A Arma'} alcançou Grau I e agora evolui com o Terrírian.`, 'success')
      return true
    },

    adjustAttribute: (attributeId, direction) => {
      const save = get().save
      if (!save) return failAction('Nenhum Terrírian ativo.')
      const result = adjustCharacterAttribute(save, attributeId, direction, nowIso())
      if (!result.ok) return failAction(result.message)
      const stats = deriveCharacterStats(result.value, content)
      // During the initial bond setup, newly allocated Vigor/Espírito must not
      // leave a fresh character injured or depleted before their first battle.
      // Normal progression after the bond keeps the existing clamp behavior.
      if (!save.character.bondedEquipment.weapon) {
        result.value.vitals.hp = stats.life.value
        result.value.vitals.mp = stats.mana.value
      } else {
        result.value.vitals.hp = Math.min(result.value.vitals.hp, stats.life.value)
        result.value.vitals.mp = Math.min(result.value.vitals.mp, stats.mana.value)
      }
      commit(result.value)
    },

    discoverEldamar: () => {
      const save = get().save
      if (!save) return
      const next = structuredClone(save)
      next.relationships.npc_eldamar.discovered = true
      if (!next.relationships.npc_eldamar.dialogueFlags.includes('first_meeting')) {
        next.relationships.npc_eldamar.dialogueFlags.push('first_meeting')
      }
      next.updatedAt = nowIso()
      next.revision += 1
      next.eventLog.push('NPCDiscovered:npc_eldamar')
      commit(next)
    },

    chooseClanCandidate: (clanId) => {
      const save=get().save
      if(!save)return
      const result=chooseClanCandidateDomain(save,clanId,content,nowIso())
      if(!result.ok)return failAction(result.message)
      const refreshed=refreshQuestAvailability(result.value,content,nowIso())
      commit(refreshed)
      show('Candidatura registrada',`Agora converse com o representante de ${content.clans[clanId].name}.`,'info')
    },
    chooseInitialClanSpell: (skillId) => {
      const save=get().save
      if(!save)return
      const result=chooseInitialClanSpellDomain(save,skillId,content,nowIso())
      if(!result.ok)return failAction(result.message)
      commit(result.value)
      show('Magia aprendida',content.combatSkills[skillId].name,'success')
    },
    discoverClan: (clanId) => {
      const save = get().save
      if (!save) return
      const discovered = discoverClanDomain(save, clanId, content, nowIso())
      if (!discovered.ok) return failAction(discovered.message)
      if (discovered.value !== save) commit(discovered.value)
    },

    offerQuest: (questId) => {
      const save = get().save
      if (!save) return
      const offered = offerQuestDomain(save, questId, content, nowIso())
      if (!offered.ok) return failAction(offered.message)
      commit(offered.value)
    },

    declineQuest: (questId) => {
      const save = get().save
      if (!save) return
      const declined = declineQuestDomain(save, questId, nowIso())
      if (!declined.ok) return failAction(declined.message)
      commit(declined.value)
      show('Oferta mantida', 'A missão continuará disponível com o NPC.', 'info')
    },

    acceptQuest: (questId) => {
      const save = get().save
      if (!save) return
      // Single-click acceptance from the quest panel: validate and offer in memory,
      // then accept once. Persist a single atomic save instead of an intermediate offer.
      const candidate = save.quests[questId]?.status === 'available'
        ? offerQuestDomain(save, questId, content, nowIso())
        : { ok: true as const, value: save }
      if (!candidate.ok) return failAction(candidate.message)
      const accepted = acceptQuestDomain(candidate.value, questId, content, nowIso())
      if (!accepted.ok) return failAction(accepted.message)
      let next = accepted.value
      if (questId === 'vs_astravel_first_contact') {
        next = applyQuestEvent(
          next,
          { type: 'talk', targetId: 'npc_eldamar' },
          content,
          nowIso(),
        )
        next.world.trailNodeStates.astravel_entry = 'current'
        next.world.trailNodeStates.astravel_fungorro_01 = 'locked'
      }
      commit(next)
      show('Missão aceita', content.quests[questId]?.title ?? questId, 'neutral')
    },

    turnInQuest: (questId, npcId, choiceItemId) => {
      const save = get().save
      if (!save) return
      const completed = turnInQuestDomain(save, questId, npcId, content, nowIso(), choiceItemId)
      if (!completed.ok) return failAction(completed.message)
      let next = completed.value
      if (next.clanTrialRun?.questId === questId && next.clanTrialRun.phase === 'won')
        next.clanTrialRun = null
      const clan = Object.values(content.clans).find((entry) => clanGolemQuestId(entry.id) === questId)
      if (clan) {
        // turnInQuestDomain atomically validates and consumes the Emblem before joining.
        const joined = joinClanDomain(next, clan.id, content, nowIso())
        if (!joined.ok) return failAction(joined.message)
        next = joined.value
        if (next.quests[MAIN_CLAN_AFFILIATION_QUEST]?.status === 'active') {
          next = applyQuestEvent(next, { type: 'completeRite', targetId: CLAN_AFFILIATION_RITE_ID }, content, nowIso())
          const finished = turnInQuestDomain(next, MAIN_CLAN_AFFILIATION_QUEST, 'npc_curador_nexo', content, nowIso())
          if (finished.ok) next = finished.value
        }
      }
      commit(next)
      const narrative = !clan ? getNarrativeLeadV0516(next, content) : null
      const nextStep = narrative && narrative.completedQuestId === questId ? ' ' + narrative.message : ''
      show(clan ? 'Clã conquistado' : 'Missão concluída',
        clan ? `Emblema entregue a ${content.npcs[npcId]?.name}. Filiação a ${clan.name} confirmada; o miniportal do castelo está aberto.`
          : 'Recompensas aplicadas e registro movido para Concluídas.' + nextStep, 'success')
    },

    inspectCityLandmark: (landmarkId) => {
      const save = get().save
      if (!save) return
      const result = discoverCityLandmark(save, landmarkId, nowIso())
      if (!result.ok) return failAction(result.message)
      if (result.value !== save) commit(result.value)
    },

    setQuestTracked: (questId, tracked) => {
      const save = get().save
      if (!save) return
      const changed = setQuestTrackedDomain(save, questId, tracked, nowIso())
      if (!changed.ok) return failAction(changed.message)
      if (changed.value !== save) commit(changed.value)
    },

    startClanTrialWave: (questId) => {
      const save=get().save
      if(!save)return
      const draft=prepareClanWave(save,questId,content,nowIso())
      if(!draft.ok)return failAction(draft.message)
      const encounterId=draft.value.clanTrialRun!.activeEncounterId!
      const encounter=content.encounters[encounterId]
      const next=draft.value
      next.battle=createBattle(next,encounter,content,undefined,{manualInitiative:true})
      next.battle.clanTrialQuestId=questId
      next.battle.clanTrialRunId=next.clanTrialRun!.runId
      const player=next.battle.combatants.combatant_player
      next.vitals={hp:player.hp,mp:player.mp}
      commit(next)
      show('Prova de Clã',`Onda ${next.clanTrialRun!.waveIndex}/3. Combate iniciado.`,'info')
    },
    startClanGolemBattle: (questId) => {
      const save = get().save
      if (!save || save.battle || save.vitals.hp <= 0)
        return failAction('Finalize o encontro atual ou descanse antes de aceitar o desafio.')
      const clanId = save.character.clan.candidateClanId
      if (!clanId || save.character.clan.clanId || (save.world.portalWaveBest ?? 0) < CLAN_RECRUITMENT_WAVE ||
          save.quests[clanTableQuestId(clanId)]?.status !== 'completed' ||
          questId !== clanGolemQuestId(clanId) ||
          save.world.currentLocationId !== 'location_terran_clan_hall' ||
          save.quests[questId]?.status !== 'active')
        return failAction('Conclua a onda 14 do Portal, aceite O Coração de Granito e fale com o líder do Clã no Salão.')
      const encounter = content.encounters[GRANITE_GOLEM_ENCOUNTER_ID]
      if (!encounter) return failAction('Encontro do Golem de Granito não cadastrado.')
      const next = structuredClone(save)
      next.battle = createBattle(next, encounter, content, undefined, { manualInitiative: true })
      next.battle.clanBossQuestId = questId
      next.world.currentLocationId = GRANITE_HEART_INSTANCE_ID
      const player = next.battle.combatants.combatant_player
      next.vitals = { hp: player.hp, mp: player.mp }
      next.updatedAt = nowIso()
      next.revision += 1
      next.eventLog.push(`ClanLeaderTransportedToGraniteHeart:${clanId}`)
      commit(next)
      show('Golem de Granito', 'Observe a preparação do esmagamento e use Defender no turno certo.', 'info')
    },
    performSocialTrial: (questId) => {
      const save = get().save
      const progress = save?.quests[questId]
      const definition = content.quests[questId]
      const isHallMainLore = definition?.id === 'main_lore_identity_01'
      if (!save || !progress || !definition || (!['clan', 'class'].includes(definition.category) && !isHallMainLore)) {
        return failAction('Esta prova não está disponível.')
      }
      if (save.world.currentLocationId !== 'location_terran_clan_hall') {
        return failAction('As provas sociais desta build são iniciadas no Salão dos Clãs.')
      }
      if (progress.status !== 'active') return failAction('Aceite a prova antes de realizá-la.')
      if (isHallMainLore) return failAction('Interaja com a Mesa dos Ecos no Salão para investigar sua identidade.')
      if (definition.category === 'clan') return failAction('As provas de Clã exigem três vitórias reais. Use Iniciar onda.')
      const next = applyQuestEvent(save, { type: 'interact', targetId: questId }, content, nowIso())
      commit(next)
      show('Prova realizada', 'Retorne ao representante para concluir a avaliação.', 'success')
    },

    joinClan: (clanId) => {
      const save = get().save
      if (!save) return
      const joined = joinClanDomain(save, clanId, content, nowIso())
      if (!joined.ok) return failAction(joined.message)
      let next = joined.value
      if (next.quests[MAIN_CLAN_AFFILIATION_QUEST]?.status === 'active') {
        next = applyQuestEvent(next, {type:'completeRite',targetId:CLAN_AFFILIATION_RITE_ID},content,nowIso())
        const completed = turnInQuestDomain(next,MAIN_CLAN_AFFILIATION_QUEST,'npc_curador_nexo',content,nowIso())
        if (completed.ok) next = completed.value
      }
      commit(next)
      show('Vínculo aceito', `${content.clans[clanId].name} agora faz parte da identidade do Terrírian.`, 'success')
    },

    unlockClass: (classId) => {
      const save = get().save
      if (!save) return
      const unlocked = unlockClassDomain(save, classId, content, nowIso())
      if (!unlocked.ok) return failAction(unlocked.message)
      commit(unlocked.value)
      show('Classe desbloqueada', `${content.classes[classId].name} foi assumida após a prova.`, 'success')
    },

    enterClanCastle: () => {
      const save=get().save
      if(!save) { failAction('Nenhum Terrírian ativo.'); return false }
      const result=enterClanCastleDomain(save,nowIso())
      if(!result.ok) { failAction(result.message); return false }
      commit(result.value)
      show('Base de Clã', 'O miniportal conduziu você ao castelo do seu Clã.', 'success')
      return true
    },
    leaveClanCastle: () => {
      const save=get().save
      if(!save) { failAction('Nenhum Terrírian ativo.'); return false }
      const result=leaveClanCastleDomain(save,nowIso())
      if(!result.ok) { failAction(result.message); return false }
      commit(result.value)
      return true
    },
    travelInTerran: (locationId) => {
      const save = get().save
      if (!save) return
      if (save.battle || save.world.currentLocationId === FUNGAL_DUNGEON_ID || content.trails.trail_astravel_entry.nodes.some((node) => node.id === save.world.currentLocationId)) {
        return failAction('Registre o retorno da expedição antes de circular por Terran.')
      }
      const now = nowIso()
      const result = visitTerranLocation(save, locationId, content, now)
      if (!result.ok) return failAction(result.message)
      let next = result.value.save
      if (locationId === 'location_terran_clan_hall' && next.quests[ROSETTA_CLAN_QUEST]?.status === 'active') {
        next = applyQuestEvent(next, { type: 'visit', targetId: locationId }, content, now)
      }
      if (locationId === 'location_terran_clan_hall' && next.quests[ROSETTA_CLAN_QUEST]?.status === 'ready_to_turn_in') {
        const delivered = turnInQuestDomain(next, ROSETTA_CLAN_QUEST, 'npc_rosetta', content, now)
        if (!delivered.ok) return failAction(delivered.message)
        next = delivered.value
        show('Orientação concluída', 'Os Quatro Caminhos terminou. Converse com um dos líderes e aceite uma única candidatura.', 'success')
      }
      if (locationId === 'location_terran_clan_hall' && !next.character.clan.clanId &&
          next.quests[ROSETTA_CLAN_QUEST]?.status === 'completed' &&
          ['available','offered'].includes(next.quests[MAIN_CLAN_AFFILIATION_QUEST]?.status ?? '')) {
        const candidate = next.quests[MAIN_CLAN_AFFILIATION_QUEST].status === 'available'
          ? offerQuestDomain(next,MAIN_CLAN_AFFILIATION_QUEST,content,now)
          : {ok:true as const,value:next}
        if (!candidate.ok) return failAction(candidate.message)
        const accepted = acceptQuestDomain(candidate.value,MAIN_CLAN_AFFILIATION_QUEST,content,now)
        if (!accepted.ok) return failAction(accepted.message)
        next = accepted.value
      }
      if (next !== save) commit(next)
      if (result.value.firstVisit) {
        show(
          'Local descoberto',
          `${content.terranLocations[locationId].name} agora faz parte do seu minimapa.`,
          'success',
        )
      }
    },

    performTerranQuestTask: (questId, objectId, completedSteps) => {
      const save = get().save
      const definition = content.quests[questId]
      const objective = definition?.objectives.find((entry) => entry.type === 'interact')
      if (!save || !definition || !['main', 'clan'].includes(definition.category) || !objective) { failAction('Interação indisponível.'); return false }
      if (!objectId || !completedSteps || !canCompleteQuestObjectActivity(save, questId, objectId, completedSteps)) {
        failAction('Interaja com o objeto da missão e conclua suas etapas antes de registrar o objetivo.')
        return false
      }
      const next = applyQuestEvent(save, { type: 'interact', targetId: objective.targetId }, content, nowIso())
      if (next === save) { failAction('Este objetivo não pode ser registrado novamente.'); return false }
      next.eventLog.push(`QuestObjectSolved:${questId}:${objectId}`)
      commit(next)
      show('Objetivo realizado', `Retorne a ${content.npcs[definition.turnInNpcId]?.name ?? 'quem entregou a missão'} para receber a recompensa.`, 'success')
      return true
    },

    preparePlayerHome: () => {
      failAction('Aproxime-se da Estante de Cura na Casa de Daeryn e organize as poções.')
    },

    enterBase: () => {
      const save = get().save
      if (!save) return false
      const result = enterPlayerBase(save, nowIso())
      if (!result.ok) { failAction(result.message); return false }
      if (result.value !== save) commit(result.value)
      return true
    },

    unlockBaseWithKey: () => {
      const save = get().save
      if (!save) return false
      const now = nowIso()
      const result = unlockPlayerBaseWithDaerynKey(save, now)
      if (!result.ok) { failAction(result.message); return false }
      let next = result.value
      // ACCESS is the reward. Mark this single objective and hand it in
      // in the same transaction as consuming the key; no XP/Gold granted.
      if (next.quests.main_terran_open_base_door?.status === 'active') {
        next = applyQuestEvent(next, { type: 'interact', targetId: 'unlock_player_home_door' }, content, now)
        const done = turnInQuestDomain(next, 'main_terran_open_base_door', 'npc_daeryn', content, now)
        if (!done.ok) { failAction(done.message); return false }
        next = done.value
      }
      commit(next)
      show('Base destrancada · missão concluída', 'Chave usada uma vez. O acesso à sua Base e às três funções foi liberado.', 'success')
      return true
    },

    acknowledgeBaseIntroduction: () => {
      const save = get().save
      if (!save || save.world.worldFlags.includes('base_intro_viewed_v0510')) return
      const next = structuredClone(save)
      next.world.worldFlags.push('base_intro_viewed_v0510')
      commit(next)
    },

    leaveBase: () => {
      const save = get().save
      if (!save) return
      const result = leavePlayerBase(save, nowIso())
      if (!result.ok) return failAction(result.message)
      commit(result.value)
    },

    transferBaseItem: (direction, instanceId, quantity) => {
      const save = get().save
      if (!save) return
      const result = transferBaseChestItem(save, direction, instanceId, quantity, content, nowIso())
      if (!result.ok) return failAction(result.message)
      commit(result.value)
    },

    restAtHome: () => {
      const save = get().save
      if (!save) return
      const result = restAtHome(save, content, nowIso())
      if (!result.ok) return failAction(result.message)
      if (result.value !== save) commit(result.value)
      show('Descanso concluído', 'Vida e Mana restauradas. Experiência e Vínculos preservados.', 'success')
    },

    receiveDaerynAid: () => {
      const save = get().save
      if (!save) return
      const result = receiveDaerynAid(save, content, nowIso())
      if (!result.ok) return failAction(result.message)
      commit(result.value)
      show('Socorro de Daeryn', 'Você pode voltar a explorar. Seu quarto oferecerá repouso completo.', 'success')
    },

    buyFromSylwen: (itemId, quantity = 1) => {
      const save = get().save
      if (!save) return
      const result = buyFromSylwen(save, itemId, quantity, content, nowIso())
      if (!result.ok) return failAction(result.message)
      commit(result.value)
      show('Compra realizada', `${quantity}× ${content.items[itemId].name} adicionado à mochila.`, 'success')
    },

    equipArmor: (instanceId) => {
      const save = get().save
      if (!save) return
      const result = equipBasicArmor(save, instanceId, content, nowIso())
      if (!result.ok) return failAction(result.message)
      if (result.value === save) return
      commit(result.value)
      show(instanceId ? 'Proteção equipada' : 'Proteção retirada', instanceId ? 'Sua defesa foi atualizada. A peça aparece no slot equipado, fora da grade da mochila.' : 'Você pode escolher outra proteção na mochila.', 'success')
    },

    equipComplementary: (slot, instanceId) => {
      const save = get().save
      if (!save) return
      const result = equipComplementaryItem(save, slot, instanceId, content, nowIso())
      if (!result.ok) return failAction(result.message)
      if (result.value === save) return
      commit(result.value)
      show('Equipamentos', instanceId ? 'Peça equipada sem modificar seus Vínculos.' : 'Peça devolvida à mochila.', 'success')
    },

    refineArmor: (instanceId) => {
      const save = get().save
      if (!save) return
      const result = refineBasicArmor(save, instanceId, content, nowIso())
      if (!result.ok) return failAction(result.message)
      commit(result.value)
      show('Proteção aprimorada', 'A peça alcançou +1 e ganhou 1 de Defesa.', 'success')
    },

    purchaseModularPart:(partId)=>{
      const save=get().save
      if(!save)return
      const result=purchaseModularPartV05171(save,partId,content,nowIso())
      if(!result.ok)return failAction(result.message)
      commit(result.value)
      show('Componente adquirido',content.items[partId].name+' guardado na Mochila para montar em Durnan.','success')
    },
    assembleBoundPart:(slot,partId,revision)=>{
      const save=get().save
      if(!save)return
      const result=commitAssemblyV05171(save,slot,partId,content,nowIso(),revision)
      if(!result.ok)return failAction(result.message)
      commit(result.value)
      show('Montagem concluída','O Vínculo original foi preservado. A ficha e o dano já usam os atributos novos.','success')
    },

    forge: (recipeId) => {
      const save = get().save
      if (!save) return
      const result = executeForgeRecipe(save, recipeId, content, nowIso())
      if (!result.ok) return failAction(result.message)
      commit(result.value)
      show('Forja concluída', 'O trabalho de Durnan foi registrado. Consulte os novos caminhos da sua arma.', 'success')
    },

    goldForge: (slot) => {
      const save = get().save
      if (!save) return
      const result = executeGoldForgeUpgrade(save, slot, content, nowIso())
      if (!result.ok) return failAction(result.message)
      commit(result.value)
      show('Forja Magistral', 'O Vínculo foi aprimorado permanentemente com Ouro.', 'success')
    },

    recordMarketSpecialistConversation: (npcId) => {
      const save=get().save
      if(!save||save.battle||save.world.currentLocationId!=='location_terran_bond_workshop')return
      const specialists=['npc_terran_weaponsmith','npc_terran_armorer','npc_terran_accessory_artisan']
      if(!specialists.includes(npcId))return
      const flag='MarketSpecialistTalk:'+npcId
      const now=nowIso()
      const next=applyQuestEvent(save,{type:'talk',targetId:npcId},content,now)
      if(save.eventLog.includes(flag)){
        // Avoid a redundant save write for every repeat conversation.
        if(next.quests.rosetta_tutorial_market_specialists?.status===
          save.quests.rosetta_tutorial_market_specialists?.status)return
      }
      next.eventLog.push(flag)
      next.updatedAt=now
      next.revision+=1
      commit(next)
    },

    bindOffhandAtWorkshop:(baseId)=>{
      const save=get().save
      if(!save)return
      const result=performOffhandRiteV0517(save,baseId,content,nowIso())
      if(!result.ok)return failAction(result.message)
      commit(result.value)
      show('Vínculo da Escudaria',content.boundItemBases[baseId].name+
        ' vinculado permanentemente. O slot de mão secundária não pode ser trocado por outro item.',
        'success')
    },

    buyFromMarket: (npcId, itemId, quantity = 1) => {
      const save = get().save
      if (!save) return
      const result = buyMarketItem(save, npcId, itemId, quantity, content, nowIso())
      if (!result.ok) return failAction(result.message)
      commit(result.value)
      show('Compra realizada', BACKPACK_UPGRADES.find((upgrade) => upgrade.id === itemId)
        ? 'Capacidade da mochila expandida e salva no personagem.'
        : `${quantity}× ${content.items[itemId].name} recebido no Mercado. Investimento: ${save.wallet.gold-result.value.wallet.gold} Ouro · Saldo: ${result.value.wallet.gold} Ouro.`, 'success')
    },

    buyAndEquipGear: (merchantId, offerId) => {
      const save=get().save
      if(!save)return
      const result=purchaseAndEquipGear(save,merchantId,offerId,content,nowIso())
      if(!result.ok)return failAction(result.message)
      commit(result.value)
      show('Comprado e equipado',
        (gearOfferById[offerId]?.name ?? 'Equipamento')+' equipado com os bônus aplicados. Custo: '+(save.wallet.gold-result.value.wallet.gold)+' Ouro · Saldo: '+result.value.wallet.gold+' Ouro. O Vínculo permanente foi preservado.',
        'success')
    },

    buyAndEquipMarketArmor: (merchantId, itemId) => {
      const save=get().save
      if(!save)return
      const result=purchaseAndEquipStarterArmor(save,merchantId,itemId,content,nowIso())
      if(!result.ok)return failAction(result.message)
      commit(result.value)
      show('Proteção comprada e equipada',
        (content.items[itemId]?.name ?? 'Armadura')+' equipada. Custo: '+(save.wallet.gold-result.value.wallet.gold)+' Ouro · Saldo: '+result.value.wallet.gold+' Ouro. Seus atributos foram atualizados.',
        'success')
    },

    buyGear: (merchantId, offerIds) => {
      const save = get().save
      if (!save) return
      const result = purchaseGear(save, offerIds, nowIso(), merchantId)
      if (!result.ok) return failAction(result.message)
      commit(result.value)
      show('Equipamentos adquiridos', offerIds.length + ' peça(s) guardada(s). Custo: ' + (save.wallet.gold-result.value.wallet.gold) + ' Ouro · Saldo: ' + result.value.wallet.gold + ' Ouro. Confira o destino na Mochila ou no Baú da Base.', 'success')
    },

    buyGearSet: (merchantId, setId) => {
      const setDefinition = gearSetById[setId]
      if (!setDefinition) return failAction('Kit não encontrado.')
      get().buyGear(merchantId, setDefinition.itemIds.filter(id=>gearOfferById[id]?.slot!=='weapon'))
    },

    equipGearStyle: (slot, instanceId) => {
      const save = get().save
      if (!save) return
      const result = equipGearStyle(save, instanceId, slot, nowIso())
      if (!result.ok) return failAction(result.message)
      if (result.value === save) return
      commit(result.value)
      show('Equipamentos', instanceId ? 'Revestimento equipado sem substituir o Vínculo.' : 'Revestimento devolvido à mochila.', 'success')
    },

    refineGear: (instanceId) => {
      const save = get().save
      if (!save) return
      const result = refineCatalogGear(save, instanceId, nowIso())
      if (!result.ok) return failAction(result.message)
      commit(result.value)
      const gearId = [...result.value.inventory, ...(result.value.equippedBasicArmor ? [result.value.equippedBasicArmor] : []),
        ...Object.values(result.value.equippedComplementary ?? {}), ...Object.values(result.value.equippedGearStyles ?? {})]
        .find((item) => item?.instanceId === instanceId)?.definitionId
      show('Forja de Durnan', 'Equipamento '+(gearOfferById[gearId ?? '']?.name ?? '')+' aprimorado até G3.', 'success')
    },

    recordCutsceneViewed: (sceneId) => {
      const save = get().save
      if (!save || !cutscenes.some((scene) => scene.id === sceneId)) return
      const marker = `CutsceneViewed:${sceneId}`
      if (save.eventLog.includes(marker)) return
      const next = structuredClone(save)
      next.eventLog.push(marker)
      next.updatedAt = nowIso()
      next.revision += 1
      commit(next)
    },

    enterAstravel: () => {
      const save = get().save
      if (!save) return
      const alreadyEntered = save.world.trailNodeStates.astravel_entry === 'completed'
        && save.world.unlockedLocationIds.includes('astravel_entry')
      if (!alreadyEntered && save.quests.vs_astravel_first_contact?.status !== 'active') {
        return failAction('Converse com Eldamar e aceite a missão antes de entrar na rota.')
      }
      if (save.world.currentLocationId !== 'location_terran_portal_plaza') {
        return failAction('A instância deve ser acessada pela Praça do Portal.')
      }
      const trail = content.trails.trail_astravel_entry
      if (alreadyEntered) {
        const activeNode = getActiveTrailNode(save, trail)
        const completedBoss = save.world.trailNodeStates.astravel_boss_preview === 'completed'
        if (!activeNode && !completedBoss) return failAction('A expedição não possui um marco acessível.')
        const resumed = structuredClone(save)
        // Re-entry always starts from Entrada; previously completed nodes remain intact.
        resumed.world.currentLocationId = 'astravel_entry'
        resumed.updatedAt = nowIso()
        resumed.revision += 1
        resumed.eventLog.push(completedBoss && !activeNode ? 'ExpeditionRevisited:trail_astravel_entry' : 'ExpeditionResumed:trail_astravel_entry')
        commit(resumed)
        show('Astravél', completedBoss && !activeNode ? 'A ruína concluída pode ser visitada sem repetir recompensas.' : 'Entrada da instância · progressão e marcos preservados.', 'info')
        return
      }
      const visiting = structuredClone(save)
      visiting.world.currentLocationId = 'astravel_entry'
      if (!visiting.world.unlockedLocationIds.includes('astravel_entry')) {
        visiting.world.unlockedLocationIds.push('astravel_entry')
      }
      const now = nowIso()
      const completed = completeTrailNode(
        visiting,
        content.trails.trail_astravel_entry,
        'astravel_entry',
        now,
      )
      if (!completed.ok) return failAction(completed.message)
      let next = completed.value.save
      next.eventLog.push('LocationVisited:astravel_entry')
      next = applyQuestEvent(next, { type: 'visit', targetId: 'astravel_entry' }, content, now)
      commit(next)
      show('Astravél', 'A presença Fungorra foi localizada no próximo nó.', 'info')
    },

    enterBiome: (biomeId) => {
      const save = get().save
      if (!save) return
      const result = enterBiomeTrail(save, biomeId, content, nowIso())
      if (!result.ok) return failAction(result.message)
      commit(result.value)
      const region = content.trails[Object.values(content.trails).find((trail) =>
        trail.nodes[0].id === result.value.world.currentLocationId)?.id ?? '']
      show('Expedição', region?.name ?? 'Novo bioma', 'info')
    },

    enterFungalChambers: () => {
      const save = get().save
      if (!save) return
      const boss = content.trails.trail_astravel_entry.nodes.find((node) => node.type === 'boss')!
      if (save.world.trailNodeStates[boss.id] !== 'completed') {
        const gate = checkTrailQuestGate(save, boss, content)
        if (!gate.ok) return failAction(gate.message)
      }
      const result = enterDungeon(save, content.dungeons.dungeon_fungal_chambers, nowIso(), content.trails.trail_astravel_entry)
      if (!result.ok) return failAction(result.message)
      commit(result.save)
      show('Câmaras Fúngicas', 'A passagem foi aberta. Explore as salas até o núcleo da Ruína.', 'info')
    },

    startDungeonStage: (roomId) => {
      const save = get().save
      if (!save || save.battle) return failAction('Termine o combate atual antes de avançar.')
      if (save.vitals.hp <= 0) return failAction('Descanse na Base antes de combater.')
      const draft = prepareDungeonEncounter(save, roomId, nowIso())
      if (!draft.ok) return failAction(draft.message)
      const encounterId = draft.save.dungeonRun!.activeEncounterId!
      const encounter = content.encounters[encounterId]
      if (!encounter) return failAction('Estágio sem encontro cadastrado.')
      const next = draft.save
      next.battle = createBattle(next, encounter, content, undefined, { manualInitiative: true })
      next.battle.dungeonEncounterId = encounterId
      next.battle.dungeonRunId = next.dungeonRun!.runId
      // Historical characters keep their unique items. Stages still yield ordinary materials.
      if (encounterId === FUNGAL_BOSS_ENCOUNTER_ID &&
        (save.world.worldFlags.includes('fungal_chambers_first_clear')
          || save.world.trailNodeStates.astravel_boss_preview === 'completed')) {
        next.battle.rewards.lootDefinitionIds = next.battle.rewards.lootDefinitionIds.filter((id) =>
          !['fragment_mycelial_essence', 'item_gem_esmeralda_crescimento'].includes(id))
        delete next.battle.rewards.boundMemory
      }
      const player = next.battle.combatants.combatant_player
      next.vitals = { hp: player.hp, mp: player.mp }
      commit(next)
    },

    discoverFungalRoom: (roomId) => {
      const save = get().save
      if (!save) return
      const result = discoverDungeonRoom(save, content.dungeons.dungeon_fungal_chambers, roomId, nowIso())
      if (!result.ok) return failAction(result.message)
      if (result.save !== save) {
        commit(result.save)
        show('Sala descoberta', content.dungeons.dungeon_fungal_chambers.rooms.find((room) => room.id === roomId)?.name ?? 'Câmaras Fúngicas', 'success')
      }
    },

    exitFungalChambers: () => {
      const save = get().save
      if (!save) return
      const result = exitDungeon(save, content.dungeons.dungeon_fungal_chambers, nowIso())
      if (!result.ok) return failAction(result.message)
      commit(result.save)
    },

    resolveCurrentTrailNode: () => {
      const save = get().save
      if (!save) return
      const trail = getTrailByNodeId(content, save.world.currentLocationId)
      const node = trail ? getCurrentTrailNode(save, trail) : null
      if (!node) return failAction('Não existe uma interação atual na trilha.')
      const now = nowIso()
      if (!trail) return failAction('Trilha desconhecida.')
      const result = resolveTrailInteraction(save, trail, node.id, content, now)
      if (!result.ok) return failAction(result.message)
      result.value.save.world.currentLocationId = node.id
      commit(result.value.save)
      show(
        node.type === 'camp' ? 'Acampamento vasculhado' : 'Rota investigada',
        node.interaction?.completionMessage ?? 'O nó atual foi concluído.',
        'success',
      )
    },

    startBattle: (nodeId) => {
      const save = get().save
      if (!save) return
      if (save.battle) return failAction('Finalize o encontro atual antes de iniciar outro combate.')
      if (save.vitals.hp <= 0) return failAction('Descanse na Base antes de combater.')
      const trail = getTrailByNodeId(content, nodeId ?? save.world.currentLocationId)
      const node = nodeId
        ? trail?.nodes.find((candidate) => candidate.id === nodeId)
        : trail ? getActiveTrailNode(save, trail) : null
      const nodeStatus = node ? save.world.trailNodeStates[node.id] : undefined
      const accessible = node?.type === 'boss'
        ? nodeStatus === 'bossCurrent'
        : nodeStatus === 'current'
      if (!node || !accessible) {
        return failAction('Este encontro ainda não está acessível.')
      }
      if (!['battle', 'boss'].includes(node.type) || !node.encounterId) {
        return failAction('O nó atual não contém um encontro de combate.')
      }
      if (!trail || (!trail.nodes.some((candidate) => candidate.id === save.world.currentLocationId)
        && !(trail.id === 'trail_astravel_entry' && save.world.currentLocationId === FUNGAL_DUNGEON_ID))) {
        return failAction('Entre na instância correspondente pelo Portal antes de iniciar este encontro.')
      }
      const questGate = checkTrailQuestGate(save, node, content)
      if (!questGate.ok) return failAction(questGate.message)
      if (trail.id === 'trail_astravel_entry' && node.type === 'boss') {
        return failAction('O Núcleo da Ruína agora é enfrentado ao concluir os 12 estágios das Câmaras Fúngicas.')
      }
      const encounter = content.encounters[node.encounterId]
      if (!encounter) return failAction('Conteúdo do encontro não encontrado.')
      const next = structuredClone(save)
      next.battle = createBattle(next, encounter, content, undefined, { manualInitiative: true })
      const startingPlayer = next.battle.combatants.combatant_player
      next.vitals = { hp: startingPlayer.hp, mp: startingPlayer.mp }
      if (next.world.currentLocationId !== FUNGAL_DUNGEON_ID) next.world.currentLocationId = node.id
      next.updatedAt = nowIso()
      next.revision += 1
      next.eventLog.push(`BattleStarted:${encounter.id}`)
      commit(next)
    },

    startPortalWaves: () => {
      const save = get().save
      if (!save || save.battle) return failAction('Termine o encontro atual antes de iniciar as ondas.')
      if (save.world.currentLocationId !== 'location_terran_portal_plaza') {
        return failAction('O Modo Ondas só pode ser iniciado na Praça do Portal.')
      }
      if (save.world.trailNodeStates.astravel_fungorro_01 !== 'completed') {
        return failAction('Conclua o primeiro encontro em Astravél para liberar o Modo Ondas.')
      }
      if (save.vitals.hp <= 0) return failAction('Descanse na Base antes de combater.')
      const next = structuredClone(save)
      next.battle = createWaveBattle(next, content, 1)
      next.updatedAt = nowIso()
      next.revision += 1
      next.eventLog.push('PortalWaveStarted:1')
      commit(next)
    },

    startPortalHunt: (encounterId) => {
      const save = get().save
      if (!save) return
      const permitted = canStartPortalHunt(save, encounterId, content)
      if (!permitted.ok) return failAction(permitted.message)
      const next = structuredClone(save)
      const battle = createBattle(next, content.encounters[encounterId], content, undefined, { manualInitiative: true })
      battle.portalHuntId = encounterId
      next.battle = battle
      next.vitals = { hp: battle.combatants.combatant_player.hp, mp: battle.combatants.combatant_player.mp }
      next.updatedAt = nowIso()
      next.revision += 1
      next.eventLog.push(`PortalHuntStarted:${encounterId}`)
      commit(next)
    },

    continuePortalWave: () => {
      const save = get().save
      const old = save?.battle
      if (!save || !old?.waveIndex || old.phase !== 'Victory' || !old.claimed) {
        return failAction('Recolha as recompensas da onda antes de continuar.')
      }
      const next = structuredClone(save)
      next.battle = createWaveBattle(next, content, old.waveIndex + 1)
      next.updatedAt = nowIso()
      next.revision += 1
      next.eventLog.push('PortalWaveStarted:' + (old.waveIndex + 1))
      commit(next)
    },

    consumeFieldItem: (instanceId) => {
      const save = get().save
      if (!save) return failAction('Nenhum personagem ativo.')
      const result = applyFieldConsumable(save, instanceId, content, nowIso())
      if (!result.ok) return failAction(result.message)
      commit(result.value)
      show('Suprimento utilizado', 'A recuperação foi aplicada ao seu personagem sem alterar a posição na trilha.', 'success')
    },

    consumeVictoryItem: (instanceId) => {
      const save=get().save
      if(!save)return failAction('Nenhum Terrírian ativo.')
      const result=applyVictoryRecovery(save,instanceId,content,nowIso())
      if(!result.ok)return failAction(result.message)
      commit(result.value)
      show('Preparação concluída','Consumível utilizado sem avançar a onda ou gastar turno.','success')
    },

    submitBattleCommand: (command) => {
      const save = get().save
      if (!save?.battle) return failAction('Nenhuma batalha está ativa.')
      const consumedCount = save.battle.consumedItemInstanceIds.length
      const result = submitBattleCommand(save.battle, command, content, save.inventory)
      if (!result.ok) return failAction(result.message)
      const next = structuredClone(save)
      next.battle = result.value
      const player = result.value.combatants.combatant_player
      next.vitals = { hp: player.hp, mp: player.mp }
      const consumedNow = result.value.consumedItemInstanceIds.slice(consumedCount)
      for (const instanceId of consumedNow) {
        const index = next.inventory.findIndex((item) => item.instanceId === instanceId)
        if (index < 0) continue
        if (next.inventory[index].quantity > 1) next.inventory[index].quantity -= 1
        else next.inventory.splice(index, 1)
        next.eventLog.push(`CombatItemConsumed:${instanceId}`)
      }
      const now=nowIso()
      // Quest progress comes only from an authoritative, accepted battle command.
      let progressed=next
      if(command.type==='skill'&&content.combatSkills[command.skillId]?.defenseStance)
        progressed=applyQuestEvent(progressed,{type:'interact',targetId:'modular_defense'},content,now)
      const currentWeaponId=progressed.character.bondedEquipment.weapon
      if((command.type==='attack'||command.type==='areaAttack'||
         (command.type==='skill'&&content.combatSkills[command.skillId]?.target==='enemy')) &&
         currentWeaponId&&progressed.boundItems[currentWeaponId]?.assembly?.revision)
        progressed=applyQuestEvent(progressed,{type:'interact',targetId:'modular_attack'},content,now)
      progressed.updatedAt=now
      progressed.revision+=1
      commit(progressed)
    },

    claimBattleRewards: () => {
      const save = get().save
      const battle = save?.battle
      if (!save || !battle || battle.phase !== 'Victory' || battle.claimed) {
        return failAction('Não há recompensas de vitória disponíveis.')
      }
      let next = structuredClone(save)
      const xpGain = gainCharacterXp(next.character, battle.rewards.characterXp)
      next.character = xpGain.character
      if (xpGain.levelsGained > 0) next.eventLog.push(`CharacterLevelGained:${xpGain.levelsGained}`)
      next.wallet.gold += battle.rewards.gold
      const acquiredAt = nowIso()
      // One claim collects all drops; fungible duplicates share a safe inventory slot.
      next.inventory = addBattleLootToInventory(next.inventory, battle.rewards.lootDefinitionIds,
        content, battle.id, battle.encounterId, acquiredAt)
      const loot = battle.rewards.lootDefinitionIds.map((definitionId) => ({ definitionId, quantity: 1 }))
      const recovery = battle.rewards.fieldRecovery
      if (recovery) {
        const stats = deriveCharacterStats(next, content)
        next.vitals.hp = Math.min(stats.life.value, next.vitals.hp + recovery.hp)
        next.vitals.mp = Math.min(stats.mana.value, next.vitals.mp + recovery.mp)
        next.eventLog.push(`FieldRecovery:${battle.trailNodeId}`)
      }
      const weaponId = next.character.bondedEquipment.weapon
      if (weaponId && next.boundItems[weaponId]) {
        next.boundItems[weaponId] = gainBoundResonance(
          next.boundItems[weaponId],
          battle.rewards.boundResonance,
          acquiredAt,
        )
        const memory = battle.rewards.boundMemory
        if (
          memory &&
          !next.boundItems[weaponId].memories.some(
            (entry) => entry.sourceId === memory.sourceId,
          )
        ) {
          next.boundItems[weaponId].memories.push({
            id: `${weaponId}_memory_${memory.sourceId}`,
            ...memory,
            createdAt: acquiredAt,
          })
        }
      }
      for (const flag of battle.rewards.worldFlags ?? []) {
        if (!next.world.worldFlags.includes(flag)) next.world.worldFlags.push(flag)
      }
      next.battle = { ...battle, claimed: true }
      if (battle.waveIndex) {
        next.world.portalWaveBest = Math.max(next.world.portalWaveBest ?? 0, battle.waveIndex)
        if (battle.waveIndex >= CLAN_RECRUITMENT_WAVE && !save.character.clan.clanId)
          next.eventLog.push(`ClanRecruitmentWaveReached:${battle.waveIndex}`)
      }
      if (battle.clanTrialQuestId && battle.clanTrialRunId) {
        const progress=claimClanTrialWave(next,battle.clanTrialQuestId,battle.clanTrialRunId,battle.encounterId,acquiredAt)
        if(!progress.ok)return failAction(progress.message)
        next=progress.value
        if(next.clanTrialRun?.phase==='won')
          next=applyQuestEvent(next,{type:'completeRite',targetId:battle.clanTrialQuestId},content,acquiredAt)
      } else if (battle.dungeonEncounterId) {
        if (save.dungeonRun?.runId !== battle.dungeonRunId) return failAction('Tentativa da dungeon incompatível.')
        const progress = claimDungeonEncounter(next, battle.dungeonEncounterId, acquiredAt)
        if (!progress.ok) return failAction(progress.message)
        next = progress.save
        if (battle.dungeonEncounterId === FUNGAL_BOSS_ENCOUNTER_ID &&
            next.world.trailNodeStates.astravel_boss_preview === 'bossCurrent') {
          const trail = content.trails.trail_astravel_entry
          const cleared = completeTrailNode(next, trail, trail.nodes[trail.nodes.length - 1].id, acquiredAt)
          if (!cleared.ok) return failAction(cleared.message)
          next = cleared.value.save
        }
        if (!next.world.completedEncounterIds.includes(battle.encounterId))
          next.world.completedEncounterIds.push(battle.encounterId)
      } else if (!battle.waveIndex && !battle.portalHuntId && !battle.clanBossQuestId) {
        const trail = getTrailByNodeId(content, battle.trailNodeId)
        if (!trail) return failAction('A trilha deste encontro não foi encontrada.')
        const trailResult = completeTrailNode(next, trail, battle.trailNodeId, acquiredAt)
        if (!trailResult.ok) return failAction(trailResult.message)
        next = trailResult.value.save
        if (!next.world.completedEncounterIds.includes(battle.encounterId)) {
          next.world.completedEncounterIds.push(battle.encounterId)
        }
      }
      // Persist precisely which species were defeated: dynamic Portal waves share
      // an encounter ID and cannot be reconstructed from the static catalog.
      const defeatedSpecies = [...new Set(Object.values(battle.combatants)
        .filter((combatant) => combatant.side === 'enemy' && !combatant.alive)
        .map((combatant) => combatant.definitionId))]
      next.eventLog.push(...defeatedSpecies.filter((id) => !next.eventLog.includes(`EnemyStudied:${id}`))
        .map((id) => `EnemyStudied:${id}`))
      next.eventLog.push(`BattleWon:${battle.encounterId}`, `DropReceived:${loot.length}`)
      next.updatedAt = acquiredAt
      if (!battle.waveIndex && !battle.portalHuntId && !battle.clanTrialQuestId && !battle.clanBossQuestId && (!battle.dungeonEncounterId || battle.dungeonEncounterId === FUNGAL_BOSS_ENCOUNTER_ID)) {
        next = applyQuestEvent(next, { type: 'visit', targetId: battle.trailNodeId }, content, acquiredAt)
      }
      for (const item of loot) {
        next = applyQuestEvent(next, { type: 'collect', targetId: item.definitionId, amount: item.quantity }, content, acquiredAt)
      }
      for (const enemy of Object.values(battle.combatants).filter(
        (combatant) => combatant.side === 'enemy' && !combatant.alive,
      )) {
        next = applyQuestEvent(
          next,
          { type: 'kill', targetId: enemy.definitionId },
          content,
          acquiredAt,
        )
      }
      // The Emblem is a real inventory delivery objective after claiming the boss drop.
      next = refreshDeliveryQuestProgress(next, content, acquiredAt)
      next = refreshQuestAvailability(next, content, acquiredAt)
      commit(next)
      show(
        'Vitória',
        battle.clanBossQuestId ? 'Golem vencido! Retorne ao seu líder no Salão para entregar a missão.'
          : battle.clanTrialQuestId ? `Prova de Clã: onda vencida. Retorne ao Salão dos Clãs.`
          : battle.waveIndex
          ? `Onda ${battle.waveIndex} concluída: ${loot.length} itens recebidos. Você pode continuar ou retornar a Terran.`
          : battle.portalHuntId ? `Caçada concluída: ${loot.length} itens recebidos. Retorne ao Portal para outra caçada.`
          : battle.dungeonEncounterId
            ? 'Estágio concluído. Continue pela sala atual ou avance na dungeon.'
            : loot.length > 0
              ? `${loot.length} drop entrou no inventário. A trilha avançou para o próximo nó.`
              : 'A trilha avançou para o próximo nó.',
        'success',
      )
    },

    finishBattleIntoExpedition: () => {
      const save = get().save
      if (!save?.battle || save.battle.phase !== 'Victory' || !save.battle.claimed) {
        return failAction('Receba as recompensas antes de continuar a expedição.')
      }
      const next = structuredClone(save)
      if (next.battle?.clanBossQuestId) next.world.currentLocationId = 'location_terran_clan_hall'
      next.battle = null
      next.updatedAt = nowIso()
      next.revision += 1
      next.eventLog.push('BattleExitedToExpedition')
      commit(next)
    },

    returnToTerran: () => {
      const save = get().save
      if (!save) return
      if (save.battle?.phase === 'Defeat') {
        const revived = respawnDefeatedPlayer(save, nowIso())
        if (!revived.ok) return failAction(revived.message)
        commit(revived.value)
        show('Despertar na Base', 'Você acordou com 1 PV. Descanse na cama para recuperar Vida e Mana.', 'info')
        return
      }
      if (save.battle && !(save.battle.phase === 'Victory' && save.battle.claimed)) {
        return failAction('Finalize o combate e receba as recompensas antes de retornar.')
      }
      const next = structuredClone(save)
      next.battle = null
      next.dungeonRun = null
      const destination = save.battle?.clanBossQuestId ? 'location_terran_clan_hall' : 'location_terran_portal_plaza'
      next.world.currentLocationId = destination
      if (!next.world.unlockedLocationIds.includes(destination)) {
        next.world.unlockedLocationIds.push(destination)
      }
      next.updatedAt = nowIso()
      next.revision += 1
      next.eventLog.push('ReturnedToTerran:location_terran_portal_plaza')
      commit(next)
    },

    convertItems: (instanceIds) => {
      const save = get().save
      if (!save) return
      if (save.battle || save.world.currentLocationId !== MARKET_LOCATION_ID) return failAction('Troque itens por Essência com Lorian no Mercado.')
      const result = convertInventoryItems(save.inventory, save.essence, instanceIds, content, save.character.basicArmorInstanceId ? [save.character.basicArmorInstanceId] : [])
      if (!result.ok) return failAction(result.message)
      const next = structuredClone(save)
      next.inventory = result.value.inventory
      next.essence = result.value.essence
      next.updatedAt = nowIso()
      next.revision += 1
      next.eventLog.push(`ItemConverted:${result.value.removedInstanceIds.join(',')}`)
      commit(next)
      const points = result.value.gainedPoints
      show(
        points > 0 ? `+${points} Ponto de Essência` : `+${result.value.rawEssence} Essência`,
        points > 0
          ? 'A barra completou. A Skill Tree já pode receber um novo investimento.'
          : 'A Essência excedente foi preservada na barra.',
        'success',
      )
    },

    sellItems: (instanceIds) => {
      const save = get().save
      if (!save) return
      if (save.battle || save.world.currentLocationId !== MARKET_LOCATION_ID) return failAction('Venda itens por Ouro com Feril no Mercado.')
      const result = sellInventoryItems(save.inventory, save.wallet.gold, instanceIds, content, save.character.basicArmorInstanceId ? [save.character.basicArmorInstanceId] : [])
      if (!result.ok) return failAction(result.message)
      const next = structuredClone(save)
      next.inventory = result.value.inventory
      next.wallet.gold = result.value.gold
      next.updatedAt = nowIso()
      next.revision += 1
      next.eventLog.push(`ItemSold:${result.value.removedInstanceIds.join(',')}`)
      commit(next)
      show(`+${result.value.gainedGold} Ouro`, 'O drop foi convertido em recursos econômicos.', 'success')
    },

    toggleFavorite: (instanceId) => {
      const save = get().save
      if (!save) return
      const next = structuredClone(save)
      const item = next.inventory.find((instance) => instance.instanceId === instanceId)
      if (!item) return
      item.favorite = !item.favorite
      next.updatedAt = nowIso()
      next.revision += 1
      commit(next)
    },

    performGradeTwoRite: (boundItemId, fragmentInstanceId) => {
      const save = get().save
      if (!save) return
      const result = performGradeTwoRite(
        save,
        boundItemId,
        fragmentInstanceId,
        content,
        nowIso(),
      )
      if (!result.ok) return failAction(result.message)
      commit(result.value)
      show(
        'Vínculo elevado ao Grau II',
        'A primeira Essência foi incorporada e um novo ramo da Skill Tree foi revelado.',
        'success',
      )
    },

    performGradeThreeRite: (boundItemId, gemInstanceId) => {
      const save = get().save
      if (!save) return
      const result = performGradeThreeRite(
        save,
        boundItemId,
        gemInstanceId,
        content,
        nowIso(),
      )
      if (!result.ok) return failAction(result.message)
      commit(result.value)
      show(
        'Vínculo elevado ao Grau III',
        'A primeira Joia foi lapidada, seus efeitos estão ativos e novos ramos foram revelados.',
        'success',
      )
    },

    unlockNode: (nodeId) => {
      const save = get().save
      if (!save) return
      const node = content.skillTreeNodes[nodeId]
      if (!node) return failAction('Node desconhecido.')
      const result = unlockSkillNode(save, node, content, nowIso())
      if (!result.ok) return failAction(result.message)
      commit(result.value)
      show('Node desbloqueado', `${node.name} agora faz parte do Vínculo.`, 'success')
    },

    resetCampaign: async () => {
      const save = get().save
      if (!save) return false
      set({ syncStatus: 'saving', error: null })
      await flushPersistence()
      const campaignSeed = {
        campaignId: createRandomId(),
        campaignGeneration: save.campaignGeneration + 1,
      }
      const resetEvent = requestCampaignReset(save, campaignSeed.campaignId, nowIso())
      if (!resetEvent.ok) {
        show('Reset não concluído', resetEvent.message, 'error')
        return false
      }
      try {
        saveAccountSettings(save.ownerId, save.settings)
        const mode = await resetCampaignEverywhere(save, resetEvent.value)
        set({
          save: null,
          campaignSeed,
          preservedSettings: save.settings,
          characterAccess: 'creating',
          status: 'ready',
          syncStatus: 'saved',
          syncMode: mode,
          error: null,
        })
        show('Campanha resetada', 'O progresso foi apagado. Sua conta continua ativa.', 'success')
        return true
      } catch (error) {
        const message = error instanceof Error ? error.message : 'Falha ao resetar a campanha.'
        set({ syncStatus: 'error', error: message })
        show('Reset não concluído', message, 'error')
        return false
      }
    },

    setSoundEnabled: (enabled) => {
      const current = get().save
      if (!current || current.settings.soundEnabled === enabled) return
      const next = structuredClone(current)
      next.settings.soundEnabled = enabled
      next.revision += 1
      next.updatedAt = nowIso()
      commit(next)
      if (enabled) playGameplaySfx('success', true)
    },

    clearNotification: () => set({ notification: null }),
    resetSession: () => {
      activeBootSequence += 1
      set({
        status: 'idle',
        syncStatus: 'idle',
        syncMode: null,
        ownerId: null,
        save: null,
        characterAccess: 'idle',
        campaignSeed: null,
        preservedSettings: null,
        error: null,
        notification: null,
      })
    },
  }
})
