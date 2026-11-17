import {describe,it,expect} from 'vitest'
import {content} from '../../content/catalog'
import {createNewSave,bindPrologueWeapon} from '../game/createSave'
import {createBattle} from './engine'
import {createWaveBattle} from './waves'
import {rollModularLootV05171} from './modularLootV05171'
import {getAttackDeliveryV05171,getDefenseChanceV05171,calculateDefenseReactionV05171,
 isDefenseApplicableV05171,applyAreaDodgeV05171} from './defensiveResolutionV05171'
import {gameSaveSchema} from '../../persistence/saveSchema'
import {astravelCombatNodes,astravelEncounterDefinitions} from '../../content/astravel'
import {MODULAR_BALANCE_V05171,modularAssemblyFeeV05171,modularWaveDropPercentV05171} from '../../content/modularBalanceV05171'
const NOW='2026-11-13T21:00:00Z'
const setup=()=>{
 const s=createNewSave('lootqa','Terrírian','character.terririan.default',content,NOW)
 s.character.attributes.strength.die=6
 const b=bindPrologueWeapon(s,content,NOW,'loot-weapon','bound_weapon_long_sword')
 if(!b.ok)throw Error(b.message)
 return b.value
}
describe('v0.5.17.1 — persistent drops and contextual skill reactions',()=>{
 it('every Astravél stage generates valid, seeded, immutable modular loot with original drops retained',()=>{
  const save=setup()
  expect(astravelCombatNodes).toHaveLength(15)
  for(const encounter of astravelEncounterDefinitions){
   const battle=createBattle(save,encounter,content,'stage-'+encounter.id,{manualInitiative:true})
   expect(battle.modularLootRollV05171?.source).toBe('trail')
   const ids=battle.modularLootRollV05171?.itemIds??[]
   expect(ids.length).toBeGreaterThan(0)
   for(const id of ids)expect(content.items[id],id).toBeDefined()
   for(const id of encounter.rewards.lootDefinitionIds)expect(battle.rewards.lootDefinitionIds).toContain(id)
   expect(createBattle(save,encounter,content,'stage-'+encounter.id,{manualInitiative:true}).modularLootRollV05171).toEqual(battle.modularLootRollV05171)
  }
 })
 it('waves cap repeatable part rewards; T5 is rare rather than guaranteed from wave 20',()=>{
  const save=setup()
  for(const [wave,tiers] of [[1,[1]],[4,[2]],[8,[3]],[12,[4]],[20,[3,4,5]],[51,[3,4,5]]] as const){
   const battle=createWaveBattle(save,content,wave)
   expect(battle.modularLootRollV05171?.sourceIndex).toBe(wave)
   const parts=battle.modularLootRollV05171?.itemIds.filter(id=>id.startsWith('part_'))??[]
   expect(parts.length).toBeLessThanOrEqual(1)
   for(const part of parts){
    expect(tiers.some(t=>part.endsWith('_t'+t))).toBe(true)
    expect(battle.rewards.lootDefinitionIds).toContain(part)
   }
   expect(battle.claimed).toBe(false)
   expect(save.character.bondedEquipment.weapon).toBe('loot-weapon')
   expect(gameSaveSchema.safeParse({...save,battle}).success).toBe(true)
  }
  const rolls=Array.from({length:300},(_,index)=>
   rollModularLootV05171(save,'repeat-'+index,42,'astravel_entry',20,content)!.itemIds)
  const awarded=rolls.filter(ids=>ids.some(id=>id.startsWith('part_')))
  const tier5=awarded.filter(ids=>ids.some(id=>id.endsWith('_t5')))
  expect(awarded.length).toBeGreaterThan(40)
  expect(awarded.length).toBeLessThan(150)
  expect(tier5.length).toBeLessThan(awarded.length/5)
  expect(rolls.every(ids=>ids.filter(id=>id.startsWith('part_')).length<=1)).toBe(true)
 })
 it('keeps costs and wave band thresholds centralized in BALANCE_DRAFT parameters',()=>{
  expect(MODULAR_BALANCE_V05171.status).toBe('BALANCE_DRAFT')
  expect(MODULAR_BALANCE_V05171.pricesByTier).toEqual([0,12,32,80,168,310])
  expect(MODULAR_BALANCE_V05171.pricesByTier.slice(1).every((p,i,a)=>i===0||p>a[i-1])).toBe(true)
  expect(modularAssemblyFeeV05171(32)).toBe(8)
  expect([1,4,8,12,20].map(modularWaveDropPercentV05171)).toEqual([70,55,45,35,30])
  expect(MODULAR_BALANCE_V05171.elementalGemDropsEnabled).toBe(false)
 })
 it('never gives an elemental gem on a first-stage encounter, and gem IDs are always real',()=>{
  const save=setup()
  expect(rollModularLootV05171(save,'early',13,'astravel_fungorro_01',undefined,content)?.itemIds.some(x=>x.startsWith('item_gem_'))).toBe(false)
  for(let wave=8;wave<=35;wave++){
   const r=rollModularLootV05171(save,'wave-'+wave,42,'astravel_entry',wave,content)
   for(const id of r?.itemIds??[])expect(content.items[id]).toBeDefined()
  }
 })
 it('Block/Parry/Dodge/Counter have distinct attack-family restrictions and real failure',()=>{
  const battle=createBattle(setup(),content.encounters.encounter_fungorro_01,content,'defense-test',{manualInitiative:true})
  const player=battle.combatants.combatant_player
  expect(isDefenseApplicableV05171('block','projectile')).toBe(true)
  expect(isDefenseApplicableV05171('block','arcane')).toBe(false)
  expect(isDefenseApplicableV05171('parry','projectile')).toBe(false)
  expect(isDefenseApplicableV05171('counter','arcane')).toBe(false)
  expect(isDefenseApplicableV05171('dodge','arcane')).toBe(true)
  expect(calculateDefenseReactionV05171(player,'dodge',1,'melee').success).toBe(false)
  expect(getDefenseChanceV05171(player,'parry','projectile').chance).toBe(0)
  expect(getDefenseChanceV05171(player,'dodge','melee').chance).toBeLessThan(100)
  const bow={...player,weaponArchetype:'bow'}
  expect(getAttackDeliveryV05171(bow)).toBe('projectile')
 })
 it('a successful area dodge mitigates damage without granting immunity, while failure preserves damage',()=>{
  for(const damage of [1,2,3,6,11,25]){
   expect(applyAreaDodgeV05171(damage,true)).toBeGreaterThan(0)
   expect(applyAreaDodgeV05171(damage,true)).toBeLessThanOrEqual(damage)
   expect(applyAreaDodgeV05171(damage,false)).toBe(damage)
  }
  expect(applyAreaDodgeV05171(0,true)).toBe(0)
  const battle=createBattle(setup(),content.encounters.encounter_fungorro_01,content,'dodge-area',{manualInitiative:true})
  const actor=battle.combatants.combatant_player
  expect(isDefenseApplicableV05171('dodge','area')).toBe(true)
  expect(isDefenseApplicableV05171('parry','area')).toBe(false)
  expect(calculateDefenseReactionV05171(actor,'dodge',1,'area').success).toBe(false)
 })

})
