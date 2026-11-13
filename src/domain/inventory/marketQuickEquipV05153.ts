import type { ContentCatalog } from '../../content/catalog'
import { gearOfferById } from '../../content/equipmentV0515'
import type { GameSave } from '../game/types'
import { fail, type Result } from '../shared/types'
import type { BoundSlot, ComplementarySlot } from '../shared/types'
import { equipBasicArmor } from './basicArmor'
import { equipComplementaryItem } from './complementaryEquipment'
import { equipGearStyle, purchaseGear } from './equipmentV0515'
import { buyMarketItem } from '../terran/market'

/**
 * v0.5.15.3 — One atomic purchase + wear transaction.
 * Never commits an intermediary paid item. When a Bond, level or slot
 * prevents equipping, the purchase is entirely rejected and Gold is intact.
 * The legacy three basic armors are handled separately from commercial gear.
 */
export function purchaseAndEquipGear(
  save: GameSave,
  merchantId: string,
  gearId: string,
  catalog: ContentCatalog,
  now: string,
): Result<GameSave> {
  const offer = gearOfferById[gearId]
  if(offer?.slot==='weapon')return fail('BOUND_WEAPON_NOT_FOR_SALE','Armas completas não podem ser compradas ou substituídas.')
  if (!offer) return fail('MARKET_EQUIP_UNKNOWN', 'Esta peça não pertence ao catálogo de equipamentos.')
  const purchased = purchaseGear(save, [gearId], now, merchantId)
  if (!purchased.ok) return purchased
  const before = new Set(save.inventory.map(item => item.instanceId))
  const added = purchased.value.inventory.find(item =>
    item.definitionId === gearId && !before.has(item.instanceId))
  if (!added) return fail('MARKET_EQUIP_MISSING', 'A compra não criou uma peça equipável na mochila.')

  if (offer.slot === 'armor') {
    return purchased.value.character.bondedEquipment.armor
      ? equipGearStyle(purchased.value, added.instanceId, 'armor', now)
      : equipBasicArmor(purchased.value, added.instanceId, catalog, now)
  }
  if (['weapon', 'shield', 'necklace', 'bracelet'].includes(offer.slot))
    return equipGearStyle(purchased.value, added.instanceId, offer.slot as BoundSlot, now)
  return equipComplementaryItem(purchased.value, offer.slot as ComplementarySlot, added.instanceId, catalog, now)
}

/** Preserve basic Tier I starter IDs; no commercial Bond or stats are invented. */
export function purchaseAndEquipStarterArmor(
  save: GameSave,
  merchantId: string,
  itemId: string,
  catalog: ContentCatalog,
  now: string,
): Result<GameSave> {
  if (!catalog.items[itemId]?.basicArmor)
    return fail('MARKET_EQUIP_ARMOR', 'Esta oferta não é uma armadura de treino.')
  const purchased = buyMarketItem(save, merchantId, itemId, 1, catalog, now)
  if (!purchased.ok) return purchased
  const before = new Set(save.inventory.map(item => item.instanceId))
  const added = purchased.value.inventory.find(item =>
    item.definitionId === itemId && !before.has(item.instanceId))
  if (!added) return fail('MARKET_EQUIP_MISSING', 'A proteção comprada não foi encontrada.')
  return equipBasicArmor(purchased.value, added.instanceId, catalog, now)
}
