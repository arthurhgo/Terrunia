import {describe,expect,it} from 'vitest'
import {content} from '../../content/catalog'
import {createNewSave,bindPrologueWeapon} from '../game/createSave'
import {createBoundItem} from '../bond/boundItems'
import {createBattle,submitBattleCommand} from './engine'
import {applyAffinityV0517,getEffectiveShieldV0517,getEnemyIntentV0517,getPredictedTurnOrderV0517} from './combatTacticsV0517'
import {applyLayeredProtectionV0517} from './layeredDefenseV0517'
import {previewCombatSkill} from './skillPreview'
import {resolveAsset} from '../../assets/assetRegistry'
import type {BattleState} from './types'

const NOW='2026-11-13T18:00:00.000Z'
function scenario(foe='enemy_fungorro_thornback',weapon='bound_weapon_long_sword'){
 const save=createNewSave('tactics-owner','Terrírian','character.terririan.default',content,NOW)
 save.character.attributes.vigor.die=6
 save.character.attributes.agility.die=6
 save.character.attributes.strength.die=8
 save.character.attributes.cunning.die=6
 const result=bindPrologueWeapon(save,content,NOW,'tactics-weapon',weapon)
 if(!result.ok)throw Error(result.message)
 const encounter={...content.encounters.encounter_fungorro_01,enemyDefinitionIds:[foe]}
 const battle=createBattle(result.value,encounter,content,'tactical-'+foe,{manualInitiative:true})
 return {save:result.value,battle,player:battle.combatants.combatant_player,
  enemy:Object.values(battle.combatants).find(x=>x.side==='enemy')!}
}
function turnReady(battle:BattleState){
 battle.phase='AwaitingAction'
 battle.actorId='combatant_player'
 battle.initiativeOrder=['combatant_player',...battle.initiativeOrder.filter(id=>id!=='combatant_player')]
 battle.actorCursor=0
}
describe('v0.5.17 — regras táticas e leituras reais',()=>{
 it('guarda pressionada diminui ESC apenas durante o status e não altera o Vínculo',()=>{
  const {save,battle,player}=scenario()
  const item=createBoundItem(save.character.id,content.boundItemBases.bound_shield_round,NOW,'guard-test')
  save.boundItems[item.id]=item
  save.character.bondedEquipment.shield=item.id
  const shielded=createBattle(save,content.encounters.encounter_fungorro_01,content,'shield-pressure')
  const a=shielded.combatants.combatant_player
  expect(getEffectiveShieldV0517(a,content)).toBe(2)
  expect(applyLayeredProtectionV0517(a,2,'physical',content).hpDamage).toBe(0)
  a.statusEffects.push({definitionId:'status_guard_pressure_v0517',sourceId:battle.actorId,remainingTurns:2})
  expect(getEffectiveShieldV0517(a,content)).toBe(0)
  expect(applyLayeredProtectionV0517(a,2,'physical',content).hpDamage).toBe(2)
  a.statusEffects=[]
  expect(getEffectiveShieldV0517(a,content)).toBe(2)
  expect(save.boundItems[item.id].grade).toBe(1)
 })
 it('afinidade física e ígnea alteram dano sem usar RNG',()=>{
  const {enemy}=scenario()
  const before=structuredClone(enemy)
  const physical=applyAffinityV0517(enemy,10,'physical',content)
  const fire=applyAffinityV0517(enemy,10,'fire',content)
  expect(physical).toMatchObject({damage:9,resistance:0.1})
  expect(fire.damage).toBeGreaterThan(10)
  expect(enemy).toEqual(before)
 })
 it('mostra intenção de acordo com o mesmo ciclo de habilidades do motor',()=>{
  const {battle,enemy}=scenario()
  turnReady(battle)
  const initial=structuredClone(battle)
  expect(getEnemyIntentV0517(battle,enemy,content,1)?.kind).toBe('basic')
  expect(getEnemyIntentV0517(battle,enemy,content,3)).toMatchObject({
   skillId:'skill_enemy_thorn_pressure_v0517',kind:'skill',aspect:'physical'
  })
  const spell=scenario('enemy_ruin_warden')
  turnReady(spell.battle)
  expect(getEnemyIntentV0517(spell.battle,spell.enemy,content,3)).toMatchObject({
   skillId:'skill_enemy_ruin_arcane_v0517',kind:'skill',aspect:'ruin'
  })
  expect(battle).toEqual(initial)
 })
 it('status prevê mudança de ordem sem antecipar dado ou modificar battle',()=>{
  const {battle,player,enemy}=scenario()
  expect(getPredictedTurnOrderV0517(battle,content)).toBeNull()
  turnReady(battle)
  player.initiativeRolledBase=10
  player.initiative=10
  enemy.initiativeRolledBase=9
  enemy.initiative=9
  player.statusEffects.push({definitionId:'status_slow_v0517',sourceId:enemy.id,remainingTurns:2})
  const snapshot=structuredClone(battle)
  expect(getPredictedTurnOrderV0517(battle,content)).toEqual([enemy.id,player.id])
  expect(battle).toEqual(snapshot)
 })
 it('flechas e magias extras são obtidas por Grau sem munição consumível automática',()=>{
  const bow=content.boundItemBases.bound_weapon_long_bow.skillUnlocks
  const mage=content.boundItemBases.bound_weapon_arcane_scepter.skillUnlocks
  expect(bow).toContainEqual({grade:2,skillId:'skill_bow_fire_arrow_v0517'})
  expect(bow).toContainEqual({grade:3,skillId:'skill_bow_poison_arrow_v0517'})
  expect(mage).toContainEqual({grade:2,skillId:'skill_scepter_fire_spark_v0517'})
  expect(mage).toContainEqual({grade:3,skillId:'skill_scepter_dispel_v0517'})
  const {player,enemy}=scenario('enemy_fungorro_thornback','bound_weapon_long_bow')
  expect(previewCombatSkill(player,enemy,content.combatSkills.skill_bow_fire_arrow_v0517,content).aspect).toBe('fire')
  expect(player.skillIds).not.toContain('skill_bow_fire_arrow_v0517')
 })
 it('dissipação remove apenas benefícios após comando legítimo de Grau III',()=>{
  const data=scenario('enemy_fungorro_thornback','bound_weapon_arcane_scepter')
  const weaponId=data.save.character.bondedEquipment.weapon!
  data.save.boundItems[weaponId].grade=3
  const battle=createBattle(data.save,
   {...content.encounters.encounter_fungorro_01,enemyDefinitionIds:['enemy_fungorro_thornback']},
   content,'tactical-dispel',{manualInitiative:true})
  const target=Object.values(battle.combatants).find(x=>x.side==='enemy')!
  target.statusEffects.push({definitionId:'status_haste_v0517',sourceId:target.id,remainingTurns:3})
  target.statusEffects.push({definitionId:'status_slow_v0517',sourceId:target.id,remainingTurns:3})
  turnReady(battle)
  const result=submitBattleCommand(battle,{type:'skill',skillId:'skill_scepter_dispel_v0517',targetId:target.id},content)
  expect(result.ok).toBe(true)
  if(result.ok){
   expect(result.value.log.some(x=>x.message.includes('dissipa 1 efeito'))).toBe(true)
   expect(result.value.combatants[target.id].statusEffects.some(s=>s.definitionId==='status_haste_v0517')).toBe(false)
  }
 })
 it('sprites SVG dos novos estados e habilidades existem com IDs estáveis',()=>{
  const ids=[
   'status.status_guard_pressure_v0517','status.status_arrow_poison_v0517',
   'skill.skill_bow_fire_arrow_v0517','skill.skill_bow_poison_arrow_v0517',
   'skill.skill_scepter_fire_spark_v0517','skill.skill_scepter_dispel_v0517',
   'skill.skill_enemy_thorn_pressure_v0517','skill.skill_enemy_spore_miasma_v0517',
   'skill.skill_enemy_ruin_arcane_v0517'
  ]
  ids.forEach(id=>expect(resolveAsset(id).path,id).toMatch(/\.svg$/))
 })
})
