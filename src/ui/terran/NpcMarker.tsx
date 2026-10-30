import type { NpcMarkerPhase, NpcWorldMarker } from '../../domain/quests/questSelectors'

/** Rosetta alone uses a question bubble; sidequests have a distinct shape as well as color. */
export function NpcMarker({ state, phase }: { state: NpcWorldMarker; phase?: NpcMarkerPhase }) {
  if (!state) return null
  const resolvedPhase = phase ?? (state === '?' ? 'guide' : state === '◆' ? 'turn-in' : 'available')
  const title = resolvedPhase === 'active' ? 'Missão aceita · em andamento' : state === '?' ? 'Orientações de Rosetta'
    : resolvedPhase === 'turn-in' ? 'Missão pronta para entregar' : state === '◇' ? 'Sidequest disponível' : 'Missão disponível'
  return <span className={state === '?' ? 'npc-question-bubble' : `npc-quest-marker ${state === '!' ? 'npc-quest-marker--main' : 'npc-quest-marker--side'}`}
    data-quest-state={resolvedPhase} title={title} aria-hidden="true">{state}</span>
}
