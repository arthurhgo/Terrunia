import type {ContentCatalog} from '../../content/catalog'
import type {BattleState,Combatant} from './types'
import type {DamageTypeV0517} from './layeredDefenseV0517'
import {getEffectiveInitiativeV0517,getInitiativeModifiersV0517} from './layeredDefenseV0517'
import {GRANITE_GOLEM_BALANCE,GRANITE_GOLEM_ENEMY_ID} from '../../content/clanProgressionV05142'

/** BALANCE_DRAFT. ESC reflects temporary pressure without changing the permanent item. */
export function getEffectiveShieldV0517(actor:Combatant,catalog:ContentCatalog){
 const pressure=actor.statusEffects.reduce((n,e)=>n+(catalog.statusEffects[e.definitionId]?.shieldGuardModifier??0),0)
 return Math.max(0,(actor.physicalGuard??0)+pressure)
}
/** Positive fractions resist, negative fractions are vulnerabilities. No RNG. */
export function applyAffinityV0517(target:Combatant,damage:number,type:DamageTypeV0517,catalog:ContentCatalog){
 const raw=catalog.enemies[target.definitionId]?.damageResistances?.[type]??0
 const fraction=Math.min(.5,Math.max(-.5,raw))
 const original=Math.max(0,Math.floor(damage))
 const resulting=Math.max(0,Math.floor(original*(1-fraction)))
 return {damage:resulting,delta:resulting-original,resistance:fraction}
}
/** Used by BOTH the battle machine and the telegraph; immutable and seed-free.
 * Tactical monsters avoid repeating a control spell while the same debuff persists. */
export function getScheduledEnemySkillV0517(battle:BattleState,actor:Combatant,
 player:Combatant,catalog:ContentCatalog,round=battle.round){
 const skillId=actor.aiSkillEveryRounds&&round%actor.aiSkillEveryRounds===0?actor.skillIds[0]:undefined
 const skill=skillId?catalog.combatSkills[skillId]:undefined
 if(!skill||actor.mp<skill.mpCost||(actor.skillCooldowns?.[skill.id]??0)>0||skill.target!=='enemy')return undefined
 const role=catalog.enemies[actor.definitionId]?.aiArchetype
 if(role==='breaker'&&(getEffectiveShieldV0517(player,catalog)===0||
  player.statusEffects.some(status=>status.definitionId==='status_guard_pressure_v0517')))return undefined
 if(role==='controller'&&player.statusEffects.some(status=>status.definitionId==='status_slow_v0517'))return undefined
 return skill
}
export type EnemyIntentV0517={
 actorId:string;action:string;aspect:DamageTypeV0517;role:string
 kind:'basic'|'skill'|'windup';round:number;warning:string;skillId?:string
}
/** Predict only the declared action for its scheduled round, without hidden rolls. */
export function getEnemyIntentV0517(battle:BattleState,actor:Combatant,
 catalog:ContentCatalog,round=battle.round):EnemyIntentV0517|null{
 if(!actor.alive||actor.side!=='enemy'||battle.phase==='AwaitingInitiative'||
  battle.phase==='Victory'||battle.phase==='Defeat')return null
 const definition=catalog.enemies[actor.definitionId]
 const role=definition?.aiArchetype??(definition?.boss?'sentinel':'skirmisher')
 if(battle.bossMechanics?.bossId===actor.id){
  const skill=catalog.combatSkills.skill_sentinel_arcane_pulse
  return {actorId:actor.id,action:skill?.name??'Ataque do Núcleo',
   kind:skill?'skill':'basic',...(skill?{skillId:skill.id}:{}),
   aspect:'arcane',role,round,warning:'Proteção Arcana (ARC) pode absorver o impacto'}
 }
 if(actor.definitionId===GRANITE_GOLEM_ENEMY_ID &&
   round%GRANITE_GOLEM_BALANCE.throwIntervalRounds===GRANITE_GOLEM_BALANCE.windupRoundRemainder)
  return {actorId:actor.id,action:'Preparação de Rocha',aspect:'physical',kind:'windup',
   role,round,warning:'O Golem prepara o arremesso, com oportunidade de reação'}
 const player=Object.values(battle.combatants).find(c=>c.side==='player'&&c.alive)
 const skill=player?getScheduledEnemySkillV0517(battle,actor,player,catalog,round):undefined
 const aspect:DamageTypeV0517=skill?(skill.damageAspect??(skill.presentationGroup==='magic'?'arcane':'physical')):'physical'
 return {actorId:actor.id,action:skill?.name??'Ataque Direto',kind:skill?'skill':'basic',
  ...(skill?{skillId:skill.id}:{}),aspect,role,round,
  warning:role==='breaker'?'Pressiona ESC (guarda física)'
    :role==='caster'?'O escudo físico não absorve magia'
    :role==='controller'?'Pode alterar status e iniciativa'
    :role==='brute'?'Impacto físico pesado'
    :'Considere uma reação defensiva'}
}
/** This is a prediction of next-round order, not a second initiative roll. */
export function getPredictedTurnOrderV0517(battle:BattleState,catalog:ContentCatalog){
 const actors=Object.values(battle.combatants).filter(a=>a.alive)
 const affected=actors.some(actor=>{
  const status=getInitiativeModifiersV0517(actor,catalog)
  return status.flat!==0||status.steps!==(actor.initiativeAppliedDieSteps??0)
 })
 if(!affected||battle.phase==='AwaitingInitiative')return null
 const order=actors.slice().sort((a,b)=>
  getEffectiveInitiativeV0517(b,catalog)-getEffectiveInitiativeV0517(a,catalog)||a.id.localeCompare(b.id)).map(x=>x.id)
 const current=battle.initiativeOrder.filter(id=>battle.combatants[id]?.alive)
 return order.some((id,i)=>current[i]!==id)?order:null
}
