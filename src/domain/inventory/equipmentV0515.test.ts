import { describe, expect, it } from 'vitest'
import { content } from '../../content/catalog'
import { equipmentOffersV0515, equipmentSetsV0515, gearOfferById, gearSetById, getGearGrade } from '../../content/equipmentV0515'
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
 it('keeps T1 G3 strictly weaker than T2 G1 for every identical slot and lineage',()=>{
  for(const set of equipmentSetsV0515.filter(s=>s.tier<5)){
   const next=gearSetById[set.id.replace(/_t[1-4]$/,match=>'_t'+(Number(match.slice(2))+1))]
   expect(next).toBeTruthy()
   for(let index=0;index<10;index++)
    expect(gearOfferById[set.itemIds[index]].values[2]).toBeLessThan(gearOfferById[next.itemIds[index]].values[0])
  }
 })
 it('only allows public sets in Terran without requiring clan/class, with atomic all-or-nothing payment',()=>{
  const save=base()
  const set=equipmentSetsV0515.find(s=>s.channel==='PUBLIC_TERRAN'&&s.tier===1)!
  const cost=getSetPrice(set.id)
  const bought=purchaseGear(save,set.itemIds,NOW)
  expect(bought.ok).toBe(true)
  if(!bought.ok)return
  expect(bought.value.inventory).toHaveLength(10)
  expect(bought.value.wallet.gold).toBe(save.wallet.gold-cost)
  expect(save.inventory).toHaveLength(0)
  const broke={...save,wallet:{gold:cost-1}}
  expect(purchaseGear(broke,set.itemIds,NOW)).toMatchObject({ok:false,code:'GEAR_GOLD'})
 })
 it('rejects buying clan/class exclusives from Terran, another castle or before initiation',()=>{
  const save=base()
  const clan=equipmentOffersV0515.find(o=>o.channel==='CLAN_EXCLUSIVE'&&o.tier===1&&o.clanId==='dunavar')!
  const cls=equipmentOffersV0515.find(o=>o.channel==='CLASS_EXCLUSIVE'&&o.tier===1&&o.classId==='sentinela_da_luz')!
  expect(checkGearAccess(save,clan)).toMatchObject({ok:false,code:'GEAR_LOCATION'})
  save.world.currentLocationId='interior_clan_dunavar_castle'
  expect(checkGearAccess(save,clan)).toMatchObject({ok:false,code:'GEAR_CLAN'})
  save.character.clan.clanId='dunavar'
  expect(checkGearAccess(save,clan)).toMatchObject({ok:true})
  expect(checkGearAccess(save,cls)).toMatchObject({ok:false,code:'GEAR_CLASS'})
  save.character.classProgression.classId='sentinela_da_luz'
  expect(checkGearAccess(save,cls)).toMatchObject({ok:true})
  save.world.currentLocationId='interior_clan_rustal_castle'
  expect(checkGearAccess(save,cls)).toMatchObject({ok:false,code:'GEAR_LOCATION'})
 })
 it('forges G1→G2→G3 only at Durnan, charges Gold and preserves Tier',()=>{
  const save=base()
  const offer=equipmentOffersV0515.find(o=>o.channel==='PUBLIC_TERRAN'&&o.slot==='helmet'&&o.tier===1)!
  const paid=purchaseGear(save,[offer.id],NOW)
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
  const purchased=purchaseGear(save,[weapon.id],NOW)
  if(!purchased.ok)throw Error('missing weapon purchase')
  const worn=equipGearStyle(purchased.value,purchased.value.inventory[0].instanceId,'weapon',NOW)
  if(!worn.ok)throw Error('missing equip')
  expect(worn.value.character.bondedEquipment.weapon).toBe(linked.id)
  expect(worn.value.boundItems[linked.id]).toEqual(linked)
  expect(worn.value.equippedGearStyles?.weapon?.definitionId).toBe(weapon.id)
  expect(getGearBonuses(worn.value).attackPower).toBe(weapon.values[0])
  expect(gameSaveSchema.safeParse(worn.value).success).toBe(true)
 })
})
