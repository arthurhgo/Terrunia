import { BookOpen, CheckCircle2, ChevronDown, Circle, Coins, Diamond, Gem, MapPin, Radio, RadioTower, ScrollText, Swords, X } from 'lucide-react'
import { useId, useState } from 'react'
import { content } from '../../content/catalog'
import type { QuestCategory } from '../../content/types'
import type { GameSave } from '../../domain/game/types'
import { getQuestJournalEntries, getQuestJournalGroups, getQuestStatusLabel, type QuestJournalEntry } from '../../domain/quests/questSelectors'
import { useGameStore } from '../../state/gameStore'

type Category = 'all' | QuestCategory | 'completed'
const filters: Array<{ id: Category; label: string }> = [
  { id: 'all', label: 'Todas' }, { id: 'main', label: 'Principal' }, { id: 'secondary', label: 'Secundárias' },
  { id: 'clan', label: 'Clã' }, { id: 'class', label: 'Classe' }, { id: 'bounty', label: 'Caçadas' }, { id: 'completed', label: 'Concluídas' },
]
const categoryLabel: Record<QuestCategory, string> = { main: 'Principal', secondary: 'Secundária', clan: 'Clã', class: 'Classe', bounty: 'Caçada' }
const rewardLabel = (reward: { type: string; value: number }) =>
  reward.value + ' ' + (reward.type === 'gold' ? 'Ouro' : reward.type === 'characterXp' ? 'XP' : 'Essência')

function QuestDetails({ entry, onTrack }: { entry: QuestJournalEntry; onTrack: () => void }) {
  const { definition, progress } = entry
  return <div className="quest-board__details" role="region" aria-label={'Detalhes: ' + definition.title}>
    <p>{definition.summary}</p>
    <h4><BookOpen size={15} /> Objetivos</h4>
    <div className="quest-board__objectives">{definition.objectives.map((objective) => {
      const current = Math.min(objective.required, progress.objectives[objective.id] ?? 0)
      return <div key={objective.id}>
        {current >= objective.required ? <CheckCircle2 size={15} /> : <Circle size={15} />}
        <span>{objective.label}</span><strong>{current}/{objective.required}</strong>
      </div>
    })}</div>
    <h4><Gem size={15} /> Recompensas</h4>
    <div className="quest-board__rewards">{definition.rewards.map((reward, index) =>
      <span key={index}>{reward.type === 'gold' ? <Coins size={15} /> : reward.type === 'characterXp' ? <Swords size={15} /> : <Gem size={15} />}{rewardLabel(reward)}</span>)}</div>
    <p className="quest-board__npc"><MapPin size={15} /> Entrega: {content.npcs[definition.turnInNpcId]?.name ?? definition.turnInNpcId}</p>
    {progress.status !== 'completed' && <button type="button" className="quest-board__track" onClick={onTrack}>
      {progress.tracked ? <RadioTower size={16} /> : <Radio size={16} />}
      {progress.tracked ? 'Remover rastreamento' : 'Rastrear missão'}
    </button>}
  </div>
}

/** One horizontal row per quest. Main story first, secondary quests beneath it, history last. */
export function QuestGrid({ save, compact = false }: { save: GameSave; compact?: boolean }) {
  const setTracked = useGameStore((state) => state.setQuestTracked)
  const [category, setCategory] = useState<Category>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [completedExpanded, setCompletedExpanded] = useState(false)
  const historyId = useId()
  const entries = getQuestJournalEntries(save, content)
  const filtered = entries.filter(({ definition, progress }) =>
    category === 'all' || (category === 'completed' ? progress.status === 'completed' :
      progress.status !== 'completed' && definition.category === category))
  const groups = getQuestJournalGroups(filtered)
  return <section className={'quest-board quest-board--rows' + (compact ? ' quest-board--compact' : '')} aria-label="Diário de missões">
    <div className="quest-board__filters" role="group" aria-label="Filtrar missões">
      {filters.map((filter) => {
        const count = filter.id === 'all' ? entries.length : entries.filter(({ definition, progress }) =>
          filter.id === 'completed' ? progress.status === 'completed' :
            definition.category === filter.id && progress.status !== 'completed').length
        if (compact && count === 0 && filter.id !== 'all') return null
        return <button type="button" key={filter.id} aria-pressed={category === filter.id}
          className={category === filter.id ? 'active' : ''} onClick={() => { setCategory(filter.id); setSelectedId(null) }}>
          {filter.label} <small>{count}</small>
        </button>
      })}
    </div>
    {groups.length ? <div className="quest-board__rows">
      {groups.map((group) => <section key={group.id} className={'quest-journal-group quest-journal-group--' + group.id} aria-label={group.label}>
        {group.id === 'completed' ? <h3><button type="button" className="quest-history-toggle" aria-expanded={completedExpanded} aria-controls={historyId}
          aria-label={`${completedExpanded ? 'Recolher' : 'Expandir'} missões concluídas (${group.entries.length})`}
          onClick={() => setCompletedExpanded((expanded) => !expanded)}><CheckCircle2 size={16} /> Concluídas <small>{group.entries.length}</small><ChevronDown size={16} /></button></h3>
          : <h3>{group.label}<small>{group.entries.length}</small></h3>}
        <div id={group.id === 'completed' ? historyId : undefined} hidden={group.id === 'completed' && !completedExpanded} className="quest-board__grid">{(group.id !== 'completed' || completedExpanded) && group.entries.map((entry) => {
          const { definition, progress } = entry
          const selected = selectedId === progress.questId
          const total = definition.objectives.reduce((sum, objective) => sum + objective.required, 0)
          const done = definition.objectives.reduce((sum, objective) => sum + Math.min(objective.required, progress.objectives[objective.id] ?? 0), 0)
          return <div className="quest-row" key={progress.questId}>
            <button type="button" className={'quest-tile quest-tile--' + definition.category + (selected ? ' is-selected' : '')}
              data-quest-status={progress.status} aria-label={'Detalhes da missão ' + definition.title} aria-expanded={selected}
              onClick={() => setSelectedId(selected ? null : progress.questId)}>
              <span className="quest-row__icon" aria-hidden="true">{definition.category === 'secondary' || definition.category === 'bounty' ? <Diamond size={21} /> : <ScrollText size={21} />}</span>
              <span className="quest-row__body">
                <small className="quest-row__category">{categoryLabel[definition.category]}</small>
                <strong>{definition.title}</strong>
                <span className="quest-tile__status">{getQuestStatusLabel(progress.status)}</span>
                <span className="quest-tile__progress"><span style={{ width: (total ? done / total * 100 : 100) + '%' }} /></span>
              </span>
              <span className="quest-row__meta"><strong>{done}/{total}</strong><small>{definition.rewards.map(rewardLabel).join(' · ')}</small><ChevronDown size={16} /></span>
            </button>
            {selected && <QuestDetails entry={entry} onTrack={() => setTracked(progress.questId, !progress.tracked)} />}
          </div>
        })}</div>
      </section>)}
    </div> : <div className="quest-board__empty"><X size={22} /> Nenhuma missão nesta categoria. Aceite as ofertas com os NPCs.</div>}
  </section>
}
