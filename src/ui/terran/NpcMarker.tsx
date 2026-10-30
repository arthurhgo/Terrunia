import type { NpcWorldMarker } from '../../domain/quests/questSelectors'

/** Rosetta alone uses a question bubble; sidequests have a distinct shape as well as color. */
export function NpcMarker({ state }: { state: NpcWorldMarker }) {
  if (!state) return null
  const title = state === '?' ? 'Orientações de Rosetta' : state === '◆' ? 'Sidequest pronta para entregar'
    : state === '◇' ? 'Sidequest disponível ou em andamento' : 'Missão disponível ou em andamento'
  return <span className={state === '?' ? 'npc-question-bubble' : `npc-quest-marker ${state === '!' ? 'npc-quest-marker--main' : 'npc-quest-marker--side'}`}
    data-quest-state={state === '◆' ? 'turn-in' : state === '?' ? 'guide' : 'available'} title={title} aria-hidden="true">{state}</span>
}
