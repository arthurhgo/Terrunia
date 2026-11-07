import { content } from '../../content/catalog'
import type { TerranNpcPresence } from '../../content/types'
import { useGameStore } from '../../state/gameStore'
import { getNpcQuestCounts } from '../../domain/quests/questSelectors'
import './npcNameplate.css'

/** Labels use existing catalog/presence fields, never invented character lore. */
export function getNpcSubtitle(presence: TerranNpcPresence): string {
  const title = presence.npcId ? content.npcs[presence.npcId]?.title?.trim() : ''
  // The world label has two lines only: name, then canonical title.
  // Non-catalog residents show their existing contextual function instead.
  return title || presence.roleLabel?.trim() || ''
}

/** Display-only label; interaction and identity continue to use the NPC presence ID. */
export function NpcNameplate({ presence }: { presence: TerranNpcPresence }) {
  const subtitle = getNpcSubtitle(presence)
  const save = useGameStore((state) => state.save)
  // Rosetta is the tutorial guide, not a quest acceptance terminal.
  // Never advertise unacceptably locked/future quests as an available offer.
  const totals = save && presence.npcId && presence.npcId !== 'npc_rosetta'
    ? getNpcQuestCounts(save, presence.npcId, content) : null
  const hasQuests = totals && (totals.available + totals.active + totals.ready > 0)
  return <span className="npc-nameplate" aria-hidden="true" data-npc-title={subtitle}
    title={subtitle ? `${presence.label} · ${subtitle}` : presence.label}>
    <strong className="npc-nameplate__name">{presence.label}</strong>
    {subtitle && <small className="npc-nameplate__subtitle">{subtitle}</small>}
    {hasQuests && <span className="npc-nameplate__quest-counts" title={`${totals.available} disponíveis, ${totals.active} em andamento, ${totals.ready} para entregar`}>
      {totals.available > 0 && <small className="npc-nameplate__quest-count npc-nameplate__quest-count--available" title={`${totals.available} disponíveis`}>{totals.available}</small>}
      {totals.active > 0 && <small className="npc-nameplate__quest-count npc-nameplate__quest-count--active" title={`${totals.active} em andamento`}>{totals.active}</small>}
      {totals.ready > 0 && <small className="npc-nameplate__quest-count npc-nameplate__quest-count--ready" title={`${totals.ready} para entregar`}>{totals.ready}</small>}
    </span>}
  </span>
}
