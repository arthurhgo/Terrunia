import './QuestContextNote.css'

/** Shared secondary guidance: only quest definitions opt in to this layout. */
export function QuestContextNote({ note }: { note?: string }) {
  const text = note?.trim()
  return text ? <p className="quest-context-note" aria-label="Observação da missão">{text}</p> : null
}
