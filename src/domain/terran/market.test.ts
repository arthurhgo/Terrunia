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
  it('mantém Neris exclusiva de equipamentos e encaminha materiais e tônico para especialistas', () => {
    expect(MARKET_STOCK.filter((offer) => offer.npcId === 'presence_neris')
      .every((offer) => content.items[offer.itemId].category === 'equipment')).toBe(true)
    expect(MARKET_STOCK.find((offer) => offer.itemId === 'consumable_minor_tonic')?.npcId).toBe('presence_edran')
    expect(MARKET_STOCK.find((offer) => offer.itemId === 'material_linen_thread')?.npcId).toBe('presence_edran')
    expect(MARKET_STOCK.find((offer) => offer.itemId === 'drop_ruin_shard')?.npcId).toBe('presence_valmira')
  })

  it('vende melhorias permanentes de mochila e impede recompra ou salto de tier', () => {
    const save = base()
    expect(buyMarketItem(save, 'presence_edran', 'backpack_arcane', 1, content, now))
      .toMatchObject({ ok: false, code: 'BACKPACK_PREREQUISITE' })
    const first = buyMarketItem(save, 'presence_edran', 'backpack_sturdy', 1, content, now)
    expect(first.ok).toBe(true)
    if (!first.ok) return
    expect(first.value.wallet.gold).toBe(405)
    expect(getBackpackCapacity(first.value)).toBe(18)
    expect(first.value.inventory).toEqual(save.inventory)
    expect(buyMarketItem(first.value, 'presence_edran', 'backpack_sturdy', 1, content, now))
      .toMatchObject({ ok: false, code: 'BACKPACK_OWNED' })
    const second = buyMarketItem(first.value, 'presence_edran', 'backpack_traveler', 1, content, now)
    expect(second.ok).toBe(true)
    if (second.ok) expect(getBackpackCapacity(second.value)).toBe(24)
  })

  it('aplica preços progressivos mais altos às armaduras do Mercado', () => {
    expect(MARKET_STOCK.find((offer) => offer.itemId === 'equipment_worn_linen_tunic')?.price).toBe(22)
    expect(MARKET_STOCK.map((offer) => offer.itemId as string).includes('equipment_simple_leather_armor')).toBe(false)
    expect(MARKET_STOCK.map((offer) => offer.itemId as string).includes('equipment_terran_guard_armor')).toBe(false)
    expect(MARKET_STOCK.filter((offer) => offer.npcId === 'presence_neris').every((offer) => content.items[offer.itemId].basicArmor?.tier === 1)).toBe(true)
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
  it('nega qualquer compra antiga Tier II/III de Neris mesmo após completar quests', () => {
    const save=base()
    save.quests.rosetta_tutorial_refine.status='completed'
    save.quests.main_astravel_lost_hunters.status='completed'
    const previous=structuredClone(save)
    for(const itemId of ['equipment_simple_leather_armor','equipment_terran_guard_armor']){
      expect(buyMarketItem(save,'presence_neris',itemId,1,content,now))
        .toMatchObject({ok:false,code:'NERIS_TIER'})
    }
    expect(save).toEqual(previous)
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
      .toMatchObject({ ok: false, code: 'NERIS_STOCK' })
  })

})
