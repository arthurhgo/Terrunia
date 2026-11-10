import { describe, expect, it } from 'vitest'
import { content } from '../../content/catalog'
import { castleGearMerchantsV05151 } from '../../content/castleMerchantsV05151'
import { equipmentOffersV0515, equipmentSetsV0515, gearOfferById, getGearGrade } from '../../content/equipmentV0515'
import { equipComplementaryItem } from './complementaryEquipment'
import { createNewSave } from '../game/createSave'
import { createBoundItem } from '../bond/boundItems'
import { purchaseGear, checkGearAccess, equipGearStyle, refineCatalogGear, getGearBonuses, getSetPrice } from './equipmentV0515'
import { gameSaveSchema } from '../../persistence/saveSchema'

const NOW='2026-11-09T18:00:00.000Z'
function base(){
 const save=createNewSave('owner','Terririan Tester','character.terririan.default',content,NOW,
  {saveId:'v0515-save',characterId:'v0515-character'})
 save.wallet.gold=200000
 save.world.currentLocationId='location_terran_bond_workshop'
 return save
}
describe('v0.5.15 gear rules',()=>{
 it('generates 60 public, 20 clan and 60 class sets with exactly ten unique slots',()=>{
  expect(equipmentSetsV0515).toHaveLength(140)
  expect(equipmentOffersV0515).toHaveLength(1400)
  expect(new Set(equipmentOffersV0515.map(o=>o.id)).size).toBe(1400)
  expect(equipmentSetsV0515.filter(s=>s.channel==='PUBLIC_TERRAN')).toHaveLength(60)
  expect(equipmentSetsV0515.filter(s=>s.channel==='CLAN_EXCLUSIVE')).toHaveLength(20)
  expect(equipmentSetsV0515.filter(s=>s.channel==='CLASS_EXCLUSIVE')).toHaveLength(60)
  for(const set of equipmentSetsV0515)expect(new Set(set.itemIds.map(id=>gearOfferById[id].slot)).size).toBe(10)
 })
 it('has exactly one unique merchant per Clan castle, each stocking Clan and Class items',()=>{
  expect(castleGearMerchantsV05151).toHaveLength(4)
  expect(new Set(castleGearMerchantsV05151.map(m=>m.npcId)).size).toBe(4)
  for(const castle of ['interior_clan_dunavar_castle','interior_clan_rustal_castle','interior_clan_cebios_esti_castle','interior_clan_estres_do_et_castle']){
    const merchants=castleGearMerchantsV05151.filter(m=>m.castleId===castle)
    expect(merchants).toHaveLength(1)
    const offers=equipmentOffersV0515.filter(o=>o.castleId===castle)
    expect(offers.filter(o=>o.channel==='CLAN_EXCLUSIVE')).toHaveLength(50)
    expect(offers.filter(o=>o.channel==='CLASS_EXCLUSIVE')).toHaveLength(150)
  }
 })
 it('Neris sells only prereq-free Tier I G1, never a Tier II or any clan/class item',()=>{
  const save=base()
  const publicOne=equipmentOffersV0515.find(o=>o.channel==='PUBLIC_TERRAN'&&o.tier===1)!
  const publicTwo=equipmentOffersV0515.find(o=>o.channel==='PUBLIC_TERRAN'&&o.tier===2)!
  const clan=equipmentOffersV0515.find(o=>o.channel==='CLAN_EXCLUSIVE')!
  const cls=equipmentOffersV0515.find(o=>o.channel==='CLASS_EXCLUSIVE')!
  expect(checkGearAccess(save,publicOne,'presence_neris')).toMatchObject({ok:true})
  expect(checkGearAccess(save,publicTwo,'presence_neris')).toMatchObject({ok:false,code:'GEAR_NERIS_TIER'})
  expect(checkGearAccess(save,clan,'presence_neris')).toMatchObject({ok:false,code:'GEAR_NERIS_EXCLUSIVE'})
  expect(checkGearAccess(save,cls,'presence_neris')).toMatchObject({ok:false,code:'GEAR_NERIS_EXCLUSIVE'})
  expect(purchaseGear(save,[publicTwo.id],NOW,'presence_neris')).toMatchObject({ok:false,code:'GEAR_NERIS_TIER'})
  expect(purchaseGear(save,[clan.id],NOW,'presence_neris')).toMatchObject({ok:false,code:'GEAR_NERIS_EXCLUSIVE'})
 })
 it('uses the same castle merchant for all three classes while strictly enforcing the unlocked Class',()=>{
  const save=base()
  const npc='presence_castle_merchant_clan_dunavar'
  save.world.currentLocationId='interior_clan_dunavar_castle'
  save.character.clan.clanId='dunavar'
  const own=equipmentOffersV0515.find(o=>o.channel==='CLAN_EXCLUSIVE'&&o.tier===1&&o.clanId==='dunavar')!
  const sentinela=equipmentOffersV0515.find(o=>o.channel==='CLASS_EXCLUSIVE'&&o.classId==='sentinela_da_luz'&&o.tier===1)!
  const gladiador=equipmentOffersV0515.find(o=>o.channel==='CLASS_EXCLUSIVE'&&o.classId==='gladiador_da_barreira'&&o.tier===1)!
  const batedor=equipmentOffersV0515.find(o=>o.channel==='CLASS_EXCLUSIVE'&&o.classId==='batedor_da_vigilia'&&o.tier===1)!
  expect(checkGearAccess(save,own,npc)).toMatchObject({ok:true})
  for(const gear of [sentinela,gladiador,batedor])
   expect(checkGearAccess(save,gear,npc)).toMatchObject({ok:false,code:'GEAR_CLASS'})
  const gold=save.wallet.gold
  expect(purchaseGear(save,[sentinela.id],NOW,npc)).toMatchObject({ok:false,code:'GEAR_CLASS'})
  expect(save.wallet.gold).toBe(gold)
  expect(save.inventory).toHaveLength(0)
  save.character.classProgression.classId='gladiador_da_barreira'
  expect(checkGearAccess(save,gladiador,npc)).toMatchObject({ok:true})
  expect(checkGearAccess(save,sentinela,npc)).toMatchObject({ok:false,code:'GEAR_CLASS'})
  expect(checkGearAccess(save,batedor,npc)).toMatchObject({ok:false,code:'GEAR_CLASS'})
  expect(checkGearAccess(save,gladiador,'presence_castle_merchant_class_gladiador_da_barreira'))
   .toMatchObject({ok:false,code:'GEAR_MERCHANT'})
  const paid=purchaseGear(save,[gladiador.id],NOW,npc)
  expect(paid.ok).toBe(true)
  if(paid.ok){
    expect(paid.value.wallet.gold).toBe(gold-gladiador.price)
    expect(paid.value.inventory[0].definitionId).toBe(gladiador.id)
  }
 })
 it('denies cross-Clan sales even if the character is inside the other castle',()=>{
  const save=base()
  save.character.level=13
  save.character.clan.clanId='dunavar'
  save.character.classProgression.classId='sentinela_da_luz'
  save.world.currentLocationId='interior_clan_dunavar_castle'
  const other=equipmentOffersV0515.find(o=>o.channel==='CLASS_EXCLUSIVE'&&o.classId==='forjador_arcano')!
  expect(checkGearAccess(save,other,'presence_castle_merchant_clan_dunavar'))
   .toMatchObject({ok:false,code:'GEAR_MERCHANT'})
  expect(checkGearAccess(save,other,'presence_castle_merchant_clan_rustal'))
   .toMatchObject({ok:false,code:'GEAR_LOCATION'})
 })
 it('trades an affordable Tier I G3 upgrade for higher-Tier raw power without multiplicative stat growth',()=>{
  for(const low of equipmentOffersV0515.filter(o=>o.tier===1)){
   const higher=equipmentOffersV0515.find(o=>o.setId===low.setId.replace(/_t1$/,'_t2')&&o.slot===low.slot)!
   expect(higher).toBeTruthy()
   expect(higher.values[0]+higher.secondaryValues[0]).toBeGreaterThan(low.values[0]+low.secondaryValues[0])
   expect(low.values[2]-low.values[0]).toBe(1)
   expect(low.secondaryValues[2]-low.secondaryValues[0]).toBe(1)
  }
 })

 it('only allows public sets in Terran without requiring clan/class, with atomic all-or-nothing payment',()=>{
  const save=base()
  const set=equipmentSetsV0515.find(s=>s.channel==='PUBLIC_TERRAN'&&s.tier===1)!
  const cost=getSetPrice(set.id)
  const bought=purchaseGear(save,set.itemIds,NOW,'presence_neris')
  expect(bought.ok).toBe(true)
  if(!bought.ok)return
  expect(bought.value.inventory).toHaveLength(10)
  expect(bought.value.wallet.gold).toBe(save.wallet.gold-cost)
  expect(save.inventory).toHaveLength(0)
  const broke={...save,wallet:{gold:cost-1}}
  expect(purchaseGear(broke,set.itemIds,NOW,'presence_neris')).toMatchObject({ok:false,code:'GEAR_GOLD'})
 })
 it('rejects buying clan/class exclusives from Terran, another castle or before initiation',()=>{
  const save=base()
  const clan=equipmentOffersV0515.find(o=>o.channel==='CLAN_EXCLUSIVE'&&o.tier===1&&o.clanId==='dunavar')!
  const cls=equipmentOffersV0515.find(o=>o.channel==='CLASS_EXCLUSIVE'&&o.tier===1&&o.classId==='sentinela_da_luz')!
  expect(checkGearAccess(save,clan,'presence_castle_merchant_clan_dunavar')).toMatchObject({ok:false,code:'GEAR_LOCATION'})
  save.world.currentLocationId='interior_clan_dunavar_castle'
  expect(checkGearAccess(save,clan,'presence_castle_merchant_clan_dunavar')).toMatchObject({ok:false,code:'GEAR_CLAN'})
  save.character.clan.clanId='dunavar'
  expect(checkGearAccess(save,clan,'presence_castle_merchant_clan_dunavar')).toMatchObject({ok:true})
  expect(checkGearAccess(save,cls,'presence_castle_merchant_clan_dunavar')).toMatchObject({ok:false,code:'GEAR_CLASS'})
  save.character.classProgression.classId='sentinela_da_luz'
  expect(checkGearAccess(save,cls,'presence_castle_merchant_clan_dunavar')).toMatchObject({ok:true})
  save.world.currentLocationId='interior_clan_rustal_castle'
  expect(checkGearAccess(save,cls,'presence_castle_merchant_clan_dunavar')).toMatchObject({ok:false,code:'GEAR_LOCATION'})
 })

 it('rejects wearing an exclusive complementary item after loss of its Clan or Class gate',()=>{
  const save=base()
  const gear=equipmentOffersV0515.find(o=>o.channel==='CLASS_EXCLUSIVE'&&o.slot==='helmet'&&o.tier===1&&o.classId==='sentinela_da_luz')!
  save.inventory.push({instanceId:'exclusive-helmet',definitionId:gear.id,quantity:1,rarity:'common',
   locked:false,favorite:false,acquiredAt:NOW})
  expect(equipComplementaryItem(save,'helmet','exclusive-helmet',content,NOW))
   .toMatchObject({ok:false,code:'GEAR_CLAN'})
  save.character.clan.clanId='dunavar'
  expect(equipComplementaryItem(save,'helmet','exclusive-helmet',content,NOW))
   .toMatchObject({ok:false,code:'GEAR_CLASS'})
  save.character.classProgression.classId='sentinela_da_luz'
  expect(equipComplementaryItem(save,'helmet','exclusive-helmet',content,NOW)).toMatchObject({ok:true})
 })
 it('forges G1→G2→G3 only at Durnan, charges Gold and preserves Tier',()=>{
  const save=base()
  const offer=equipmentOffersV0515.find(o=>o.channel==='PUBLIC_TERRAN'&&o.slot==='helmet'&&o.tier===1)!
  const paid=purchaseGear(save,[offer.id],NOW,'presence_neris')
  if(!paid.ok)throw Error('missing purchase')
  const itemId=paid.value.inventory[0].instanceId
  expect(refineCatalogGear(paid.value,itemId,NOW)).toMatchObject({ok:false,code:'GEAR_FORGE_LOCATION'})
  paid.value.world.currentLocationId='location_terran_forge'
  const gradeTwo=refineCatalogGear(paid.value,itemId,NOW)
  if(!gradeTwo.ok)throw Error('missing forge G2')
  expect(getGearGrade(gradeTwo.value.inventory[0].refinementLevel)).toBe(2)
  const gradeThree=refineCatalogGear(gradeTwo.value,itemId,NOW)
  if(!gradeThree.ok)throw Error('missing forge G3')
  expect(getGearGrade(gradeThree.value.inventory[0].refinementLevel)).toBe(3)
  expect(refineCatalogGear(gradeThree.value,itemId,NOW)).toMatchObject({ok:false,code:'GEAR_FORGE_MAX'})
  expect(gradeThree.value.wallet.gold).toBe(paid.value.wallet.gold-offer.forgeG2-offer.forgeG3)
 })
 it('equips a new shell while retaining exactly the same bound item and soul memories',()=>{
  const save=base()
  const baseWeapon=content.boundItemBases.bound_weapon_prologue_base
  const linked=createBoundItem(save.character.id,baseWeapon,NOW,'bond-v0515')
  linked.resonance=79
  linked.memories.push({id:'memory-v0515',type:'special',sourceId:'quest-example',title:'Memória',description:'Protegida',createdAt:NOW})
  save.boundItems[linked.id]=linked
  save.character.bondedEquipment.weapon=linked.id
  const weapon=equipmentOffersV0515.find(o=>o.channel==='PUBLIC_TERRAN'&&o.slot==='weapon'&&o.tier===1)!
  const purchased=purchaseGear(save,[weapon.id],NOW,'presence_neris')
  if(!purchased.ok)throw Error('missing weapon purchase')
  const worn=equipGearStyle(purchased.value,purchased.value.inventory[0].instanceId,'weapon',NOW)
  if(!worn.ok)throw Error('missing equip')
  expect(worn.value.character.bondedEquipment.weapon).toBe(linked.id)
  expect(worn.value.boundItems[linked.id]).toEqual(linked)
  expect(worn.value.equippedGearStyles?.weapon?.definitionId).toBe(weapon.id)
  expect(getGearBonuses(worn.value)[weapon.stat]).toBe(weapon.values[0])
  expect(getGearBonuses(worn.value)[weapon.secondaryStat]).toBe(weapon.secondaryValues[0])
  expect(gameSaveSchema.safeParse(worn.value).success).toBe(true)
 })
})
