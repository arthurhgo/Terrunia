import { castleMerchantByPresenceId, castleGearMerchantsV05151 } from './castleMerchantsV05151'
import profiles from './npcVisuals.json'
import type { TerranNpcPresence } from './types'
export const npcVisualDefinitions = profiles
export const castleMerchantVisualIds = castleGearMerchantsV05151.map(m => m.portraitAssetId)
const byNpc = new Map(profiles.filter((profile) => 'npcId' in profile).map((profile) => [profile.npcId, profile.assetId]))
const byPresence = new Map(profiles.filter((profile) => 'presenceId' in profile).map((profile) => [profile.presenceId, profile.assetId]))
/** A single identity resolves portraits, map sprites and dialogue cast. */
export const getPresencePortrait = (presence: TerranNpcPresence) =>
  castleMerchantByPresenceId[presence.id]?.portraitAssetId ??
  (presence.npcId ? byNpc.get(presence.npcId) : byPresence.get(presence.id)) ?? 'npc.unassigned'
