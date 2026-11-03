import { content } from '../../content/catalog'
import type { TerranNpcPresence } from '../../content/types'
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
  return <span className="npc-nameplate" aria-hidden="true" data-npc-title={subtitle}
    title={subtitle ? `${presence.label} · ${subtitle}` : presence.label}>
    <strong className="npc-nameplate__name">{presence.label}</strong>
    {subtitle && <small className="npc-nameplate__subtitle">{subtitle}</small>}
  </span>
}
