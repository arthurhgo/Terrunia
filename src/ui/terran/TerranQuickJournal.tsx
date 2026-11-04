import { BookOpen, ChevronLeft, ChevronRight, Diamond, Radio, RadioTower, ScrollText } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { content } from '../../content/catalog'
import type { GameSave } from '../../domain/game/types'
import { getPrioritizedQuestEntries, getQuestStatusLabel, type QuestJournalEntry } from '../../domain/quests/questSelectors'
import { useGameStore } from '../../state/gameStore'
import './terranFixedSidebar.css'

/** A fixed, concise two-card journal. Full quest details remain in Menu > Missões.
 * Pagination (rather than scrolling) keeps the battle/world viewport unobstructed.
 */
export function TerranQuickJournal({ save }: { save: GameSave }) {
  const setTracked = useGameStore((state) => state.setQuestTracked)
  const [mainIndex, setMainIndex] = useState(0)
  const [sideIndex, setSideIndex] = useState(0)
  const entries = getPrioritizedQuestEntries(save, content)
  const ready = entries.filter(({ progress }) => progress.status === 'ready_to_turn_in')
  const main = entries.filter(({ definition }) => definition.category === 'main')
  const side = entries.filter(({ definition }) => definition.category !== 'main')
  const mainEntry = main[mainIndex % Math.max(1, main.length)]
  const sideEntry = side[sideIndex % Math.max(1, side.length)]

  const renderCard = (entry: QuestJournalEntry | undefined, category: 'main' | 'side', count: number, pageIndex: number, setPage: (value: number) => void) => {
    if (!entry) return <p className="terran-quick-journal__empty">
      {category === 'main' ? 'Procure Rosetta para iniciar a jornada.' : 'Nenhuma missão secundária disponível.'}
    </p>
    const { definition, progress } = entry
    const objective = definition.objectives.find((item) =>
      (progress.objectives[item.id] ?? 0) < item.required) ?? definition.objectives.at(-1)
    const current = objective ? Math.min(objective.required, progress.objectives[objective.id] ?? 0) : 0
    const canTrack = progress.status === 'active' || progress.status === 'ready_to_turn_in'
    return <article className={'terran-quick-journal__quest terran-quick-journal__quest--' + category}
      data-quest-id={progress.questId} data-quest-status={progress.status}>
      <div className="terran-quick-journal__meta">
        <span>{category === 'main' ? <ScrollText size={13} /> : <Diamond size={13} />}
          {category === 'main' ? 'PRINCIPAL' : 'SECUNDÁRIAS'}</span>
        {count > 1 && <nav aria-label={'Navegar missões ' + category}>
          <button type="button" aria-label={'Missão anterior ' + category} onClick={() => setPage((pageIndex + count - 1) % count)}><ChevronLeft size={14} /></button>
          <small>{pageIndex % count + 1}/{count}</small>
          <button type="button" aria-label={'Próxima missão ' + category} onClick={() => setPage((pageIndex + 1) % count)}><ChevronRight size={14} /></button>
        </nav>}
      </div>
      <strong title={definition.title}>{definition.title}</strong>
      <small>{getQuestStatusLabel(progress.status)}</small>
      <p title={objective?.label ?? definition.summary}>{progress.status === 'ready_to_turn_in'
        ? 'Pronta para entregar a ' + (content.npcs[definition.turnInNpcId]?.name ?? 'quem concedeu a missão')
        : objective?.label ?? definition.summary}
        {canTrack && objective && progress.status !== 'ready_to_turn_in' && <b> {current}/{objective.required}</b>}
      </p>
      <div className="terran-quick-journal__actions">
        {canTrack && <button type="button" className={progress.tracked ? 'is-tracked' : ''}
          aria-label={(progress.tracked ? 'Remover rastreamento de ' : 'Rastrear ') + definition.title}
          onClick={() => setTracked(progress.questId, !progress.tracked)}>
          {progress.tracked ? <RadioTower size={13} /> : <Radio size={13} />}
          {progress.tracked ? 'Rastreando' : 'Rastrear'}
        </button>}
        {!canTrack && <span>Converse com o NPC para aceitar</span>}
      </div>
    </article>
  }

  return <section className="terran-quick-journal" aria-label="Missões fixas">
    <header><BookOpen size={16} /><h2>MISSÕES</h2><Link to="/quests">Diário completo</Link></header>
    {ready.length > 0 && <section className="terran-quick-journal__deliveries" aria-label="Missões prontas para entrega">
      <h3>PRONTAS PARA ENTREGA <span>{ready.length}</span></h3>
      {ready.map(({ definition, progress }) => <div key={progress.questId} className="terran-quick-journal__delivery">
        <strong title={definition.title}>{definition.title}</strong>
        <small>{content.npcs[definition.turnInNpcId]?.name ?? 'NPC responsável'}</small>
        <button type="button" aria-label={'Rastrear entrega de ' + definition.title}
          onClick={() => setTracked(progress.questId, true)}>{progress.tracked ? '✓ Rastreando' : 'Rastrear entrega'}</button>
      </div>)}
    </section>}
    {renderCard(mainEntry, 'main', main.length, mainIndex, setMainIndex)}
    {renderCard(sideEntry, 'side', side.length, sideIndex, setSideIndex)}
  </section>
}
