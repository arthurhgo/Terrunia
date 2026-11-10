import { clanDefinitions, classDefinitions } from './progression'
import { getClanCastleId } from './clanCastlesV05142'
import type { NPCDefinition, TerranNpcPresence } from './types'

/**
 * v0.5.15.1: Functional merchant identities, not new lore.
 * Unique NPC IDs and sprites are replaceable. Personal names remain OWNER_DECISION.
 */
export type CastleGearMerchant = {
  id: string
  npcId: string
  name: string
  portraitAssetId: string
  channel: 'CLAN_EXCLUSIVE' | 'CLASS_EXCLUSIVE'
  clanId: string
  classId?: string
  castleId: string
  presence: TerranNpcPresence
}

export const castleGearMerchantsV05151: CastleGearMerchant[] = [
  ...clanDefinitions.map((clan): CastleGearMerchant => {
    const npcId = 'npc_castle_merchant_clan_' + clan.id
    return {
      id: 'presence_castle_merchant_clan_' + clan.id,
      npcId,
      name: 'Intendente · ' + clan.name,
      portraitAssetId: 'npc.castle-merchant.clan.' + clan.id,
      channel: 'CLAN_EXCLUSIVE',
      clanId: clan.id,
      castleId: getClanCastleId(clan.id)!,
      presence: {
        id: 'presence_castle_merchant_clan_' + clan.id, npcId,
        label: 'Intendente · ' + clan.name,
        presence: 'resident', roleLabel: 'Mercador exclusivo do Clã',
      },
    }
  }),
  ...classDefinitions.map((cls): CastleGearMerchant => {
    const npcId = 'npc_castle_merchant_class_' + cls.id
    return {
      id: 'presence_castle_merchant_class_' + cls.id,
      npcId,
      name: 'Armeiro · ' + cls.name,
      portraitAssetId: 'npc.castle-merchant.class.' + cls.id,
      channel: 'CLASS_EXCLUSIVE',
      clanId: cls.clanId,
      classId: cls.id,
      castleId: getClanCastleId(cls.clanId)!,
      presence: {
        id: 'presence_castle_merchant_class_' + cls.id, npcId,
        label: 'Armeiro · ' + cls.name,
        presence: 'resident', roleLabel: 'Mercador exclusivo da Classe',
      },
    }
  }),
]

export const castleMerchantByPresenceId: Record<string, CastleGearMerchant> =
  Object.fromEntries(castleGearMerchantsV05151.map(merchant => [merchant.id, merchant]))

export const castleMerchantsForInterior = (castleId: string): CastleGearMerchant[] =>
  castleGearMerchantsV05151.filter(merchant => merchant.castleId === castleId)

export const castleMerchantNpcsV05151: NPCDefinition[] = castleGearMerchantsV05151.map(merchant => ({
  id: merchant.npcId,
  name: merchant.name,
  title: merchant.channel === 'CLAN_EXCLUSIVE' ? 'Intendente do Clã' : 'Armeiro de Classe',
  settlementId: 'terran',
  roles: ['vendor'],
  questIds: [],
  portraitAssetId: merchant.portraitAssetId,
  dialogue: ['Este arsenal é exclusivo. A filiação e a disciplina são verificadas antes de cada compra.'],
  status: 'CONTENT_DRAFT',
}))
