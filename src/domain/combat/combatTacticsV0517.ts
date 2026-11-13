import type {ContentCatalog} from '../../content/catalog'
import type {BattleState,Combatant} from './types'
import type {DamageTypeV0517} from './layeredDefenseV0517'
import {getEffectiveInitiativeV0517,getInitiativeModifiersV0517} from './layeredDefenseV0517'
import {GRANITE_GOLEM_BALANCE,GRANITE_GOLEM_ENEMY_ID} from '../../content/clanProgressionV05142'

/** BALANCE_DRAFT: body ARM remains the original numeric mitigation. */
export function getEffectiveShieldV0517(actor:Combatant,catalog:ContentCatalog){
 const pressure=actor.statusEffects.reduce((n,e)=>n+(catalog.statusEffects[e.definitionId]?.shieldGuardModifier??0),0)
 return Math.max(0,(actor.physicalGuard??0)+pressure)
}
/** Positive fractions resist; negative fractions expose weakness. Neither is a hidden die roll. */
export function applyAffinityV0517(target:Combatant,damage:number,type:DamageTypeV0517,catalog:ContentCatalog){
 const raw=catalog.enemies[target.definitionId]?.damageResistances?.[type]??0
 const fraction=Math.min(.5,Math.max(-.5,raw))
 const original=Math.max(0,Math.floor(damage))
 const resulting=Math.max(0,Math.floor(original*(1-fraction)))
 return {damage:resulting,delta:resulting-original,resistance:fraction}
}
/** Shared deterministic AI decision used in both combat engine and telegraph.
 * No hidden roll or exploitative omniscient counter-pick. */
export function getScheduledEnemySkillV0517(battle:BattleState,actor:Combatant,
 player:Combatant,catalog:ContentCatalog,round=battle.round){
 const player=Object.values(battle.combatants).find(c=>c.side==='player'&&c.alive)
 const skill=player?getScheduledEnemySkillV0517(battle,actor,player,catalog,round):undefined
 const useSkill=Boolean(skill)
 const aspect=useSkill?(skill!.damageAspect??(skill!.presentationGroup==='magic'?'arcane':'physical')):'physical'
 return {actorId:actor.id,action:useSkill?skill!.name:'Ataque Direto',kind:useSkill?'skill':'basic',
  ...(useSkill?{skillId:skill!.id}:{}),aspect,role,round,
  warning:role==='breaker'?'Pressiona ESC (guarda física)'
    :role==='caster'?'O escudo físico não absorve magia'
    :role==='controller'?'Pode alterar status e iniciativa'
    :role==='brute'?'Impacto físico pesado'
    :'Considere a reação defensiva'}
}
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
