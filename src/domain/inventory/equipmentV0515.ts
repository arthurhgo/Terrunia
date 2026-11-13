import { emptyGearStats } from '../../content/equipmentProfilesV05152'
import { getTerranMerchantForSlot, isTerranMerchantOffer } from '../../content/terranGearMerchantsV05153'
import { castleMerchantByPresenceId } from '../../content/castleMerchantsV05151'
import { gearOfferById, gearSetById, getGearGrade, getGearStatEntries, type GearOffer, type GearSlot } from '../../content/equipmentV0515'
import type { GameSave, InventoryItemInstance } from '../game/types'
import type { BoundSlot } from '../shared/types'
import { fail, ok, type Result } from '../shared/types'
import { createRandomId } from '../shared/randomId'

/** Market authorization is validated again in the domain, never only in disabled UI buttons. */
export function checkGearAccess(save:GameSave,offer:GearOffer,merchantId:string):Result<true>{
 if (offer.slot==='weapon') return fail('BOUND_WEAPON_ONLY','Armas completas não são vendidas: monte partes na Casa do Ferreiro.');
 if (offer.channel === 'PUBLIC_TERRAN') {
   if (!isTerranMerchantOffer(merchantId,offer))
     return fail('GEAR_MERCHANT','Este item comum pertence ao comerciante especializado em '+getTerranMerchantForSlot(offer.slot)+'.')
 } else {
   const merchant = castleMerchantByPresenceId[merchantId]
   if (!merchant || !offer.castleId || offer.castleId !== merchant.castleId ||
       offer.clanId !== merchant.clanId ||
       (offer.channel !== 'CLAN_EXCLUSIVE' && offer.channel !== 'CLASS_EXCLUSIVE'))
     return fail('GEAR_MERCHANT','Este equipamento pertence a outro Clã ou mercador.')
 }

 if(save.battle)return fail('GEAR_BATTLE','Comércio indisponível durante o combate.')
 const location=offer.channel==='PUBLIC_TERRAN'?'location_terran_bond_workshop':offer.castleId
 if(save.world.currentLocationId!==location)return fail('GEAR_LOCATION','Este item só pode ser comprado no vendedor correto.')
 if(save.character.level<offer.level)return fail('GEAR_LEVEL','Requer nível '+offer.level+'.')
 if(offer.clanId!==undefined&&save.character.clan.clanId!==offer.clanId)
  return fail('GEAR_CLAN','Somente membros do Clã podem adquirir este equipamento.')
 if(offer.classId!==undefined&&save.character.classProgression.classId!==offer.classId)
  return fail('GEAR_CLASS','É necessário conquistar esta Classe antes da compra.')
 return ok(true)
}

const addItem=(offer:GearOffer,now:string,instanceId:string):InventoryItemInstance=>({
 instanceId,definitionId:offer.id,quantity:1,
 rarity:offer.tier>=5?'epic':offer.tier>=3?'rare':offer.tier===2?'uncommon':'common',
 locked:false,favorite:false,acquiredAt:now,refinementLevel:0,
})
export function purchaseGear(save:GameSave,offerIds:readonly string[],now:string,merchantId:string):Result<GameSave>{
 if(offerIds.length===0||offerIds.length>10||new Set(offerIds).size!==offerIds.length)
  return fail('GEAR_SET','Escolha uma peça ou um kit completo sem duplicações.')
 const offers=offerIds.map(id=>gearOfferById[id])
 if(offers.some(offer=>!offer))return fail('GEAR_UNKNOWN','Peça não cadastrada no catálogo.')
 if(offers.some(offer=>offer.slot==='weapon'))return fail('BOUND_WEAPON_ONLY','Kits não podem incluir armas comerciais; o Vínculo original é permanente.')
 if(offers.length>1){
  const set=gearSetById[offers[0].setId]
  if(!set||set.itemIds.length!==offerIds.length||set.itemIds.some(id=>!offerIds.includes(id)))
   return fail('GEAR_SET','A compra conjunta deve conter todas as dez peças de um kit.')
 }
 for(const offer of offers){const access=checkGearAccess(save,offer,merchantId);if(!access.ok)return access}
 const cost=offers.reduce((sum,offer)=>sum+offer.price,0)
 if(save.wallet.gold<cost)return fail('GEAR_GOLD','Ouro insuficiente: '+cost+' necessário.')
 const next=structuredClone(save)
 next.wallet.gold-=cost
 // Never reuse a physical item's ID across backpack, equipped slots or Base
 // storage, even on deterministic test origins or faulty UUID providers.
 const occupied=new Set([...save.inventory,...getWornGear(save),...save.baseStorage]
   .map(item=>item.instanceId))
 const added=offers.map(offer=>{
   const base='gear_'+createRandomId()
   let instanceId=base,attempt=1
   while(occupied.has(instanceId))instanceId=base+'_'+attempt++
   occupied.add(instanceId)
   return addItem(offer,now,instanceId)
 })
 next.inventory.push(...added)
 next.updatedAt=now;next.revision+=1
 next.eventLog.push('GearPurchased:v05151:'+merchantId+':'+offers[0].setId+':'+offerIds.length+':'+cost)
 return ok(next)
}

export function checkGearWear(save:GameSave,offer:GearOffer):Result<true>{
 if(offer.slot==='weapon')return fail('BOUND_WEAPON_ONLY','Revestimentos comerciais de arma são legados; personalize o Vínculo no ferreiro.')
 if(save.battle)return fail('GEAR_BATTLE','Não é possível equipar durante o combate.')
 if(save.character.level<offer.level)return fail('GEAR_LEVEL','Requer nível '+offer.level+'.')
 if(offer.clanId&&save.character.clan.clanId!==offer.clanId)return fail('GEAR_CLAN','Este equipamento exige seu Clã.')
 if(offer.classId&&save.character.classProgression.classId!==offer.classId)return fail('GEAR_CLASS','Este equipamento exige sua Classe.')
 return ok(true)
}

const isBound=(slot:GearSlot):slot is BoundSlot =>
 ['weapon','shield','armor','necklace','bracelet'].includes(slot)
export function equipGearStyle(save:GameSave,instanceId:string|null,slot:BoundSlot,
 now:string):Result<GameSave>{
 if(save.battle)return fail('GEAR_BATTLE','Não é possível trocar revestimentos no combate.')
 if(slot==='weapon'&&instanceId)return fail('BOUND_WEAPON_ONLY','O Vínculo da arma não pode ser substituído; utilize a mesa modular do ferreiro.')
 const existing=save.equippedGearStyles?.[slot]
 if(!instanceId&&!existing)return ok(save)
 if(instanceId===existing?.instanceId)return ok(save)
 const incoming=instanceId?save.inventory.find(item=>item.instanceId===instanceId):undefined
 const offer=incoming?gearOfferById[incoming.definitionId]:undefined
 if(instanceId&&(!incoming||!offer||offer.slot!==slot||!isBound(offer.slot)||incoming.quantity!==1||incoming.locked))
  return fail('GEAR_INVALID','Escolha uma peça comercial compatível e desbloqueada.')
 if(offer){
  const eligible=checkGearWear(save,offer)
  if(!eligible.ok)return eligible
  // Starter commercial shells for protection/necklace/bracelet are allowed before the
  // permanent Bond exists. Once the Bond is earned this same instance remains worn
  // as its shell, never creating or replacing a Bond.
  if(!save.character.bondedEquipment[slot] && !['shield','necklace','bracelet'].includes(slot))
   return fail('GEAR_BOND','Obtenha primeiro o Vínculo permanente deste slot.')
 }
 const next=structuredClone(save)
 next.equippedGearStyles??={}
 if(incoming){
  next.inventory=next.inventory.filter(item=>item.instanceId!==incoming.instanceId)
  next.equippedGearStyles[slot]=incoming
 }else{
  delete next.equippedGearStyles[slot]
 }
 if(existing)next.inventory.push(existing)
 next.updatedAt=now;next.revision+=1
 next.eventLog.push('GearStyleEquipped:v0515:'+slot+':'+(offer?.id??'none'))
 return ok(next)
}

/** G1→G2→G3 in Durnan's forge. Does not touch bound grade (G1→G7). */
export function refineCatalogGear(save:GameSave,instanceId:string,now:string):Result<GameSave>{
 if(save.battle||save.world.currentLocationId!=='location_terran_forge')
  return fail('GEAR_FORGE_LOCATION','Visite Durnan na Casa do Ferreiro.')
 const all=[...save.inventory,...(save.equippedBasicArmor?[save.equippedBasicArmor]:[]),
  ...Object.values(save.equippedComplementary??{}),...Object.values(save.equippedGearStyles??{})]
 const item=all.find(entry=>entry?.instanceId===instanceId)
 const offer=item?gearOfferById[item.definitionId]:undefined
 if(!item||!offer)return fail('GEAR_FORGE_ITEM','Peça do catálogo não encontrada.')
 if(item.locked||item.favorite)return fail('GEAR_FORGE_LOCK','Desproteja a peça para evoluí-la.')
 const grade=getGearGrade(item.refinementLevel)
 if(grade===3)return fail('GEAR_FORGE_MAX','Esta peça já alcançou Grau 3.')
 const price=grade===1?offer.forgeG2:offer.forgeG3
 if(save.wallet.gold<price)return fail('GEAR_FORGE_GOLD','São necessários '+price+' Ouro.')
 const next=structuredClone(save)
 const inventory=[...next.inventory,...(next.equippedBasicArmor?[next.equippedBasicArmor]:[]),
  ...Object.values(next.equippedComplementary??{}),...Object.values(next.equippedGearStyles??{})]
 const actual=inventory.find(entry=>entry?.instanceId===instanceId)!
 actual.refinementLevel=(actual.refinementLevel??0)+1
 next.wallet.gold-=price;next.updatedAt=now;next.revision+=1
 next.eventLog.push('GearRefined:v0515:'+offer.id+':'+(grade+1)+':'+price)
 return ok(next)
}

export function getWornGear(save:GameSave):InventoryItemInstance[]{
 return [...(save.equippedBasicArmor?[save.equippedBasicArmor]:[]),
  ...Object.values(save.equippedComplementary??{}),...Object.values(save.equippedGearStyles??{})]
  .filter((item):item is InventoryItemInstance=>Boolean(item))
}
/** Combat uses primary + secondary bonuses of the current grade.
 * A simple armor's Defense is already counted by the basic-armor system.
 * All its OTHER bonuses still apply; this avoids double-counting mitigation.
 */
export function getGearBonuses(save:GameSave){
 const totals=emptyGearStats()
 for(const item of getWornGear(save)){
  const offer=gearOfferById[item.definitionId]
  if(!offer)continue
  const isSimpleArmor=item.instanceId===save.equippedBasicArmor?.instanceId
  if(isSimpleArmor&&save.character.bondedEquipment.armor)continue
  for(const {stat,value} of getGearStatEntries(offer,getGearGrade(item.refinementLevel))){
   // Commercial armor's mitigation is already counted as basic armor in derivedStats.
   if(isSimpleArmor&&stat==='mitigation')continue
   totals[stat]+=value
  }
 }
 return totals
}

export const getSetPrice=(setId:string)=>
 gearSetById[setId]?.itemIds.reduce((sum,id)=>sum+gearOfferById[id].price,0)??0
