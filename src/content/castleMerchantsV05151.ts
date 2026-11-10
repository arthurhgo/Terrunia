import { clanDefinitions } from './progression'
import { getClanCastleId } from './clanCastlesV05142'
import type { NPCDefinition, TerranNpcPresence } from './types'

/**
 * v0.5.15.1 functional revision: one vendor per Clan castle.
 * The vendor sells its Clan lineage AND all three Class lineages for that Clan.
 * Class ownership remains a purchase prerequisite, not a separate NPC.
 * Personal names and biographies are OWNER_DECISION; stable identifiers survive the change.
 */
export type CastleGearMerchant = {
  id: string
  npcId: string
  name: string
  portraitAssetId: string
  clanId: string
  castleId: string
  presence: TerranNpcPresence
}

export const castleGearMerchantsV05151: CastleGearMerchant[] = clanDefinitions.map((clan) => {
  // Keep the previous Intendant ID so existing references and art overrides stay valid.
  const npcId = 'npc_castle_merchant_clan_' + clan.id
  const id = 'presence_castle_merchant_clan_' + clan.id
  const name = 'Intendente · ' + clan.name
  return {
    id,
    npcId,
    name,
    portraitAssetId: 'npc.castle-merchant.clan.' + clan.id,
    clanId: clan.id,
    castleId: getClanCastleId(clan.id)!,
    presence: {
      id,
      npcId,
      label: name,
      presence: 'resident',
      roleLabel: 'Mercador de equipamentos do Clã e suas Classes',
    },
  }
})

export const castleMerchantByPresenceId: Record<string, CastleGearMerchant> =
  Object.fromEntries(castleGearMerchantsV05151.map((merchant) => [merchant.id, merchant]))

export const castleMerchantsForInterior = (castleId: string): CastleGearMerchant[] =>
  castleGearMerchantsV05151.filter((merchant) => merchant.castleId === castleId)

export const castleMerchantNpcsV05151: NPCDefinition[] = castleGearMerchantsV05151.map((merchant) => ({
  id: merchant.npcId,
  name: merchant.name,
  title: 'Intendente do Clã',
  settlementId: 'terran',
  roles: ['vendor'],
  questIds: [],
  portraitAssetId: merchant.portraitAssetId,
  dialogue: [
    'Bem-vindo ao arsenal de nosso Clã. Aqui você encontra equipamentos do Clã e das três Classes.',
    'Para comprar uma peça de Classe, primeiro precisa conquistar essa disciplina. Não posso dispensar os requisitos.',
  ],
  status: 'CONTENT_DRAFT',
}))
