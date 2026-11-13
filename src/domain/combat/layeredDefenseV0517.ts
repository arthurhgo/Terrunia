import type { ContentCatalog } from '../../content/catalog'
import type { GameSave } from '../game/types'
import type { Combatant, CombatDie } from './types'

/** BALANCE_DRAFT / OWNER_DECISION.
 * Escudaria is one manifestation of the EXISTING 'shield' bound slot.
 * A quiver never creates a sixth permanent Bond. */
export type OffhandKindV0517 = 'shield' | 'arcane' | 'quiver' | 'empty'
export type CombatProfileV0517 = 'shieldbearer' | 'arcaneCaster' | 'duelist' | 'archer' | 'untrained'
const MAGE_WEAPONS = new Set(['arcaneFocus','grimoire','staff'])
const DUEL_WEAPONS = new Set(['blade','dagger'])

export function deriveOffhandCombatV0517(save: GameSave, catalog: ContentCatalog) {
 const char=save.character
 const weaponId=char.bondedEquipment.weapon
 const weapon=weaponId ? catalog.boundItemBases[save.boundItems[weaponId]?.baseItemId??''] : undefined
 const id=char.bondedEquipment.shield
 const bound=id ? save.boundItems[id] : undefined
 const offhand=bound ? catalog.boundItemBases[bound.baseItemId] : undefined
 const kind:OffhandKindV0517 = offhand?.archetype==='quiver' ? 'quiver'
  : offhand?.archetype==='arcaneWard' ? 'arcane'
  : offhand?.archetype==='shield' ? 'shield' : 'empty'
 const grade=bound?.grade??1
 const clanDunavar=char.clan.clanId==='dunavar'
 const style:CombatProfileV0517 = kind==='quiver'&&weapon?.archetype==='bow'?'archer'
  : kind==='shield'?'shieldbearer'
  : MAGE_WEAPONS.has(weapon?.archetype??'')?'arcaneCaster'
  : DUEL_WEAPONS.has(weapon?.archetype??'')?'duelist':'untrained'
 // A visible physical shield is a repeatable per-hit THRESHOLD, not invulnerability.
 const physicalGuard=kind==='shield' ? Math.min(6,(offhand?.basePower??0)+Math.floor((grade-1)/2)) : 0
 // ARC is a depletable pool and can be replenished by an earned clan spell.
 const arcaneGuard=kind==='arcane'?Math.min(9,(offhand?.basePower??0)+2+Math.floor((grade-1)/2))
  : clanDunavar&&kind==='shield'?1
  : style==='arcaneCaster'?1:0
 return { kind,style,physicalGuard,arcaneGuard,clanDunavar,weaponArchetype:weapon?.archetype??'blade',
  offhandAssetId:offhand?.assetIdByGrade[grade]??null,
  label:kind==='shield'?'Escudo Vinculado':kind==='arcane'?'Protetor Arcano':
   kind==='quiver'?'Aljava Vinculada':'Mão secundária livre' }
}

export type DamageTypeV0517 = 'physical' | 'arcane' | 'fire' | 'poison' | 'ruin'
export function getDamageTypeV0517(actor:Combatant, skill?:{damageAspect?:DamageTypeV0517;presentationGroup?:string}):DamageTypeV0517 {
 if(skill?.damageAspect)return skill.damageAspect
 if(skill?.presentationGroup==='magic'||MAGE_WEAPONS.has(actor.weaponArchetype??''))return 'arcane'
 return 'physical'
}
export function applyLayeredProtectionV0517(target:Combatant, incoming:number, type:DamageTypeV0517) {
 const safe=Math.max(0,Math.floor(incoming))
 const physical=type==='physical'
 const shieldAbsorbed=physical?Math.min(target.physicalGuard??0,safe):0
 const afterShield=safe-shieldAbsorbed
 const arcaneAbsorbed=physical?0:Math.min(target.arcaneGuard??0,afterShield)
 if(arcaneAbsorbed)target.arcaneGuard=Math.max(0,(target.arcaneGuard??0)-arcaneAbsorbed)
 const hpDamage=afterShield-arcaneAbsorbed
 return {type,incoming:safe,shieldAbsorbed,arcaneAbsorbed,hpDamage}
}
export function getCombatDefenseReadoutV0517(actor:Combatant){
 return {shield:actor.physicalGuard??0,armor:actor.mitigation,arcane:actor.arcaneGuard??0,
  maxArcane:actor.maxArcaneGuard??0,offhand:actor.offhandKind??'empty'}
}
export function stepInitiativeDieV0517(base:CombatDie,steps:number):CombatDie {
 const order=[4,6,8,10,12] as const
 const index=order.indexOf(base)
 return order[Math.max(0,Math.min(4,(index<0?0:index)+Math.trunc(steps)))]
}
export function getInitiativeModifiersV0517(actor:Combatant,catalog:ContentCatalog){
 const flat=actor.statusEffects.reduce((n,s)=>n+(catalog.statusEffects[s.definitionId]?.initiativeModifier??0),0)
 const steps=actor.statusEffects.reduce((n,s)=>n+(catalog.statusEffects[s.definitionId]?.initiativeDieSteps??0),0)
 return {flat,steps,die:stepInitiativeDieV0517(actor.initiativeDie??4,steps)}
}
export function getEffectiveInitiativeV0517(actor:Combatant,catalog:ContentCatalog){
 return (actor.initiativeRolledBase??actor.initiative)+getInitiativeModifiersV0517(actor,catalog).flat
}
