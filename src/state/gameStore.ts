import { create } from 'zustand'
import { content } from '../content/catalog'
import { gainBoundResonance } from '../domain/bond/boundItems'
import { createBattle, submitBattleCommand } from '../domain/combat/engine'
import type { BattleCommand } from '../domain/combat/types'
import { bindPrologueWeapon, createNewSave } from '../domain/game/createSave'
import type { GameSave, InventoryItemInstance } from '../domain/game/types'
import { convertInventoryItems, sellInventoryItems } from '../domain/inventory/inventory'
import { acceptQuest as acceptQuestDomain, applyQuestEvent } from '../domain/quests/questEngine'
import { unlockSkillNode } from '../domain/skillTree/skillTree'
import { loadSynchronizedSave, saveEverywhere, type SyncMode } from '../services/sync/syncService'

type GameStatus = 'idle' | 'loading' | 'ready' | 'error'
type SyncStatus = 'idle' | 'saving' | 'saved' | 'error'

export type GameNotification = {
  id: number
  title: string
  message: string
  tone: 'info' | 'success' | 'warning' | 'error'
}

type GameState = {
  status: GameStatus
  syncStatus: SyncStatus
  syncMode: SyncMode | null
  ownerId: string | null
  save: GameSave | null
  error: string | null
  notification: GameNotification | null
  boot: (ownerId: string) => Promise<void>
  createGame: (name: string, portraitAssetId: string) => void
  bindPrologueWeapon: () => void
  discoverEldamar: () => void
  acceptQuest: (questId: string) => void
  enterAstravel: () => void
  startBattle: () => void
  submitBattleCommand: (command: BattleCommand) => void
  claimBattleRewards: () => void
  returnToTerran: () => void
  convertItems: (instanceIds: string[]) => void
  sellItems: (instanceIds: string[]) => void
  toggleFavorite: (instanceId: string) => void
  unlockNode: (nodeId: string) => void
  clearNotification: () => void
  resetSession: () => void
}

const nowIso = () => new Date().toISOString()
let persistenceQueue = Promise.resolve<void>(undefined)

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
  }

  const commit = (save: GameSave) => {
    set({ save, status: 'ready', error: null })
    persist(save)
  }

  const failAction = (message: string) => show('Ação indisponível', message, 'warning')

  return {
    status: 'idle',
    syncStatus: 'idle',
    syncMode: null,
    ownerId: null,
    save: null,
    error: null,
    notification: null,

    boot: async (ownerId) => {
      set({ status: 'loading', ownerId, error: null })
      try {
        const save = await loadSynchronizedSave(ownerId)
        set({ status: 'ready', save, error: null, syncStatus: save ? 'saved' : 'idle' })
      } catch (error) {
        set({
          status: 'error',
          save: null,
          error: error instanceof Error ? error.message : 'Falha ao carregar o save.',
        })
      }
    },

    createGame: (name, portraitAssetId) => {
      const ownerId = get().ownerId
      const cleanName = name.trim()
      if (!ownerId) return failAction('Nenhum usuário ativo.')
      if (cleanName.length < 2 || cleanName.length > 28) {
        return failAction('O nome deve possuir entre 2 e 28 caracteres.')
      }
      const save = createNewSave(ownerId, cleanName, portraitAssetId, content)
      commit(save)
      show('Terrírian criado', 'Você começa sem Clã, sem Classe e sem build pronta.', 'success')
    },

    bindPrologueWeapon: () => {
      const save = get().save
      if (!save) return failAction('Crie um Terrírian antes de iniciar o prólogo.')
      const result = bindPrologueWeapon(save, content)
      if (!result.ok) return failAction(result.message)
      commit(result.value)
      show('Primeiro Vínculo', 'A Arma Básica alcançou Grau I. Ela não será substituída por drops.', 'success')
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

    acceptQuest: (questId) => {
      const save = get().save
      if (!save) return
      const accepted = acceptQuestDomain(save, questId, content, nowIso())
      if (!accepted.ok) return failAction(accepted.message)
      let next = applyQuestEvent(
        accepted.value,
        { type: 'talk', targetId: 'npc_eldamar' },
        content,
        nowIso(),
      )
      next.world.trailNodeStates.astravel_entry = 'current'
      next.world.trailNodeStates.astravel_fungorro_01 = 'locked'
      commit(next)
      show('Missão aceita', content.quests[questId]?.title ?? questId, 'success')
    },

    enterAstravel: () => {
      const save = get().save
      if (!save) return
      if (save.quests.vs_astravel_first_contact?.status !== 'active') {
        return failAction('Converse com Eldamar e aceite a missão antes de entrar na rota.')
      }
      let next = structuredClone(save)
      next.world.currentLocationId = 'astravel_entry'
      if (!next.world.unlockedLocationIds.includes('astravel_entry')) {
        next.world.unlockedLocationIds.push('astravel_entry')
      }
      next.world.trailNodeStates.astravel_entry = 'completed'
      next.world.trailNodeStates.astravel_fungorro_01 = 'current'
      next.updatedAt = nowIso()
      next.revision += 1
      next.eventLog.push('LocationVisited:astravel_entry')
      next = applyQuestEvent(next, { type: 'visit', targetId: 'astravel_entry' }, content, nowIso())
      commit(next)
      show('Astravél', 'A presença Fungorra foi localizada no próximo nó.', 'info')
    },

    startBattle: () => {
      const save = get().save
      if (!save) return
      if (save.world.trailNodeStates.astravel_fungorro_01 !== 'current') {
        return failAction('Este encontro ainda não está acessível.')
      }
      const enemy = content.enemies.enemy_fungorro_crawler
      if (!enemy) return failAction('Conteúdo do inimigo não encontrado.')
      const next = structuredClone(save)
      next.battle = createBattle(next, enemy, content)
      next.updatedAt = nowIso()
      next.revision += 1
      next.eventLog.push('BattleStarted:encounter_fungorro_01')
      commit(next)
    },

    submitBattleCommand: (command) => {
      const save = get().save
      if (!save?.battle) return failAction('Nenhuma batalha está ativa.')
      const result = submitBattleCommand(save.battle, command)
      if (!result.ok) return failAction(result.message)
      const next = structuredClone(save)
      next.battle = result.value
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
      next.character.xp += battle.rewards.characterXp
      next.wallet.gold += battle.rewards.gold
      const acquiredAt = nowIso()
      const loot: InventoryItemInstance[] = battle.rewards.lootDefinitionIds.map(
        (definitionId, index) => ({
          instanceId: `${battle.id}_loot_${index + 1}`,
          definitionId,
          quantity: 1,
          rarity: content.items[definitionId]?.rarity ?? 'common',
          locked: false,
          favorite: false,
          acquiredAt,
        }),
      )
      next.inventory.push(...loot)
      const weaponId = next.character.bondedEquipment.weapon
      if (weaponId && next.boundItems[weaponId]) {
        next.boundItems[weaponId] = gainBoundResonance(
          next.boundItems[weaponId],
          battle.rewards.boundResonance,
          acquiredAt,
        )
      }
      next.battle = { ...battle, claimed: true }
      next.world.trailNodeStates.astravel_fungorro_01 = 'completed'
      next.world.trailNodeStates.astravel_locked_03 = 'locked'
      if (!next.world.completedEncounterIds.includes(battle.encounterId)) {
        next.world.completedEncounterIds.push(battle.encounterId)
      }
      next.eventLog.push(`BattleWon:${battle.encounterId}`, `DropReceived:${loot.length}`)
      next.updatedAt = acquiredAt
      next.revision += 1
      next = applyQuestEvent(
        next,
        { type: 'kill', targetId: 'enemy_fungorro_crawler' },
        content,
        acquiredAt,
      )
      commit(next)
      show('Vitória', 'O Núcleo Fúngico entrou no inventário. Converta ou venda: a escolha é sua.', 'success')
    },

    returnToTerran: () => {
      const save = get().save
      if (!save) return
      const next = structuredClone(save)
      next.battle = null
      next.world.currentLocationId = 'terran'
      next.updatedAt = nowIso()
      next.revision += 1
      next.eventLog.push('ReturnedToTerran')
      commit(next)
    },

    convertItems: (instanceIds) => {
      const save = get().save
      if (!save) return
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

    clearNotification: () => set({ notification: null }),
    resetSession: () =>
      set({
        status: 'idle',
        syncStatus: 'idle',
        syncMode: null,
        ownerId: null,
        save: null,
        error: null,
        notification: null,
      }),
  }
})
