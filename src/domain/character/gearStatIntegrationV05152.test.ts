import { describe,expect,it } from 'vitest'
import { content } from '../../content/catalog'
import { createBoundItem } from '../bond/boundItems'
import { equipmentOffersV0515 } from '../../content/equipmentV0515'
import { bindPrologueWeapon,createNewSave } from '../game/createSave'
import { deriveCharacterStats } from './derivedStats'
import { getGearBonuses } from '../inventory/equipmentV0515'
import { gameSaveSchema } from '../../persistence/saveSchema'
import type { GameSave,InventoryItemInstance } from '../game/types'

const NOW='2026-11-10T12:00:00.000Z'
const offer=(id:string,slot:string)=>equipmentOffersV0515.find(o=>o.channel==='PUBLIC_TERRAN'&&o.tier===1 &&
 o.recommendedClassId===id&&o.slot===slot)!
const instance=(id:string,grade=1):InventoryItemInstance=>({
 instanceId:'piece_'+id,definitionId:id,quantity:1,rarity:'common',locked:false,
 favorite:false,acquiredAt:NOW,refinementLevel:grade-1,
})
const base=()=>createNewSave('owner','Revisao de Status','character.terririan.default',content,NOW)
function withWeapon(boundType:'physical'|'magical'):GameSave{
 const save=base()
 const baseId=boundType==='magical'?'bound_weapon_arcane_scepter':'bound_weapon_prologue_base'
 if(boundType==='magical')save.character.attributes.cunning.die=6
 const result=bindPrologueWeapon(save,content,NOW,'bond-weapon-test',baseId)
 if(!result.ok)throw Error(result.message)
 return result.value
}

describe('v0.5.15.2 — bonuses are applied to actual game/combat stats',()=>{
 it('physical-specific weapon adds damage to physical bound weapons, not magical attack',()=>{
  const save=withWeapon('physical')
  const before=deriveCharacterStats(save,content)
  const gear=offer('batedor_da_vigilia','weapon')
  save.equippedGearStyles={weapon:instance(gear.id)}
  const after=deriveCharacterStats(save,content)
  expect(getGearBonuses(save).physicalAttack).toBe(gear.values[0])
  expect(getGearBonuses(save).initiative).toBe(gear.secondaryValues[0])
  expect(after.primaryAttack.value-before.primaryAttack.value).toBe(gear.values[0])
  expect(after.physicalAttack.value-before.physicalAttack.value).toBe(gear.values[0])
  expect(after.magicalAttack.value-before.magicalAttack.value).toBe(0)
  expect(after.initiative.value-before.initiative.value).toBe(gear.secondaryValues[0])
  expect(gameSaveSchema.safeParse(save).success).toBe(true)
 })

 it('magical-specific weapon increases both spell damage and Mana without affecting physical damage',()=>{
  const save=withWeapon('magical')
  const before=deriveCharacterStats(save,content)
  const gear=offer('astrologo_celestial','weapon')
  save.equippedGearStyles={weapon:instance(gear.id)}
  const after=deriveCharacterStats(save,content)
  expect(after.primaryAttack.value-before.primaryAttack.value).toBe(gear.values[0])
  expect(after.magicalAttack.value-before.magicalAttack.value).toBe(gear.values[0])
  expect(after.physicalAttack.value-before.physicalAttack.value).toBe(0)
  expect(after.mana.value-before.mana.value).toBe(gear.secondaryValues[0])
 })

 it('general attack increases BOTH types while staying numerically weaker than specialized attacks',()=>{
  const save=withWeapon('physical')
  const before=deriveCharacterStats(save,content)
  const gear=offer('forjador_arcano','weapon')
  save.equippedGearStyles={weapon:instance(gear.id)}
  const after=deriveCharacterStats(save,content)
  expect(after.physicalAttack.value-before.physicalAttack.value).toBe(gear.values[0])
  expect(after.magicalAttack.value-before.magicalAttack.value).toBe(gear.values[0])
  expect(after.primaryAttack.value-before.primaryAttack.value).toBe(gear.values[0])
  expect(after.defense.value-before.defense.value).toBe(gear.secondaryValues[0])
 })

 it('a simple equipped armor counts Defense once and adds its secondary Life bonus',()=>{
  const save=base()
  const before=deriveCharacterStats(save,content)
  const gear=offer('sentinela_da_luz','armor')
  expect(gear.stat).toBe('mitigation')
  expect(gear.secondaryStat).toBe('maxHp')
  const worn=instance(gear.id)
  save.equippedBasicArmor=worn
  save.character.basicArmorInstanceId=worn.instanceId
  const stats=deriveCharacterStats(save,content)
  expect(getGearBonuses(save).mitigation).toBe(0)
  expect(getGearBonuses(save).maxHp).toBe(gear.secondaryValues[0])
  expect(stats.defense.value-before.defense.value).toBe(gear.values[0])
  expect(stats.life.value-before.life.value).toBe(gear.secondaryValues[0])
  worn.refinementLevel=2
  const g3=deriveCharacterStats(save,content)
  expect(g3.defense.value-before.defense.value).toBe(gear.values[2])
  expect(g3.life.value-before.life.value).toBe(gear.secondaryValues[2])
  expect(gameSaveSchema.safeParse(save).success).toBe(true)
 })
 it('supports all seven permanent weapon archetypes through role-appropriate neutral gear',()=>{
  const weaponStyles=[
   ['bound_weapon_long_sword','sentinela_da_luz','physical'],
   ['bound_weapon_war_axe','gladiador_da_barreira','physical'],
   ['bound_weapon_long_bow','batedor_da_vigilia','physical'],
   ['bound_weapon_dagger','cacador_de_constelacoes','physical'],
   ['bound_weapon_arcane_scepter','guardiao_das_inscricoes','magical'],
   ['bound_weapon_spellbook','astrologo_celestial','magical'],
   ['bound_weapon_conjuration_staff','gravador_das_sombras','magical'],
  ] as const
  for(const [baseId,role,power] of weaponStyles){
   const save=base()
   const definition=content.boundItemBases[baseId]
   expect(definition.powerType).toBe(power)
   const weapon=createBoundItem(save.character.id,definition,NOW,'test-bound-'+baseId)
   save.boundItems[weapon.id]=weapon
   save.character.bondedEquipment.weapon=weapon.id
   const before=deriveCharacterStats(save,content)
   const gear=offer(role,'weapon')
   expect(gear.stat).toBe(power==='physical'?'physicalAttack':'magicalAttack')
   save.equippedGearStyles={weapon:instance(gear.id)}
   const after=deriveCharacterStats(save,content)
   expect(after.primaryAttack.value-before.primaryAttack.value,baseId).toBe(gear.values[0])
   expect(after.primaryAttack.value,baseId).toBeGreaterThan(before.primaryAttack.value)
  }
 })

})
