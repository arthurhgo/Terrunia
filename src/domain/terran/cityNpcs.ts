import { content } from '../../content/catalog'
import type { TerranLocationId } from '../../content/terran'
import type { TerranNpcPresence } from '../../content/types'
import type { GameSave } from '../game/types'
import { streetNpcPresences, streetNpcPlacements } from '../../content/streetNpcs'

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

/** Street residents are separate from institutional locations by design. */
export const STREET_SIDEQUEST_PRESENCE_IDS: readonly string[] = streetNpcPresences.map((entry) => entry.id)

export function getOutdoorCityNpcs(save: GameSave): VisibleNpc[] {
  return streetNpcPresences
    .filter((presence) => isNpcVisible(save, presence) && Boolean(presence.npcId &&
      content.npcs[presence.npcId]?.questIds.some((id) => content.quests[id]?.category === 'secondary')))
    .map((presence) => {
      const placement = streetNpcPlacementsById[presence.id]
      return { presence, locationId: placement.locationId }
    })
}

const streetNpcPlacementsById = Object.fromEntries(streetNpcPlacements.map((entry) => [entry.id, entry])) as
  Record<string, (typeof streetNpcPlacements)[number]>

export function getNpcQuestMarker(save: GameSave, presence: TerranNpcPresence): '!' | '✓' | null {
  const npc = presence.npcId ? content.npcs[presence.npcId] : null
  if (!npc) return null
  const statuses = npc.questIds.map((id) => save.quests[id]?.status)
  if (statuses.includes('ready_to_turn_in')) return '✓'
  if (statuses.some((status) => status === 'available' || status === 'offered')) return '!'
  return null
}
