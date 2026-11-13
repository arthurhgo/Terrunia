import type {ContentCatalog} from '../../content/catalog'
import type {GameSave} from '../game/types'
import {createBoundItem,canBindSlot} from './boundItems'
import {evaluateEquipmentRequirements} from './equipmentLoadout'
import {fail,ok,type Result} from '../shared/types'
import {MARKET_LOCATION_ID} from '../terran/market'

/** UX_DRAFT / BALANCE_DRAFT. Existing workshop NPC, same permanent shield axis.
 * Never transforms or replaces a piece already bonded. */
export const OFFHAND_RITE_V0517 = {
 locationId:MARKET_LOCATION_ID, npcId:'presence_edran', minLevel:2,
 offers:[
  {baseId:'bound_shield_round',cost:45,label:'Escudo físico'},
  {baseId:'bound_shield_arcane',cost:50,label:'Protetor Arcano'},
  {baseId:'bound_shield_quiver_v0517',cost:40,label:'Aljava de arqueiro'},
 ] as const,
} as const
export function checkOffhandRiteV0517(save:GameSave,baseId:string,catalog:ContentCatalog,npcId:string=OFFHAND_RITE_V0517.npcId){
 const offer=OFFHAND_RITE_V0517.offers.find(o=>o.baseId===baseId)
 if(!offer)return fail('OFFHAND_UNKNOWN','Esta manifestação não pertence à Escudaria.')
 if(save.battle||save.world.currentLocationId!==OFFHAND_RITE_V0517.locationId||npcId!==OFFHAND_RITE_V0517.npcId)
  return fail('OFFHAND_NPC_REQUIRED',"Converse com Ed'ran na Oficina de Vínculos em Terran.")
 if(!save.character.bondedEquipment.weapon)return fail('OFFHAND_WEAPON_REQUIRED','Vincule sua primeira arma antes do rito de Escudaria.')
 const available=canBindSlot(save.character.bondedEquipment,'shield')
 if(!available.ok)return available
 const item=catalog.boundItemBases[baseId]
 if(!item||item.slot!=='shield')return fail('OFFHAND_INVALID','Manifestação vinculada inválida.')
 const requirements=evaluateEquipmentRequirements(save.character,item)
 if(!requirements.eligible)return fail('OFFHAND_REQUIREMENTS','Faltam requisitos: '+requirements.requirements.filter(x=>!x.met).map(x=>x.label).join(', ')+'.')
 if(save.wallet.gold<offer.cost)return fail('OFFHAND_GOLD','Ouro insuficiente para o rito.')
 return ok(offer)
}
export function performOffhandRiteV0517(save:GameSave,baseId:string,catalog:ContentCatalog,now:string,npcId:string=OFFHAND_RITE_V0517.npcId):Result<GameSave>{
 const check=checkOffhandRiteV0517(save,baseId,catalog,npcId)
 if(!check.ok)return check
 const next=structuredClone(save)
 const definition=catalog.boundItemBases[baseId]
 const bound=createBoundItem(next.character.id,definition,now)
 if(next.boundItems[bound.id])return fail('OFFHAND_ID_CONFLICT','Vínculo duplicado: tente novamente.')
 bound.memories[0].sourceId='offhand_rite_v0517'
 bound.memories[0].title='Rito da Escudaria'
 bound.memories[0].description='Vínculo inicial da mão secundária realizado em Terran, sem trocar outro equipamento.'
 next.boundItems[bound.id]=bound
 next.character.bondedEquipment.shield=bound.id
 next.wallet.gold-=check.value.cost
 next.updatedAt=now
 next.revision+=1
 next.eventLog.push('OffhandRite:'+baseId+':'+npcId)
 return ok(next)
}
