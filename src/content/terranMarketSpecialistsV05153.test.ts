import { describe,expect,it } from 'vitest'
import { content } from './catalog'
import { equipmentOffersV0515 } from './equipmentV0515'
import { TERRAN_GEAR_MERCHANTS,getTerranMerchantForSlot,
  isTerranMerchantOffer } from './terranGearMerchantsV05153'
import { MARKET_STOCK,buyMarketItem } from '../domain/terran/market'
import { createNewSave } from '../domain/game/createSave'
import { purchaseGear,checkGearAccess } from '../domain/inventory/equipmentV0515'
import { getInteriorResidents } from '../ui/terran/interiorLayout'
import { getRoomPlan,isRoomWalkable, } from '../ui/terran/roomGeometry'
import { resolveAsset } from '../assets/assetRegistry'
import { acceptQuest,applyQuestEvent,turnInQuest } from '../domain/quests/questEngine'
import { refreshTutorialQuestProgress } from '../domain/quests/tutorialProgress'
import { migrateAndValidateSave } from '../persistence/saveSchema'

const NOW='2026-11-10T18:00:00.000Z'
const base=()=>{
 const save=createNewSave('owner','Terrírian do Mercado','character.terririan.default',content,NOW)
 save.wallet.gold=1000
 save.world.currentLocationId='location_terran_bond_workshop'
 return save
}
describe('v0.5.15.3 — 3 specialists + Neris consumables',()=>{
 it('assigns all 120 common Tier I offers to exact role, without duplicates or Clan/Class bypass',()=>{
  const common=equipmentOffersV0515.filter(o=>o.channel==='PUBLIC_TERRAN'&&o.tier===1)
  expect(common).toHaveLength(120)
  const byVendor=Object.keys(TERRAN_GEAR_MERCHANTS).map(id=>[
    id,common.filter(o=>isTerranMerchantOffer(id,o))
  ] as const)
  const counts=Object.fromEntries(byVendor.map(([id,items])=>[id,items.length]))
  expect(counts).toEqual({
   presence_terran_weaponsmith:12,presence_terran_armorer:60,
   presence_terran_accessory_artisan:48,
  })
  expect(new Set(byVendor.flatMap(([,items])=>items.map(o=>o.id))).size).toBe(120)
  const save=base()
  for(const offer of common){
   const vendor=getTerranMerchantForSlot(offer.slot)
   expect(checkGearAccess(save,offer,vendor).ok,offer.id).toBe(true)
   expect(checkGearAccess(save,offer,'presence_neris'))
    .toMatchObject({ok:false,code:'GEAR_MERCHANT'})
  }
  const sample=common.find(o=>o.slot==='necklace')!
  expect(purchaseGear(save,[sample.id],NOW,'presence_terran_armorer'))
   .toMatchObject({ok:false,code:'GEAR_MERCHANT'})
  const secret=equipmentOffersV0515.find(o=>o.channel==='CLAN_EXCLUSIVE')!
  expect(purchaseGear(save,[secret.id],NOW,'presence_terran_weaponsmith'))
   .toMatchObject({ok:false,code:'GEAR_MERCHANT'})
 })

 it('keeps NPCs walkable, permanent IDs and separate illustrated sprite assets',()=>{
  const save=base()
  const residents=getInteriorResidents(save,'location_terran_bond_workshop')
  expect(residents).toHaveLength(10)
  const plan=getRoomPlan('location_terran_bond_workshop')
  for(const [presenceId,merchant] of Object.entries(TERRAN_GEAR_MERCHANTS)){
   const resident=residents.find(r=>r.presence.id===presenceId)
   expect(resident).toBeTruthy()
   expect(resident?.presence.npcId).toBe(merchant.npcId)
   expect(isRoomWalkable('location_terran_bond_workshop',resident!.position)).toBe(true)
   expect(plan.residents.some(p=>p.x===resident?.position.x&&p.y===resident?.position.y)).toBe(true)
   const npc=content.npcs[merchant.npcId]
   expect(npc?.portraitAssetId).toBeTruthy()
   expect(resolveAsset(npc.portraitAssetId).path).toContain('market_')
  }
  expect(content.terranLocations.location_terran_bond_workshop.npcPresences)
   .toHaveLength(10)
 })

 it('keeps Rosetta potion purchasable for 18 Ouro and credits both old and new purchases',()=>{
  const save=base()
  save.quests.rosetta_tutorial_supply.status='active'
  save.quests.rosetta_tutorial_supply.objectives.wear_armor=1
  const tonic=MARKET_STOCK.find(o=>o.npcId==='presence_neris'&&o.itemId==='consumable_minor_tonic')!
  expect(tonic.price).toBe(18)
  const bought=buyMarketItem(save,'presence_neris',tonic.itemId,1,content,NOW)
  expect(bought.ok).toBe(true)
  if(!bought.ok)return
  expect(bought.value.wallet.gold).toBe(982)
  expect(bought.value.quests.rosetta_tutorial_supply.status).toBe('ready_to_turn_in')
  const old=structuredClone(save)
  old.eventLog.push('MarketPurchase:presence_edran:consumable_minor_tonic:1:18')
  const reconciled=refreshTutorialQuestProgress(old,content,NOW)
  expect(reconciled.quests.rosetta_tutorial_supply.status).toBe('ready_to_turn_in')
  const wrong=buyMarketItem(save,'presence_edran',tonic.itemId,1,content,NOW)
  expect(wrong).toMatchObject({ok:false,code:'MARKET_OFFER'})
 })

 it('preserves existing optional Gibão objective with new armorer and old Neris purchase',()=>{
  const save=base()
  save.quests.rosetta_tutorial_armor.status='active'
  const outcome=buyMarketItem(save,'presence_terran_armorer','equipment_light_leather_vest',1,content,NOW)
  expect(outcome.ok).toBe(true)
  if(!outcome.ok)return
  expect(outcome.value.wallet.gold).toBe(975)
  expect(outcome.value.quests.rosetta_tutorial_armor.objectives.buy_armor).toBe(1)
  const historical=structuredClone(save)
  historical.eventLog.push('MarketPurchase:presence_neris:equipment_light_leather_vest:1:25')
  const progress=refreshTutorialQuestProgress(historical,content,NOW)
  expect(progress.quests.rosetta_tutorial_armor.objectives.buy_armor).toBe(1)
 })

 it('offers optional specialist tour without mandatory purchases, then turns in at Rosetta',()=>{
  const save=base()
  save.quests.rosetta_tutorial_supply.status='completed'
  save.quests.rosetta_tutorial_market_specialists.status='offered'
  save.eventLog.push('MarketSpecialistTalk:npc_terran_armorer')
  save.world.currentLocationId='location_terran_portal_plaza'
  const accepted=acceptQuest(save,'rosetta_tutorial_market_specialists',content,NOW)
  expect(accepted.ok).toBe(true)
  if(!accepted.ok)return
  expect(accepted.value.quests.rosetta_tutorial_market_specialists.objectives.talk_armorer).toBe(1)
  let next=accepted.value
  for(const id of ['npc_terran_weaponsmith','npc_terran_accessory_artisan'])
   next=applyQuestEvent(next,{type:'talk',targetId:id},content,NOW)
  expect(next.quests.rosetta_tutorial_market_specialists.status).toBe('ready_to_turn_in')
  const delivered=turnInQuest(next,'rosetta_tutorial_market_specialists','npc_rosetta',content,NOW)
  expect(delivered.ok).toBe(true)
  if(delivered.ok){
   expect(delivered.value.quests.rosetta_tutorial_market_specialists.status).toBe('completed')
   expect(delivered.value.wallet.gold).toBe(next.wallet.gold)
   expect(migrateAndValidateSave(delivered.value).quests.rosetta_tutorial_market_specialists.status).toBe('completed')
  }
 })
})
