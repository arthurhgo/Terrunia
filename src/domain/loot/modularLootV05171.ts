import type {ContentCatalog} from '../../content/catalog'
import type {GameSave} from '../game/types'
import {weaponPartByIdV05171,MODULAR_SLOTS_V05171,getModularPartIdV05171,type ModularFamilyV05171,
 type ModularTierV05171} from '../../content/weaponPartsV05171'

type ModularLootV05171={
 battleId:string;stageIndex?:number;waveIndex?:number;save:GameSave
 catalog:ContentCatalog
}
/** Stable encounter-local hash. Not a gameplay die roll; it never touches battle RNG. */
const hash=(key:string)=>{
 let h=2166136261
 for(const char of key){h=Math.imul(h^char.charCodeAt(0),16777619)}
 return h>>>0
}
export const getModularLootTierV05171=(index:number,source:'trail'|'wave'):ModularTierV05171=>{
 if(source==='trail')return (index<=3?1:index<=7?2:3) as ModularTierV05171
 return (index<=3?1:index<=7?2:index<=11?3:index<=19?4:5) as ModularTierV05171
}
/** Rolled once before combat starts and persisted in battle.rewards, not in the UI.
 * Tier ceilings never unlock Essence/Gem installation before the canonical Bound Grade. */
export function rollModularLootV05171(input:ModularLootV05171):string[]{
 const index=input.waveIndex??input.stageIndex??0
 if(index<1)return []
 const source=input.waveIndex?'wave':'trail'
 const tier=getModularLootTierV05171(index,source)
 const weaponId=input.save.character.bondedEquipment.weapon
 const base=weaponId ? input.catalog.boundItemBases[input.save.boundItems[weaponId]?.baseItemId??'']:undefined
 const valid=new Set(['blade','axe','bow','dagger','arcaneFocus','grimoire','staff'])
 const family:ModularFamilyV05171=valid.has(base?.archetype??'')
  ? base!.archetype as ModularFamilyV05171 : 'blade'
 const chosenSlots=MODULAR_SLOTS_V05171
 // First four trail milestones guarantee all four structural slots, removing tutorial RNG locks.
 const slot=source==='trail'&&index<=4 ? chosenSlots[index-1]
  : chosenSlots[hash(input.battleId+':slot:'+index)%4]
 const id=getModularPartIdV05171(family,slot,tier)
 const result=weaponPartByIdV05171[id]?[id]:[]
 // Additional shield part may drop only for characters with a shield Bond.
 if(input.save.character.bondedEquipment.shield && hash(input.battleId+':shield')%4===0){
  const shieldSlot=chosenSlots[hash(input.battleId+':offhand')%4]
  const sid=getModularPartIdV05171('shield',shieldSlot,tier)
  if(weaponPartByIdV05171[sid])result.push(sid)
 }
 // Late rewards may carry elemental gems, but their actual use still requires Grade III.
 if(index>=8 && hash(input.battleId+':jewel')%5===0){
  const gems=['fire','water','earth','air'] as const
  result.push('item_modular_gem_'+gems[hash(input.battleId+':element')%4]+'_v05171')
 }
 return result.filter(id=>Boolean(input.catalog.items[id]))
}
