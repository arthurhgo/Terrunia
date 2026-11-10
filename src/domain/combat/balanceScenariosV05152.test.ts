import { describe, expect, it } from 'vitest'
import { content } from '../../content/catalog'
import { equipmentOffersV0515, GEAR_LEVELS } from '../../content/equipmentV0515'
import { deriveCharacterStats } from '../character/derivedStats'
import { bindPrologueWeapon,createNewSave } from '../game/createSave'
import type { GameSave, InventoryItemInstance } from '../game/types'
import { calculateRolledDamage, createBattle, submitBattleCommand } from './engine'
import type { BattleState } from './types'

const NOW='2026-11-10T12:00:00Z'
const COMBAT_SLOTS=['weapon','armor','helmet','pants','boots','accessoryA','accessoryB'] as const
const item=(id:string,grade:number):InventoryItemInstance=>({
 instanceId:'sim_'+id,definitionId:id,quantity:1,rarity:'common',locked:false,
 favorite:false,acquiredAt:NOW,refinementLevel:grade-1,
})
function equip(style:string,tier:number,grade:1|2|3,exclusive=false):GameSave{
 const initial=createNewSave('qa-balance','Terrírian QA','character.terririan.default',content,NOW)
 const bound=bindPrologueWeapon(initial,content,NOW,'sim-bound')
 if(!bound.ok)throw Error(bound.message)
 const save=bound.value
 save.character.level=GEAR_LEVELS[tier-1]
 if(exclusive){
  const cls=content.classes[style]
  save.character.classProgression.classId=style
  save.character.clan.clanId=cls.clanId
 }
 const channel=exclusive?'CLASS_EXCLUSIVE':'PUBLIC_TERRAN'
 const offers=equipmentOffersV0515.filter(o=>o.channel===channel&&o.tier===tier &&
  (exclusive?o.classId===style:o.recommendedClassId===style))
 expect(offers).toHaveLength(10)
 for(const slot of COMBAT_SLOTS){
  const offer=offers.find(o=>o.slot===slot)!
  const wearing=item(offer.id,grade)
  if(slot==='armor'){
   save.equippedBasicArmor=wearing
   save.character.basicArmorInstanceId=wearing.instanceId
  }else if(slot==='weapon')save.equippedGearStyles={weapon:wearing}
  else save.equippedComplementary={...save.equippedComplementary,[slot]:wearing}
 }
 const derived=deriveCharacterStats(save,content)
 save.vitals.hp=derived.life.value
 save.vitals.mp=derived.mana.value
 return save
}

type Outcome={victory:boolean;defeat:boolean;actions:number;remainingHp:number;enemyHp:number}
function play(save:GameSave,encounterId:string,seed:string):Outcome{
 const encounter=content.encounters[encounterId]
 expect(encounter,'Unknown encounter '+encounterId).toBeTruthy()
 let battle:BattleState=createBattle(save,encounter,content,seed)
 const initialEnemyHp=Object.values(battle.combatants).filter(x=>x.side==='enemy')
  .reduce((n,e)=>n+e.hp,0)
 let actions=0
 while(actions<100&&battle.phase!=='Victory'&&battle.phase!=='Defeat'){
  if(battle.phase==='AwaitingInitiative'){
   const rolled=submitBattleCommand(battle,{type:'rollInitiative'},content)
   if(!rolled.ok)throw Error(rolled.message)
   battle=rolled.value
   continue
  }
  // A protected boss cannot be targeted until its minions are defeated.
  const enemy=Object.values(battle.combatants).find(e=>e.side==='enemy'&&e.alive&&
   (!battle.bossMechanics||e.id!==battle.bossMechanics.bossId)) ??
   Object.values(battle.combatants).find(e=>e.side==='enemy'&&e.alive)
  if(!enemy)break
  const result=submitBattleCommand(battle,{type:'attack',targetId:enemy.id},content)
  if(!result.ok)throw Error('Combat simulation '+result.code+': '+result.message+' at '+battle.phase)
  battle=result.value
  actions++
 }
 return {
  victory:battle.phase==='Victory',
  defeat:battle.phase==='Defeat',
  actions,
  remainingHp:battle.combatants.combatant_player.hp,
  enemyHp:initialEnemyHp,
 }
}

describe('v0.5.15.2 — battle simulations on the real state machine, no Vercel',()=>{
 it('keeps first tutorial fight clearable by an entirely ungeared character',()=>{
  const initial=createNewSave('qa-0','Sem equipamento','character.terririan.default',content,NOW)
  const bound=bindPrologueWeapon(initial,content,NOW,'basic-bound')
  if(!bound.ok)throw Error(bound.message)
  const out=play(bound.value,'encounter_fungorro_01','balance-tutorial-001')
  expect(out.victory).toBe(true)
  expect(out.actions).toBeGreaterThanOrEqual(1)
  expect(out.actions).toBeLessThanOrEqual(6)
 })

 it('keeps Level 1 neutral equipment from instantly deleting the Level 5 mini-boss',()=>{
  for(const style of ['batedor_da_vigilia','sentinela_da_luz','astrologo_celestial','forjador_arcano']){
   const save=equip(style,1,1)
   const hero=createBattle(save,content.encounters.encounter_astravel_blackroot_13,content,
    'balance-mini-'+style).combatants.combatant_player
   const boss=content.enemies.enemy_blackroot_titan
   const max=calculateRolledDamage(hero.attackPower,boss.mitigation,4,4).finalDamage
   expect(max,style).toBeLessThan(boss.maxHp)
  }
 })

 it('checks class and neutral builds in level-appropriate encounters with deterministic seeds',()=>{
  const scenarios=[
   {name:'Guarda comum T1 G1',style:'sentinela_da_luz',tier:1,grade:1 as const,encounter:'encounter_astravel_spore_garden_07',exclusive:false},
   {name:'Agilidade comum T1 G1',style:'batedor_da_vigilia',tier:1,grade:1 as const,encounter:'encounter_astravel_horror_09',exclusive:false},
   {name:'Agilidade comum T1 G3',style:'batedor_da_vigilia',tier:1,grade:3 as const,encounter:'encounter_astravel_blackroot_13',exclusive:false},
   {name:'Sentinela Classe T3 G1',style:'sentinela_da_luz',tier:3,grade:1 as const,encounter:'encounter_fungal_core_sentinel',exclusive:true},
   {name:'Forjador Classe T3 G1',style:'forjador_arcano',tier:3,grade:1 as const,encounter:'encounter_fungal_core_sentinel',exclusive:true},
   {name:'Caçador Classe T5 G1',style:'cacador_de_constelacoes',tier:5,grade:1 as const,encounter:'encounter_elduran_golem_04',exclusive:true},
  ]
  const outcomes=scenarios.map(s=>{
   const save=equip(s.style,s.tier,s.grade,s.exclusive)
   return {name:s.name,...play(save,s.encounter,'balance-'+s.style+'-t'+s.tier+'-g'+s.grade)}
  })
  console.info('BALANCE_DRAFT_V05152_BATTLES='+JSON.stringify(outcomes))
  expect(outcomes).toHaveLength(6)
  expect(outcomes.every(o=>o.actions>0&&o.actions<100)).toBe(true)
  expect(outcomes.every(o=>o.enemyHp>0)).toBe(true)
  // No promise that the encounter is always won by attacking: potions,
  // abilities and defending must remain useful in difficult fights.
 })
})
