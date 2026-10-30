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
})
