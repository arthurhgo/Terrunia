import { BookOpen, CheckCircle2, Diamond, Radio, RadioTower, ScrollText } from 'lucide-react'
import { Link } from 'react-router-dom'
import { content } from '../../content/catalog'
import type { GameSave } from '../../domain/game/types'
import { getQuestJournalEntries, getQuestStatusLabel, type QuestJournalEntry } from '../../domain/quests/questSelectors'
import { useGameStore } from '../../state/gameStore'
import './terranFixedSidebar.css'

/** Accepted missions only: offers belong to Rosetta and NPCs, not the journal. */
export function TerranQuickJournal({ save }: { save: GameSave }) {
  const setTracked = useGameStore((state) => state.setQuestTracked)
  const entries = getQuestJournalEntries(save, content)
  const active = entries.filter(({ progress }) => progress.status === 'active')
  const ready = entries.filter(({ progress }) => progress.status === 'ready_to_turn_in')
  const completed = entries.filter(({ progress }) => progress.status === 'completed')
  const showIntroduction = ['available', 'offered'].includes(save.quests.rosetta_tutorial_equip?.status ?? 'locked')

  const renderLine = ({ definition, progress }: QuestJournalEntry) => {
    const objective = definition.objectives.find((item) => (progress.objectives[item.id] ?? 0) < item.required)
    const status = getQuestStatusLabel(progress.status)
    return <div className={'terran-quick-journal__line terran-quick-journal__line--' + progress.status}
      key={progress.questId} data-quest-id={progress.questId} data-quest-status={progress.status}>
      <span className="terran-quick-journal__line-content">
        <strong title={definition.title}>{definition.title}</strong>
        <small>{progress.status === 'ready_to_turn_in'
          ? 'Entregar: ' + (content.npcs[definition.turnInNpcId]?.name ?? 'NPC responsável')
          : objective?.label ?? status}</small>
      </span>
      {progress.status === 'completed'
        ? <CheckCircle2 size={15} aria-label="Concluída" />
        : <button type="button" aria-label={(progress.tracked ? 'Remover rastreamento de ' : 'Rastrear ') + definition.title}
          onClick={() => setTracked(progress.questId, !progress.tracked)} title={status}>
          {progress.tracked ? <RadioTower size={15} /> : <Radio size={15} />}
        </button>}
    </div>
  }

  const renderGroup = (id: string, title: string, items: QuestJournalEntry[]) => <section
    className="terran-quick-journal__group" aria-label={title} key={id}>
    <h3>{id === 'main' ? <ScrollText size={13} /> : id === 'side' ? <Diamond size={13} /> : <CheckCircle2 size={13} />}
      {title} <small>{items.length}</small></h3>
    {items.length ? items.map(renderLine) : <div className="terran-quick-journal__line terran-quick-journal__line--empty" aria-disabled="true">
      Nenhuma missão nesta etapa
    </div>}
  </section>

  return <section className="terran-quick-journal" aria-label="Missões fixas">
    <header><BookOpen size={16} /><h2>MISSÕES</h2><Link to="/quests">Diário completo</Link></header>
    {showIntroduction && <div className="terran-quick-journal__intro" role="note" aria-label="Primeiro passo">
      <strong>01 · Falar com Rosetta</strong>
      <small>Praça do Portal · Inicie sua jornada</small>
    </div>}
    {renderGroup('ready', 'Prontas para entrega', ready)}
    {renderGroup('main', 'Principais', active.filter(({ definition }) => definition.category === 'main'))}
    {renderGroup('side', 'Outras missões', active.filter(({ definition }) => definition.category !== 'main'))}
    <details className="terran-quick-journal__history">
      <summary>Concluídas <small>{completed.length}</small></summary>
      {completed.length ? completed.map(renderLine)
        : <div className="terran-quick-journal__line terran-quick-journal__line--empty" aria-disabled="true">Nenhuma missão concluída</div>}
    </details>
  </section>
}
