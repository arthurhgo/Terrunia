import type {Combatant,CombatDie} from './types'
import type {CombatSkillDefinition} from '../../content/types'
import {DEFENSE_RULES_V0517,type DefenseModeV0517} from '../../content/combatStylesV0517'

export type AttackDeliveryV05171='melee'|'projectile'|'area'|'arcane'
export const DELIVERY_LABELS_V05171:Record<AttackDeliveryV05171,string>={
 melee:'Corpo a corpo',projectile:'Projétil',area:'Área',arcane:'Arcano'
}
export const DEFENSE_ALLOWED_V05171:Record<DefenseModeV0517,readonly AttackDeliveryV05171[]>={
 block:['melee','projectile','area'],
 parry:['melee'],dodge:['melee','projectile','area','arcane'],counter:['melee']
}
export function getAttackDeliveryV05171(actor:Combatant,skill?:CombatSkillDefinition):AttackDeliveryV05171{
 if(skill?.delivery)return skill.delivery
 if(skill?.id==='skill_granite_slam')return 'projectile'
 if(skill?.effects.some(e=>e.type==='adjacentSplash')||skill?.id==='skill_basic_area_attack')return 'area'
 if(skill?.damageAspect&&skill.damageAspect!=='physical')return 'arcane'
 if(skill?.presentationGroup==='magic'||['arcaneFocus','staff','grimoire'].includes(actor.weaponArchetype??''))return 'arcane'
 if(actor.weaponArchetype==='bow')return 'projectile'
 return 'melee'
}
export type DefenseRollV05171={
 valid:boolean;success:boolean;bonus:number;dc:number
 damageFactor:number;reduction:number;counterFraction:number;message:string
}
/** Called with the authoritative FSM die face, never rolls inside the helper. */
export function resolveDefenseV05171(target:Combatant,mode:DefenseModeV0517,
 delivery:AttackDeliveryV05171,sides:CombatDie,face:number,skillId?:string):DefenseRollV05171{
 const rule=DEFENSE_RULES_V0517[mode]
 const specialGolem=skillId==='skill_granite_slam'&&(mode==='parry'||mode==='block')
 const valid=DEFENSE_ALLOWED_V05171[mode].includes(delivery)||specialGolem
 const gear=rule.usesShield&&target.hasBoundShield?1:0
 const duelist=(mode==='parry'||mode==='counter')&&target.combatProfile==='duelist'?1:0
 const archer=mode==='dodge'&&target.combatProfile==='archer'?1:0
 const module=target.reactionBonuses?.[mode]??0
 const bonus=Math.min(rule.dc-2,gear+duelist+archer+module)
 const success=valid&&face+bonus>=rule.dc
 const damageFactor=success&&(mode==='parry'||mode==='dodge')
  ? (mode==='dodge'&&delivery==='area'?.5:0):1
 const reduction=success?rule.reduction+
   (mode==='block'&&target.hasBoundShield?1:0)+(mode==='block'?module:0):0
 const counterFraction=success&&mode==='counter'?rule.counterFraction:0
 return {valid,success,bonus,dc:rule.dc,damageFactor,reduction,counterFraction,
  message:!valid?'Postura não aplicável ao ataque declarado.'
   :success?'SUCESSO':'FALHA'}
}
export function getDefenseChanceV05171(actor:Combatant,mode:DefenseModeV0517,
 delivery:AttackDeliveryV05171,skillId?:string){
 const die=actor.defenseDice?.[mode]??4
 let success=0
 for(let face=1;face<=die;face++)
  if(resolveDefenseV05171(actor,mode,delivery,die,face,skillId).success)success++
 return {sides:die,successPercent:Math.round(100*success/die),
  valid:resolveDefenseV05171(actor,mode,delivery,die,1,skillId).valid}
}
