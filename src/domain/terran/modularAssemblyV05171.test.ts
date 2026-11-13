import {describe,it,expect} from 'vitest'
import {content} from '../../content/catalog'
import {createNewSave,bindPrologueWeapon} from '../game/createSave'
import {buildAssemblyPreviewV05171,commitAssemblyV05171,purchaseModularPartV05171} from './modularAssemblyV05171'
import {migrateAndValidateSave,gameSaveSchema} from '../../persistence/saveSchema'
import {createBattle} from '../combat/engine'
import {modularPartsV05171} from '../../content/modularWeaponsV05171'
const NOW='2026-11-13T20:00:00.000Z'
function fixture(){
 const raw=createNewSave('forge-test','Terrírian','character.terririan.default',content,NOW,{saveId:'forge-test-save',characterId:'forge-test-character'})
 raw.character.attributes.strength.die=6
 const first=bindPrologueWeapon(raw,content,NOW,'forge-test-bond','bound_weapon_long_sword')
 if(!first.ok)throw Error(first.message)
 const save=first.value
 save.world.currentLocationId='location_terran_bond_workshop'
 save.wallet.gold=300
 return save
}
describe('v0.5.17.1 — modular Bond protection',()=>{
 it('catalogs 160 compatible tiered structural parts without invalid stable IDs',()=>{
  expect(modularPartsV05171).toHaveLength(160)
  for(const p of modularPartsV05171){
   expect(p.id).toMatch(/^[a-z0-9_.-]+$/)
   expect(p.assetId).toMatch(/^[a-z0-9_.-]+$/)
   expect(content.items[p.id]).toBeDefined()
  }
 })
 it('purchases a part, previews freely, and applies permanent ID-preserving stat change',()=>{
  const raw=fixture(),bondId=raw.character.bondedEquipment.weapon!
  const part='part_blade_body_t1'
  const purchase=purchaseModularPartV05171(raw,part,content,NOW)
  expect(purchase.ok).toBe(true)
  if(!purchase.ok)return
  const purchased=purchase.value
  expect(purchased.character.bondedEquipment.weapon).toBe(bondId)
  purchased.world.currentLocationId='location_terran_forge'
  const before=structuredClone(purchased)
  const preview=buildAssemblyPreviewV05171(purchased,'weapon',part,content,NOW)
  expect(preview.ok).toBe(true)
  expect(purchased).toEqual(before)
  if(!preview.ok)return
  expect(preview.value.after.primaryAttack.value).toBeGreaterThan(preview.value.before.primaryAttack.value)
  const result=commitAssemblyV05171(purchased,'weapon',part,content,NOW,purchased.revision)
  expect(result.ok).toBe(true)
  if(!result.ok)return
  expect(result.value.character.bondedEquipment.weapon).toBe(bondId)
  expect(result.value.boundItems[bondId].id).toBe(bondId)
  expect(result.value.boundItems[bondId].grade).toBe(1)
  expect(result.value.boundItems[bondId].assembly?.parts.body).toBe(part)
  expect(result.value.wallet.gold).toBe(before.wallet.gold-preview.value.price)
  expect(result.value.inventory.find(i=>i.definitionId===part)).toBeUndefined()
  expect(gameSaveSchema.safeParse(result.value).success).toBe(true)
  const battle=createBattle({...result.value,world:{...result.value.world,currentLocationId:'terran'}},content.encounters.encounter_fungorro_01,content,'tactical-assembly',{manualInitiative:true})
  expect(battle.combatants.combatant_player.attackPower).toBeGreaterThan(0)
 })
 it('does not allow second installation of same tier, missing inventory, or stale save',()=>{
  const save=fixture()
  save.world.currentLocationId='location_terran_forge'
  expect(commitAssemblyV05171(save,'weapon','part_blade_body_t1',content,NOW).ok).toBe(false)
  save.inventory.push({instanceId:'part_one',definitionId:'part_blade_body_t1',quantity:1,rarity:'common',locked:false,favorite:false,acquiredAt:NOW})
  expect(commitAssemblyV05171(save,'weapon','part_blade_body_t1',content,NOW,save.revision-1).ok).toBe(false)
  const first=commitAssemblyV05171(save,'weapon','part_blade_body_t1',content,NOW)
  expect(first.ok).toBe(true)
  if(first.ok)expect(commitAssemblyV05171(first.value,'weapon','part_blade_body_t1',content,NOW).ok).toBe(false)
 })
 it('reconstructs old schema17 saves with weapon, quest and inventory intact',()=>{
  const old=fixture(),id=old.character.bondedEquipment.weapon!
  old.schemaVersion=17
  old.gameVersion='0.5.17'
  const restored=migrateAndValidateSave(old)
  expect(restored.schemaVersion).toBe(18)
  expect(restored.character.bondedEquipment.weapon).toBe(id)
  expect(restored.boundItems[id].id).toBe(id)
  expect(restored.boundItems[id].components.gems).toEqual([])
  expect(restored.quests.rosetta_modular_01_v05171).toBeDefined()
  expect(migrateAndValidateSave(restored)).toMatchObject({revision:restored.revision,schemaVersion:18})
 })
})
