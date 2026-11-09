import { getBackpackCapacity } from '../inventory/backpacks'
import { describe, expect, it } from 'vitest'
import { content } from '../../content/catalog'
import { createNewSave } from '../game/createSave'
import { buyMarketItem, isMarketNpc, MARKET_LOCATION_ID, MARKET_STOCK } from './market'

const now = '2026-10-30T00:00:00Z'
const base = () => {
  const save = createNewSave('owner', 'Lysa', 'character.terririan.default', content, now)
  save.wallet.gold = 500
  save.world.currentLocationId = MARKET_LOCATION_ID
  return save
}

describe('Mercado de Terran', () => {
  it('vende melhorias permanentes de mochila e impede recompra ou salto de tier', () => {
    const save = base()
    expect(buyMarketItem(save, 'presence_neris', 'backpack_arcane', 1, content, now))
      .toMatchObject({ ok: false, code: 'BACKPACK_PREREQUISITE' })
    const first = buyMarketItem(save, 'presence_neris', 'backpack_sturdy', 1, content, now)
    expect(first.ok).toBe(true)
    if (!first.ok) return
    expect(first.value.wallet.gold).toBe(405)
    expect(getBackpackCapacity(first.value)).toBe(18)
    expect(first.value.inventory).toEqual(save.inventory)
    expect(buyMarketItem(first.value, 'presence_neris', 'backpack_sturdy', 1, content, now))
      .toMatchObject({ ok: false, code: 'BACKPACK_OWNED' })
    const second = buyMarketItem(first.value, 'presence_neris', 'backpack_traveler', 1, content, now)
    expect(second.ok).toBe(true)
    if (second.ok) expect(getBackpackCapacity(second.value)).toBe(24)
  })

  it('aplica preços progressivos mais altos às armaduras do Mercado', () => {
    expect(MARKET_STOCK.find((offer) => offer.itemId === 'equipment_worn_linen_tunic')?.price).toBe(22)
    expect(MARKET_STOCK.find((offer) => offer.itemId === 'equipment_simple_leather_armor')?.price).toBe(60)
    expect(MARKET_STOCK.find((offer) => offer.itemId === 'equipment_terran_guard_armor')?.price).toBe(135)
  })

  it('mantém os seis comerciantes e especialistas mapeados sem alterar o ID do local', () => {
    for (const id of ['presence_lithwynn', 'presence_talia', 'presence_valmira', 'presence_edran', 'presence_feril', 'presence_lorian']) {
      expect(isMarketNpc(id)).toBe(true)
    }
    expect(isMarketNpc('presence_eldamar')).toBe(false)
    expect(content.terranLocations[MARKET_LOCATION_ID].name).toBe('Mercado')
    expect(MARKET_STOCK.every(({ itemId }) => Boolean(content.items[itemId]))).toBe(true)
  })

  it('compra no NPC autorizado e grava débito, item, evento e revisão sem alterar a origem', () => {
    const save = base()
    const copy = structuredClone(save)
    const result = buyMarketItem(save, 'presence_valmira', 'fragment_mycelial_essence', 2, content, now)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.wallet.gold).toBe(140)
    expect(result.value.inventory.at(-1)).toMatchObject({ definitionId: 'fragment_mycelial_essence', quantity: 2 })
    expect(result.value.eventLog.at(-1)).toBe('MarketPurchase:presence_valmira:fragment_mycelial_essence:2:360')
    expect(result.value.revision).toBe(save.revision + 1)
    expect(save).toEqual(copy)
  })

  it('rejeita local, NPC/estoque alheio, preço insuficiente e quantidade inválida', () => {
    const save = base()
    expect(buyMarketItem(save, 'presence_edran', 'fragment_mycelial_essence', 1, content, now)).toMatchObject({ ok: false, code: 'MARKET_OFFER' })
    expect(buyMarketItem(save, 'presence_valmira', 'quest_astravel_record', 1, content, now)).toMatchObject({ ok: false, code: 'MARKET_OFFER' })
    expect(buyMarketItem(save, 'presence_valmira', 'fragment_mycelial_essence', 0, content, now)).toMatchObject({ ok: false, code: 'MARKET_QUANTITY' })
    expect(buyMarketItem(save, 'presence_valmira', 'fragment_mycelial_essence', 100, content, now)).toMatchObject({ ok: false, code: 'MARKET_QUANTITY' })
    save.wallet.gold = 1
    expect(buyMarketItem(save, 'presence_valmira', 'fragment_mycelial_essence', 1, content, now)).toMatchObject({ ok: false, code: 'MARKET_GOLD' })
    save.wallet.gold = 500
    save.world.currentLocationId = 'location_terran_portal_plaza'
    expect(buyMarketItem(save, 'presence_valmira', 'fragment_mycelial_essence', 1, content, now)).toMatchObject({ ok: false, code: 'MARKET_LOCATION' })
  })
  it('desbloqueia Tier II e Tier III por progresso real sem vender equipamento permanente', () => {
    const save = base()
    const unchanged = structuredClone(save)
    expect(buyMarketItem(save, 'presence_neris', 'equipment_simple_leather_armor', 1, content, now))
      .toMatchObject({ ok: false, code: 'MARKET_TIER_LOCKED' })
    expect(buyMarketItem(save, 'presence_neris', 'equipment_terran_guard_armor', 1, content, now))
      .toMatchObject({ ok: false, code: 'MARKET_TIER_LOCKED' })
    expect(save).toEqual(unchanged)
    save.quests.rosetta_tutorial_refine.status = 'completed'
    const tierTwo = buyMarketItem(save, 'presence_neris', 'equipment_simple_leather_armor', 1, content, now)
    expect(tierTwo.ok).toBe(true)
    if (!tierTwo.ok) return
    expect(content.items[tierTwo.value.inventory.at(-1)!.definitionId].basicArmor?.tier).toBe(2)
    expect(buyMarketItem(tierTwo.value, 'presence_neris', 'equipment_terran_guard_armor', 1, content, now))
      .toMatchObject({ ok: false, code: 'MARKET_TIER_LOCKED' })
    const advanced = structuredClone(tierTwo.value)
    advanced.quests.main_astravel_lost_hunters.status = 'completed'
    const tierThree = buyMarketItem(advanced, 'presence_neris', 'equipment_terran_guard_armor', 1, content, now)
    expect(tierThree.ok).toBe(true)
    if (tierThree.ok) expect(content.items[tierThree.value.inventory.at(-1)!.definitionId].basicArmor?.tier).toBe(3)
  })

  it('oferece Poção Restauradora com consumo real na economia da Câmara', () => {
    const save = base()
    const result = buyMarketItem(save, 'presence_edran', 'consumable_fungal_healing_potion', 2, content, now)
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.inventory.at(-1)).toMatchObject({
      definitionId: 'consumable_fungal_healing_potion', quantity: 2,
    })
    expect(result.value.wallet.gold).toBe(save.wallet.gold - 56)
    expect(content.items.consumable_fungal_healing_potion.combatUseMode).toBe('freeHealingPotion')
    expect(buyMarketItem(save, 'presence_neris', 'consumable_fungal_healing_potion', 1, content, now))
      .toMatchObject({ ok: false, code: 'MARKET_OFFER' })
  })

})
