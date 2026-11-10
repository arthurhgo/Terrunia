import { describe,expect,it } from 'vitest'
import { content } from '../../content/catalog'
import { equipmentOffersV0515 } from '../../content/equipmentV0515'
import { createNewSave,bindPrologueWeapon } from '../game/createSave'
import type { InventoryItemInstance } from '../game/types'
import { createBattle,submitBattleCommand,calculateRolledDamage } from './engine'
import { applyVictoryRecovery } from './victoryRecoveryV05152'
import { DOUBLE_ATTACK_V05152 } from '../../content/combatActionRulesV05152'
import { gameSaveSchema } from '../../persistence/saveSchema'

const NOW='2026-11-10T15:00:00.000Z'
const item=(id:string,instanceId=id):InventoryItemInstance=>({
 instanceId,definitionId:id,quantity:2,rarity:'common',locked:false,favorite:false,acquiredAt:NOW,
})
const start=()=>{
 const save=createNewSave('qa','Terrírian de Teste','character.terririan.default',content,NOW)
 const initial=bindPrologueWeapon(save,content,NOW,'qa-weapon')
 if(!initial.ok)throw Error(initial.message)
 const battle=createBattle(initial.value,content.encounters.encounter_fungorro_01,content,
 'draft-05152-action', {manualInitiative:true})
 const player=battle.combatants.combatant_player
 battle.phase='AwaitingAction';battle.actorId=player.id;battle.actorCursor=0
 battle.initiativeOrder=[player.id,...battle.initiativeOrder.filter(id=>id!==player.id)]
 return {save:initial.value,battle,player}
}

describe('v0.5.15.2 — consumable and one-die combat FSM',()=>{
 it('heals immediately without consuming the main action, reaction, round or RNG',()=>{
  const {battle,player}=start()
  player.hp=3
  const originalRound=battle.round,seed=battle.rngSeed,log=battle.log.length
  const consumable=item('consumable_minor_tonic')
  const after=submitBattleCommand(battle,
   {type:'item',itemInstanceId:consumable.instanceId,targetId:player.id},content,[consumable])
  expect(after.ok).toBe(true)
  if(!after.ok)return
  expect(after.value.combatants[player.id].hp).toBe(11)
  expect(after.value.phase).toBe('AwaitingAction')
  expect(after.value.round).toBe(originalRound)
  expect(after.value.rngSeed).toBe(seed)
  expect(after.value.consumedItemInstanceIds).toEqual([consumable.instanceId])
  expect(after.value.log.slice(log).filter(entry=>entry.tone==='damage')).toHaveLength(0)
  const enemy=Object.values(after.value.combatants).find(actor=>actor.side==='enemy')!
  enemy.hp=enemy.maxHp=1000
  const attack=submitBattleCommand(after.value,{type:'attack',targetId:enemy.id},content)
  expect(attack.ok).toBe(true)
  expect(attack.ok && attack.value.log.some(entry=>entry.roll?.action==='Ataque básico')).toBe(true)
 })
 it('restores Mana instantly, refuses wasted uses, and preserves offensive item turns',()=>{
  const {battle,player}=start()
  player.mp=0
  const ether=item('consumable_simple_ether')
  const mana=submitBattleCommand(battle,{type:'item',itemInstanceId:ether.instanceId,targetId:player.id},content,[ether])
  expect(mana.ok).toBe(true)
  if(!mana.ok)return
  expect(mana.value.combatants[player.id].mp).toBe(Math.min(player.maxMp,6))
  expect(mana.value.phase).toBe('AwaitingAction')
  const full=structuredClone(battle);full.combatants[player.id].hp=full.combatants[player.id].maxHp
  const tonic=item('consumable_minor_tonic')
  expect(submitBattleCommand(full,{type:'item',itemInstanceId:tonic.instanceId,targetId:player.id},content,[tonic]))
   .toMatchObject({ok:false,code:'ITEM_NOT_NEEDED'})
  const damage=item('consumable_resonance_flask')
  const enemy=Object.values(battle.combatants).find(c=>c.side==='enemy')!
  const offensive=submitBattleCommand(battle,
   {type:'item',itemInstanceId:damage.instanceId,targetId:enemy.id},content,[damage])
  expect(offensive.ok).toBe(true)
  if(offensive.ok)expect(offensive.value.log.some(entry=>entry.tone==='damage')).toBe(true)
 })
 it('double attack delivers two 30-percent hits with a single primary roll and one action',()=>{
  const {battle,player}=start()
  const enemy=Object.values(battle.combatants).find(c=>c.side==='enemy')!
  enemy.hp=enemy.maxHp=200
  const result=submitBattleCommand(battle,{type:'doubleAttack',targetId:enemy.id},content)
  expect(result.ok).toBe(true)
  if(!result.ok)return
  const playerRolls=result.value.log.filter(entry=>entry.roll?.actorId===player.id&&entry.roll.action==='Ataque Duplo')
  expect(playerRolls).toHaveLength(1)
  const roll=playerRolls[0].roll!
  const original=calculateRolledDamage(player.attackPower+(roll.weaponBonusRoll?.face??0),
   enemy.mitigation,roll.face,roll.sides)
  const expected=2*Math.max(1,Math.floor(original.finalDamage*DOUBLE_ATTACK_V05152.fractionPerHit))
  expect(200-result.value.combatants[enemy.id].hp).toBe(expected)
  expect(playerRolls[0].message).toContain('um único d')
 })
 it('the area action requires one die roll while respecting protection and follow-up turn',()=>{
  const {battle,player}=start()
  const enemy=Object.values(battle.combatants).find(c=>c.side==='enemy')!
  enemy.hp=enemy.maxHp=200
  const result=submitBattleCommand(battle,{type:'areaAttack',targetId:enemy.id},content)
  expect(result.ok).toBe(true)
  if(!result.ok)return
  const rolls=result.value.log.filter(x=>x.roll?.actorId===player.id&&x.roll.action==='Ataque em Área')
  expect(rolls).toHaveLength(1)
 })
 it('restores resources atomically in Victory without consuming turns or accepting offensive items',()=>{
  const {save,battle,player}=start()
  battle.phase='Victory'
  for(const enemy of Object.values(battle.combatants).filter(c=>c.side==='enemy')){enemy.hp=0;enemy.alive=false}
  save.battle=battle
  save.vitals.hp=3;save.vitals.mp=0
  battle.combatants[player.id].hp=3;battle.combatants[player.id].mp=0
  save.inventory.push(item('consumable_minor_tonic','victory-tonic'))
  save.inventory.push(item('consumable_simple_ether','victory-ether'))
  save.inventory.push(item('consumable_resonance_flask','victory-flask'))
  const first=applyVictoryRecovery(save,'victory-tonic',content,NOW)
  expect(first.ok).toBe(true)
  if(!first.ok)return
  expect(first.value.vitals.hp).toBe(11)
  expect(first.value.battle?.phase).toBe('Victory')
  expect(first.value.inventory.find(x=>x.instanceId==='victory-tonic')?.quantity).toBe(1)
  expect(save.inventory.find(x=>x.instanceId==='victory-tonic')?.quantity).toBe(2)
  expect(first.value.battle?.round).toBe(battle.round)
  expect(applyVictoryRecovery(first.value,'victory-flask',content,NOW))
   .toMatchObject({ok:false,code:'VICTORY_ITEM_UNAVAILABLE'})
  const second=applyVictoryRecovery(first.value,'victory-ether',content,NOW)
  expect(second.ok).toBe(true)
  if(!second.ok)return
  expect(second.value.vitals.mp).toBe(Math.min(6,player.maxMp))
  expect(second.value.battle?.combatants.combatant_player.hp).toBe(11)
  expect(gameSaveSchema.safeParse(second.value).success).toBe(true)
 })
})
