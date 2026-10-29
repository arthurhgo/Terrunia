import type { ContentCatalog } from '../../content/catalog'
import { BASE_LOCATION_ID } from './base'
import { deriveCharacterStats } from '../character/derivedStats'
import type { GameSave } from '../game/types'
import { fail, ok, type Result } from '../shared/types'

/** BALANCE_DRAFT — preços e estoque ajustáveis sem alterar os itens vinculados. */
export const SYLWEN_STOCK = [
  { itemId: 'consumable_minor_tonic', price: 20 },
  { itemId: 'consumable_simple_ether', price: 18 },
  { itemId: 'consumable_antidote', price: 16 },
  { itemId: 'consumable_field_compress', price: 8 },
] as const

export const PLAYER_HOME_FLAG = 'player_home_unlocked'
export const PREPARE_HOME_OBJECTIVE = 'prepare_player_home'

export const buyFromSylwen = (
  save: GameSave,
  itemId: string,
  quantity: number,
  catalog: ContentCatalog,
  now: string,
): Result<GameSave> => {
  if (save.battle || save.world.currentLocationId !== 'location_terran_daeryn_house') {
    return fail('SHOP_LOCATION', 'O Balcão de Sylwen fica na Casa de Daeryn, em Terran.')
  }
  const stock = SYLWEN_STOCK.find((entry) => entry.itemId === itemId)
  const item = catalog.items[itemId]
  if (!stock || !item || item.category !== 'consumable') return fail('SHOP_ITEM', 'Item indisponível no balcão.')
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) return fail('SHOP_QUANTITY', 'Escolha entre 1 e 99 unidades.')
  const cost = stock.price * quantity
  if (!Number.isSafeInteger(cost) || save.wallet.gold < cost) return fail('SHOP_GOLD', 'Ouro insuficiente para a compra.')

  const next = structuredClone(save)
  // Ancorar a instância à revisão torna a operação determinística por compra.
  const instanceId = `sylwen_${save.saveId}_${save.revision + 1}`
  if (next.inventory.some((entry) => entry.instanceId === instanceId)) return fail('SHOP_DUPLICATE', 'Esta compra já foi registrada.')
  next.wallet.gold -= cost
  next.inventory.push({
    instanceId, definitionId: item.id, quantity, rarity: item.rarity,
    locked: false, favorite: false, acquiredAt: now,
  })
  next.updatedAt = now
  next.revision += 1
  next.eventLog.push(`ShopPurchase:${item.id}:${quantity}:${cost}`)
  return ok(next)
}

export const restAtHome = (save: GameSave, catalog: ContentCatalog, now: string): Result<GameSave> => {
  if (save.battle || save.world.currentLocationId !== BASE_LOCATION_ID) return fail('REST_UNAVAILABLE', 'É necessário estar dentro da Base para descansar.')

  const stats = deriveCharacterStats(save, catalog)
  if (save.vitals.hp === stats.life.value && save.vitals.mp === stats.mana.value) return ok(save)
  const next = structuredClone(save)
  next.vitals = { hp: stats.life.value, mp: stats.mana.value }
  next.updatedAt = now
  next.revision += 1
  next.eventLog.push('PlayerRestedAtHome')
  return ok(next)
}

/** Proteção contra bloqueio da campanha: derrota antes de conquistar a casa. */
export const receiveDaerynAid = (save: GameSave, catalog: ContentCatalog, now: string): Result<GameSave> => {
  if (save.battle || save.world.currentLocationId !== 'location_terran_daeryn_house') {
    return fail('AID_LOCATION', 'A ajuda emergencial é prestada na Casa de Daeryn.')
  }
  if (save.vitals.hp > 0) return fail('AID_NOT_NEEDED', 'A ajuda emergencial é reservada a quem caiu em combate.')
  const stats = deriveCharacterStats(save, catalog)
  const next = structuredClone(save)
  next.vitals = { hp: Math.max(1, Math.ceil(stats.life.value / 2)), mp: Math.ceil(stats.mana.value / 2) }
  next.updatedAt = now
  next.revision += 1
  next.eventLog.push('DaerynEmergencyAid')
  return ok(next)
}
