import { CheckCircle2, Circle, MapPinned, Radio, RadioTower, ScrollText } from 'lucide-react'
import { useState } from 'react'
import { Navigate } from 'react-router-dom'
import { content } from '../../content/catalog'
import type { QuestCategory } from '../../content/types'
import {
  getQuestEntriesByCategory,
  getQuestJournalEntries,
  getQuestStatusLabel,
  QUEST_JOURNAL_CATEGORIES,
} from '../../domain/quests/questSelectors'
import { getActiveQuestCount, MAX_ACTIVE_QUESTS } from '../../domain/quests/questEngine'
import { useGameStore } from '../../state/gameStore'
import { ArcanePanel } from '../components/ArcanePanel'
import { GameButton } from '../components/GameButton'
import { GameShell } from '../components/GameShell'

type JournalCategory = QuestCategory | 'completed'

export function QuestsScreen() {
  const save = useGameStore((state) => state.save)
  const setTracked = useGameStore((state) => state.setQuestTracked)
  const [category, setCategory] = useState<JournalCategory>('main')
  if (!save) return <Navigate to="/character/create" replace />
  const entries = getQuestJournalEntries(save, content)
  const visibleEntries = getQuestEntriesByCategory(entries, category)

  return (
    <GameShell>
      <div className="content-screen quest-journal-screen">
        <header className="screen-heading quest-heading"><div><p className="eyebrow">JOURNAL COMPLETO</p><h1>Missões</h1><p>Somente missões aceitas entram neste registro. O tracker acompanha apenas as selecionadas.</p></div><div className="quest-capacity" aria-label={`${getActiveQuestCount(save)} de ${MAX_ACTIVE_QUESTS} missões em andamento`}><span>EM ANDAMENTO</span><strong>{getActiveQuestCount(save)} / {MAX_ACTIVE_QUESTS}</strong><small>ATIVAS + PRONTAS PARA ENTREGA</small></div></header>
        <nav className="journal-tabs" aria-label="Categorias de missões">
          {QUEST_JOURNAL_CATEGORIES.map((tab) => {
            const count = getQuestEntriesByCategory(entries, tab.id).length
            return <button key={tab.id} type="button" className={category === tab.id ? 'active' : ''} onClick={() => setCategory(tab.id)}><span>{tab.label}</span><b>{count}</b></button>
          })}
        </nav>
        <div className="quest-journal-list">
          {visibleEntries.length ? visibleEntries.map(({ definition, progress }) => (
            <ArcanePanel key={progress.questId} title={definition.title} eyebrow={`${getQuestStatusLabel(progress.status)} · ${definition.status}`} action={<ScrollText size={20} />} className={`journal-entry journal-entry--${progress.status}`}>
              <div className="journal-entry__heading"><p>{definition.summary}</p>{progress.status !== 'completed' ? <GameButton variant={progress.tracked ? 'primary' : 'ghost'} onClick={() => setTracked(progress.questId, !progress.tracked)}>{progress.tracked ? <RadioTower size={16} /> : <Radio size={16} />}{progress.tracked ? 'Rastreando' : 'Rastrear'}</GameButton> : null}</div>
              <div className="quest-objectives">{definition.objectives.map((objective) => {
                const current = progress.objectives[objective.id] ?? 0
                const done = current >= objective.required
                return <div key={objective.id} className={done ? 'done' : ''}>{done ? <CheckCircle2 size={17} /> : <Circle size={17} />}<span>{objective.label}</span><strong>{current}/{objective.required}</strong></div>
              })}</div>
              {progress.status === 'ready_to_turn_in' ? <div className="quest-next-step"><MapPinned size={19} /><span>PRÓXIMO PASSO<strong>Retorne a {content.npcs[definition.turnInNpcId]?.name ?? definition.turnInNpcId}</strong><small>{definition.terranFlow?.ready_to_turn_in === 'location_terran_clan_hall' ? 'Terran → Salão dos Clãs' : 'Terran → Casa de Eldamar'}</small></span></div> : null}
            </ArcanePanel>
          )) : <div className="journal-empty"><ScrollText size={34} /><strong>Nenhuma missão nesta categoria</strong><p>Ofertas ainda não aceitas não aparecem no Journal.</p></div>}
        </div>
      </div>
    </GameShell>
  )
}
