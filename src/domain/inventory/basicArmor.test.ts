import { describe, expect, it } from 'vitest'
import { content } from '../../content/catalog'
import { ROSETTA_STARTER_CHOICES } from '../../content/rosettaTutorial'
import { createNewSave } from '../game/createSave'
import type { GameSave } from '../game/types'
import { acceptQuest, declineQuest, offerQuest, turnInQuest } from '../quests/questEngine'
import { refreshTutorialQuestProgress } from '../quests/tutorialProgress'
import { buyMarketItem } from '../terran/market'
import { visitTerranLocation } from '../terran/cityEngine'
import { equipBasicArmor, getEquippedBasicArmor, refineBasicArmor } from './basicArmor'
import { deriveCharacterStats } from '../character/derivedStats'
import { createBoundItem } from '../bond/boundItems'
import { migrateAndValidateSave } from '../../persistence/saveSchema'
import { transferBaseChestItem, BASE_LOCATION_ID } from '../terran/base'
import type { Result } from '../shared/types'

const now = '2026-11-03T15:00:00Z'
const take = <T,>(result: Result<T>): T => { if (!result.ok) throw new Error(result.message); return result.value }
const fresh = () => {
  const save = createNewSave('lessons', 'Lysa', 'character.terririan.default', content, now)
  save.world.currentLocationId = 'location_terran_portal_plaza'
  return save
}
const start = (save: GameSave, id: string) => take(acceptQuest(take(offerQuest(save, id, content, now)), id, content, now))
const finish = (save: GameSave, id: string, choice?: string) => {
  const atPlaza = structuredClone(save)
  atPlaza.world.currentLocationId = 'location_terran_portal_plaza'
  return take(turnInQuest(atPlaza, id, 'npc_rosetta', content, now, choice))
}
const firstChoice = (choice: string = ROSETTA_STARTER_CHOICES[0]) => {
  let save = start(fresh(), 'rosetta_tutorial_equip')
  expect(save.inventory).toHaveLength(0)
  save = refreshTutorialQuestProgress(
    take(visitTerranLocation(save, 'location_terran_bond_workshop', content, now)).save, content, now)
  expect(save.quests.rosetta_tutorial_equip.status).toBe('ready_to_turn_in')
  return finish(save, 'rosetta_tutorial_equip', choice)
}

describe('Rosetta v0.15: escolha de proteção e tiers', () => {
  it('concede exatamente uma peça somente na entrega com opção válida; proíbe pagamento repetido', () => {
    const original = fresh()
    let save = start(original, 'rosetta_tutorial_equip')
    expect(save.inventory).toHaveLength(0)
    expect(save.wallet.gold).toBe(0)
    expect(acceptQuest(save, 'rosetta_tutorial_equip', content, now).ok).toBe(false)
    save = refreshTutorialQuestProgress(
      take(visitTerranLocation(save, 'location_terran_bond_workshop', content, now)).save, content, now)
    const before = structuredClone(save)
    const plaza = structuredClone(save)
    plaza.world.currentLocationId = 'location_terran_portal_plaza'
    expect(turnInQuest(plaza, 'rosetta_tutorial_equip', 'npc_rosetta', content, now))
      .toMatchObject({ ok: false, code: 'QUEST_CHOICE_REQUIRED' })
    expect(turnInQuest(plaza, 'rosetta_tutorial_equip', 'npc_rosetta', content, now, 'equipment_simple_leather_armor'))
      .toMatchObject({ ok: false, code: 'QUEST_CHOICE_REQUIRED' })
    expect(save).toEqual(before)
    save = finish(save, 'rosetta_tutorial_equip', ROSETTA_STARTER_CHOICES[1])
    expect(save.inventory).toHaveLength(1)
    expect(save.inventory[0].definitionId).toBe('equipment_apprentice_tunic')
    expect(save.wallet.gold).toBe(32)
    expect(save.quests.rosetta_tutorial_equip.status).toBe('completed')
    expect(save.eventLog.filter((event) => event.startsWith('QuestChoiceReward:rosetta_tutorial_equip:'))).toHaveLength(1)
    expect(turnInQuest(save, 'rosetta_tutorial_equip', 'npc_rosetta', content, now, ROSETTA_STARTER_CHOICES[0]))
      .toMatchObject({ ok: false, code: 'QUEST_NOT_READY' })
  })

  it('joga a trilha inteira usando a escolha Tier I sem comprar equipamento extra', () => {
    let save = firstChoice('equipment_worn_linen_tunic')
    const tunic = save.inventory[0]
    const baseDefense = deriveCharacterStats(save, content).defense.value
    save = start(save, 'rosetta_tutorial_supply')
    expect(save.quests.rosetta_tutorial_supply.status).toBe('active')
    save = take(equipBasicArmor(save, tunic.instanceId, content, now))
    expect(deriveCharacterStats(save, content).defense.value).toBe(baseDefense + 1)
    save.world.currentLocationId = 'location_terran_bond_workshop'
    save = take(buyMarketItem(save, 'presence_neris', 'consumable_minor_tonic', 1, content, now))
    expect(save.quests.rosetta_tutorial_supply.status).toBe('ready_to_turn_in')
    save = finish(save, 'rosetta_tutorial_supply')
    expect(save.quests.rosetta_tutorial_armor.status).toBe('locked')
    save = start(save, 'rosetta_tutorial_refine')
    expect(save.inventory.some((item) => item.definitionId === 'material_linen_thread')).toBe(true)
    save.world.currentLocationId = 'location_terran_forge'
    save = take(refineBasicArmor(save, tunic.instanceId, content, now))
    expect(save.quests.rosetta_tutorial_refine.status).toBe('ready_to_turn_in')
    expect(save.inventory.some((item) => item.definitionId === 'material_linen_thread')).toBe(false)
    expect(deriveCharacterStats(save, content).defense.value).toBe(baseDefense + 2)
    expect(refineBasicArmor(save, tunic.instanceId, content, now)).toMatchObject({ ok: false, code: 'REFINE_MAX' })
    save = finish(save, 'rosetta_tutorial_refine')
    expect(save.wallet.gold).toBe(11)
    expect(save.quests.rosetta_tutorial_armor.status).toBe('available')
    expect(save.character.basicArmorInstanceId).toBe(tunic.instanceId)
    expect(save.inventory.filter((item) => content.items[item.definitionId]?.basicArmor)).toHaveLength(1)
    expect(save.character.bondedEquipment).toEqual(fresh().character.bondedEquipment)
  })

  it('bloqueia pilhas, loot irregular e substituição de Armadura permanentemente vinculada', () => {
    const first = firstChoice()
    const instanceId = first.inventory[0].instanceId
    expect(equipBasicArmor(first, 'missing', content, now).ok).toBe(false)
    const wearing = take(equipBasicArmor(first, instanceId, content, now))
    const bound = createBoundItem(wearing.character.id, content.boundItemBases.bound_armor_leather, now, 'permanent-armor')
    wearing.boundItems[bound.id] = bound
    wearing.character.bondedEquipment.armor = bound.id
    const snapshot = structuredClone(wearing)
    expect(equipBasicArmor(wearing, instanceId, content, now)).toMatchObject({ ok: false, code: 'ARMOR_ALREADY_BOUND' })
    expect(getEquippedBasicArmor(wearing, content)).toBeNull()
    expect(wearing).toEqual(snapshot)
    const market = firstChoice()
    market.world.currentLocationId = 'location_terran_bond_workshop'
    market.wallet.gold = 200
    expect(buyMarketItem(market, 'presence_neris', 'equipment_worn_linen_tunic', 2, content, now))
      .toMatchObject({ ok: false, code: 'MARKET_EQUIPMENT_QUANTITY' })
  })

  it('permite guardar proteção desvestida e bloqueia gastos parciais no reforço', () => {
    let save = firstChoice()
    const item = save.inventory[0]
    save = take(equipBasicArmor(save, item.instanceId, content, now))
    save.world.currentLocationId = BASE_LOCATION_ID
    expect(transferBaseChestItem(save, 'deposit', item.instanceId, 1, content, now)).toMatchObject({ ok: false, code: 'CHEST_EQUIPPED' })
    const unworn = take(equipBasicArmor(save, null, content, now))
    const moved = take(transferBaseChestItem(unworn, 'deposit', item.instanceId, 1, content, now))
    expect(moved.baseStorage[0].instanceId).toBe(item.instanceId)
    save.world.currentLocationId = 'location_terran_forge'
    expect(refineBasicArmor(save, item.instanceId, content, now)).toMatchObject({ ok: false, code: 'REFINE_MATERIAL' })
    save.inventory.push({ instanceId: 'thread', definitionId: 'material_linen_thread', quantity: 1, rarity: 'common', locked: false, favorite: false, acquiredAt: now })
    save.inventory[0].favorite = true
    const protectedSnapshot = structuredClone(save)
    expect(refineBasicArmor(save, item.instanceId, content, now)).toMatchObject({ ok: false, code: 'REFINE_PROTECTED' })
    expect(save).toEqual(protectedSnapshot)
    save.inventory[0].favorite = false; save.wallet.gold = 0
    expect(refineBasicArmor(save, item.instanceId, content, now)).toMatchObject({ ok: false, code: 'REFINE_GOLD' })
  })

  it('reconhece compra anterior ao aceite da lição 2, mas ainda exige equipar uma peça', () => {
    let save = firstChoice()
    save.world.currentLocationId = 'location_terran_bond_workshop'
    save = take(buyMarketItem(save, 'presence_neris', 'consumable_minor_tonic', 1, content, now))
    save.world.currentLocationId = 'location_terran_portal_plaza'
    save = start(save, 'rosetta_tutorial_supply')
    expect(save.quests.rosetta_tutorial_supply.status).toBe('active')
    save = take(equipBasicArmor(save, save.inventory.find((item) => content.items[item.definitionId]?.basicArmor)!.instanceId, content, now))
    expect(save.quests.rosetta_tutorial_supply.status).toBe('ready_to_turn_in')
    save.world.currentLocationId = 'location_terran_bond_workshop'
    expect(turnInQuest(save, 'rosetta_tutorial_supply', 'npc_rosetta', content, now))
      .toMatchObject({ ok: false, code: 'TUTORIAL_LOCATION' })
  })

  it('preserva missões e túnicas de um save legado sem conceder escolha automática', () => {
    const save = fresh()
    save.schemaVersion = 15
    save.gameVersion = '0.13.0'
    save.quests.rosetta_tutorial_equip.status = 'ready_to_turn_in'
    save.quests.rosetta_tutorial_equip.objectives.wear_armor = 1
    save.inventory.push(...ROSETTA_STARTER_CHOICES.slice(0, 2).map((definitionId, i) => ({
      instanceId: `legacy-${i}`, definitionId, quantity: 1 as const, rarity: 'common' as const,
      locked: false, favorite: false, acquiredAt: now,
    })))
    const snapshot = structuredClone(save)
    const restored = migrateAndValidateSave(save)
    expect(restored.schemaVersion).toBe(16)
    expect(restored.quests.rosetta_tutorial_equip.status).toBe('ready_to_turn_in')
    expect(restored.quests.rosetta_tutorial_equip.objectives.visit_market).toBe(1)
    expect(restored.inventory).toEqual(snapshot.inventory)
    expect(restored.wallet).toEqual(snapshot.wallet)
    expect(restored.eventLog.filter((event) => event.startsWith('QuestChoiceReward:'))).toHaveLength(0)
  })

  it('não paga nem dá equipamento ao oferecer e recusar a primeira missão', () => {
    const save = fresh()
    const offered = take(offerQuest(save, 'rosetta_tutorial_equip', content, now))
    const declined = take(declineQuest(offered, 'rosetta_tutorial_equip', now))
    expect(declined.inventory).toHaveLength(0)
    expect(declined.wallet.gold).toBe(0)
  })
})
