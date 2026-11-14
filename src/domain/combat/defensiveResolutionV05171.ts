import type {Combatant} from './types'
import type {CombatSkillDefinition} from '../../content/types'
import type {DefenseModeV0517} from '../../content/combatStylesV0517'
import {DEFENSE_RULES_V0517} from '../../content/combatStylesV0517'
import type {GameSave} from '../game/types'
import {modularPartById} from '../../content/modularWeaponsV05171'

export type IncomingDeliveryV05171='melee'|'projectile'|'arcane'|'area'
/** BALANCE_DRAFT: area damage cannot be dodged entirely. Tune only after playtesting. */
export const AREA_DODGE_RETAINED_FRACTION_V05171=0.5
export function applyAreaDodgeV05171(damage:number,successfulDodge:boolean):number{
 const safe=Math.max(0,Math.floor(damage))
 return successfulDodge ? Math.ceil(safe*AREA_DODGE_RETAINED_FRACTION_V05171) : safe
}
const allowed:Record<DefenseModeV0517,IncomingDeliveryV05171[]>={
 block:['melee','projectile'],parry:['melee'],dodge:['melee','projectile','arcane','area'],counter:['melee']
}
export function getAttackDeliveryV05171(actor:Combatant,skill?:CombatSkillDefinition,area=false):IncomingDeliveryV05171{
 if(area||skill?.attackDelivery==='area')return 'area'
 if(skill?.id==='skill_granite_slam')return 'melee' // documented legacy Golem Parry exception
 if(skill?.attackDelivery)return skill.attackDelivery
 if(skill?.presentationGroup==='magic'||skill?.damageAspect&&skill.damageAspect!=='physical')return 'arcane'
 if(actor.weaponArchetype==='bow')return 'projectile'
 return 'melee'
}
export function getModularDefenseBonusesV05171(save:GameSave){
 const bonus={block:0,parry:0,dodge:0,counter:0,shieldBash:0}
 const weaponId=save.character.bondedEquipment.weapon,shieldId=save.character.bondedEquipment.shield
 const weapon=weaponId?save.boundItems[weaponId]:undefined,shield=shieldId?save.boundItems[shieldId]:undefined
 const handle=weapon?.assembly?.parts.handle?modularPartById[weapon.assembly.parts.handle]:undefined
 const body=shield?.assembly?.parts.body?modularPartById[shield.assembly.parts.body]:undefined
 if(handle&&handle.tier>=2&&['blade','dagger'].includes(weapon?.assembly?.family??''))
  bonus.parry=Math.min(2,Math.floor(handle.tier/2))
 if(handle&&handle.tier>=2&&weapon?.assembly?.family==='bow')
  bonus.dodge=Math.min(2,Math.floor(handle.tier/2))
 if(body&&body.tier>=2&&shield?.assembly?.family==='shield'){
  bonus.block=Math.min(2,Math.floor(body.tier/2))
  bonus.shieldBash=Math.min(2,Math.floor(body.tier/2))
 }
 return bonus
}
export const isDefenseApplicableV05171=(mode:DefenseModeV0517,delivery:IncomingDeliveryV05171)=>
 allowed[mode].includes(delivery)
export function calculateDefenseReactionV05171(actor:Combatant,mode:DefenseModeV0517,
 face:number,delivery:IncomingDeliveryV05171){
 const rule=DEFENSE_RULES_V0517[mode],sides=actor.defenseDice?.[mode]??4
 const shield=rule.usesShield&&actor.hasBoundShield?1:0
 const duelist=(mode==='parry'||mode==='counter')&&actor.combatProfile==='duelist'?1:0
 const archer=mode==='dodge'&&actor.combatProfile==='archer'?1:0
 const module=actor.defenseModuleBonuses?.[mode]??0
 const applicable=isDefenseApplicableV05171(mode,delivery)
 const total=face+shield+duelist+archer+module
 // Natural 1 always fails; every new character has a genuine chance of failure.
 return {success:applicable&&face!==1&&total>=rule.dc,applicable,sides,dc:rule.dc,shield,duelist,archer,module,total}
}
export function getDefenseChanceV05171(actor:Combatant,mode:DefenseModeV0517,delivery:IncomingDeliveryV05171){
 const sides=actor.defenseDice?.[mode]??4
 let successes=0
 for(let face=1;face<=sides;face++)if(calculateDefenseReactionV05171(actor,mode,face,delivery).success)successes++
 return {sides,successes,chance:Math.round(100*successes/sides)}
}
