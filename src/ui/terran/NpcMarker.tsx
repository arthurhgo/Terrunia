type Marker = '!' | '✓' | '?' | null
/** Shared question bubble for all NPCs, including Rosetta. State stays available to assistive UI. */
export function NpcMarker({ state }: { state: Marker }) {
  return <span className="npc-question-bubble" data-quest-state={state === '✓' ? 'turn-in' : state === '!' ? 'available' : 'talk'}
    title={state === '✓' ? 'Missão pronta para entregar' : state === '!' ? 'Missão disponível' : 'Conversar'} aria-hidden="true">?</span>
}
