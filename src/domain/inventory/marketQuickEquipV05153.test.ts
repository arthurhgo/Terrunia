import { describe, expect, it } from 'vitest'
import { content } from '../../content/catalog'
import { equipmentOffersV0515 } from '../../content/equipmentV0515'
import { ARMOR_REFINEMENT } from '../../content/rosettaTutorial'
import { MARKET_STOCK } from '../terran/market'
import { createNewSave, bindPrologueWeapon } from '../game/createSave'
import { deriveCharacterStats } from '../character/derivedStats'
import { gameSaveSchema, migrateAndValidateSave } from '../../persistence/saveSchema'
import { purchaseAndEquipGear, purchaseAndEquipStarterArmor } from './marketQuickEquipV05153'

const NOW='2026-11-10T20:00:00Z'
const make=()=>{
  const save=createNewSave('qa','Mercado Tester','character.terririan.default',content,NOW)
  save.world.currentLocationId='location_terran_bond_workshop'
  save.wallet.gold=1000
  return save
}
const common=(slot:string)=>equipmentOffersV0515.find(o=>
  o.channel==='PUBLIC_TERRAN'&&o.tier===1&&o.slot===slot&&
  o.recommendedClassId==='sentinela_da_luz')!
const vendor=(slot:string)=>slot==='weapon'?'presence_terran_weaponsmith':
  ['armor','shield','helmet','pants','boots'].includes(slot)?'presence_terran_armorer':
  'presence_terran_accessory_artisan'

describe('v0.5.15.3 — atomic shop Buy & Equip and persistent bonuses',()=>{
  it('buys and equips starter armor in one action, preserving Rosetta progress and exact Gold',()=>{
    const save=make()
    const previous=structuredClone(save)
    const result=purchaseAndEquipStarterArmor(save,'presence_terran_armorer',
      'equipment_light_leather_vest',content,NOW)
    expect(result.ok).toBe(true)
    if(!result.ok)return
    expect(result.value.wallet.gold).toBe(975)
    expect(result.value.equippedBasicArmor?.definitionId).toBe('equipment_light_leather_vest')
    expect(result.value.inventory.some(x=>x.definitionId==='equipment_light_leather_vest')).toBe(false)
    expect(result.value.eventLog.some(x=>x.startsWith('MarketPurchase:presence_terran_armorer:equipment_light_leather_vest'))).toBe(true)
    expect(deriveCharacterStats(result.value,content).defense.value).toBeGreaterThan(
      deriveCharacterStats(save,content).defense.value)
    expect(save).toEqual(previous)
    expect(gameSaveSchema.safeParse(result.value).success).toBe(true)
    const restored=migrateAndValidateSave(result.value)
    expect(restored.equippedBasicArmor?.instanceId).toBe(result.value.equippedBasicArmor?.instanceId)
    expect(restored.wallet.gold).toBe(975)
  })
  it('equips commercial armor, protector, colar, pulseira and a complementary piece correctly',()=>{
    let save=make()
    const initial=deriveCharacterStats(save,content)
    for(const slot of ['armor','shield','necklace','bracelet','helmet'] as const){
      const offer=common(slot)
      const previousGold=save.wallet.gold
      const before=structuredClone(save)
      const result=purchaseAndEquipGear(save,vendor(slot),offer.id,content,NOW)
      expect(result.ok,offer.name).toBe(true)
      if(!result.ok)continue
      save=result.value
      expect(save.wallet.gold).toBe(previousGold-offer.price)
      const all=[...Object.values(save.equippedGearStyles??{}),
        ...Object.values(save.equippedComplementary??{}),
        ...(save.equippedBasicArmor?[save.equippedBasicArmor]:[])]
      const worn=all.find(item=>item?.definitionId===offer.id)
      expect(worn?.quantity).toBe(1)
      expect(save.inventory.some(item=>item.instanceId===worn?.instanceId)).toBe(false)
      expect(save.character.bondedEquipment[slot as 'armor'|'shield'|'necklace'|'bracelet']??null).toBeNull()
      expect(gameSaveSchema.safeParse(save).success).toBe(true)
      expect(before.wallet.gold).toBe(previousGold)
    }
    const final=deriveCharacterStats(save,content)
    expect(final.defense.value).toBeGreaterThan(initial.defense.value)
    expect(final.mana.value).toBeGreaterThanOrEqual(initial.mana.value)
    expect(migrateAndValidateSave(save).wallet.gold).toBe(save.wallet.gold)
  })
  it('rejects an automatic weapon equip without Bond and never charges the attempted purchase',()=>{
    const save=make()
    const item=common('weapon')
    const snapshot=structuredClone(save)
    expect(purchaseAndEquipGear(save,'presence_terran_weaponsmith',item.id,content,NOW))
      .toMatchObject({ok:false,code:'GEAR_BOND'})
    expect(save).toEqual(snapshot)
    const armed=bindPrologueWeapon(save,content,NOW,'qa-weapon')
    expect(armed.ok).toBe(true)
    if(!armed.ok)return
    const result=purchaseAndEquipGear(armed.value,'presence_terran_weaponsmith',item.id,content,NOW)
    expect(result.ok).toBe(true)
    if(!result.ok)return
    expect(result.value.equippedGearStyles?.weapon?.definitionId).toBe(item.id)
    expect(result.value.character.bondedEquipment.weapon).toBe(armed.value.character.bondedEquipment.weapon)
    expect(result.value.wallet.gold).toBe(1000-item.price)
  })
  it('rejects a mismatched seller, insufficient Gold, and unusable armor with no Gold loss',()=>{
    const item=common('armor'),save=make()
    const before=structuredClone(save)
    expect(purchaseAndEquipGear(save,'presence_neris',item.id,content,NOW))
      .toMatchObject({ok:false,code:'GEAR_MERCHANT'})
    const broke=structuredClone(save);broke.wallet.gold=0
    expect(purchaseAndEquipGear(broke,'presence_terran_armorer',item.id,content,NOW))
      .toMatchObject({ok:false,code:'GEAR_GOLD'})
    const bonded=structuredClone(save)
    // A pre-existing armor Bond correctly blocks starter armor; no intermediate
    // debit or new inventory instance is committed even when its SKU is valid.
    bonded.character.bondedEquipment.armor='bound-armor-existing'
    const armor=purchaseAndEquipStarterArmor(bonded,'presence_terran_armorer',
      'equipment_worn_linen_tunic',content,NOW)
    expect(armor).toMatchObject({ok:false,code:'ARMOR_ALREADY_BOUND'})
    expect(bonded.wallet.gold).toBe(1000)
    expect(save).toEqual(before)
  })
  it('maintains the Rosetta tutorial budget: 32 Ouro pays tonic 18 + upgrade 8, no grinding',()=>{
    const tonic=content.items.consumable_minor_tonic
    expect(tonic).toBeDefined()
    const reward=content.quests.rosetta_tutorial_equip.rewards.find(x=>x.type==='gold')?.value??0
    const tonicPrice=MARKET_STOCK.find(x=>x.npcId==='presence_neris'&&x.itemId===tonic.id)?.price
    expect(tonicPrice).toBe(18)
    // Use real catalog values; Rosetta gives the protection, and the forge material is gifted.
    const remaining=reward-(tonicPrice??0)-ARMOR_REFINEMENT.gold
    expect(remaining).toBe(6)
    expect(remaining).toBeGreaterThanOrEqual(0)
  })
})
