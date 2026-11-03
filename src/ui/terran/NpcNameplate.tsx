import { content } from '../../content/catalog'
import type { TerranNpcPresence } from '../../content/types'
import './npcNameplate.css'

/** Labels use existing catalog/presence fields, never invented character lore. */
export function getNpcSubtitle(presence: TerranNpcPresence): string {
  const title = presence.npcId ? content.npcs[presence.npcId]?.title?.trim() : ''
  const role = presence.roleLabel?.trim()
  if (!title) return role ?? ''
  if (!role || title.toLocaleLowerCase('pt-BR') === role.toLocaleLowerCase('pt-BR')) return title
  return `${title} · ${role}`
}

/** Display-only label; interaction and identity continue to use the NPC presence ID. */
export function NpcNameplate({ presence }: { presence: TerranNpcPresence }) {
  const subtitle = getNpcSubtitle(presence)
  return <span className="npc-nameplate" aria-hidden="true">
    <strong className="npc-nameplate__name">{presence.label}</strong>
    {subtitle && <small className="npc-nameplate__subtitle">{subtitle}</small>}
  </span>
}
