import { describe,expect,it } from 'vitest'
import { classDefinitions } from './progression'
import { equipmentOffersV0515,equipmentSetsV0515,gearOfferById,getGearStatEntries } from './equipmentV0515'
import { GEAR_STAT_KEYS, NERIS_COMBAT_PROFILES } from './equipmentProfilesV05152'

describe('v0.5.15.2 — Neris: cobertura real e variedade de status',()=>{
 const common=equipmentOffersV0515.filter(o=>o.channel==='PUBLIC_TERRAN'&&o.tier===1)

 it('preserves 120 common items and 12 class-free combat profiles, with seven actual bonus channels',()=>{
  expect(common).toHaveLength(120)
  expect(Object.keys(NERIS_COMBAT_PROFILES)).toHaveLength(12)
  const used=new Set(common.flatMap(item=>[item.stat,item.secondaryStat]))
  expect([...used].sort()).toEqual([...GEAR_STAT_KEYS].sort())
  expect(equipmentSetsV0515.filter(s=>s.channel==='PUBLIC_TERRAN'&&s.tier===1)).toHaveLength(12)
  for(const offer of common){
   expect(offer.classId).toBeUndefined()
   expect(offer.clanId).toBeUndefined()
   expect(offer.stat).not.toBe(offer.secondaryStat)
   expect(getGearStatEntries(offer,1)).toHaveLength(2)
   expect(offer.values[0]).toBeGreaterThan(0)
   expect(offer.secondaryValues[0]).toBeGreaterThan(0)
  }
 })

 it('offers twelve distinct real weapon bonuses, not twelve renamed copies',()=>{
  const weapons=common.filter(o=>o.slot==='weapon')
  expect(weapons).toHaveLength(12)
  const signatures=weapons.map(o=>[o.stat,o.secondaryStat].join('+'))
  expect(new Set(signatures).size).toBe(12)
  for(const weapon of weapons) {
   const profile=NERIS_COMBAT_PROFILES[weapon.recommendedClassId!]
   expect(weapon.stat).toBe(profile.weaponPrimary)
   expect(weapon.secondaryStat).toBe(profile.weaponSecondary)
  }
  const universal=weapons.find(o=>o.stat==='attackPower')!
  const physical=weapons.find(o=>o.stat==='physicalAttack')!
  const magical=weapons.find(o=>o.stat==='magicalAttack')!
  expect(universal.values[0]).toBeLessThan(physical.values[0])
  expect(universal.values[0]).toBeLessThan(magical.values[0])
 })

 it('offers different part functions and grows BOTH effects with forge grades and tiers',()=>{
  for(const set of equipmentSetsV0515){
   const signatures=new Set(set.itemIds.map(id=>{
    const o=gearOfferById[id]
    return o.stat+'+'+o.secondaryStat
   }))
   expect(signatures.size).toBeGreaterThanOrEqual(5)
   for(const id of set.itemIds){
    const item=gearOfferById[id]
    expect(item.stat).not.toBe(item.secondaryStat)
    expect(item.values[0]).toBeLessThan(item.values[1])
    expect(item.values[1]).toBeLessThan(item.values[2])
    expect(item.secondaryValues[0]).toBeLessThan(item.secondaryValues[1])
    expect(item.secondaryValues[1]).toBeLessThan(item.secondaryValues[2])
   }
  }
  for(const set of equipmentSetsV0515.filter(s=>s.tier<5)){
   const upper=equipmentSetsV0515.find(s=>s.channel===set.channel &&
     s.classId===set.classId && s.clanId===set.clanId &&
     s.recommendedClassId===set.recommendedClassId && s.tier===set.tier+1)!
   expect(upper).toBeTruthy()
   for(let i=0;i<10;i++){
    const low=gearOfferById[set.itemIds[i]],high=gearOfferById[upper.itemIds[i]]
    expect(low.values[2]).toBeLessThan(high.values[0])
    expect(low.secondaryValues[2]).toBeLessThan(high.secondaryValues[0])
   }
  }
 })

 it('makes exclusive Clan and Class gear strictly better than same-Tier common items',()=>{
  const publicBySignature=new Map(common.map(item=>[item.recommendedClassId+':'+item.slot,item]))
  for(const item of equipmentOffersV0515.filter(o=>o.channel==='CLASS_EXCLUSIVE'&&o.tier===1)){
   const publicItem=publicBySignature.get(item.classId+':'+item.slot)!
   expect(publicItem).toBeTruthy()
   expect(item.stat).toBe(publicItem.stat)
   expect(item.secondaryStat).toBe(publicItem.secondaryStat)
   expect(item.values[0]).toBeGreaterThan(publicItem.values[2])
   expect(item.secondaryValues[0]).toBeGreaterThan(publicItem.secondaryValues[2])
  }
  for(const item of equipmentOffersV0515.filter(o=>o.channel==='CLAN_EXCLUSIVE'&&o.tier===1)){
   for(const publicItem of common.filter(o=>o.slot===item.slot)){
    expect(item.values[0]+item.secondaryValues[0])
     .toBeGreaterThan(publicItem.values[0]+publicItem.secondaryValues[0])
   }
  }
  expect(classDefinitions.every(cls=>NERIS_COMBAT_PROFILES[cls.id])).toBe(true)
 })
})
