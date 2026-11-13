import type {ItemDefinition} from './types'
import type {BoundEquipmentInstance,GameSave} from '../domain/game/types'

export const MODULAR_FAMILIES=['blade','dagger','axe','bow','arcaneFocus','staff','grimoire','shield'] as const
export type ModularFamily=typeof MODULAR_FAMILIES[number]
export const MODULAR_SLOTS=['body','handle','coreHousing','focusMount'] as const
export type ModularSlot=typeof MODULAR_SLOTS[number]
export type ModularTier=1|2|3|4|5
/** Content IDs must obey stable-id schema; family/slot enums stay camelCased. */
export const modularStableKeyV05171=(value:string)=>value.replace(/([A-Z])/g,'_$1').toLowerCase()
export type ModularPart={id:string;name:string;family:ModularFamily;partSlot:ModularSlot;tier:ModularTier;
 itemId:string;assetId:string;price:number;level:number;style:'MAGIA'|'ARCO'|'DEFESA'|'GUERRA'|'MOBILIDADE';
 bonuses:{attack:number;mitigation:number;maxHp:number;maxMp:number;initiative:number}}
const FAMILY_LABEL:Record<ModularFamily,string>={
 blade:'Espada',dagger:'Adaga',axe:'Machado',bow:'Arco',arcaneFocus:'Cetro',
 staff:'Cajado',grimoire:'Grimório',shield:'Escudo'
}
const SLOT_LABEL:Record<ModularSlot,string>={
 body:'Corpo',handle:'Empunhadura',coreHousing:'Núcleo estrutural',focusMount:'Encaixe de joia'
}
const TIER_LABEL=['','Bruto','Tratado','Refinado','Nobre','Magistral']
const PRICES=[0,12,32,80,168,310]
const LEVELS=[0,1,4,7,10,13]
const styleFor=(family:ModularFamily):ModularPart['style'] =>
 ['arcaneFocus','staff','grimoire'].includes(family)?'MAGIA':
 family==='bow'?'ARCO':family==='shield'?'DEFESA':
 family==='dagger'?'MOBILIDADE':'GUERRA'
const grants=(family:ModularFamily,slot:ModularSlot,tier:number):ModularPart['bonuses']=>{
 const value=Math.max(1,Math.ceil(tier/2))
 return {
  attack:slot==='body'?value:0,
  mitigation:family==='shield'&&(slot==='handle'||slot==='body')?Math.max(1,Math.floor(tier/2)):0,
  maxHp:family==='shield'&&slot==='coreHousing'?value*2:0,
  maxMp:['arcaneFocus','staff','grimoire'].includes(family)&&slot==='coreHousing'?value*2:0,
  initiative:(family==='bow'||family==='dagger')&&slot==='handle'?value:0,
 }
}
/** Tier is structural quality; it NEVER unlocks magical Essence/Gem/Rune grade sockets. */
export const modularPartsV05171:ModularPart[]=MODULAR_FAMILIES.flatMap(family=>
 MODULAR_SLOTS.flatMap(slot=>
 ([1,2,3,4,5] as const).map(tier=>{
  const id='part_'+modularStableKeyV05171(family)+'_'+modularStableKeyV05171(slot)+'_t'+tier
  return {id,itemId:id,family,partSlot:slot,tier,
   name:SLOT_LABEL[slot]+' '+TIER_LABEL[tier]+' · '+FAMILY_LABEL[family],
   assetId:'modular.'+modularStableKeyV05171(family)+'.'+modularStableKeyV05171(slot)+'.t'+tier,price:PRICES[tier],level:LEVELS[tier],
   style:styleFor(family),bonuses:grants(family,slot,tier)}
 })))
export const modularPartById=Object.fromEntries(modularPartsV05171.map(part=>[part.id,part])) as Record<string,ModularPart>
export const modularPartItemsV05171:ItemDefinition[]=modularPartsV05171.map(p=>({
 id:p.itemId,name:p.name,description:'Módulo estrutural '+p.style+' T'+p.tier+' para montar o mesmo Vínculo permanente. Não é arma substituta.',
 category:'material',rarity:p.tier===1?'common':p.tier===2?'uncommon':p.tier===3?'rare':'epic',
 convertToEssence:false,essenceValue:0,sellable:false,sellValue:0,questLocked:false,canInfuseBoundItem:false,
 combatEffects:[],affinityTags:['modular',p.family,p.partSlot,'tier'+p.tier],iconAssetId:p.assetId,status:'BALANCE_DRAFT'
}))
export type AssemblyBonuses=ModularPart['bonuses']
export const EMPTY_ASSEMBLY_BONUSES:AssemblyBonuses={attack:0,mitigation:0,maxHp:0,maxMp:0,initiative:0}
export function getAssemblyFamily(baseArchetype:string,slot:string):ModularFamily|undefined{
 if(slot==='shield')return 'shield'
 return MODULAR_FAMILIES.find(f=>f===baseArchetype)
}
export function getAssemblyBonuses(item?:BoundEquipmentInstance):AssemblyBonuses{
 const totals={...EMPTY_ASSEMBLY_BONUSES}
 if(!item?.assembly)return totals
 for(const slot of MODULAR_SLOTS){
  const id=item.assembly.parts[slot]
  const part=id?modularPartById[id]:undefined
  if(!part||item.assembly.family!==part.family||part.partSlot!==slot)continue
  totals.attack+=part.bonuses.attack;totals.mitigation+=part.bonuses.mitigation
  totals.maxHp+=part.bonuses.maxHp;totals.maxMp+=part.bonuses.maxMp;totals.initiative+=part.bonuses.initiative
 }
 return totals
}
export function getEquippedAssemblyBonuses(save:GameSave){
 const weapon=save.character.bondedEquipment.weapon,shield=save.character.bondedEquipment.shield
 const main=getAssemblyBonuses(weapon?save.boundItems[weapon]:undefined)
 const off=getAssemblyBonuses(shield?save.boundItems[shield]:undefined)
 return {attack:main.attack+off.attack,mitigation:main.mitigation+off.mitigation,
  maxHp:main.maxHp+off.maxHp,maxMp:main.maxMp+off.maxMp,initiative:main.initiative+off.initiative}
}
