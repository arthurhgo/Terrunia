import { CheckCircle2, Circle, ScrollText } from 'lucide-react'
import { Navigate } from 'react-router-dom'
import { content } from '../../content/catalog'
import { useGameStore } from '../../state/gameStore'
import { ArcanePanel } from '../components/ArcanePanel'
import { GameShell } from '../components/GameShell'

export function QuestsScreen() {
  const save = useGameStore((state) => state.save)
  if (!save) return <Navigate to="/character/create" replace />
  return (
    <GameShell>
      <div className="content-screen">
        <header className="screen-heading"><p className="eyebrow">CAMPANHA E PROVAS</p><h1>Missões</h1><p>Quests conectam NPCs, exploração, Vínculo, Clã e Classe.</p></header>
        {Object.values(save.quests).map((progress) => {
          const quest = content.quests[progress.questId]
          return (
            <ArcanePanel key={progress.questId} title={quest.title} eyebrow={`${progress.status} · ${quest.status}`} action={<ScrollText size={20} />}>
              <p>{quest.summary}</p>
              <div className="quest-objectives">
                {quest.objectives.map((objective) => {
                  const current = progress.objectives[objective.id] ?? 0
                  const done = current >= objective.required
                  return <div key={objective.id} className={done ? 'done' : ''}>{done ? <CheckCircle2 size={17} /> : <Circle size={17} />}<span>{objective.type}: {objective.targetId}</span><strong>{current}/{objective.required}</strong></div>
                })}
              </div>
            </ArcanePanel>
          )
        })}
      </div>
    </GameShell>
  )
}
