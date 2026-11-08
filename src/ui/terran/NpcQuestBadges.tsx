import type { getNpcQuestBadgeCounts } from '../../domain/quests/questSelectors'

export type NpcQuestBadgeCounts = ReturnType<typeof getNpcQuestBadgeCounts>

/** Visual-only status tabs. Their colors and short symbols replace long labels;
 * all descriptions remain available in tooltips. Zero-count tabs are omitted. */
export function NpcQuestBadges({ counts }: { counts: NpcQuestBadgeCounts | null }) {
  if (!counts || counts.main + counts.secondary + counts.active + counts.ready === 0) return null
  return <span className="npc-nameplate__quest-counts"
    title={`${counts.main} principais, ${counts.secondary} secundárias, ${counts.active} aceitas, ${counts.ready} para entregar`}>
    {counts.main > 0 && <small className="npc-nameplate__quest-count npc-nameplate__quest-count--main"
      data-quest-state="main" title={`${counts.main} missões principais disponíveis`}>! {counts.main}</small>}
    {counts.secondary > 0 && <small className="npc-nameplate__quest-count npc-nameplate__quest-count--secondary"
      data-quest-state="secondary" title={`${counts.secondary} missões secundárias disponíveis`}>! {counts.secondary}</small>}
    {counts.active > 0 && <small className="npc-nameplate__quest-count npc-nameplate__quest-count--active"
      data-quest-state="active" title={`${counts.active} missões aceitas`}>··· {counts.active}</small>}
    {counts.ready > 0 && <small className="npc-nameplate__quest-count npc-nameplate__quest-count--ready"
      data-quest-state="ready" title={`${counts.ready} missões prontas para entregar`}>✓ {counts.ready}</small>}
  </span>
}
