import type { GearOffer, GearSlot } from './equipmentV0515'

/**
 * v0.5.16 · Market specialists retain their roles and IDs; personal names are
 * CONTENT_DRAFT proposals awaiting OWNER_DECISION. Final sprite art is not approved.
 * Commercial gear is cosmetic/attribute equipment, not a replacement Bond.
 */
export const TERRAN_GEAR_MERCHANTS = {
  presence_terran_weaponsmith: {
    npcId: 'npc_terran_weaponsmith',
    label: 'Torvan · Armeiro de Terran',
    description: 'Componentes de montagem e materiais para aprimorar a arma vinculada na Casa do Ferreiro.',
    slots: [] as readonly GearSlot[],
    tone: 'weapon',
  },
  presence_terran_armorer: {
    npcId: 'npc_terran_armorer',
    label: 'Brenna · Armadureira de Terran',
    description: 'Proteções, túnicas, capacetes, escudos, calças e botas comuns.',
    slots: ['armor', 'shield', 'helmet', 'pants', 'boots'] as readonly GearSlot[],
    tone: 'armor',
  },
  presence_terran_accessory_artisan: {
    npcId: 'npc_terran_accessory_artisan',
    label: 'Ilyra · Artesã de Acessórios',
    description: 'Colares, pulseiras e adornos comuns.',
    slots: ['necklace', 'bracelet', 'accessoryA', 'accessoryB'] as readonly GearSlot[],
    tone: 'accessory',
  },
} as const

export type TerranGearMerchantId = keyof typeof TERRAN_GEAR_MERCHANTS

export const isTerranGearMerchant = (id: string): id is TerranGearMerchantId =>
  Object.prototype.hasOwnProperty.call(TERRAN_GEAR_MERCHANTS,id)

export const isTerranMerchantOffer = (merchantId:string,offer:GearOffer): boolean =>
  isTerranGearMerchant(merchantId) &&
  offer.channel === 'PUBLIC_TERRAN' && offer.tier === 1 &&
  !offer.clanId && !offer.classId &&
  TERRAN_GEAR_MERCHANTS[merchantId].slots.includes(offer.slot)

export const getTerranMerchantForSlot = (slot:GearSlot): TerranGearMerchantId => {
  const found=(Object.keys(TERRAN_GEAR_MERCHANTS) as TerranGearMerchantId[])
    .find(merchant=>TERRAN_GEAR_MERCHANTS[merchant].slots.includes(slot))
  if(!found)throw new Error('Slot sem comerciante de Terran: '+slot)
  return found
}
