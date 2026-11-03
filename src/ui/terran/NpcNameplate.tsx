import './npcNameplate.css'

/** Display-only label; interaction and identity continue to use the NPC presence ID. */
export function NpcNameplate({ name }: { name: string }) {
  return <span className="npc-nameplate" aria-hidden="true">{name}</span>
}
