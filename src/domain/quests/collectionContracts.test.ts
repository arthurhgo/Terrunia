import { describe, expect, it } from 'vitest'
import { content } from '../../content/catalog'
import { collectionContractDefinitions } from '../../content/collectionContracts'
import { createNewSave } from '../game/createSave'
import type { GameSave } from '../game/types'
import { acceptQuest, applyQuestEvent, offerQuest, refreshQuestAvailability, turnInQuest } from './questEngine'
import { refreshDeliveryQuestProgress } from './questInventory'
import { migrateAndValidateSave } from '../../persistence/saveSchema'
import { waveEncounter } from '../combat/waves'
import { MARKET_STOCK } from '../terran/market'

const instant = '2026-10-30T16:00:00.000Z'
const ready = () => {
  const save = createNewSave('collector', 'Aron', 'character.terririan.default', content, instant)
  for (const id of ['vs_astravel_first_contact', 'main_terran_first_home', 'main_vorren_bestiary', 'main_lithwynn_signs']) save.quests[id].status = 'completed'
  return refreshQuestAvailability(save, content, instant)
}
const add = (save: GameSave, id: string, quantity: number, favorite = false) => save.inventory.push({
  instanceId: `sample-${save.inventory.length}`, definitionId: id, quantity,
  rarity: content.items[id].rarity, locked: false, favorite, acquiredAt: instant,
})
const accept = (save: GameSave, id: string) => {
  const offered = offerQuest(save, id, content, instant)
  if (!offered.ok) throw new Error(offered.message)
  const accepted = acceptQuest(offered.value, id, content, instant)
  if (!accepted.ok) throw new Error(accepted.message)
  return accepted.value
}

describe('contratos de entrega de Terran', () => {
  it('oferece doze contratos com ouro proporcional e fontes repetíveis para todos os materiais', () => {
    expect(collectionContractDefinitions).toHaveLength(12)
    const repeatableLoot = new Set(Array.from({ length: 40 }, (_, wave) => waveEncounter(content, wave + 1).rewards.lootDefinitionIds).flat())
    for (const quest of collectionContractDefinitions) {
      expect(content.npcs[quest.giverNpcId].questIds).toContain(quest.id)
      const value = quest.turnInItems!.reduce((sum, input) => {
        expect(repeatableLoot.has(input.itemId), input.itemId).toBe(true)
        expect(content.items[input.itemId].canInfuseBoundItem).toBe(false)
        return sum + input.quantity * content.items[input.itemId].sellValue
      }, 0)
      expect(quest.rewards).toEqual([{ type: 'gold', value: Math.ceil(value * 1.5) }])
    }
  })

  it('mantém a compra dos materiais acima de sua revenda e do pagamento unitário de encomendas', () => {
    for (const offer of MARKET_STOCK.filter((entry) => entry.npcId === 'presence_neris')) {
      const item = content.items[offer.itemId]
      if (item.sellable) expect(offer.price).toBeGreaterThan(Math.ceil(item.sellValue * 1.5))
    }
  })

  it('conta a mochila no aceite, entrega quantidades exatas ao NPC e paga uma única vez', () => {
    let save = ready()
    add(save, 'drop_fungal_nucleus', 1); add(save, 'drop_fungal_nucleus', 2); add(save, 'drop_fungal_nucleus', 4, true)
    const before = structuredClone(save)
    save = accept(save, 'delivery_arlen_nuclei')
    expect(save.quests.delivery_arlen_nuclei.status).toBe('ready_to_turn_in')
    expect(save.wallet).toEqual(before.wallet)
    const wrong = turnInQuest(save, 'delivery_arlen_nuclei', 'npc_street_liora', content, instant)
    expect(wrong).toMatchObject({ ok: false, code: 'WRONG_TURN_IN_NPC' })
    const result = turnInQuest(save, 'delivery_arlen_nuclei', 'npc_street_arlen', content, instant)
    if (!result.ok) throw new Error(result.message)
    expect(result.value.inventory.map((item) => item.quantity)).toEqual([1, 4])
    expect(result.value.inventory[1].favorite).toBe(true)
    expect(result.value.wallet.gold).toBe(before.wallet.gold + 96)
    expect(result.value.essence).toEqual(before.essence)
    expect(result.value.quests.delivery_arlen_nuclei.status).toBe('completed')
    expect(turnInQuest(result.value, 'delivery_arlen_nuclei', 'npc_street_arlen', content, instant).ok).toBe(false)
    expect(migrateAndValidateSave(result.value).inventory).toEqual(result.value.inventory)
    expect(save.inventory).toEqual(before.inventory)
  })

  it('não aceita eventos fictícios de coleta e retira prontidão após vender, consumir ou proteger materiais', () => {
    let save = accept(ready(), 'delivery_arlen_nuclei')
    save = applyQuestEvent(save, { type: 'collect', targetId: 'drop_fungal_nucleus', amount: 999 }, content, instant)
    expect(save.quests.delivery_arlen_nuclei.status).toBe('active')
    add(save, 'drop_fungal_nucleus', 2)
    save = refreshDeliveryQuestProgress(save, content, instant)
    expect(save.quests.delivery_arlen_nuclei.status).toBe('ready_to_turn_in')
    save.inventory[0].locked = true
    const protectedSave = structuredClone(save)
    expect(turnInQuest(save, 'delivery_arlen_nuclei', 'npc_street_arlen', content, instant))
      .toMatchObject({ ok: false, code: 'QUEST_DELIVERY_MISSING' })
    expect(save).toEqual(protectedSave)
    expect(refreshDeliveryQuestProgress(save, content, instant).quests.delivery_arlen_nuclei.status).toBe('active')
    save.inventory = []
    expect(refreshDeliveryQuestProgress(save, content, instant).quests.delivery_arlen_nuclei.objectives.arlen_nuclei_drop_fungal_nucleus).toBe(0)
  })

  it('uma entrega reavalia contratos concorrentes para impedir pagamento com o mesmo lote', () => {
    let save = ready()
    add(save, 'drop_ruin_shard', 4); add(save, 'drop_mycelial_fiber', 2)
    save = accept(accept(save, 'delivery_durnan_batch'), 'delivery_lithwynn_shards')
    expect(save.quests.delivery_durnan_batch.status).toBe('ready_to_turn_in')
    const result = turnInQuest(save, 'delivery_lithwynn_shards', 'npc_lithwynn', content, instant)
    if (!result.ok) throw new Error(result.message)
    expect(result.value.quests.delivery_durnan_batch.status).toBe('active')
    expect(turnInQuest(result.value, 'delivery_durnan_batch', 'npc_durnan', content, instant).ok).toBe(false)
    expect(result.value.wallet.gold).toBe(save.wallet.gold + 228)
  })

  it('migra v13 sem aceitar contratos nem pagar ouro e preserva o progresso anterior', () => {
    const save = ready()
    save.schemaVersion = 13; save.gameVersion = '0.10.0'
    for (const quest of collectionContractDefinitions) delete save.quests[quest.id]
    const oldQuests = structuredClone(save.quests)
    const migrated = migrateAndValidateSave(save)
    expect(migrated.schemaVersion).toBe(15)
    expect(migrated.wallet).toEqual(save.wallet)
    expect(migrated.inventory).toEqual(save.inventory)
    expect(migrated.character).toEqual(save.character)
    expect(Object.fromEntries(Object.keys(oldQuests).map((id) => [id, migrated.quests[id]]))).toEqual(oldQuests)
    for (const quest of collectionContractDefinitions) expect(migrated.quests[quest.id].status).toBe('available')
    expect(migrated.eventLog).toContain('SaveMigrated:13->14')
  })
})
