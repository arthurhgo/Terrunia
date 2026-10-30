import { describe, expect, it } from 'vitest'
import { content } from '../../content/catalog'
import { rosettaTutorialQuests } from '../../content/rosettaTutorial'
import { createNewSave } from '../game/createSave'
import type { GameSave } from '../game/types'
import { acceptQuest, declineQuest, offerQuest, turnInQuest } from '../quests/questEngine'
import { buyMarketItem } from '../terran/market'
import { equipBasicArmor, getEquippedBasicArmor, refineBasicArmor } from './basicArmor'
import { deriveCharacterStats } from '../character/derivedStats'
import { createBoundItem } from '../bond/boundItems'
import { transferBaseChestItem, BASE_LOCATION_ID } from '../terran/base'
import type { Result } from '../shared/types'

const now = '2026-10-30T20:00:00Z'
const take = <T,>(result: Result<T>): T => { if (!result.ok) throw new Error(result.message); return result.value }
const fresh = () => {
  const save = createNewSave('lessons', 'Lysa', 'character.terririan.default', content, now)
  save.world.currentLocationId = 'location_terran_portal_plaza'
  return save
}
const start = (save: GameSave, id: string) => take(acceptQuest(take(offerQuest(save, id, content, now)), id, content, now))
const finish = (save: GameSave, id: string) => {
  save = structuredClone(save); save.world.currentLocationId = 'location_terran_portal_plaza'
  return take(turnInQuest(save, id, 'npc_rosetta', content, now))
}

describe('Rosetta e as proteções de treino', () => {
  it('ensina quatro ações reais, paga uma vez e permite o percurso completo com o orçamento recebido', () => {
    const original = fresh()
    let save = start(original, 'rosetta_tutorial_equip')
    expect(original.inventory).toHaveLength(0)
    expect(save.inventory).toHaveLength(2)
    expect(save.character.basicArmorInstanceId).toBeNull()
    expect(save.wallet.gold).toBe(0)
    expect(save.quests.rosetta_tutorial_equip.status).toBe('active')
    expect(acceptQuest(save, 'rosetta_tutorial_equip', content, now).ok).toBe(false)
    const tunic = save.inventory.find((item) => item.definitionId === 'equipment_worn_linen_tunic')!
    const baseline = deriveCharacterStats(save, content).defense.value
    save = take(equipBasicArmor(save, tunic.instanceId, content, now))
    expect(deriveCharacterStats(save, content).defense.value).toBe(baseline + 1)
    expect(save.quests.rosetta_tutorial_equip.status).toBe('ready_to_turn_in')
    save = finish(save, 'rosetta_tutorial_equip')
    expect(save.wallet.gold).toBe(70)
    expect(turnInQuest(save, 'rosetta_tutorial_equip', 'npc_rosetta', content, now).ok).toBe(false)

    save = start(save, 'rosetta_tutorial_supply')
    expect(save.quests.rosetta_tutorial_supply.status).toBe('active')
    save.world.currentLocationId = 'location_terran_bond_workshop'
    save = take(buyMarketItem(save, 'presence_neris', 'consumable_minor_tonic', 1, content, now))
    expect(save.quests.rosetta_tutorial_supply.status).toBe('ready_to_turn_in')
    save = finish(save, 'rosetta_tutorial_supply')

    save = start(save, 'rosetta_tutorial_armor')
    save.world.currentLocationId = 'location_terran_bond_workshop'
    save = take(buyMarketItem(save, 'presence_neris', 'equipment_simple_leather_armor', 1, content, now))
    expect(save.quests.rosetta_tutorial_armor.status).toBe('active')
    const leather = save.inventory.find((item) => item.definitionId === 'equipment_simple_leather_armor')!
    save = take(equipBasicArmor(save, leather.instanceId, content, now))
    expect(save.quests.rosetta_tutorial_armor.status).toBe('ready_to_turn_in')
    expect(save.inventory.find((item) => item.instanceId === tunic.instanceId)).toBeDefined()
    save = finish(save, 'rosetta_tutorial_armor')

    save = start(save, 'rosetta_tutorial_refine')
    expect(save.inventory.find((item) => item.definitionId === 'material_linen_thread')?.quantity).toBe(1)
    save.world.currentLocationId = 'location_terran_forge'
    const before = structuredClone(save)
    save = take(refineBasicArmor(save, leather.instanceId, content, now))
    expect(before.inventory.find((item) => item.instanceId === leather.instanceId)?.refinementLevel).toBeUndefined()
    expect(deriveCharacterStats(save, content).defense.value).toBe(baseline + 3)
    expect(save.vitals).toEqual(before.vitals)
    expect(save.inventory.some((item) => item.definitionId === 'material_linen_thread')).toBe(false)
    expect(refineBasicArmor(save, leather.instanceId, content, now)).toMatchObject({ ok: false, code: 'REFINE_MAX' })
    save = finish(save, 'rosetta_tutorial_refine')
    expect(rosettaTutorialQuests.every((quest) => save.quests[quest.id].status === 'completed')).toBe(true)
    expect(save.wallet.gold).toBe(29)
    expect(save.essence).toEqual(original.essence)
    expect(save.character.bondedEquipment).toEqual(original.character.bondedEquipment)
  })

  it('não entrega túnicas ao oferecer/recusar e bloqueia compra em pilha, equipar loot e substituir Vínculo', () => {
    const save = fresh()
    const declined = take(declineQuest(take(offerQuest(save, 'rosetta_tutorial_equip', content, now)), 'rosetta_tutorial_equip', now))
    expect(declined.inventory).toHaveLength(0)
    let wearing = start(declined, 'rosetta_tutorial_equip')
    const id = wearing.inventory[0].instanceId
    expect(equipBasicArmor(wearing, 'missing', content, now).ok).toBe(false)
    wearing.world.currentLocationId = 'location_terran_bond_workshop'
    wearing.wallet.gold = 500
    expect(buyMarketItem(wearing, 'presence_neris', 'equipment_simple_leather_armor', 2, content, now)).toMatchObject({ ok: false, code: 'MARKET_EQUIPMENT_QUANTITY' })
    wearing = take(equipBasicArmor(wearing, id, content, now))
    const bound = createBoundItem(wearing.character.id, content.boundItemBases.bound_armor_leather, now, 'permanent-armor')
    wearing.boundItems[bound.id] = bound; wearing.character.bondedEquipment.armor = bound.id
    const snapshot = structuredClone(wearing)
    expect(equipBasicArmor(wearing, id, content, now)).toMatchObject({ ok: false, code: 'ARMOR_ALREADY_BOUND' })
    expect(getEquippedBasicArmor(wearing, content)).toBeNull()
    expect(wearing).toEqual(snapshot)
  })

  it('mantém peça equipada fora do baú e rejeita reforço sem material, fora da forja ou protegido sem gastos parciais', () => {
    let save = start(fresh(), 'rosetta_tutorial_equip')
    const item = save.inventory[0]
    save = take(equipBasicArmor(save, item.instanceId, content, now))
    save.world.currentLocationId = BASE_LOCATION_ID
    expect(transferBaseChestItem(save, 'deposit', item.instanceId, 1, content, now)).toMatchObject({ ok: false, code: 'CHEST_EQUIPPED' })
    const unworn = take(equipBasicArmor(save, null, content, now))
    const moved = take(transferBaseChestItem(unworn, 'deposit', item.instanceId, 1, content, now))
    expect(moved.baseStorage[0].instanceId).toBe(item.instanceId)
    expect(moved.character.basicArmorInstanceId).toBeNull()
    expect(refineBasicArmor(save, item.instanceId, content, now)).toMatchObject({ ok: false, code: 'REFINE_LOCATION' })
    save.world.currentLocationId = 'location_terran_forge'; save.wallet.gold = 30
    expect(refineBasicArmor(save, item.instanceId, content, now)).toMatchObject({ ok: false, code: 'REFINE_MATERIAL' })
    save.inventory.push({ instanceId: 'thread', definitionId: 'material_linen_thread', quantity: 2, rarity: 'common', locked: false, favorite: false, acquiredAt: now })
    save.inventory[0].favorite = true
    const original = structuredClone(save)
    expect(refineBasicArmor(save, item.instanceId, content, now)).toMatchObject({ ok: false, code: 'REFINE_PROTECTED' })
    expect(save).toEqual(original)
    save.inventory[0].favorite = false; save.wallet.gold = 0
    const poor = structuredClone(save)
    expect(refineBasicArmor(save, item.instanceId, content, now)).toMatchObject({ ok: false, code: 'REFINE_GOLD' })
    expect(save).toEqual(poor)
  })

  it('reconhece uma compra anterior ao aceite e exige retorno à Praça para a recompensa', () => {
    let save = fresh()
    save.world.currentLocationId = 'location_terran_bond_workshop'; save.wallet.gold = 100
    save = take(buyMarketItem(save, 'presence_neris', 'consumable_minor_tonic', 1, content, now))
    save.quests.rosetta_tutorial_equip.status = 'completed'
    save.quests.rosetta_tutorial_supply.status = 'available'
    save.world.currentLocationId = 'location_terran_portal_plaza'
    save = start(save, 'rosetta_tutorial_supply')
    expect(save.quests.rosetta_tutorial_supply.status).toBe('ready_to_turn_in')
    save.world.currentLocationId = 'location_terran_bond_workshop'
    expect(turnInQuest(save, 'rosetta_tutorial_supply', 'npc_rosetta', content, now)).toMatchObject({ ok: false, code: 'TUTORIAL_LOCATION' })
  })
})
