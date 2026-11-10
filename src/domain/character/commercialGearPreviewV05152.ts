import type { ContentCatalog } from '../../content/catalog'
import { gearOfferById, getGearGrade, getGearStatEntries } from '../../content/equipmentV0515'
import type { GameSave,InventoryItemInstance } from '../game/types'
import { checkGearWear } from '../inventory/equipmentV0515'
import { deriveCharacterStats } from './derivedStats'

const DERIVED_LABELS={
 life:'Vida',mana:'Mana',defense:'Defesa',primaryAttack:'Ataque vinculado',
 physicalAttack:'Ataque físico',magicalAttack:'Ataque mágico',initiative:'Iniciativa',
} as const

/**
 * Read-only equipment comparison. No save, Bond, inventory or currencies mutate.
 * Uses EXACTLY the same stat derivation as combat; not decorative catalog numbers.
 */
export function previewCommercialEquip(save:GameSave,item:InventoryItemInstance,catalog:ContentCatalog){
 const offer=gearOfferById[item.definitionId]
 if(!offer)return null
 const grade=getGearGrade(item.refinementLevel)
 const permission=checkGearWear(save,offer)
 const hasBond=Boolean(save.character.bondedEquipment[offer.slot as keyof typeof save.character.bondedEquipment])
 const allowedWithoutBond=['shield','necklace','bracelet','helmet','pants','boots','accessoryA','accessoryB','armor'].includes(offer.slot)
 const wearable=permission.ok&&(hasBond||allowedWithoutBond)
 const before=deriveCharacterStats(save,catalog)
 const projected=structuredClone(save)
 if(offer.slot==='armor'){
   if(projected.character.bondedEquipment.armor)
     projected.equippedGearStyles={...projected.equippedGearStyles,armor:item}
   else {
     projected.equippedBasicArmor=item
     projected.character.basicArmorInstanceId=item.instanceId
   }
 }else if(['weapon','shield','necklace','bracelet'].includes(offer.slot)){
   projected.equippedGearStyles={...projected.equippedGearStyles,[offer.slot]:item}
 }else {
   projected.equippedComplementary={...projected.equippedComplementary,[offer.slot]:item}
 }
 const after=deriveCharacterStats(projected,catalog)
 const deltas=Object.entries(DERIVED_LABELS).map(([key,label])=>{
   const stat=key as keyof typeof DERIVED_LABELS
   return {key:stat,label,before:before[stat].value,after:after[stat].value,
     difference:after[stat].value-before[stat].value}
 }).filter(x=>x.difference!==0)
 return {
  offer,grade,stats:getGearStatEntries(offer,grade),
  nextGrade:grade===3?null:getGearStatEntries(offer,(grade+1) as 2|3),
  wearable,blockReason:!permission.ok?permission.message:
   !hasBond&&!allowedWithoutBond?'Este slot exige primeiro o Vínculo permanente.':null,
  deltas,
 }
}
