import type {GameSave} from '../game/types'
import type {ContentCatalog} from '../../content/catalog'
import {astravelCombatNodes} from '../../content/astravel'
import {modularPartById,MODULAR_SLOTS,getAssemblyFamily,type ModularFamily,type ModularTier} from '../../content/modularWeaponsV05171'

export type ModularLootRollV05171={
 version:1;seed:number;source:'trail'|'wave';sourceIndex:number;itemIds:string[]
}
const mix=(seed:number,salt:number)=>((Math.imul(seed^salt,1664525)+1013904223)>>>0)
const fromBattle=(id:string,seed:number)=>{let x=seed>>>0;for(let i=0;i<id.length;i++)x=mix(x,id.charCodeAt(i));return x}
const tierFor=(source:'trail'|'wave',index:number):ModularTier=>
 source==='trail' ? index<=3?1:index<=7?2:3
 :index<=3?1:index<=7?2:index<=11?3:index<=19?4:5
/** Roll once at battle creation. Concrete results live in battle.rewards and are never re-rolled at victory. */
export function rollModularLootV05171(save:GameSave,battleId:string,seed:number,
 trailNodeId:string,wave:number|undefined,catalog:ContentCatalog):ModularLootRollV05171|null{
 const trailIndex=astravelCombatNodes.findIndex(node=>node.id===trailNodeId)
 const source:ModularLootRollV05171['source']=wave?'wave':'trail'
 if(!wave&&trailIndex<0)return null
 const index=wave??trailIndex+1
 const mainId=save.character.bondedEquipment.weapon
 const weapon=mainId?save.boundItems[mainId]:undefined
 const archetype=weapon?catalog.boundItemBases[weapon.baseItemId]?.archetype:undefined
 const family=getAssemblyFamily(archetype??'blade','weapon')??'blade'
 const value=fromBattle(battleId,seed),tier=tierFor(source,index)
 const slot=MODULAR_SLOTS[(index-1)%MODULAR_SLOTS.length]
 const items=['part_'+family+'_'+slot+'_t'+tier]
 if(index>=8&&mix(value,37)%4===0){
  const alt:ModularFamily=family==='blade'?'shield':'blade'
  const extra='part_'+alt+'_'+MODULAR_SLOTS[mix(value,97)%4]+'_t'+Math.max(1,tier-1)
  if(modularPartById[extra])items.push(extra)
 }
 // Earned gems stay inventory-only until Grade III's existing gem rite.
 if(index>=8&&mix(value,311)%6===0){
  const gems=['item_gem_rubi_ira_v05171','item_gem_safira_mares_v05171',
   'item_gem_terra_v05171','item_gem_ar_v05171']
  const gem=gems[mix(value,229)%gems.length]
  if(catalog.items[gem])items.push(gem)
 }
 return {version:1,seed:value,source,sourceIndex:index,itemIds:items.filter(id=>Boolean(catalog.items[id]))}
}
