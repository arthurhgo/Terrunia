import { BookOpen, ClipboardList, Compass } from 'lucide-react'
import { content } from '../../content/catalog'
import type { GameSave } from '../../domain/game/types'
import { getRosettaGuidance } from '../../domain/terran/rosettaGuide'
import { DialogueWindow } from './DialogueWindow'

/** Tutorial NPC. Never accepts missions or modifies the save: quest givers retain authority. */
export function RosettaGuide({ save, onClose, onOpenQuests }: {
  save: GameSave
  onClose: () => void
  onOpenQuests: () => void
}) {
  const guidance = getRosettaGuidance(save, content)
  return <DialogueWindow save={save} title="Rosetta" ariaLabel="Orientações de Rosetta" portraitAssetId="npc.rosetta.portrait" eyebrow="GUARDIÃ DO PORTAL"
    lines={content.npcs.npc_rosetta.dialogue} onClose={onClose}>
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
        <small>{guidance.activeCount} missões em andamento · sem limite</small>
        {guidance.canReceive && !guidance.available.length && <p>Nenhuma nova missão está disponível pelos requisitos atuais.</p>}
        {guidance.canReceive && guidance.available.map((entry) => <div key={entry.id} className="rosetta-guide__mission">
          <strong>{entry.title}</strong><span>Fale com {entry.npcName} · {entry.locationName}</span>
        </div>)}
        <button type="button" onClick={onOpenQuests}>Consultar diário de missões</button>
      </article>
      <article className="rosetta-guide__library">
        <h3><BookOpen size={16}/> Biblioteca de Eldamar</h3>
        <p>Na Biblioteca de Eldamar, procure a <strong>Estante dos Registros</strong>. Ela contém o Guia do Viajante, o Arsenal Visual e informações sobre os Vínculos.</p>
        <small>Entre na Casa de Eldamar em Terran: a estante fica no interior da biblioteca.</small>
      </article>
    </div>
  </DialogueWindow>
}
