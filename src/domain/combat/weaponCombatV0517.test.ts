import {describe,expect,it} from 'vitest'
import {content} from '../../content/catalog'
import {getWeaponAttackCardsV0517,COMMON_DEFENSE_SKILL_IDS_V0517} from '../../content/combatStylesV0517'
import {createNewSave,bindPrologueWeapon} from '../game/createSave'
import {gameSaveSchema} from '../../persistence/saveSchema'
import {createBattle,submitBattleCommand} from './engine'
import type {BattleState} from './types'
const NOW='2026-11-13T12:00:00.000Z'
const ready=(weapon='bound_weapon_prologue_base')=>{
 const save=createNewSave('qa-v0517','Terrírian','character.terririan.default',content,NOW)
 save.character.attributes.strength.die=8
 save.character.attributes.vigor.die=6
 save.character.attributes.agility.die=6
 save.character.attributes.cunning.die=6
 const result=bindPrologueWeapon(save,content,NOW,'weapon-v0517',weapon)
 if(!result.ok)throw Error(result.message)
 return result.value
}
const prepared=(id:string):BattleState=>{
 const battle=createBattle(ready(),content.encounters.encounter_fungorro_01,content,id,{manualInitiative:true})
 const enemy=Object.values(battle.combatants).find(x=>x.side==='enemy')!
 battle.phase='AwaitingAction';battle.actorId='combatant_player';battle.actorCursor=0
 battle.initiativeOrder=['combatant_player',enemy.id]
 return battle
}
describe('v0.5.17 — armas diferenciadas e defesa aleatória',()=>{
 it('arco possui flechas; cetro magias; machado golpes próprios',()=>{
  const bow=createBattle(ready('bound_weapon_long_bow'),content.encounters.encounter_fungorro_01,content,'bow-v0517')
  const mage=createBattle(ready('bound_weapon_arcane_scepter'),content.encounters.encounter_fungorro_01,content,'scepter-v0517')
  const axe=createBattle(ready('bound_weapon_war_axe'),content.encounters.encounter_fungorro_01,content,'axe-v0517')
  expect(getWeaponAttackCardsV0517(bow.combatants.combatant_player.weaponArchetype).map(x=>x.name)).toEqual(['Flecha Direta','Flecha de Dispersão'])
  expect(getWeaponAttackCardsV0517(mage.combatants.combatant_player.weaponArchetype).map(x=>x.name)).toEqual(['Projétil Arcano','Onda de Energia'])
  expect(getWeaponAttackCardsV0517(axe.combatants.combatant_player.weaponArchetype).map(x=>x.name)).toEqual(['Machadada','Varredura do Machado'])
  expect(mage.combatants.combatant_player.skillIds).toContain('skill_scepter_ethereal_arrow_v0517')
  expect(content.boundItemBases.bound_weapon_arcane_scepter.skillUnlocks).toContainEqual({grade:2,skillId:'skill_scepter_arcane_nova_v0517'})
  expect(content.combatSkills.skill_bow_piercing_shot.name).toContain('Flecha')
  expect(COMMON_DEFENSE_SKILL_IDS_V0517.every(id=>bow.combatants.combatant_player.skillIds.includes(id))).toBe(true)
 })
 it('Bloqueio pode falhar ou vencer e persiste corretamente no save',()=>{
  const outcomes=new Set<string>()
  for(let i=0;i<32;i++){
   const battle=prepared('block-v0517-'+i)
   const response=submitBattleCommand(battle,{type:'skill',skillId:'skill_nexus_block_v0517',targetId:'combatant_player'},content)
   expect(response.ok).toBe(true)
   if(!response.ok)continue
   const attempt=response.value.log.find(x=>x.message.includes('tenta Bloqueio'))
   expect(attempt?.message).toContain('d6=')
   outcomes.add(attempt?.message.includes('SUCESSO')?'success':'fail')
   const save=ready()
   save.battle=response.value
   expect(gameSaveSchema.safeParse(save).success).toBe(true)
  }
  expect(outcomes).toEqual(new Set(['success','fail']))
 })
 it('Aparar, Esquiva e Contragolpe usam RNG e recarga',()=>{
  for(const skillId of COMMON_DEFENSE_SKILL_IDS_V0517.slice(1)){
   const battle=prepared('reaction-'+skillId)
   const response=submitBattleCommand(battle,{type:'skill',skillId,targetId:'combatant_player'},content)
   expect(response.ok).toBe(true)
   if(!response.ok)continue
   expect(response.value.log.some(entry=>entry.message.includes('tenta '))).toBe(true)
   expect(response.value.combatants.combatant_player.skillCooldowns?.[skillId]??0).toBeGreaterThan(0)
  }
 })
 it('comando legado de duplo ataque não gasta turno nem RNG',()=>{
  const battle=prepared('old-double')
  const snapshot=structuredClone(battle)
  expect(submitBattleCommand(battle,{type:'doubleAttack',targetId:'x'} as unknown as Parameters<typeof submitBattleCommand>[1],content))
   .toMatchObject({ok:false,code:'REMOVED_ACTION_V0517'})
  expect(battle).toEqual(snapshot)
 })
})
