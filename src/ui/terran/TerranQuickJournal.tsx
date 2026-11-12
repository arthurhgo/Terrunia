import { BookOpen, CheckCircle2, Diamond, Radio, RadioTower, ScrollText } from 'lucide-react'
import { Link } from 'react-router-dom'
import { content } from '../../content/catalog'
import type { GameSave } from '../../domain/game/types'
import { getQuestJournalEntries, getQuestStatusLabel, type QuestJournalEntry } from '../../domain/quests/questSelectors'
import { useGameStore } from '../../state/gameStore'
import { ExpeditionReportV0516 } from '../quests/ExpeditionReportV0516'
import { getNarrativeLeadV0516, getChapterContinuationV0516, getFungalChambersClanNoticeV0516, getAstravelChapterCountV0516 } from '../../domain/quests/questFlowV0516'
import { ASTRAVEL_QUEST_CHAPTERS_V0516, currentQuestChapterV0516, isQuestInCurrentChapterV0516 } from '../../domain/quests/questPacingV0516'
import './terranFixedSidebar.css'

/** Accepted missions only: offers belong to Rosetta and NPCs, not the journal. */
export function TerranQuickJournal({ save }: { save: GameSave }) {
  const setTracked = useGameStore((state) => state.setQuestTracked)
  const entries = getQuestJournalEntries(save, content)
  const active = entries.filter(({ progress }) => progress.status === 'active')
  const ready = entries.filter(({ progress }) => progress.status === 'ready_to_turn_in')
  const completed = entries.filter(({ progress }) => progress.status === 'completed')
  const showIntroduction = ['available', 'offered'].includes(save.quests.rosetta_tutorial_equip?.status ?? 'locked')
  const chapter = currentQuestChapterV0516(save)
  const chapterInfo = ASTRAVEL_QUEST_CHAPTERS_V0516[chapter]
  const nextLead = getNarrativeLeadV0516(save, content)
  const continuation = getChapterContinuationV0516(save)
  const clanGateNotice = getFungalChambersClanNoticeV0516(save)
  const chapterProgress = getAstravelChapterCountV0516(save, content)
  const secondaryActive = active.filter(({ definition }) => definition.category !== 'main')
  const stageMatches = secondaryActive.filter(({ definition }) => isQuestInCurrentChapterV0516(save, definition))
  // Focus is a presentation limit only. Never remove, expire or change an accepted quest.
  const featuredSide = (stageMatches.length ? stageMatches : secondaryActive).slice(0, 3)
  const featuredIds = new Set(featuredSide.map(({ progress }) => progress.questId))
  const otherSide = secondaryActive.filter(({ progress }) => !featuredIds.has(progress.questId))
  const visibleReady = ready.slice(0, 3)
  const otherReady = ready.slice(3)

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
    <div className="terran-quick-journal__intro" role="note" aria-label="Etapa da expedição">
      <strong>{chapter === 'aftermath' ? 'Astravél · Arco concluído' : 'Astravél · ' + chapterInfo.label}</strong>
      <small>{chapter === 'aftermath'
        ? 'Contratos extras opcionais; consulte o Diário para o histórico completo.'
        : 'Trilha ' + chapterInfo.from + '–' + chapterInfo.to + ' · ' + chapterProgress.cleared + '/' + chapterProgress.total + ' marcos concluídos.'}</small>
    </div>
    {clanGateNotice && <div className="terran-quick-journal__intro" role="note" aria-label="Preparação para as Câmaras Fúngicas"><strong>Preparação para o marco 15</strong><small>{clanGateNotice}</small></div>}
    {continuation && <div className="terran-quick-journal__intro" role="note" aria-label="Jornada contínua"><strong>Continue a expedição</strong><small>{continuation}</small></div>}
    {nextLead && <div className="terran-quick-journal__intro" role="note" aria-label="Próximo capítulo de Astravél">
      <strong>Próximo contato · {nextLead.npcName}</strong>
      <small>{nextLead.message}</small>
    </div>}
    <ExpeditionReportV0516 save={save} />
    {renderGroup('ready', 'Prontas para entrega', visibleReady)}
    {otherReady.length > 0 && <details className="terran-quick-journal__history" aria-label="Mais entregas prontas">
      <summary>Mais entregas prontas <small>{otherReady.length}</small></summary>
      {otherReady.map(renderLine)}
    </details>}
    {renderGroup('main', 'Principais', active.filter(({ definition }) => definition.category === 'main'))}
    {renderGroup('side', 'Secundárias da etapa', featuredSide)}
    {otherSide.length > 0 && <details className="terran-quick-journal__history" aria-label="Outras missões aceitas">
      <summary>Outras missões ativas <small>{otherSide.length}</small></summary>
      {otherSide.map(renderLine)}
    </details>}
    <details className="terran-quick-journal__history">
      <summary>Concluídas <small>{completed.length}</small></summary>
      {completed.length ? completed.map(renderLine)
        : <div className="terran-quick-journal__line terran-quick-journal__line--empty" aria-disabled="true">Nenhuma missão concluída</div>}
    </details>
  </section>
}
