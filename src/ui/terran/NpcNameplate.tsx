import { content } from '../../content/catalog'
import type { TerranNpcPresence } from '../../content/types'
import { useGameStore } from '../../state/gameStore'
import { getNpcQuestBadgeCounts, type NpcWorldMarker, type NpcMarkerPhase } from '../../domain/quests/questSelectors'
import { NpcMarker } from './NpcMarker'
import { NpcQuestBadges } from './NpcQuestBadges'
import './npcNameplate.css'

/** Labels use existing catalog/presence fields, never invented character lore. */
export function getNpcSubtitle(presence: TerranNpcPresence): string {
  const title = presence.npcId ? content.npcs[presence.npcId]?.title?.trim() : ''
  // The world label has two lines only: name, then canonical title.
  // Non-catalog residents show their existing contextual function instead.
  return title || presence.roleLabel?.trim() || ''
}

/** Display-only label; interaction and identity continue to use the NPC presence ID. */
export function NpcNameplate({ presence, marker, markerPhase }: { presence: TerranNpcPresence; marker?: NpcWorldMarker; markerPhase?: NpcMarkerPhase }) {
  const subtitle = getNpcSubtitle(presence)
  const save = useGameStore((state) => state.save)
  // Rosetta is the tutorial guide, not a quest acceptance terminal.
  // Never advertise unacceptably locked/future quests as an available offer.
  const totals = save && presence.npcId && presence.npcId !== 'npc_rosetta'
    ? getNpcQuestBadgeCounts(save, presence.npcId, content) : null
  return <span className="npc-nameplate" aria-hidden="true" data-npc-title={subtitle}
    title={subtitle ? `${presence.label} · ${subtitle}` : presence.label}>
    <span className="npc-nameplate__heading">
      {marker && <NpcMarker state={marker} phase={markerPhase} />}
      <strong className="npc-nameplate__name">{presence.label}</strong>
    </span>
    {subtitle && <small className="npc-nameplate__subtitle">{subtitle}</small>}
    <NpcQuestBadges counts={totals} />
  </span>
}
