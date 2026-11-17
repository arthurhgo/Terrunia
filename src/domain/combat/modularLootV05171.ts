import type {GameSave} from '../game/types'
import type {ContentCatalog} from '../../content/catalog'
import {astravelCombatNodes} from '../../content/astravel'
import {modularPartById,MODULAR_SLOTS,getAssemblyFamily,modularStableKeyV05171,type ModularFamily,type ModularTier} from '../../content/modularWeaponsV05171'
import {MODULAR_BALANCE_V05171,modularWaveDropPercentV05171} from '../../content/modularBalanceV05171'

export type ModularLootRollV05171={
 version:1;seed:number;source:'trail'|'wave';sourceIndex:number;itemIds:string[]
}
// Avalanche all 32 bits: low-bit LCG modulo caused a 3x T5 inflation in
// seeded batches despite a nominal 8% rate. Battle state keeps rolled loot;
// this only affects fresh encounters, not already persisted rewards.
const mix=(seed:number,salt:number)=>{
 let x=(seed^salt)>>>0
 x=Math.imul(x^(x>>>16),0x7feb352d)
 x=Math.imul(x^(x>>>15),0x846ca68b)
 return (x^(x>>>16))>>>0
}
const percent=(seed:number,salt:number)=>Math.floor(mix(seed,salt)/0x100000000*100)
const fromBattle=(id:string,seed:number)=>{let x=seed>>>0;for(let i=0;i<id.length;i++)x=mix(x,id.charCodeAt(i));return x}
const tierFor=(source:'trail'|'wave',index:number,seed:number):ModularTier=>{
 if(source==='trail')return index<=3?1:index<=7?2:3
 if(index<=3)return 1
 if(index<=7)return 2
 if(index<=11)return 3
 if(index<=19)return 4
 // The late-game Tier V material remains rare even in endless waves.
 const roll=percent(seed,997)
 return roll<MODULAR_BALANCE_V05171.advancedWaveTier5Percent?5
  :roll<MODULAR_BALANCE_V05171.advancedWaveTier5Percent+
    MODULAR_BALANCE_V05171.advancedWaveTier4Percent?4:3
}
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
 const value=fromBattle(battleId,seed),tier=tierFor(source,index,value)
 const slot=MODULAR_SLOTS[(index-1)%MODULAR_SLOTS.length]
 const hasPart=source==='trail'
  ?MODULAR_BALANCE_V05171.trailGuaranteedPart
  :percent(value,173)<modularWaveDropPercentV05171(index)
 const items=hasPart
  ?['part_'+modularStableKeyV05171(family)+'_'+modularStableKeyV05171(slot)+'_t'+tier]
  :[]
 // At most ONE structural module per wave (never per enemy).
 // Story trail secondary materials remain a controlled first-clear opportunity.
 if(source==='trail'&&hasPart&&index>=8&&mix(value,37)%4===0){
  const alt:ModularFamily=family==='blade'?'shield':'blade'
  const extra='part_'+modularStableKeyV05171(alt)+'_'+modularStableKeyV05171(MODULAR_SLOTS[mix(value,97)%4])+'_t'+Math.max(1,tier-1)
  if(modularPartById[extra])items.push(extra)
 }
 // Earned gems stay inventory-only until Grade III's existing gem rite.
 if(MODULAR_BALANCE_V05171.elementalGemDropsEnabled&&
    index>=8&&percent(value,311)<5){
  const gems=['item_gem_rubi_ira_v05171','item_gem_safira_mares_v05171',
   'item_gem_terra_v05171','item_gem_ar_v05171']
  const gem=gems[mix(value,229)%gems.length]
  if(catalog.items[gem])items.push(gem)
 }
 return {version:1,seed:value,source,sourceIndex:index,itemIds:items.filter(id=>Boolean(catalog.items[id]))}
}
