import { CheckCircle2, Circle, MapPinned, RadioTower } from 'lucide-react'
import { content } from '../../content/catalog'
import { getTrackedQuestEntries } from '../../domain/quests/questSelectors'
import type { GameSave } from '../../domain/game/types'

export function QuestTracker({ save }: { save: GameSave }) {
  const entries = getTrackedQuestEntries(save, content)
  if (!entries.length) return null
  return (
    <aside className="quest-tracker" aria-label="Missões rastreadas">
      <header><RadioTower size={16} /><strong>Objetivos rastreados</strong></header>
      {entries.slice(0, 3).map(({ definition, progress }) => (
        <article key={progress.questId}>
          <strong>{definition.title}</strong>
          {progress.status === 'ready_to_turn_in' ? <span className="quest-tracker__return"><MapPinned size={13} /> Retorne a {content.npcs[definition.turnInNpcId]?.name}</span> : definition.objectives.map((objective) => {
            const current = progress.objectives[objective.id] ?? 0
            const done = current >= objective.required
            return <span key={objective.id}>{done ? <CheckCircle2 size={12} /> : <Circle size={12} />}{objective.label}<b>{current}/{objective.required}</b></span>
          })}
        </article>
      ))}
    </aside>
  )
}
