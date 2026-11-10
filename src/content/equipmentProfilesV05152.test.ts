import { describe,expect,it } from 'vitest'
import { classDefinitions,clanDefinitions } from './progression'
import { equipmentOffersV0515,equipmentSetsV0515,gearOfferById,getGearStatEntries,GEAR_LEVELS } from './equipmentV0515'
import { GEAR_STAT_KEYS,GEAR_SLOT_ORDER,NERIS_COMBAT_PROFILES } from './equipmentProfilesV05152'

describe('v0.5.15.2 — 1400 balanced options; no redundant neutral offers',()=>{
 const common=equipmentOffersV0515.filter(o=>o.channel==='PUBLIC_TERRAN'&&o.tier===1)

 it('preserves 140 sets/1400 SKU IDs, 10 slots, 12 class-free neutral profiles and seven live stat channels',()=>{
  expect(equipmentSetsV0515).toHaveLength(140)
  expect(equipmentOffersV0515).toHaveLength(1400)
  expect(new Set(equipmentOffersV0515.map(o=>o.id)).size).toBe(1400)
  expect(common).toHaveLength(120)
  expect(Object.keys(NERIS_COMBAT_PROFILES)).toHaveLength(12)
  expect(new Set(common.flatMap(o=>[o.stat,o.secondaryStat]))).toEqual(new Set(GEAR_STAT_KEYS))
  expect(clanDefinitions).toHaveLength(4)
  expect(classDefinitions).toHaveLength(12)
  for(const o of common){
   expect(o.classId).toBeUndefined()
   expect(o.clanId).toBeUndefined()
   expect(o.stat).not.toBe(o.secondaryStat)
   expect(o.values[0]).toBeGreaterThanOrEqual(1)
   expect(o.secondaryValues[0]).toBeGreaterThanOrEqual(0)
  }
 })

 it('ensures all 12 neutral choices within EACH slot are different, not cosmetic renames',()=>{
  for(const slot of GEAR_SLOT_ORDER){
   const alternatives=common.filter(o=>o.slot===slot)
   expect(alternatives).toHaveLength(12)
   const signatures=alternatives.map(o=>o.stat+'+'+o.secondaryStat)
   expect(new Set(signatures).size).toBe(12)
  }
  const weapons=common.filter(o=>o.slot==='weapon')
  expect(new Set(weapons.map(o=>o.stat+'+'+o.secondaryStat)).size).toBe(12)
  for(const w of weapons){
   const profile=NERIS_COMBAT_PROFILES[w.recommendedClassId!]
   expect(w.stat).toBe(profile.weaponPrimary)
   expect(w.secondaryStat).toBe(profile.weaponSecondary)
  }
 })

 it('builds ten distinct functions in EVERY outfit, including all 4 Clans and 12 Classes',()=>{
  for(const set of equipmentSetsV0515){
   expect(set.itemIds).toHaveLength(10)
   const options=set.itemIds.map(id=>gearOfferById[id])
   expect(new Set(options.map(o=>o.slot)).size).toBe(10)
   expect(new Set(options.map(o=>o.stat+'+'+o.secondaryStat)).size).toBe(10)
   expect(options.every(o=>o.tier===set.tier&&o.channel===set.channel)).toBe(true)
  }
 })

 it('makes both forge grades useful without doubling every bonus on every upgrade',()=>{
  for(const o of equipmentOffersV0515){
   const one=getGearStatEntries(o,1),two=getGearStatEntries(o,2),three=getGearStatEntries(o,3)
   expect(one[0].value).toBe(two[0].value)
   expect(two[0].value+1).toBe(three[0].value)
   expect(one[1].value+1).toBe(two[1].value)
   expect(two[1].value).toBe(three[1].value)
   expect(one[0].stat).not.toBe(one[1].stat)
  }
 })

 it('keeps higher Tiers useful while retaining a choice between Tier upgrades and forging',()=>{
  for(const set of equipmentSetsV0515.filter(s=>s.tier<5)){
   const higher=equipmentSetsV0515.find(s=>s.channel===set.channel &&
     s.classId===set.classId && s.clanId===set.clanId &&
     s.recommendedClassId===set.recommendedClassId && s.tier===set.tier+1)!
   expect(higher).toBeTruthy()
   for(let i=0;i<10;i++){
    const low=gearOfferById[set.itemIds[i]],high=gearOfferById[higher.itemIds[i]]
    expect(high.level).toBe(GEAR_LEVELS[set.tier])
    expect(high.values[0]).toBeGreaterThanOrEqual(low.values[0])
    expect(high.secondaryValues[0]).toBeGreaterThanOrEqual(low.secondaryValues[0])
    expect(high.values[0]+high.secondaryValues[0])
     .toBeGreaterThan(low.values[0]+low.secondaryValues[0])
   }
  }
 })

 it('makes same-GRADE exclusive lines stronger without a +3/+5 runaway stack',()=>{
  const neutral=new Map(common.map(o=>[o.recommendedClassId+':'+o.slot,o]))
  for(const o of equipmentOffersV0515.filter(o=>o.channel==='CLASS_EXCLUSIVE'&&o.tier===1)){
   const candidate=neutral.get(o.classId+':'+o.slot)!
   expect(candidate).toBeTruthy()
   expect([o.stat,o.secondaryStat]).toEqual([candidate.stat,candidate.secondaryStat])
   expect(o.values[0]+o.secondaryValues[0]).toBe(candidate.values[0]+candidate.secondaryValues[0]+3)
  }
  for(const o of equipmentOffersV0515.filter(o=>o.channel==='CLAN_EXCLUSIVE'&&o.tier===1)){
   expect(o.values[0]).toBeGreaterThanOrEqual(2)
   expect(o.values[0]+o.secondaryValues[0]).toBeLessThanOrEqual(4)
  }
  for(const o of equipmentOffersV0515.filter(o=>o.channel==='CLASS_EXCLUSIVE'&&o.tier===1)){
   const clan=equipmentOffersV0515.find(i=>i.channel==='CLAN_EXCLUSIVE'&&i.tier===1&&
    i.clanId===o.clanId&&i.slot===o.slot)!
   expect(o.values[0]+o.secondaryValues[0]).toBeGreaterThan(clan.values[0]+clan.secondaryValues[0])
  }
 })
})
