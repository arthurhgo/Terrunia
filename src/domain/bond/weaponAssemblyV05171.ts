import {weaponPartByIdV05171,MODULAR_SLOTS_V05171,type ModularSlotV05171,
 type WeaponPartDefinitionV05171} from '../../content/weaponPartsV05171'
import type {ContentCatalog} from '../../content/catalog'
import type {GameSave,BoundEquipmentInstance,WeaponAssemblyV05171} from '../game/types'
import {fail,ok,type Result} from '../shared/types'

export const DURNAN_FORGE_LOCATION_V05171='location_terran_forge'
export const MODULE_SLOTS_V05171=MODULAR_SLOTS_V05171

export type AssemblyBonusesV05171={
 attack:number;initiative:number;guard:number;arcane:number;parry:number
 dodge:number;block:number;shieldStrike:number
}
export const emptyAssemblyBonusesV05171=():AssemblyBonusesV05171=>({
 attack:0,initiative:0,guard:0,arcane:0,parry:0,dodge:0,block:0,shieldStrike:0
})

export function getAssemblyPartsV05171(item?:BoundEquipmentInstance|null){
 return MODULE_SLOTS_V05171.map(slot=>({
  slot,definition:item?.assembly?.partIds?.[slot]?
   weaponPartByIdV05171[item.assembly.partIds[slot]!] : undefined
 }))
}
/** Pure bonuses. Never depend on the sprite, an inventory item or a visual draft. */
export function deriveAssemblyBonusesV05171(item?:BoundEquipmentInstance|null):AssemblyBonusesV05171{
 const result=emptyAssemblyBonusesV05171()
 for(const {definition} of getAssemblyPartsV05171(item)){
  if(!definition)continue
  const points=definition.tier<=2?1:definition.tier<=4?2:3
  result[definition.bonus]+=points
 }
 // Per-Bond soft caps; the item may collect visual history without unlimited power.
 result.attack=Math.min(result.attack,6)
 result.guard=Math.min(result.guard,4)
 result.arcane=Math.min(result.arcane,4)
 result.initiative=Math.min(result.initiative,3)
 for(const mode of ['parry','dodge','block','shieldStrike'] as const)
  result[mode]=Math.min(result[mode],2)
 return result
}
export function getBoundAssemblyBonusesV05171(save:GameSave,slot:'weapon'|'shield'){
 const id=save.character.bondedEquipment[slot]
 return deriveAssemblyBonusesV05171(id?save.boundItems[id]:null)
}
export type AssemblyPreviewV05171={
 boundItemId:string;part:WeaponPartDefinitionV05171;slot:ModularSlotV05171
 price:number;before:AssemblyBonusesV05171;after:AssemblyBonusesV05171
 previousPartId:string|null
}
const check=(save:GameSave,boundItemId:string,partId:string,
 catalog:ContentCatalog):Result<AssemblyPreviewV05171>=>{
 if(save.battle||save.world.currentLocationId!==DURNAN_FORGE_LOCATION_V05171)
  return fail('ASSEMBLY_FORGE_REQUIRED','A montagem só pode ser confirmada com Durnan na Casa do Ferreiro.')
 const item=save.boundItems[boundItemId]
 if(!item||item.ownerCharacterId!==save.character.id||
  !['weapon','shield'].includes(item.slot)||
  save.character.bondedEquipment[item.slot as 'weapon'|'shield']!==boundItemId)
  return fail('ASSEMBLY_BOUND_REQUIRED','Escolha a arma ou o escudo que já pertence ao Terrírian.')
 const base=catalog.boundItemBases[item.baseItemId]
 const part=weaponPartByIdV05171[partId]
 if(!part||!base)return fail('ASSEMBLY_UNKNOWN_PART','Parte não cadastrada na coleção modular.')
 const family=item.slot==='shield'?'shield':base.archetype
 if(part.family!==family)return fail('ASSEMBLY_INCOMPATIBLE','A peça não pertence à família deste Vínculo.')
 const previousPartId=item.assembly?.partIds[part.slot]??null
 if(previousPartId===partId)return fail('ASSEMBLY_ALREADY_INSTALLED','Esta peça já está instalada.')
 const previous=previousPartId?weaponPartByIdV05171[previousPartId]:undefined
 if(previous && part.tier<=previous.tier)
  return fail('ASSEMBLY_REFINEMENT_ORDER','Somente uma melhoria de Tier superior é permitida. A peça antiga será preservada como memória de montagem.')
 const count=save.inventory.filter(entry=>entry.definitionId===partId&&!entry.locked&&!entry.favorite)
  .reduce((n,entry)=>n+entry.quantity,0)
 if(count<1)return fail('ASSEMBLY_MISSING_PART','Esta peça não está disponível na Mochila.')
 if(save.wallet.gold<part.forgeGold)return fail('ASSEMBLY_GOLD_REQUIRED','Ouro insuficiente para realizar a montagem.')
 const proposed={...item,assembly:{
  version:1 as const,partIds:{body:null,handle:null,coreHousing:null,focusMount:null,
   ...item.assembly?.partIds,[part.slot]:partId},
  retiredPartIds:item.assembly?.retiredPartIds??[],
  revision:(item.assembly?.revision??0)+1,updatedAt:save.updatedAt,
 }}
 return ok({boundItemId,part,slot:part.slot,price:part.forgeGold,
  before:deriveAssemblyBonusesV05171(item),after:deriveAssemblyBonusesV05171(proposed),
  previousPartId})
}
export const previewAssemblyV05171=check
/** Single atomic operation, with no changes if a precondition fails.
 * Upgraded old parts remain in retained history and cannot secretly disappear. */
export function commitAssemblyV05171(save:GameSave,boundItemId:string,partId:string,
 catalog:ContentCatalog,now:string):Result<GameSave>{
 const checkResult=check(save,boundItemId,partId,catalog)
 if(!checkResult.ok)return checkResult
 const {part,price,previousPartId}=checkResult.value
 const next=structuredClone(save),item=next.boundItems[boundItemId]
 const index=next.inventory.findIndex(entry=>entry.definitionId===partId&&!entry.locked&&!entry.favorite)
 if(index<0)return fail('ASSEMBLY_MISSING_PART','A peça de montagem não está disponível.')
 next.inventory[index].quantity-=1
 if(next.inventory[index].quantity===0)next.inventory.splice(index,1)
 const old=item.assembly
 const assembly:WeaponAssemblyV05171={
  version:1,partIds:{body:null,handle:null,coreHousing:null,focusMount:null,
   ...old?.partIds,[part.slot]:part.id},
  retiredPartIds:[...(old?.retiredPartIds??[]),...(previousPartId?[previousPartId]:[])],
  revision:(old?.revision??0)+1,updatedAt:now
 }
 item.assembly=assembly
 item.updatedAt=now
 next.wallet.gold-=price
 next.revision+=1;next.updatedAt=now
 next.eventLog.push('WeaponAssemblyCommitted:'+boundItemId+':'+partId)
 next.eventLog.push('WeaponAssemblySkillChanged:'+boundItemId)
 return ok(next)
}


/** Torvan sells loose modules only, never a new weapon or Bond. */
export function buyModularPartV05171(save:GameSave,partId:string,quantity:number,
 catalog:ContentCatalog,now:string):Result<GameSave>{
 const part=weaponPartByIdV05171[partId]
 if(!part)return fail('MODULAR_SHOP_UNKNOWN','Peça modular indisponível.')
 if(save.battle||save.world.currentLocationId!=='location_terran_bond_workshop')
  return fail('MODULAR_SHOP_LOCATION','Converse com Torvan no Mercado de Terran.')
 if(!Number.isInteger(quantity)||quantity<1||quantity>10)
  return fail('MODULAR_SHOP_QUANTITY','Compre de uma a dez peças por operação.')
 if(save.character.level<1+(part.tier-1)*3)
  return fail('MODULAR_SHOP_LEVEL','Tier bloqueado: avance seu personagem para comprar esta peça.')
 const price=part.price*quantity
 if(!Number.isSafeInteger(price)||save.wallet.gold<price)
  return fail('MODULAR_SHOP_GOLD','Ouro insuficiente para adquirir componentes.')
 const definition=catalog.items[partId]
 if(!definition||definition.category!=='material')
  return fail('MODULAR_SHOP_ITEM','O componente não está cadastrado no inventário.')
 const next=structuredClone(save)
 const existing=next.inventory.find(entry=>entry.definitionId===partId&&!entry.favorite&&!entry.locked)
 if(existing)existing.quantity+=quantity
 else next.inventory.push({instanceId:'modular_'+next.saveId+'_'+(next.revision+1),
  definitionId:partId,quantity,rarity:definition.rarity,locked:false,favorite:false,acquiredAt:now})
 next.wallet.gold-=price
 next.updatedAt=now;next.revision+=1
 next.eventLog.push('MarketPurchase:presence_terran_weaponsmith:'+partId+':'+quantity+':'+price)
 return ok(next)
}
