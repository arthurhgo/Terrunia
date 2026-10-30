import type { ContentCatalog } from '../../content/catalog'
import type { GameSave } from '../game/types'
import { fail, ok, type Result } from '../shared/types'

export const MARKET_LOCATION_ID = 'location_terran_bond_workshop' as const

/** BALANCE_DRAFT: trade offers are separated by the NPC who actually sells them. */
export const MARKET_STOCK = [
  { npcId: 'presence_valmira', itemId: 'fragment_mycelial_essence', price: 180 },
  { npcId: 'presence_valmira', itemId: 'item_gem_esmeralda_crescimento', price: 260 },
  { npcId: 'presence_valmira', itemId: 'consumable_field_rune', price: 30 },
  { npcId: 'presence_edran', itemId: 'consumable_resonance_flask', price: 24 },
  { npcId: 'presence_edran', itemId: 'consumable_vital_essence', price: 26 },
  { npcId: 'presence_edran', itemId: 'consumable_field_compress', price: 8 },
] as const

export const MARKET_SERVICES = {
  presence_lithwynn: 'infusion',
  presence_valmira: 'merchant',
  presence_talia: 'lapidation',
  presence_edran: 'supplies',
  presence_feril: 'gold',
  presence_lorian: 'essence',
} as const

export type MarketNpcId = keyof typeof MARKET_SERVICES

export function isMarketNpc(presenceId: string): presenceId is MarketNpcId {
  return Object.prototype.hasOwnProperty.call(MARKET_SERVICES, presenceId)
}

/** Validate every purchase against market location, merchant catalog and available Gold. */
export function buyMarketItem(
  save: GameSave, npcId: string, itemId: string, quantity: number,
  catalog: ContentCatalog, now: string,
): Result<GameSave> {
  if (save.battle || save.world.currentLocationId !== MARKET_LOCATION_ID) {
    return fail('MARKET_LOCATION', 'Compre itens dentro do Mercado de Terran.')
  }
  const offer = MARKET_STOCK.find((entry) => entry.npcId === npcId && entry.itemId === itemId)
  const item = catalog.items[itemId]
  if (!offer || !item || item.questLocked || item.category === 'quest' || item.category === 'lore') {
    return fail('MARKET_OFFER', 'Este NPC não vende o item selecionado.')
  }
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
    return fail('MARKET_QUANTITY', 'Escolha entre 1 e 99 unidades.')
  }
  const cost = offer.price * quantity
  if (!Number.isSafeInteger(cost) || save.wallet.gold < cost) {
    return fail('MARKET_GOLD', 'Ouro insuficiente para a compra.')
  }
  const next = structuredClone(save)
  const instanceId = `market_${save.saveId}_${save.revision + 1}`
  if (next.inventory.some((entry) => entry.instanceId === instanceId)) {
    return fail('MARKET_DUPLICATE', 'Esta compra já foi registrada.')
  }
  next.inventory.push({
    instanceId, definitionId: item.id, quantity, rarity: item.rarity,
    locked: false, favorite: false, acquiredAt: now,
  })
  next.wallet.gold -= cost
  next.updatedAt = now
  next.revision += 1
  next.eventLog.push(`MarketPurchase:${npcId}:${itemId}:${quantity}:${cost}`)
  return ok(next)
}
