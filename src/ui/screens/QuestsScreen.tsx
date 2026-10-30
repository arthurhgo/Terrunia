import { Navigate } from 'react-router-dom'
import { getActiveQuestCount, MAX_ACTIVE_QUESTS } from '../../domain/quests/questEngine'
import { useGameStore } from '../../state/gameStore'
import { GameShell } from '../components/GameShell'
import { QuestGrid } from '../quests/QuestGrid'

export function QuestsScreen() {
  const save = useGameStore((state) => state.save)
  if (!save) return <Navigate to="/character/create" replace />
  return <GameShell fluid>
    <div className="quest-journal-screen quest-journal-screen--grid">
      <header className="screen-heading quest-heading">
        <div><p className="eyebrow">MISSÕES · TERRÚNIA</p><h1>Registro de Missões</h1><p>Explore Terrúnia, construa alianças e deixe sua marca no mundo. Passe o mouse ou selecione uma missão para ler os detalhes.</p></div>
        <div className="quest-capacity" aria-label={`${getActiveQuestCount(save)} de ${MAX_ACTIVE_QUESTS} missões em andamento`}>
          <span>EM ANDAMENTO</span><strong>{getActiveQuestCount(save)} / {MAX_ACTIVE_QUESTS}</strong><small>ATIVAS + PRONTAS PARA ENTREGA</small>
        </div>
      </header>
      <QuestGrid save={save} />
    </div>
  </GameShell>
}
