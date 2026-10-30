import { BookOpen, CircleHelp, ClipboardList, Compass, X } from 'lucide-react'
import { content } from '../../content/catalog'
import type { GameSave } from '../../domain/game/types'
import { getRosettaGuidance } from '../../domain/terran/rosettaGuide'
import { AssetImage } from '../components/AssetImage'

/** Tutorial NPC. Never accepts missions or modifies the save: quest givers retain authority. */
export function RosettaGuide({ save, onClose, onOpenQuests }: {
  save: GameSave
  onClose: () => void
  onOpenQuests: () => void
}) {
  const guidance = getRosettaGuidance(save, content)
  return <section className="rosetta-guide" role="dialog" aria-modal="true" aria-label="Orientações de Rosetta">
    <header className="rosetta-guide__header">
      <div className="rosetta-guide__portrait">
        <AssetImage assetId="npc.rosetta.portrait" alt="Rosetta, Guardiã do Portal" />
      </div>
      <div>
        <span className="eyebrow">GUARDIÃ DO PORTAL · ORIENTAÇÃO</span>
        <h2>Rosetta <CircleHelp size={18} aria-hidden="true" /></h2>
        <p>Bem-vindo a Terran, aventureiro. Vou ajudá-lo a reconhecer seu próximo passo.</p>
      </div>
      <button type="button" className="rosetta-guide__close" aria-label="Encerrar conversa com Rosetta" onClick={onClose}><X size={19}/></button>
    </header>
    <div className="rosetta-guide__content">
      <article className="rosetta-guide__next">
        <h3><Compass size={16}/> O que fazer agora</h3>
        {guidance.next ? <>
          <strong>{guidance.next.title}</strong>
          <p>{guidance.next.instruction}</p>
          <small>Responsável: {guidance.next.npcName} · {guidance.next.locationName}</small>
        </> : <p>Não há uma nova missão disponível neste momento. Explore Terran e consulte seus registros.</p>}
      </article>
      <article className="rosetta-guide__missions">
        <h3><ClipboardList size={16}/> Missões que pode receber</h3>
        <small>{guidance.activeCount}/{guidance.maxActive} espaços de missão ocupados</small>
        {!guidance.canReceive && <p>Seu diário está cheio. Conclua ou entregue uma missão antes de aceitar outra.</p>}
        {guidance.canReceive && !guidance.available.length && <p>Nenhuma nova missão está disponível pelos requisitos atuais.</p>}
        {guidance.canReceive && guidance.available.slice(0, 4).map((entry) => <div key={entry.id} className="rosetta-guide__mission">
          <strong>{entry.title}</strong><span>Fale com {entry.npcName} · {entry.locationName}</span>
        </div>)}
        {guidance.canReceive && guidance.available.length > 4 && <small>+{guidance.available.length - 4} ofertas no diário de missões.</small>}
        <button type="button" onClick={onOpenQuests}>Consultar diário de missões</button>
      </article>
      <article className="rosetta-guide__library">
        <h3><BookOpen size={16}/> Biblioteca de Eldamar</h3>
        <p>Na Biblioteca de Eldamar, procure a <strong>Estante dos Registros</strong>. Ela contém o Guia do Viajante, o Arsenal Visual e informações sobre os Vínculos.</p>
        <small>Encontre Eldamar e a estante no edifício de registros de Terran.</small>
      </article>
    </div>
  </section>
}
