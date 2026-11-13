import {describe,expect,it} from 'vitest'
import {content} from '../../content/catalog'
import {createNewSave,bindPrologueWeapon} from '../game/createSave'
import {createBattle} from '../combat/engine'
import {createWaveBattle} from '../combat/waves'
import {rollModularLootV05171,getModularLootTierV05171} from './modularLootV05171'
import {gameSaveSchema} from '../../persistence/saveSchema'
const NOW='2026-11-13T20:00:00.000Z'
function setup(){
 const save=createNewSave('loot-owner','Terrírian','character.terririan.default',content,NOW)
 const result=bindPrologueWeapon(save,content,NOW,'loot-weapon')
 if(!result.ok)throw Error(result.message)
 return result.value
}
describe('v0.5.17.1 — drops de montagem persistentes',()=>{
 it('15 nós têm teto de Tier inicial; Ondas avançam até Tier V sem substituir drops anteriores',()=>{
  expect(getModularLootTierV05171(1,'trail')).toBe(1)
  expect(getModularLootTierV05171(15,'trail')).toBe(3)
  expect(getModularLootTierV05171(3,'wave')).toBe(1)
  expect(getModularLootTierV05171(8,'wave')).toBe(3)
  expect(getModularLootTierV05171(20,'wave')).toBe(5)
 })
 it('primeiras quatro trilhas cobrem todos os encaixes de arma sem RNG de gemas',()=>{
  const save=setup()
  const slots=['body','handle','coreHousing','focusMount']
  const nodes=content.trails.trail_astravel_entry.nodes
  expect(nodes.length).toBeGreaterThanOrEqual(15)
  for(let i=1;i<=4;i++){
   const drops=rollModularLootV05171({battleId:'milestone-'+i,stageIndex:i,save,catalog:content})
   expect(drops).toContain('part_v05171_blade_'+slots[i-1].toLowerCase()+'_t'+(i<=3?1:2))
   expect(drops.some(id=>id.startsWith('item_modular_gem_'))).toBe(false)
  }
 })
 it('mesma batalha possui exatamente os mesmos materiais e não consome RNG do combate',()=>{
  const save=setup()
  const a=createBattle(save,content.encounters.encounter_fungorro_01,content,'fixed-seed',{manualInitiative:true})
  const b=createBattle(save,content.encounters.encounter_fungorro_01,content,'fixed-seed',{manualInitiative:true})
  expect(a.rewards).toEqual(b.rewards)
  expect(a.rngSeed).toBe(b.rngSeed)
  expect(a.rewards.lootDefinitionIds).toContain('part_v05171_blade_body_t1')
  expect(a.rewards.lootDefinitionIds).toEqual(expect.arrayContaining(content.encounters.encounter_fungorro_01.rewards.lootDefinitionIds))
  expect(gameSaveSchema.safeParse({...save,battle:a}).success).toBe(true)
 })
 it('onda repetível tem Tier determinado pelo índice, recompensas sem rerolar no claim',()=>{
  const save=setup()
  const wave=createWaveBattle(save,content,12)
  expect(wave.modularLootRollVersion).toBe(1)
  expect(wave.rewards.lootDefinitionIds.some(id=>id.includes('_t4'))).toBe(true)
  expect(wave.claimed).toBe(false)
  expect(createWaveBattle(save,content,12).rewards.lootDefinitionIds.some(id=>id.startsWith('part_v05171_'))).toBe(true)
 })
})
