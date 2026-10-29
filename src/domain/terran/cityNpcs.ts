import { content } from '../../content/catalog'
import { TERRAN_LOCATION_IDS, type TerranLocationId } from '../../content/terran'
import type { TerranNpcPresence } from '../../content/types'
import type { GameSave } from '../game/types'

export type VisibleNpc = { presence: TerranNpcPresence; locationId: TerranLocationId }

/** Content-driven visibility. Conditional visitors require a deliberate world flag. */
export function isNpcVisible(save: GameSave, presence: TerranNpcPresence): boolean {
  if (presence.presence === 'resident' || presence.presence === 'institution') return true
  if (presence.presence === 'conditional' || presence.presence === 'visitor') {
    return save.world.worldFlags.includes(`npc_presence:${presence.id}`)
  }
  if (presence.id === 'presence_class_masters') return Boolean(save.character.clan.clanId)
  if (presence.id === 'presence_main_lore_council') return Boolean(save.character.classProgression.classId)
  return false
}

export function getVisibleNpcsInLocation(save: GameSave, locationId: TerranLocationId): VisibleNpc[] {
  return content.terranLocations[locationId].npcPresences
    .filter((presence) => isNpcVisible(save, presence))
    .map((presence) => ({ presence, locationId }))
}

/**
 * Only explicitly assigned secondary-quest characters belong outdoors.
 * Reserved empty until street-sidequest locations/stories are authored.
 * All current institutional and service residents live inside their buildings.
 */
export const STREET_SIDEQUEST_PRESENCE_IDS: readonly string[] = []

export function getOutdoorCityNpcs(save: GameSave): VisibleNpc[] {
  return TERRAN_LOCATION_IDS.flatMap((id) => getVisibleNpcsInLocation(save, id))
    .filter(({ presence }) => STREET_SIDEQUEST_PRESENCE_IDS.includes(presence.id)
      && Boolean(presence.npcId && content.npcs[presence.npcId]?.questIds.some((id) =>
        content.quests[id]?.category === 'secondary')))
}

export function getNpcQuestMarker(save: GameSave, presence: TerranNpcPresence): '!' | '✓' | null {
  const npc = presence.npcId ? content.npcs[presence.npcId] : null
  if (!npc) return null
  const statuses = npc.questIds.map((id) => save.quests[id]?.status)
  if (statuses.includes('ready_to_turn_in')) return '✓'
  if (statuses.some((status) => status === 'available' || status === 'offered')) return '!'
  return null
}
