import { content } from '../../content/catalog'
import type { TerranNpcPresence } from '../../content/types'
import { useGameStore } from '../../state/gameStore'
import { getNpcQuestBadgeCounts, type NpcWorldMarker, type NpcMarkerPhase } from '../../domain/quests/questSelectors'
import { NpcMarker } from './NpcMarker'
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
  const hasQuests = totals && (totals.main + totals.secondary + totals.active + totals.ready > 0)
  return <span className="npc-nameplate" aria-hidden="true" data-npc-title={subtitle}
    title={subtitle ? `${presence.label} · ${subtitle}` : presence.label}>
    <span className="npc-nameplate__heading">
      {marker && <NpcMarker state={marker} phase={markerPhase} />}
      <strong className="npc-nameplate__name">{presence.label}</strong>
    </span>
    {subtitle && <small className="npc-nameplate__subtitle">{subtitle}</small>}
    {hasQuests && <span className="npc-nameplate__quest-counts"
      title={`${totals.main} principais, ${totals.secondary} secundárias, ${totals.active} aceitas, ${totals.ready} para entregar`}>
      {totals.main > 0 && <small className="npc-nameplate__quest-count npc-nameplate__quest-count--main" title="Missões principais disponíveis">Principal {totals.main}</small>}
      {totals.secondary > 0 && <small className="npc-nameplate__quest-count npc-nameplate__quest-count--secondary" title="Missões secundárias disponíveis">Secundária {totals.secondary}</small>}
      {totals.active > 0 && <small className="npc-nameplate__quest-count npc-nameplate__quest-count--active" title="Missões aceitas">Aceita {totals.active}</small>}
      {totals.ready > 0 && <small className="npc-nameplate__quest-count npc-nameplate__quest-count--ready" title="Missões prontas para entregar">Entrega {totals.ready}</small>}
    </span>}
  </span>
}
