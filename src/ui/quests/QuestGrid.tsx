import { BookOpen, CheckCircle2, Circle, Coins, Diamond, Gem, MapPin, Radio, RadioTower, ScrollText, Swords, X } from 'lucide-react'
import { useState } from 'react'
import { content } from '../../content/catalog'
import type { QuestCategory } from '../../content/types'
import type { GameSave } from '../../domain/game/types'
import { getQuestJournalEntries, getQuestStatusLabel } from '../../domain/quests/questSelectors'
import { useGameStore } from '../../state/gameStore'

type Category = 'all' | QuestCategory | 'completed'
const filters: Array<{ id: Category; label: string }> = [
  { id: 'all', label: 'Todas' },
  { id: 'main', label: 'Principal' },
  { id: 'secondary', label: 'Secundária' },
  { id: 'clan', label: 'Clã' },
  { id: 'class', label: 'Classe' },
  { id: 'bounty', label: 'Caçada' },
  { id: 'completed', label: 'Concluídas' },
]
const categoryLabel: Record<QuestCategory, string> = {
  main: 'Principal', secondary: 'Secundária', clan: 'Clã', class: 'Classe', bounty: 'Caçada',
}
const rewardLabel = (reward: { type: string; value: number }) =>
  `${reward.value} ${reward.type === 'gold' ? 'Ouro' : reward.type === 'characterXp' ? 'XP' : 'Essência'}`

/** Compact mission cards with details on hover, focus or touch selection. Data comes from the current save. */
export function QuestGrid({ save, compact = false }: { save: GameSave; compact?: boolean }) {
  const setTracked = useGameStore((state) => state.setQuestTracked)
  const [category, setCategory] = useState<Category>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const entries = getQuestJournalEntries(save, content)
  const filtered = entries.filter(({ definition, progress }) =>
    category === 'all' || (category === 'completed' ? progress.status === 'completed' :
      progress.status !== 'completed' && definition.category === category))
  const selected = filtered.find(({ progress }) => progress.questId === selectedId) ?? filtered[0]
  return <section className={`quest-board ${compact ? 'quest-board--compact' : ''}`} aria-label="Registro de missões em grid">
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
    {filtered.length ? <div className="quest-board__layout">
      <div className="quest-board__grid">
        {filtered.map(({ definition, progress }) => {
          const total = definition.objectives.reduce((sum, o) => sum + o.required, 0)
          const done = definition.objectives.reduce((sum, o) => sum + Math.min(o.required, progress.objectives[o.id] ?? 0), 0)
          return <button type="button" key={progress.questId}
            className={`quest-tile quest-tile--${definition.category} ${selected?.progress.questId === progress.questId ? 'is-selected' : ''}`}
            aria-label={`Detalhes da missão ${definition.title}`}
            aria-pressed={selected?.progress.questId === progress.questId}
            onMouseEnter={() => setSelectedId(progress.questId)}
            onFocus={() => setSelectedId(progress.questId)}
            onClick={() => setSelectedId(progress.questId)}>
            <span className="quest-tile__category">{definition.category === 'secondary' || definition.category === 'bounty' ? <Diamond size={13} /> : <ScrollText size={13} />} {categoryLabel[definition.category]}</span>
            <strong>{definition.title}</strong>
            <span className="quest-tile__status">{getQuestStatusLabel(progress.status)}</span>
            <span className="quest-tile__excerpt">{definition.summary}</span>
            <span className="quest-tile__progress"><span style={{ width: `${total ? done / total * 100 : 100}%` }} /></span>
            <span className="quest-tile__footer"><span><Gem size={13} /> {definition.rewards.map(rewardLabel).join(' · ') || 'Sem recompensa'}</span><b>{done}/{total}</b></span>
          </button>
        })}
      </div>
      {selected && <aside className="quest-board__details" aria-label={`Detalhes: ${selected.definition.title}`}>
        <header>
          <small>{categoryLabel[selected.definition.category]} · {getQuestStatusLabel(selected.progress.status)}</small>
          <h3>{selected.definition.title}</h3>
          <p>{selected.definition.summary}</p>
        </header>
        <h4><BookOpen size={15} /> Objetivos</h4>
        <div className="quest-board__objectives">{selected.definition.objectives.map((objective) => {
          const current = Math.min(objective.required, selected.progress.objectives[objective.id] ?? 0)
          return <div key={objective.id}>
            {current >= objective.required ? <CheckCircle2 size={15} /> : <Circle size={15} />}
            <span>{objective.label}</span><strong>{current}/{objective.required}</strong>
          </div>
        })}</div>
        <h4><Gem size={15} /> Recompensas</h4>
        <div className="quest-board__rewards">{selected.definition.rewards.map((reward, index) =>
          <span key={index}>{reward.type === 'gold' ? <Coins size={15} /> : reward.type === 'characterXp' ? <Swords size={15} /> : <Gem size={15} />}{rewardLabel(reward)}</span>)}</div>
        <p className="quest-board__npc"><MapPin size={15} /> NPC: {content.npcs[selected.definition.turnInNpcId]?.name ?? selected.definition.turnInNpcId}</p>
        {selected.progress.status !== 'completed' && <button type="button" className="quest-board__track"
          onClick={() => setTracked(selected.progress.questId, !selected.progress.tracked)}>
          {selected.progress.tracked ? <RadioTower size={16} /> : <Radio size={16} />}
          {selected.progress.tracked ? 'Remover rastreamento' : 'Rastrear missão'}
        </button>}
      </aside>}
    </div> : <div className="quest-board__empty"><X size={22} /> Nenhuma missão nesta categoria. As ofertas precisam ser aceitas com os NPCs.</div>}
  </section>
}
