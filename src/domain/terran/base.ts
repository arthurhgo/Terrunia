import type { GameSave, InventoryItemInstance } from '../game/types'
import type { ContentCatalog } from '../../content/catalog'
import { fail, ok, type Result } from '../shared/types'

/** This is a private interior, not a new city institution. */
export const BASE_LOCATION_ID = 'location_terran_base'
export const BASE_RETURN_LOCATION_ID = 'location_terran_portal_plaza'

/** Changing scenes never updates global trail/quest progress. */
export function enterPlayerBase(save: GameSave, now: string): Result<GameSave> {
  if (save.battle) return fail('BASE_IN_BATTLE', 'Não é possível entrar na Base durante um combate.')
  if (!['terran', BASE_LOCATION_ID, ...[
    'location_terran_portal_plaza', 'location_terran_eldamar_house',
    'location_terran_vorren_post', 'location_terran_bond_workshop',
    'location_terran_zareth_barracks', 'location_terran_clan_hall',
    'location_terran_daeryn_house', 'location_terran_forge',
  ]].includes(save.world.currentLocationId)) return fail('BASE_OUTSIDE_TERRAN', 'Retorne a Terran antes de entrar na Base.')
  if (save.world.currentLocationId === BASE_LOCATION_ID) return ok(save)
  const next = structuredClone(save)
  next.world.currentLocationId = BASE_LOCATION_ID
  if (!next.world.unlockedLocationIds.includes(BASE_LOCATION_ID)) next.world.unlockedLocationIds.push(BASE_LOCATION_ID)
  next.revision += 1
  next.updatedAt = now
  next.eventLog.push('PlayerEnteredBase')
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
  next.world.currentLocationId = BASE_LOCATION_ID
  if (!next.world.unlockedLocationIds.includes(BASE_LOCATION_ID)) next.world.unlockedLocationIds.push(BASE_LOCATION_ID)
  next.vitals = { hp: 1, mp: 0 }
  next.revision += 1
  next.updatedAt = now
  next.eventLog.push('PlayerRespawnedAtBase')
  return ok(next)
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
