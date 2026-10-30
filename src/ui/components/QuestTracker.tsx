import { CheckCircle2, ChevronDown, Circle, MapPinned, RadioTower } from 'lucide-react'
import { useState } from 'react'
import { content } from '../../content/catalog'
import { getTrackedQuestEntries } from '../../domain/quests/questSelectors'
import type { GameSave } from '../../domain/game/types'

/** Discreet in-game trigger; pointer hover, keyboard focus and touch/click reveal the details. */
export function QuestTracker({ save }: { save: GameSave }) {
  const entries = getTrackedQuestEntries(save, content)
  const [pinnedOpen, setPinnedOpen] = useState(false)
  const [hovered, setHovered] = useState(false)
  const [focused, setFocused] = useState(false)
  if (!entries.length) return null

  const open = hovered || focused || pinnedOpen
  return (
    <aside
      className={`quest-tracker quest-tracker--popover ${open ? 'is-expanded' : ''}`}
      aria-label="Missões rastreadas"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocusCapture={() => setFocused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setFocused(false)
      }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') { setPinnedOpen(false); setHovered(false); setFocused(false); (event.target as HTMLElement).blur() }
      }}
    >
      <button type="button" className="quest-tracker__trigger" aria-expanded={open}
        aria-controls="quest-tracker-details" onClick={() => setPinnedOpen((value) => !value)}>
        <RadioTower size={15} aria-hidden="true" />
        <strong>Objetivos rastreados</strong>
        <span className="quest-tracker__count">{entries.length}</span>
        <ChevronDown className="quest-tracker__chevron" size={14} aria-hidden="true" />
      </button>
      {open && <div className="quest-tracker__details" id="quest-tracker-details">
        {entries.slice(0, 3).map(({ definition, progress }) => (
          <article key={progress.questId}>
            <strong>{definition.title}</strong>
            {progress.status === 'ready_to_turn_in' ? <span className="quest-tracker__return"><MapPinned size={13} /> Retorne a {content.npcs[definition.turnInNpcId]?.name}</span> : definition.objectives.map((objective) => {
              const current = Math.min(objective.required, progress.objectives[objective.id] ?? 0)
              const done = current >= objective.required
              return <span key={objective.id}>{done ? <CheckCircle2 size={12} /> : <Circle size={12} />}{objective.label}<b>{current}/{objective.required}</b></span>
            })}
          </article>
        ))}
        {entries.length > 3 && <small className="quest-tracker__more">+{entries.length - 3} missão(ões) rastreada(s) no Registro de Missões.</small>}
      </div>}
    </aside>
  )
}
