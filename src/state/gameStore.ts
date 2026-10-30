import { executeForgeRecipe } from '../domain/terran/forge'
import { create } from 'zustand'
import { content } from '../content/catalog'
import {
  gainBoundResonance,
  performGradeThreeRite,
  performGradeTwoRite,
} from '../domain/bond/boundItems'
import { createBattle, submitBattleCommand } from '../domain/combat/engine'
import { createWaveBattle } from '../domain/combat/waves'
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
import { discoverDungeonRoom, dungeonRoomFlag, enterDungeon, exitDungeon, FUNGAL_DUNGEON_ID } from '../domain/exploration/dungeonEngine'
import { bindPrologueWeapon, createNewSave } from '../domain/game/createSave'
import { requestCampaignReset } from '../domain/game/campaignReset'
import type { AttributeId, GameSave, InventoryItemInstance } from '../domain/game/types'
import { convertInventoryItems, sellInventoryItems } from '../domain/inventory/inventory'
import { refreshDeliveryQuestProgress } from '../domain/quests/questInventory'
import {
  acceptQuest as acceptQuestDomain,
  applyQuestEvent,
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
import { buyMarketItem, MARKET_LOCATION_ID } from '../domain/terran/market'
import { enterPlayerBase, leavePlayerBase, respawnDefeatedPlayer, transferBaseChestItem } from '../domain/terran/base'
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
  createGame: (name: string, portraitAssetId: string) => Promise<boolean>
  bindPrologueWeapon: (baseItemId?: string) => boolean
  adjustAttribute: (attributeId: AttributeId, direction: 1 | -1) => void
  discoverEldamar: () => void
  discoverClan: (clanId: string) => void
  offerQuest: (questId: string) => void
  declineQuest: (questId: string) => void
  acceptQuest: (questId: string) => void
  turnInQuest: (questId: string, npcId: string) => void
  setQuestTracked: (questId: string, tracked: boolean) => void
  performSocialTrial: (questId: string) => void
  joinClan: (clanId: string) => void
  unlockClass: (classId: string) => void
  travelInTerran: (locationId: string) => void
  inspectCityLandmark: (landmarkId: string) => void
  preparePlayerHome: () => void
  performTerranQuestTask: (questId: string) => void
  restAtHome: () => void
  enterBase: () => void
  leaveBase: () => void
  transferBaseItem: (direction: 'deposit' | 'withdraw', instanceId: string, quantity: number) => void
  receiveDaerynAid: () => void
  buyFromSylwen: (itemId: string, quantity?: number) => void
  forge: (recipeId: string) => void
  buyFromMarket: (npcId: string, itemId: string, quantity?: number) => void
  recordCutsceneViewed: (sceneId: CutsceneId) => void
  enterAstravel: () => void
  enterFungalChambers: () => void
  discoverFungalRoom: (roomId: string) => void
  exitFungalChambers: () => void
  resolveCurrentTrailNode: () => void
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
    const save = refreshDeliveryQuestProgress(candidate, content, candidate.updatedAt)
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

    createGame: async (name, portraitAssetId) => {
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
      )
      if (preservedSettings) save.settings = preservedSettings
      await commit(save)
      set({ characterAccess: 'granted' })
      show('Terrírian criado', 'Você começa sem Clã, sem Classe e sem build pronta.', 'success')
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
      result.value.vitals.hp = Math.min(result.value.vitals.hp, stats.life.value)
      result.value.vitals.mp = Math.min(result.value.vitals.mp, stats.mana.value)
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
      const accepted = acceptQuestDomain(save, questId, content, nowIso())
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

    turnInQuest: (questId, npcId) => {
      const save = get().save
      if (!save) return
      const completed = turnInQuestDomain(save, questId, npcId, content, nowIso())
      if (!completed.ok) return failAction(completed.message)
      commit(completed.value)
      show('Missão concluída', 'Recompensas aplicadas e registro movido para Concluídas.', 'success')
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
      const next = applyQuestEvent(save, { type: 'interact', targetId: questId }, content, nowIso())
      commit(next)
      show('Prova realizada', 'Retorne ao representante para concluir a avaliação.', 'success')
    },

    joinClan: (clanId) => {
      const save = get().save
      if (!save) return
      const joined = joinClanDomain(save, clanId, content, nowIso())
      if (!joined.ok) return failAction(joined.message)
      commit(joined.value)
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

    travelInTerran: (locationId) => {
      const save = get().save
      if (!save) return
      if (save.battle || save.world.currentLocationId === FUNGAL_DUNGEON_ID || content.trails.trail_astravel_entry.nodes.some((node) => node.id === save.world.currentLocationId)) {
        return failAction('Registre o retorno da expedição antes de circular por Terran.')
      }
      const result = visitTerranLocation(save, locationId, content, nowIso())
      if (!result.ok) return failAction(result.message)
      if (result.value.save !== save) commit(result.value.save)
      if (result.value.firstVisit) {
        show(
          'Local descoberto',
          `${content.terranLocations[locationId].name} agora faz parte do seu minimapa.`,
          'success',
        )
      }
    },

    performTerranQuestTask: (questId) => {
      const save = get().save
      const definition = content.quests[questId]
      const objective = definition?.objectives.find((entry) => entry.type === 'interact')
      if (!save || !definition || definition.category !== 'main' || !objective) return failAction('Interação indisponível.')
      if (definition.terranFlow?.active !== save.world.currentLocationId) {
        return failAction('Este objetivo precisa ser realizado no local indicado pela missão.')
      }
      if (save.quests[questId]?.status !== 'active') return failAction('Aceite primeiro esta missão.')
      const next = applyQuestEvent(save, { type: 'interact', targetId: objective.targetId }, content, nowIso())
      commit(next)
      show('Objetivo realizado', `Retorne a ${content.npcs[definition.turnInNpcId]?.name ?? 'quem entregou a missão'} para receber a recompensa.`, 'success')
    },

    preparePlayerHome: () => {
      get().performTerranQuestTask('main_terran_first_home')
    },

    enterBase: () => {
      const save = get().save
      if (!save) return
      const result = enterPlayerBase(save, nowIso())
      if (!result.ok) return failAction(result.message)
      if (result.value !== save) commit(result.value)
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

    forge: (recipeId) => {
      const save = get().save
      if (!save) return
      const result = executeForgeRecipe(save, recipeId, content, nowIso())
      if (!result.ok) return failAction(result.message)
      commit(result.value)
      show('Forja concluída', 'O trabalho de Durnan foi registrado. Consulte os novos caminhos da sua arma.', 'success')
    },

    buyFromMarket: (npcId, itemId, quantity = 1) => {
      const save = get().save
      if (!save) return
      const result = buyMarketItem(save, npcId, itemId, quantity, content, nowIso())
      if (!result.ok) return failAction(result.message)
      commit(result.value)
      show('Compra realizada', `${quantity}× ${content.items[itemId].name} recebido no Mercado.`, 'success')
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
        resumed.world.currentLocationId = activeNode?.id ?? 'astravel_boss_preview'
        resumed.updatedAt = nowIso()
        resumed.revision += 1
        resumed.eventLog.push(completedBoss && !activeNode ? 'ExpeditionRevisited:trail_astravel_entry' : 'ExpeditionResumed:trail_astravel_entry')
        commit(resumed)
        show('Astravél', completedBoss && !activeNode ? 'A ruína concluída pode ser visitada sem repetir recompensas.' : 'A expedição foi retomada na etapa já alcançada.', 'info')
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

    enterFungalChambers: () => {
      const save = get().save
      if (!save) return
      const boss = content.trails.trail_astravel_entry.nodes.find((node) => node.type === 'boss')!
      if (save.world.trailNodeStates[boss.id] !== 'completed') {
        const gate = checkTrailQuestGate(save, boss, content)
        if (!gate.ok) return failAction(gate.message)
      }
      const result = enterDungeon(save, content.dungeons.dungeon_fungal_chambers, nowIso())
      if (!result.ok) return failAction(result.message)
      commit(result.save)
      show('Câmaras Fúngicas', 'A passagem foi aberta. Explore as salas até o núcleo da Ruína.', 'info')
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
      const trail = content.trails.trail_astravel_entry
      const node = getCurrentTrailNode(save, trail)
      if (!node) return failAction('Não existe uma interação atual na trilha.')
      const now = nowIso()
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
      const trail = content.trails.trail_astravel_entry
      const node = nodeId
        ? trail.nodes.find((candidate) => candidate.id === nodeId)
        : getActiveTrailNode(save, trail)
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
      if (!trail.nodes.some((candidate) => candidate.id === save.world.currentLocationId)
        && save.world.currentLocationId !== FUNGAL_DUNGEON_ID) {
        return failAction('Entre em Astravél pelo Portal antes de iniciar este encontro.')
      }
      const questGate = checkTrailQuestGate(save, node, content)
      if (!questGate.ok) return failAction(questGate.message)
      if (node.type === 'boss' && (save.world.currentLocationId !== FUNGAL_DUNGEON_ID
        || !save.world.worldFlags.includes(dungeonRoomFlag('fungal_core')))) {
        return failAction('Alcance o Núcleo da Ruína dentro das Câmaras Fúngicas antes de enfrentar o Colosso.')
      }
      const encounter = content.encounters[node.encounterId]
      if (!encounter) return failAction('Conteúdo do encontro não encontrado.')
      const next = structuredClone(save)
      next.battle = createBattle(next, encounter, content)
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
      const battle = createBattle(next, content.encounters[encounterId], content)
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
      next.updatedAt = nowIso()
      next.revision += 1
      commit(next)
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
      const loot: InventoryItemInstance[] = battle.rewards.lootDefinitionIds.map(
        (definitionId, index) => ({
          instanceId: `${battle.id}_${battle.encounterId}_loot_${index + 1}`,
          definitionId,
          quantity: 1,
          rarity: content.items[definitionId]?.rarity ?? 'common',
          locked: false,
          favorite: false,
          acquiredAt,
        }),
      )
      next.inventory.push(...loot)
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
      }
      if (!battle.waveIndex && !battle.portalHuntId) {
        const trail = getTrailByNodeId(content, battle.trailNodeId)
        if (!trail) return failAction('A trilha deste encontro não foi encontrada.')
        const trailResult = completeTrailNode(next, trail, battle.trailNodeId, acquiredAt)
        if (!trailResult.ok) return failAction(trailResult.message)
        next = trailResult.value.save
        if (!next.world.completedEncounterIds.includes(battle.encounterId)) {
          next.world.completedEncounterIds.push(battle.encounterId)
        }
      }
      next.eventLog.push(`BattleWon:${battle.encounterId}`, `DropReceived:${loot.length}`)
      next.updatedAt = acquiredAt
      if (!battle.waveIndex && !battle.portalHuntId) {
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
      commit(next)
      show(
        'Vitória',
        battle.waveIndex
          ? `Onda ${battle.waveIndex} concluída: ${loot.length} itens recebidos. Você pode continuar ou retornar a Terran.`
          : battle.portalHuntId ? `Caçada concluída: ${loot.length} itens recebidos. Retorne ao Portal para outra caçada.`
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
      next.world.currentLocationId = 'location_terran_portal_plaza'
      if (!next.world.unlockedLocationIds.includes('location_terran_portal_plaza')) {
        next.world.unlockedLocationIds.push('location_terran_portal_plaza')
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
      const result = convertInventoryItems(save.inventory, save.essence, instanceIds, content)
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
      const result = sellInventoryItems(save.inventory, save.wallet.gold, instanceIds, content)
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
