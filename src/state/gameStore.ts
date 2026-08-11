import { create } from 'zustand'
import { content } from '../content/catalog'
import {
  gainBoundResonance,
  performGradeThreeRite,
  performGradeTwoRite,
} from '../domain/bond/boundItems'
import { createBattle, submitBattleCommand } from '../domain/combat/engine'
import type { BattleCommand } from '../domain/combat/types'
import {
  completeTrailNode,
  getActiveTrailNode,
  getCurrentTrailNode,
  getTrailByNodeId,
  resolveTrailInteraction,
} from '../domain/exploration/trailEngine'
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
  resolveCurrentTrailNode: () => void
  startBattle: (nodeId?: string) => void
  submitBattleCommand: (command: BattleCommand) => void
  claimBattleRewards: () => void
  returnToTerran: () => void
  convertItems: (instanceIds: string[]) => void
  sellItems: (instanceIds: string[]) => void
  toggleFavorite: (instanceId: string) => void
  performGradeTwoRite: (boundItemId: string, fragmentInstanceId: string) => void
  performGradeThreeRite: (boundItemId: string, gemInstanceId: string) => void
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

    resolveCurrentTrailNode: () => {
      const save = get().save
      if (!save) return
      const trail = content.trails.trail_astravel_entry
      const node = getCurrentTrailNode(save, trail)
      if (!node) return failAction('Não existe uma interação atual na trilha.')
      const now = nowIso()
      const result = resolveTrailInteraction(save, trail, node.id, content, now)
      if (!result.ok) return failAction(result.message)
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
      const encounter = content.encounters[node.encounterId]
      if (!encounter) return failAction('Conteúdo do encontro não encontrado.')
      const next = structuredClone(save)
      next.battle = createBattle(next, encounter, content)
      next.world.currentLocationId = node.id
      next.updatedAt = nowIso()
      next.revision += 1
      next.eventLog.push(`BattleStarted:${encounter.id}`)
      commit(next)
    },

    submitBattleCommand: (command) => {
      const save = get().save
      if (!save?.battle) return failAction('Nenhuma batalha está ativa.')
      const consumedBefore = new Set(save.battle.consumedItemInstanceIds)
      const result = submitBattleCommand(save.battle, command, content, save.inventory)
      if (!result.ok) return failAction(result.message)
      const next = structuredClone(save)
      next.battle = result.value
      const consumedNow = result.value.consumedItemInstanceIds.filter(
        (instanceId) => !consumedBefore.has(instanceId),
      )
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
      next.character.xp += battle.rewards.characterXp
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
      const trail = getTrailByNodeId(content, battle.trailNodeId)
      if (!trail) return failAction('A trilha deste encontro não foi encontrada.')
      const trailResult = completeTrailNode(next, trail, battle.trailNodeId, acquiredAt)
      if (!trailResult.ok) return failAction(trailResult.message)
      next = trailResult.value.save
      if (!next.world.completedEncounterIds.includes(battle.encounterId)) {
        next.world.completedEncounterIds.push(battle.encounterId)
      }
      next.eventLog.push(`BattleWon:${battle.encounterId}`, `DropReceived:${loot.length}`)
      next.updatedAt = acquiredAt
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
        loot.length > 0
          ? `${loot.length} drop entrou no inventário. A trilha avançou para o próximo nó.`
          : 'A trilha avançou para o próximo nó.',
        'success',
      )
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
