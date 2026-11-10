import { describe,expect,it } from 'vitest'
import { content } from '../../content/catalog'
import { equipmentOffersV0515 } from '../../content/equipmentV0515'
import { bindPrologueWeapon, createNewSave } from '../game/createSave'
import type { InventoryItemInstance } from '../game/types'
import { equipGearStyle } from '../inventory/equipmentV0515'
import { previewCommercialEquip } from './commercialGearPreviewV05152'
import { deriveCharacterStats } from './derivedStats'
import { gameSaveSchema } from '../../persistence/saveSchema'

const NOW='2026-11-10T12:00:00.000Z'
const make=()=>createNewSave('qa','Terrírian sem Clã','character.terririan.default',content,NOW)
const item=(id:string):InventoryItemInstance=>({
 instanceId:'qa_'+id,definitionId:id,quantity:1,rarity:'common',
 locked:false,favorite:false,acquiredAt:NOW,refinementLevel:0,
})

describe('v0.5.15.2 — every equipment bonus has a live stat delta and Bond-safe initial slots',()=>{
 it('equips the precise Guard training protector, necklace and bracelet before their Bonds',()=>{
  let save=make()
  expect(save.character.clan.clanId).toBeNull()
  expect(save.character.classProgression.classId).toBeNull()
  const base=deriveCharacterStats(save,content)
  for(const slot of ['shield','necklace','bracelet'] as const){
   const offer=equipmentOffersV0515.find(o=>o.channel==='PUBLIC_TERRAN'&&o.tier===1&&
     o.recommendedClassId==='sentinela_da_luz'&&o.slot===slot)!
   expect(offer.name).toContain('Treino do Guarda')
   const instance=item(offer.id)
   save.inventory.push(instance)
   const equipped=equipGearStyle(save,instance.instanceId,slot,NOW)
   expect(equipped.ok,offer.name).toBe(true)
   if(!equipped.ok)continue
   save=equipped.value
   expect(save.equippedGearStyles?.[slot]?.instanceId).toBe(instance.instanceId)
   expect(save.character.bondedEquipment[slot]).toBeNull()
   expect(save.inventory.find(x=>x.instanceId===instance.instanceId)).toBeUndefined()
   expect(gameSaveSchema.safeParse(save).success).toBe(true)
  }
  const wearing=deriveCharacterStats(save,content)
  expect(wearing.defense.value).toBeGreaterThan(base.defense.value)
  expect(wearing.mana.value).toBeGreaterThan(base.mana.value)
  const unequipped=equipGearStyle(save,null,'shield',NOW)
  expect(unequipped.ok).toBe(true)
  if(unequipped.ok)expect(deriveCharacterStats(unequipped.value,content).defense.value)
   .toBeLessThan(wearing.defense.value)
 })
 it('keeps all 1400 catalog SKUs functional, with accurate derived changes and all slots covered',()=>{
  const start=make()
  const bound=bindPrologueWeapon(start,content,NOW,'qa-weapon')
  if(!bound.ok)throw Error(bound.message)
  const save=bound.value
  save.character.level=13
  const usedSlots=new Set<string>(),usedStats=new Set<string>()
  for(const offer of equipmentOffersV0515){
   save.character.clan.clanId=offer.clanId??null
   save.character.classProgression.classId=offer.classId??null
   const preview=previewCommercialEquip(save,item(offer.id),content)!
   expect(preview,offer.id).toBeTruthy()
   expect(preview.wearable,offer.id).toBe(true)
   expect(preview.stats).toHaveLength(2)
   expect(preview.stats[0].value,offer.id).toBeGreaterThan(0)
   expect(preview.deltas.some(delta=>delta.difference>0),offer.id).toBe(true)
   usedSlots.add(offer.slot)
   usedStats.add(offer.stat)
   usedStats.add(offer.secondaryStat)
  }
  expect(usedSlots).toHaveProperty('size',10)
  expect(usedStats).toHaveProperty('size',7)
 })
 it('does not hide changed Defense when equipping a common Tier I protector',()=>{
  const save=make()
  const offer=equipmentOffersV0515.find(o=>o.channel==='PUBLIC_TERRAN'&&
   o.tier===1&&o.slot==='shield'&&o.recommendedClassId==='sentinela_da_luz')!
  const preview=previewCommercialEquip(save,item(offer.id),content)!
  expect(preview.wearable).toBe(true)
  expect(preview.deltas.some(d=>d.key==='defense'&&d.difference>0)).toBe(true)
  expect(preview.stats[0].label).toBe('Defesa')
 })
})
