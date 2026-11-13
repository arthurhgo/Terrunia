import {describe,expect,it} from 'vitest'
import {content} from '../../content/catalog'
import {createNewSave,bindPrologueWeapon} from '../game/createSave'
import {createBoundItem,performGradeThreeRite} from './boundItems'
import {createBattle,submitBattleCommand} from '../combat/engine'
import {deriveCharacterStats} from '../character/derivedStats'
import {getBoundAssemblyBonusesV05171,previewAssemblyV05171,commitAssemblyV05171,buyModularPartV05171} from './weaponAssemblyV05171'
import {migrateAndValidateSave,gameSaveSchema} from '../../persistence/saveSchema'
import {weaponPartDefinitionsV05171} from '../../content/weaponPartsV05171'
const NOW='2026-11-13T20:00:00.000Z'
function ready(){
 const start=createNewSave('assembly-owner','Tester','character.terririan.default',content,NOW,
  {saveId:'assembly-save',characterId:'assembly-character'})
 start.character.attributes.strength.die=8
 const bonded=bindPrologueWeapon(start,content,NOW,'assembly-bond','bound_weapon_long_sword')
 if(!bonded.ok)throw Error(bonded.message)
 const save=bonded.value
 save.wallet.gold=1000
 save.world.currentLocationId='location_terran_forge'
 return save
}
function part(save:ReturnType<typeof ready>,id:string,instanceId=id){
 save.inventory.push({instanceId,definitionId:id,rarity:content.items[id].rarity,
  quantity:1,locked:false,favorite:false,acquiredAt:NOW})
 return save
}
describe('v0.5.17.1 — montagem permanente sem substituição do Vínculo',()=>{
 it('160 partes possuem família, quatro slots e tiers 1–5 distintos',()=>{
  expect(weaponPartDefinitionsV05171).toHaveLength(160)
  expect(new Set(weaponPartDefinitionsV05171.map(p=>p.id)).size).toBe(160)
  for(const partDef of weaponPartDefinitionsV05171)
   expect(content.items[partDef.id]?.category).toBe('material')
 })
 it('montagem só muda o original, debita exatamente uma peça e gera bônus reais em atributos e dano',()=>{
  const save=part(ready(),'part_v05171_blade_body_t1')
  const oldId=save.character.bondedEquipment.weapon!
  const oldStats=deriveCharacterStats(save,content)
  const preview=previewAssemblyV05171(save,oldId,'part_v05171_blade_body_t1',content)
  expect(preview.ok).toBe(true)
  expect(save.boundItems[oldId].assembly).toBeUndefined()
  const made=commitAssemblyV05171(save,oldId,'part_v05171_blade_body_t1',content,NOW)
  expect(made.ok).toBe(true)
  if(!made.ok)return
  expect(made.value.character.bondedEquipment.weapon).toBe(oldId)
  expect(made.value.boundItems[oldId].grade).toBe(1)
  expect(made.value.boundItems[oldId].memories).toEqual(save.boundItems[oldId].memories)
  expect(made.value.inventory.some(i=>i.definitionId==='part_v05171_blade_body_t1')).toBe(false)
  expect(made.value.wallet.gold).toBe(save.wallet.gold-4)
  expect(deriveCharacterStats(made.value,content).primaryAttack.value).toBe(oldStats.primaryAttack.value+1)
  const before=createBattle(save,content.encounters.encounter_fungorro_01,content,'same-battle',{manualInitiative:true})
  const after=createBattle(made.value,content.encounters.encounter_fungorro_01,content,'same-battle',{manualInitiative:true})
  expect(after.combatants.combatant_player.attackPower).toBe(before.combatants.combatant_player.attackPower+1)
  expect(gameSaveSchema.safeParse(made.value).success).toBe(true)
  const enemy=Object.values(before.combatants).find(a=>a.side==='enemy')!
  before.phase='AwaitingAction';before.actorId='combatant_player';before.actorCursor=0
  before.initiativeOrder=['combatant_player',enemy.id]
  after.phase='AwaitingAction';after.actorId='combatant_player';after.actorCursor=0
  after.initiativeOrder=['combatant_player',enemy.id]
  before.combatants[enemy.id].hp=100;before.combatants[enemy.id].maxHp=100
  after.combatants[enemy.id].hp=100;after.combatants[enemy.id].maxHp=100
  const a=submitBattleCommand(before,{type:'attack',targetId:enemy.id},content)
  const b=submitBattleCommand(after,{type:'attack',targetId:enemy.id},content)
  expect(a.ok&&b.ok).toBe(true)
  if(a.ok&&b.ok){
   expect(b.value.combatants[enemy.id].hp).toBeLessThanOrEqual(a.value.combatants[enemy.id].hp)
   expect(b.value.combatants.combatant_player.attackPower).toBe(a.value.combatants.combatant_player.attackPower+1)
  }
 })
 it('não é possível comprar ou instalar item de outra família, in battle, sem Ouro ou favorito',()=>{
  const save=part(ready(),'part_v05171_bow_body_t1')
  expect(previewAssemblyV05171(save,'assembly-bond','part_v05171_bow_body_t1',content))
   .toMatchObject({ok:false,code:'ASSEMBLY_INCOMPATIBLE'})
  save.battle=createBattle(save,content.encounters.encounter_fungorro_01,content,'in-battle',{manualInitiative:true})
  expect(commitAssemblyV05171(save,'assembly-bond','part_v05171_bow_body_t1',content,NOW))
   .toMatchObject({ok:false,code:'ASSEMBLY_FORGE_REQUIRED'})
  save.battle=null
  save.inventory[0].favorite=true
  expect(commitAssemblyV05171(save,'assembly-bond','part_v05171_bow_body_t1',content,NOW).ok).toBe(false)
 })
 it('Tier inferior não apaga o anterior; histórico armazena a peça antiga',()=>{
  let save=ready()
  for(const id of ['part_v05171_blade_body_t1','part_v05171_blade_body_t2'])part(save,id)
  const first=commitAssemblyV05171(save,'assembly-bond','part_v05171_blade_body_t1',content,NOW)
  if(!first.ok)throw Error(first.message)
  const second=commitAssemblyV05171(first.value,'assembly-bond','part_v05171_blade_body_t2',content,NOW)
  expect(second.ok).toBe(true)
  if(!second.ok)return
  expect(second.value.boundItems['assembly-bond'].assembly?.retiredPartIds).toContain('part_v05171_blade_body_t1')
  expect(commitAssemblyV05171(second.value,'assembly-bond','part_v05171_blade_body_t1',content,NOW))
   .toMatchObject({ok:false,code:'ASSEMBLY_REFINEMENT_ORDER'})
 })
 it('escudo é segundo Vínculo com bônus independentes, não uma arma substituta',()=>{
  const save=ready()
  const shield=createBoundItem(save.character.id,content.boundItemBases.bound_shield_round,NOW,'assembly-shield')
  save.boundItems[shield.id]=shield;save.character.bondedEquipment.shield=shield.id
  part(save,'part_v05171_shield_body_t1')
  const made=commitAssemblyV05171(save,shield.id,'part_v05171_shield_body_t1',content,NOW)
  expect(made.ok).toBe(true)
  if(made.ok){
   expect(getBoundAssemblyBonusesV05171(made.value,'shield').guard).toBe(1)
   expect(made.value.character.bondedEquipment.weapon).toBe('assembly-bond')
   const after=createBattle(made.value,content.encounters.encounter_fungorro_01,content,'shield-stats')
   const before=createBattle(save,content.encounters.encounter_fungorro_01,content,'shield-stats')
   expect(after.combatants.combatant_player.physicalGuard).toBe((before.combatants.combatant_player.physicalGuard??0)+1)
   expect(after.combatants.combatant_player.skillIds).toContain('skill_offhand_shield_bash_v05171')
  }
 })
 it('joias não são encaixadas como módulos estruturais no Grau I',()=>{
  const save=ready()
  const gem='item_modular_gem_fire_v05171'
  save.inventory.push({instanceId:'gem-1',definitionId:gem,rarity:content.items[gem].rarity,quantity:1,
   locked:false,favorite:false,acquiredAt:NOW})
  expect(previewAssemblyV05171(save,'assembly-bond',gem,content).ok).toBe(false)
  expect(performGradeThreeRite(save,'assembly-bond','gem-1',content,NOW).ok).toBe(false)
 })
 it('migração 17→18 devolve casca comercial sem apagar memórias, gema, ressonância ou arma',()=>{
  const save=ready()
  const weaponId=save.character.bondedEquipment.weapon!
  save.boundItems[weaponId].resonance=123
  const legacy={...structuredClone(save),schemaVersion:17}
  const old=Object.values(content.items).find(item=>item.affinityTags.includes('gear-v0515')&&item.affinityTags.includes('weapon'))!
  legacy.equippedGearStyles={weapon:{instanceId:'old-shell-1',definitionId:old.id,
   rarity:old.rarity,quantity:1,locked:false,favorite:false,acquiredAt:NOW}}
  const migrated=migrateAndValidateSave(legacy)
  expect(migrated.schemaVersion).toBe(18)
  expect(migrated.equippedGearStyles?.weapon).toBeUndefined()
  expect(migrated.inventory.some(item=>item.instanceId==='old-shell-1')).toBe(true)
  expect(migrated.character.bondedEquipment.weapon).toBe(weaponId)
  expect(migrated.boundItems[weaponId].resonance).toBe(123)
  expect(migrated.boundItems[weaponId].memories).toEqual(save.boundItems[weaponId].memories)
 })
 it('Torvan vende exclusivamente materiais em transação atômica',()=>{
  const save=ready()
  const id='part_v05171_blade_handle_t1'
  save.world.currentLocationId='location_terran_bond_workshop'
  const purchased=buyModularPartV05171(save,id,1,content,NOW)
  expect(purchased.ok).toBe(true)
  if(purchased.ok){
   expect(purchased.value.character.bondedEquipment.weapon).toBe('assembly-bond')
   expect(purchased.value.inventory).toContainEqual(expect.objectContaining({definitionId:id,quantity:1}))
   expect(purchased.value.wallet.gold).toBe(save.wallet.gold-11)
   expect(save.inventory).toHaveLength(0)
  }
 })
})
