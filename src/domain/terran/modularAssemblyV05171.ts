import type {GameSave} from '../game/types'
import type {ContentCatalog} from '../../content/catalog'
import {getAssemblyFamily,modularPartById} from '../../content/modularWeaponsV05171'
import {deriveCharacterStats} from '../character/derivedStats'
import {fail,ok,type Result} from '../shared/types'
import {applyQuestEvent} from '../quests/questEngine'
import {FORGE_LOCATION_ID} from './forge'

export type AssemblyPreviewV05171={
 boundItemId:string;partId:string;price:number;previousPartId?:string;
 before:ReturnType<typeof deriveCharacterStats>;after:ReturnType<typeof deriveCharacterStats>;
 afterSave:GameSave;
}
const unprotected=(save:GameSave,id:string)=>save.inventory
 .filter(item=>item.definitionId===id&&!item.locked&&!item.favorite)
 .reduce((sum,item)=>sum+item.quantity,0)
export const getCurrentBoundAssemblyV05171=(save:GameSave,slot:'weapon'|'shield')=>{
 const id=save.character.bondedEquipment[slot]
 return id?save.boundItems[id]:undefined
}
export function buildAssemblyPreviewV05171(save:GameSave,slot:'weapon'|'shield',
 partId:string,catalog:ContentCatalog,now:string):Result<AssemblyPreviewV05171>{
 if(save.battle||save.world.currentLocationId!==FORGE_LOCATION_ID)
  return fail('ASSEMBLY_LOCATION','A montagem só ocorre com Durnan, na Casa do Ferreiro, fora do combate.')
 const original=getCurrentBoundAssemblyV05171(save,slot)
 if(!original)return fail('ASSEMBLY_BOND','Vincule primeiro a peça permanente deste slot.')
 const part=modularPartById[partId],base=catalog.boundItemBases[original.baseItemId]
 const family=base?getAssemblyFamily(base.archetype,slot):undefined
 if(!part||!family||part.family!==family)
  return fail('ASSEMBLY_FAMILY','Esta parte não é compatível com a estrutura do seu Vínculo.')
 if(save.character.level<part.level)return fail('ASSEMBLY_LEVEL','A peça T'+part.tier+' requer nível '+part.level+'.')
 const previous=original.assembly?.parts[part.partSlot]
 const installed=previous?modularPartById[previous]:undefined
 if(installed?.tier&&installed.tier>=part.tier)
  return fail('ASSEMBLY_TIER','A estrutura só aceita um Tier mais alto; partes antigas ficam registradas como memória.')
 if(unprotected(save,part.itemId)<1)return fail('ASSEMBLY_PART','Adquira esta parte na oficina ou obtenha como drop antes de montar.')
 const price=Math.max(0,Math.floor(part.price/4))
 if(save.wallet.gold<price)return fail('ASSEMBLY_GOLD','São necessários '+price+' Ouro para instalar o módulo.')
 const next=structuredClone(save)
 const item=next.boundItems[original.id]
 item.assembly??={assemblyVersion:1,boundItemId:item.id,family,parts:{},history:[],revision:0,assembledAt:now}
 if(previous)item.assembly.history.push(previous)
 item.assembly.parts[part.partSlot]=partId
 item.assembly.revision+=1
 item.assembly.assembledAt=now
 const before=deriveCharacterStats(save,catalog),after=deriveCharacterStats(next,catalog)
 // Pure preview: does not consume parts, gold, quest rewards or RNG.
 return ok({boundItemId:item.id,partId,price,...(previous?{previousPartId:previous}:{}),before,after,afterSave:next})
}
export function commitAssemblyV05171(save:GameSave,slot:'weapon'|'shield',
 partId:string,catalog:ContentCatalog,now:string,expectedRevision=save.revision):Result<GameSave>{
 if(save.revision!==expectedRevision)return fail('ASSEMBLY_STALE','O save mudou; revise novamente a montagem antes de confirmar.')
 const prepared=buildAssemblyPreviewV05171(save,slot,partId,catalog,now)
 if(!prepared.ok)return prepared
 const next=prepared.value.afterSave
 const id=next.inventory.findIndex(item=>item.definitionId===partId&&!item.locked&&!item.favorite)
 if(id<0)return fail('ASSEMBLY_PART','O componente foi removido antes da confirmação.')
 next.inventory[id].quantity-=1
 next.inventory=next.inventory.filter(item=>item.quantity>0)
 next.wallet.gold-=prepared.value.price
 next.updatedAt=now;next.revision+=1
 next.eventLog.push('ModularAssembly:'+slot+':'+partId)
 next.boundItems[prepared.value.boundItemId].updatedAt=now
 const result=applyQuestEvent(next,{type:'refine',targetId:'modular_weapon'},catalog,now)
 const stats=deriveCharacterStats(result,catalog)
 result.vitals.hp=Math.min(result.vitals.hp,stats.life.value)
 result.vitals.mp=Math.min(result.vitals.mp,stats.mana.value)
 return ok(result)
}
/** No permanent equipment replacement: only a market component purchased as temporary material. */
export function purchaseModularPartV05171(save:GameSave,id:string,catalog:ContentCatalog,
 now:string,merchantId='presence_terran_weaponsmith'):Result<GameSave>{
 const part=modularPartById[id]
 if(!part)return fail('PART_UNKNOWN','Componente desconhecido.')
 if(merchantId!=='presence_terran_weaponsmith'||save.battle||
  save.world.currentLocationId!=='location_terran_bond_workshop')
  return fail('PART_MERCHANT','Compre componentes com Torvan no Mercado de Terran.')
 if(part.tier>3)return fail('PART_RARE','Peças nobres e magistrais devem ser adquiridas por exploração.')
 if(save.character.level<part.level)return fail('PART_LEVEL','Requer nível '+part.level+'.')
 if(save.wallet.gold<part.price)return fail('PART_GOLD','Ouro insuficiente.')
 const next=structuredClone(save)
 next.wallet.gold-=part.price
 const instance=next.inventory.find(item=>item.definitionId===id&&!item.locked&&!item.favorite)
 if(instance)instance.quantity+=1
 else next.inventory.push({instanceId:'modular_'+next.saveId+'_'+next.revision,definitionId:id,quantity:1,
  rarity:catalog.items[id].rarity,locked:false,favorite:false,acquiredAt:now})
 next.updatedAt=now;next.revision+=1
 next.eventLog.push('ModularPartPurchased:'+id)
 return ok(applyQuestEvent(next,{type:'purchase',targetId:'modular_part'},catalog,now))
}
