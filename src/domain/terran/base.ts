import type { GameSave, InventoryItemInstance } from '../game/types'
import type { ContentCatalog } from '../../content/catalog'
import { fail, ok, type Result } from '../shared/types'

/** This is a private interior, not a new city institution. */
export const BASE_LOCATION_ID = 'location_terran_base'
export const BASE_RETURN_LOCATION_ID = 'location_terran_portal_plaza'
export const PLAYER_HOME_KEY_ITEM_ID = 'quest_daeryn_home_key'
export const PLAYER_HOME_DOOR_OPENED_FLAG = 'player_home_door_opened'
export const PLAYER_HOME_KEY_USED_FLAG = 'player_home_key_used'

/** Neither completed quests nor old "door opened" flags authorize entry.
 * The key-use marker is written only by the explicit door interaction. */
export const isPlayerHomeDoorOpen = (save: GameSave) =>
  save.quests.main_terran_first_home?.status === 'completed' &&
  save.world.worldFlags.includes(PLAYER_HOME_DOOR_OPENED_FLAG) &&
  save.world.worldFlags.includes(PLAYER_HOME_KEY_USED_FLAG)
export const hasPlayerHomeKey = (save: GameSave) => save.inventory.some((item) =>
  item.definitionId === PLAYER_HOME_KEY_ITEM_ID && item.quantity > 0)


/** Changing scenes never updates global trail/quest progress. */
export function enterPlayerBase(save: GameSave, now: string): Result<GameSave> {
  if (save.battle) return fail('BASE_IN_BATTLE', 'Não é possível entrar na Base durante um combate.')
  if (!['terran', BASE_LOCATION_ID, ...[
    'location_terran_portal_plaza', 'location_terran_eldamar_house',
    'location_terran_vorren_post', 'location_terran_bond_workshop',
    'location_terran_zareth_barracks', 'location_terran_clan_hall',
    'location_terran_daeryn_house', 'location_terran_forge',
  ]].includes(save.world.currentLocationId)) return fail('BASE_OUTSIDE_TERRAN', 'Retorne a Terran antes de entrar na Base.')
  if (!isPlayerHomeDoorOpen(save)) return fail('BASE_DOOR_LOCKED', 'A porta está trancada. Conclua a missão de Daeryn e use a chave na porta.')
  if (save.world.currentLocationId === BASE_LOCATION_ID) return ok(save)
  const next = structuredClone(save)
  next.world.currentLocationId = BASE_LOCATION_ID
  if (!next.world.unlockedLocationIds.includes(BASE_LOCATION_ID)) next.world.unlockedLocationIds.push(BASE_LOCATION_ID)
  next.revision += 1
  next.updatedAt = now
  next.eventLog.push('PlayerEnteredBase')
  return ok(next)
}

/** One deliberate interaction on the actual home door. Consumes the unique key,
 * opens the door permanently and enters the home as a single save transaction.
 */
export function unlockPlayerBaseWithDaerynKey(save: GameSave, now: string): Result<GameSave> {
  if (isPlayerHomeDoorOpen(save)) return fail('BASE_ALREADY_OPEN', 'A porta da Base já está destrancada.')
  if (save.quests.main_terran_first_home?.status !== 'completed') {
    return fail('BASE_QUEST_REQUIRED', 'Conclua a missão do alojamento com Daeryn antes de abrir a Base.')
  }
  // The key opens the real door only after the new quest has been consciously accepted.
  // Already-unlocked legacy homes never pass through this first-use branch.
  const doorQuest = save.quests.main_terran_open_base_door
  if (doorQuest && !['active', 'ready_to_turn_in', 'completed'].includes(doorQuest.status)) {
    return fail('BASE_DOOR_QUEST_REQUIRED', 'Aceite a missão Abrir a Base antes de usar a chave na porta.')
  }
  const index = save.inventory.findIndex((item) =>
    item.definitionId === PLAYER_HOME_KEY_ITEM_ID && item.quantity > 0)
  if (index < 0) return fail('BASE_KEY_REQUIRED', 'Você ainda não possui a Chave de Daeryn na mochila.')
  // Reuse the same location/battle safety checks as ordinary entrance.
  const prepared = structuredClone(save)
  prepared.world.worldFlags.push(PLAYER_HOME_DOOR_OPENED_FLAG, PLAYER_HOME_KEY_USED_FLAG)
  const allowed = enterPlayerBase(prepared, now)
  if (!allowed.ok) return allowed
  const next = allowed.value
  const storedIndex = next.inventory.findIndex((item) =>
    item.definitionId === PLAYER_HOME_KEY_ITEM_ID && item.quantity > 0)
  if (storedIndex < 0) return fail('BASE_KEY_REQUIRED', 'A Chave de Daeryn não está disponível.')
  if (next.inventory[storedIndex].quantity === 1) next.inventory.splice(storedIndex, 1)
  else next.inventory[storedIndex].quantity -= 1
  next.eventLog.push('DaerynKeyUsedOnHomeDoor')
  return ok(next)
}

export function leavePlayerBase(save: GameSave, now: string): Result<GameSave> {
  if (save.battle || save.world.currentLocationId !== BASE_LOCATION_ID) return fail('NOT_AT_BASE', 'Entre na Base antes de sair.')
  const next = structuredClone(save)
  next.world.currentLocationId = BASE_RETURN_LOCATION_ID
  if (!next.world.unlockedLocationIds.includes(BASE_RETURN_LOCATION_ID)) next.world.unlockedLocationIds.push(BASE_RETURN_LOCATION_ID)
  next.revision += 1
  next.updatedAt = now
  next.eventLog.push('PlayerLeftBase')
  return ok(next)
}

/** No invented death penalty. Player wakes with 1 HP and 0 MP, and may rest. */
export function respawnDefeatedPlayer(save: GameSave, now: string): Result<GameSave> {
  if (save.battle?.phase !== 'Defeat' || save.battle.combatants.combatant_player.hp > 0) {
    return fail('NO_DEFEAT', 'Só é possível despertar na Base depois de cair em combate.')
  }
  const next = structuredClone(save)
  next.battle = null
  // Before the key is used, respawn at the public plaza, not inside the locked home.
  const destination = isPlayerHomeDoorOpen(save) ? BASE_LOCATION_ID : BASE_RETURN_LOCATION_ID
  next.world.currentLocationId = destination
  if (!next.world.unlockedLocationIds.includes(destination)) next.world.unlockedLocationIds.push(destination)
  next.vitals = { hp: 1, mp: 0 }
  next.revision += 1
  next.updatedAt = now
  next.eventLog.push(destination === BASE_LOCATION_ID ? 'PlayerRespawnedAtBase' : 'PlayerRespawnedAtPlaza')
  return ok(next)
}

/** Legacy saves may predate Daeryn's physical key. Reconcile on load without
 * resetting completed quests, items, HP, Vínculos or previous exploration.
 */
export function reconcileLegacyHomeKey(save: GameSave): GameSave {
  const questDone = save.quests.main_terran_first_home?.status === 'completed'
  const usedInDoor = questDone && save.eventLog.includes('DaerynKeyUsedOnHomeDoor')
  const inside = save.world.currentLocationId === BASE_LOCATION_ID
  const keyInChest = save.baseStorage.some((item) =>
    item.definitionId === PLAYER_HOME_KEY_ITEM_ID && item.quantity > 0)
  const needsFlags = usedInDoor && !isPlayerHomeDoorOpen(save)
  const staleFlags = !usedInDoor && (save.world.worldFlags.includes(PLAYER_HOME_DOOR_OPENED_FLAG) ||
    save.world.worldFlags.includes(PLAYER_HOME_KEY_USED_FLAG))
  const needsRelocation = inside && !usedInDoor
  const needsKey = questDone && !usedInDoor && !hasPlayerHomeKey(save) && !keyInChest
  const needsRetrieveKey = questDone && !usedInDoor && keyInChest
  if (!needsFlags && !staleFlags && !needsRelocation && !needsKey && !needsRetrieveKey) return save

  const next = structuredClone(save)
  if (staleFlags) {
    next.world.worldFlags = next.world.worldFlags.filter((flag) =>
      flag !== PLAYER_HOME_DOOR_OPENED_FLAG && flag !== PLAYER_HOME_KEY_USED_FLAG)
    next.eventLog.push('HomeDoorLegacyBypassRevoked')
  }
  if (needsFlags) {
    for (const flag of [PLAYER_HOME_DOOR_OPENED_FLAG, PLAYER_HOME_KEY_USED_FLAG]) {
      if (!next.world.worldFlags.includes(flag)) next.world.worldFlags.push(flag)
    }
    next.eventLog.push('HomeDoorKeyUsageReconciled')
  }
  if (needsRelocation) {
    next.world.currentLocationId = BASE_RETURN_LOCATION_ID
    if (!next.world.unlockedLocationIds.includes(BASE_RETURN_LOCATION_ID)) {
      next.world.unlockedLocationIds.push(BASE_RETURN_LOCATION_ID)
    }
    next.eventLog.push('HomeDoorLocked:ReturnedToPlaza')
  }
  if (needsRetrieveKey) {
    const index = next.baseStorage.findIndex((item) => item.definitionId === PLAYER_HOME_KEY_ITEM_ID && item.quantity > 0)
    if (index >= 0) next.inventory.push(...next.baseStorage.splice(index, 1))
    next.eventLog.push('LegacyHomeKeyRetrieved')
  }
  if (needsKey) {
    next.inventory.push({
      instanceId: `quest_reward_main_terran_first_home_${save.saveId}_${PLAYER_HOME_KEY_ITEM_ID}`,
      definitionId: PLAYER_HOME_KEY_ITEM_ID, quantity: 1, rarity: 'unique',
      locked: true, favorite: false, acquiredAt: next.updatedAt,
    })
    next.eventLog.push('LegacyHomeKeyGranted')
  }
  next.revision += 1
  return next
}

export type BaseChestTransfer = 'deposit' | 'withdraw'

/** Stores only temporary items, not permanent bound equipment. No duplicate instance IDs. */
export function transferBaseChestItem(
  save: GameSave,
  direction: BaseChestTransfer,
  instanceId: string,
  quantity: number,
  catalog: ContentCatalog,
  now: string,
): Result<GameSave> {
  if (save.world.currentLocationId !== BASE_LOCATION_ID || save.battle) {
    return fail('CHEST_LOCATION', 'O baú pessoal só pode ser usado dentro da Base, fora de combate.')
  }
  if (direction === 'deposit' && save.character.basicArmorInstanceId === instanceId) {
    return fail('CHEST_EQUIPPED', 'Retire a proteção antes de guardá-la no baú.')
  }
  const source = direction === 'deposit' ? save.inventory : save.baseStorage
  const sourceItem = source.find((item) => item.instanceId === instanceId)
  if (!sourceItem || !catalog.items[sourceItem.definitionId]) return fail('CHEST_ITEM', 'Item inexistente ou indisponível.')
  if (direction === 'deposit' && sourceItem.locked) return fail('CHEST_LOCKED', 'Desbloqueie o item antes de guardá-lo.')
  if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > sourceItem.quantity) {
    return fail('CHEST_QUANTITY', 'A quantidade escolhida não está disponível.')
  }
  const next = structuredClone(save)
  const from = direction === 'deposit' ? next.inventory : next.baseStorage
  const to = direction === 'deposit' ? next.baseStorage : next.inventory
  const i = from.findIndex((item) => item.instanceId === instanceId)
  const moving: InventoryItemInstance = { ...from[i], quantity }
  if (quantity === from[i].quantity) {
    from.splice(i, 1)
  } else {
    from[i].quantity -= quantity
    moving.instanceId = `base_${next.saveId}_${next.revision + 1}_${direction}`
  }
  if (to.some((item) => item.instanceId === moving.instanceId)) return fail('CHEST_DUPLICATE', 'Instância duplicada no baú.')
  to.push(moving)
  next.revision += 1
  next.updatedAt = now
  next.eventLog.push(`BaseChest:${direction}:${moving.definitionId}:${quantity}`)
  return ok(next)
}
