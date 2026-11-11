import { Archive, BookOpen, CheckCircle2, Compass, Package, Route } from 'lucide-react'
import { content } from '../../content/catalog'
import type { GameSave } from '../../domain/game/types'
import { getExpeditionReportV0516 } from '../../domain/quests/questFlowV0516'
import { useGameStore } from '../../state/gameStore'
import './expeditionReportV0516.css'

/** Report is a read-only, expandable summary of actual save facts. Only the
 * deliberate tracking button changes the chosen visual destination. NPCs are
 * still responsible for acceptances, hand-ins and rewards. */
export function ExpeditionReportV0516({ save }: { save: GameSave }) {
  const setTracked = useGameStore(state => state.setQuestTracked)
  const report = getExpeditionReportV0516(save, content)
  return <details className="expedition-report-v0516" aria-label="Relatório de expedição">
    <summary><BookOpen size={15} aria-hidden="true" /> Relatório de expedição
      <small>{report.completedEncounters}/{report.totalEncounters} marcos</small></summary>
    <section aria-label="Resultados da expedição" className="expedition-report-v0516__body">
      <p><Compass size={14} aria-hidden="true" /> {report.chapterName} · {report.completedEncounters} encontros registrados</p>
      {report.lead && <p className="expedition-report-v0516__lead">
        <Route size={14} aria-hidden="true" /> {report.lead.message}
      </p>}
      {report.deliveries.length > 0 && <section aria-label="Entregas pendentes">
        <strong>Entregas aguardando NPC · {report.deliveries.length}</strong>
        {report.deliveries.map(quest => <div className="expedition-report-v0516__row" key={quest.questId}>
          <span><CheckCircle2 size={13} aria-hidden="true" /> {quest.title}
            <small>Entregar pessoalmente: {quest.npcName}</small></span>
          <button type="button" onClick={() => setTracked(quest.questId, true)}
            disabled={Boolean(save.quests[quest.questId]?.tracked)}
            aria-label={'Rastrear entrega de ' + quest.title}>
            {save.quests[quest.questId]?.tracked ? 'Rastreada' : 'Rastrear'}
          </button>
        </div>)}
      </section>}
      <details className="expedition-report-v0516__subsection">
        <summary><Archive size={13} aria-hidden="true" /> Vestígios examináveis · {report.discoveries.length}</summary>
        {report.discoveries.length ? report.discoveries.map(record => <p key={record.nodeId}>
          <strong>{record.title}</strong> — {record.description}
        </p>) : <p>As descobertas aparecerão após vitórias nos marcos correspondentes.</p>}
      </details>
      <details className="expedition-report-v0516__subsection">
        <summary><Package size={13} aria-hidden="true" /> Materiais na mochila · {report.materials.reduce((total, entry) => total + entry.quantity, 0)}</summary>
        <p>Saldo atual, não histórico de drops: itens vendidos, consumidos ou guardados no baú não aparecem aqui.</p>
        {report.materials.length ? <ul>{report.materials.map(item =>
          <li key={item.id}>{item.name} ×{item.quantity}</li>)}</ul>
          : <p>Sem materiais temporários na mochila.</p>}
      </details>
      {report.deliveries.length === 0 && <small>Nenhuma missão pronta para entrega neste momento.</small>}
    </section>
  </details>
}
