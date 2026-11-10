import type { GearOffer, GearSlot } from './equipmentV0515'

/**
 * v0.5.15.3 · Market specialists use JOB TITLES, not new lore identities.
 * Personal names, backstories and final sprite art remain OWNER_DECISION.
 * Commercial gear is cosmetic/attribute equipment, not a replacement Bond.
 */
export const TERRAN_GEAR_MERCHANTS = {
  presence_terran_weaponsmith: {
    npcId: 'npc_terran_weaponsmith',
    label: 'Armeiro de Terran',
    description: 'Revestimentos comuns para armas vinculadas.',
    slots: ['weapon'] as readonly GearSlot[],
    tone: 'weapon',
  },
  presence_terran_armorer: {
    npcId: 'npc_terran_armorer',
    label: 'Armadureiro de Terran',
    description: 'Proteções, túnicas, capacetes, escudos, calças e botas comuns.',
    slots: ['armor', 'shield', 'helmet', 'pants', 'boots'] as readonly GearSlot[],
    tone: 'armor',
  },
  presence_terran_accessory_artisan: {
    npcId: 'npc_terran_accessory_artisan',
    label: 'Artesão de Acessórios',
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
