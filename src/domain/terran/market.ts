import { BACKPACK_UPGRADES, backpackFlag } from '../inventory/backpacks'
import type { ContentCatalog } from '../../content/catalog'
import type { GameSave } from '../game/types'
import { fail, ok, type Result } from '../shared/types'
import { refreshTutorialQuestProgress } from '../quests/tutorialProgress'

export const MARKET_LOCATION_ID = 'location_terran_bond_workshop' as const

/** BALANCE_DRAFT: trade offers are separated by the NPC who actually sells them. */
export const MARKET_STOCK = [
  { npcId: 'presence_neris', itemId: 'equipment_light_leather_vest', price: 25 },
  { npcId: 'presence_neris', itemId: 'equipment_worn_linen_tunic', price: 22 },
  { npcId: 'presence_neris', itemId: 'equipment_apprentice_tunic', price: 28 },
  { npcId: 'presence_edran', itemId: 'material_linen_thread', price: 4 },
  { npcId: 'presence_valmira', itemId: 'drop_ruin_shard', price: 60 },
  { npcId: 'presence_valmira', itemId: 'drop_mycelial_fiber', price: 48 },
  { npcId: 'presence_valmira', itemId: 'drop_blackroot_core', price: 72 },
  { npcId: 'presence_edran', itemId: 'consumable_minor_tonic', price: 18 },
  { npcId: 'presence_valmira', itemId: 'fragment_mycelial_essence', price: 180 },
  { npcId: 'presence_valmira', itemId: 'item_gem_esmeralda_crescimento', price: 260 },
  { npcId: 'presence_valmira', itemId: 'consumable_field_rune', price: 30 },
  { npcId: 'presence_edran', itemId: 'consumable_resonance_flask', price: 24 },
  { npcId: 'presence_edran', itemId: 'consumable_vital_essence', price: 26 },
  { npcId: 'presence_edran', itemId: 'consumable_field_compress', price: 8 },
  // BALANCE_DRAFT: new free-action potion supply. Price is adjustable after owner review.
  { npcId: 'presence_edran', itemId: 'consumable_fungal_healing_potion', price: 28 },
] as const

export const MARKET_SERVICES = {
  presence_neris: 'merchant',
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
  const backpack = BACKPACK_UPGRADES.find((offer) => offer.id === itemId)
  if (backpack) {
    if (npcId !== backpack.npcId || quantity !== 1) return fail('BACKPACK_OFFER', 'Esta mochila só pode ser adquirida uma vez no Mercado.')
    if (save.world.worldFlags.includes(backpackFlag(backpack.id))) return fail('BACKPACK_OWNED', 'Esta mochila já foi adquirida.')
    if (backpack.previousId && !save.world.worldFlags.includes(backpackFlag(backpack.previousId))) {
      return fail('BACKPACK_PREREQUISITE', 'Adquira a mochila anterior para desbloquear esta melhoria.')
    }
    if (save.wallet.gold < backpack.price) return fail('MARKET_GOLD', 'Ouro insuficiente para a compra.')
    const next = structuredClone(save)
    next.wallet.gold -= backpack.price
    next.world.worldFlags.push(backpackFlag(backpack.id))
    next.updatedAt = now
    next.revision += 1
    next.eventLog.push(`BackpackPurchased:${backpack.id}:${backpack.price}`)
    return ok(next)
  }
  const offer = MARKET_STOCK.find((entry) => entry.npcId === npcId && entry.itemId === itemId)
  const item = catalog.items[itemId]
  if (npcId === 'presence_neris' && item?.basicArmor && item.basicArmor.tier !== 1)
    return fail('NERIS_TIER','Neris vende apenas equipamentos comuns Tier I, Grau 1.')
  if (npcId === 'presence_neris' && (!item || item.category !== 'equipment'))
    return fail('NERIS_STOCK','Neris vende somente equipamentos comuns.')
  if (offer && 'requiresQuestId' in offer && typeof offer.requiresQuestId === 'string' &&
      save.quests[offer.requiresQuestId]?.status !== 'completed') {
    return fail('MARKET_TIER_LOCKED', 'Este tier fica disponível depois da missão de progressão indicada.')
  }
  if (!offer || !item || item.questLocked || item.category === 'quest' || item.category === 'lore') {
    return fail('MARKET_OFFER', 'Este NPC não vende o item selecionado.')
  }
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
    return fail('MARKET_QUANTITY', 'Escolha entre 1 e 99 unidades.')
  }
  if (item.basicArmor && quantity !== 1) return fail('MARKET_EQUIPMENT_QUANTITY', 'Compre uma peça de proteção por vez.')
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
  return ok(refreshTutorialQuestProgress(next, catalog, now))
}
