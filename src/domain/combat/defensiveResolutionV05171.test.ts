import {describe,expect,it} from 'vitest'
import {content} from '../../content/catalog'
import {createNewSave,bindPrologueWeapon} from '../game/createSave'
import {createBattle} from './engine'
import {resolveDefenseV05171,getDefenseChanceV05171,getAttackDeliveryV05171} from './defensiveResolutionV05171'
import {previewCombatSkill} from './skillPreview'
const NOW='2026-11-13T20:00:00.000Z'
function actors(){
 const save=createNewSave('def-owner','Terrírian','character.terririan.default',content,NOW)
 const linked=bindPrologueWeapon(save,content,NOW,'def-weapon')
 if(!linked.ok)throw Error(linked.message)
 const battle=createBattle(linked.value,content.encounters.encounter_fungorro_01,content,'def-battle',{manualInitiative:true})
 return {save:linked.value,player:battle.combatants.combatant_player,
  enemy:Object.values(battle.combatants).find(x=>x.side==='enemy')!}
}
describe('v0.5.17.1 — reações defensivas com funções distintas',()=>{
 it('parry does not annul arcane or projectiles; Golem has a flagged exception',()=>{
  const {player}=actors()
  expect(resolveDefenseV05171(player,'parry','arcane',4,4).valid).toBe(false)
  expect(resolveDefenseV05171(player,'parry','projectile',4,4).valid).toBe(false)
  expect(resolveDefenseV05171(player,'parry','projectile',4,4,'skill_granite_slam').valid).toBe(true)
  expect(getDefenseChanceV05171(player,'parry','arcane').successPercent).toBe(0)
 })
 it('dodge avoids a directed hit but reduces only half of a successful area hit',()=>{
  const {player}=actors()
  const single=resolveDefenseV05171(player,'dodge','melee',4,4)
  const aoe=resolveDefenseV05171(player,'dodge','area',4,4)
  expect(single).toMatchObject({valid:true,success:true,damageFactor:0})
  expect(aoe).toMatchObject({valid:true,success:true,damageFactor:.5})
  expect(getDefenseChanceV05171(player,'dodge','melee').successPercent).toBeGreaterThan(0)
 })
 it('shield block reduces but cannot guarantee immortality, even with Tier 5',()=>{
  const {player}=actors()
  player.hasBoundShield=true
  player.reactionBonuses={block:2}
  expect(resolveDefenseV05171(player,'block','melee',4,1).success).toBe(false)
  const max=resolveDefenseV05171(player,'block','melee',4,4)
  expect(max.success).toBe(true)
  expect(max.reduction).toBeGreaterThan(3)
  expect(getDefenseChanceV05171(player,'block','melee').successPercent).toBeLessThan(100)
 })
 it('counterattacks only in melee, with risk, never grants a second turn',()=>{
  const {player}=actors()
  expect(resolveDefenseV05171(player,'counter','arcane',4,4).counterFraction).toBe(0)
  const counter=resolveDefenseV05171(player,'counter','melee',4,4)
  expect(counter.success).toBe(true)
  expect(counter.counterFraction).toBeGreaterThan(0)
  expect(counter.damageFactor).toBe(1)
 })
 it('preview reflects honest chance and eligible delivery without a synthetic die',()=>{
  const {player,enemy}=actors()
  const skill=content.combatSkills.skill_nexus_parry_v0517
  const before=structuredClone(player)
  const preview=previewCombatSkill(player,enemy,skill,content)
  expect(preview.reaction?.validAgainst).toContain('melee')
  expect(preview.effects.join(' ')).toContain('Compatível:')
  expect(player).toEqual(before)
 })
 it('attack delivery is data-driven, not inferred from icon assets',()=>{
  const {enemy}=actors()
  expect(getAttackDeliveryV05171(enemy,{...content.combatSkills.skill_nexus_parry_v0517,
   id:'test',delivery:'area'})).toBe('area')
  expect(getAttackDeliveryV05171(enemy,content.combatSkills.skill_granite_slam)).toBe('projectile')
 })
})
