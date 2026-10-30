import { BookOpen, CheckCircle2, ClipboardList, Compass, Route } from 'lucide-react'
import { content } from '../../content/catalog'
import type { GameSave } from '../../domain/game/types'
import { getRosettaGuidance } from '../../domain/terran/rosettaGuide'
import { DialogueWindow } from './DialogueWindow'
import { rosettaTutorialQuests } from '../../content/rosettaTutorial'
import { useGameStore } from '../../state/gameStore'
import { AssetImage } from '../components/AssetImage'

/** Rosetta teaches her own lessons; the player explicitly accepts and returns to claim rewards. */
export function RosettaGuide({ save, onClose, onOpenQuests, onOpenInventory, onShowPaths }: {
  save: GameSave
  onClose: () => void
  onOpenQuests: () => void
  onOpenInventory?: () => void
  onShowPaths?: () => void
}) {
  const offer = useGameStore((state) => state.offerQuest)
  const accept = useGameStore((state) => state.acceptQuest)
  const decline = useGameStore((state) => state.declineQuest)
  const complete = useGameStore((state) => state.turnInQuest)
  const guidance = getRosettaGuidance(save, content)
  const lesson = rosettaTutorialQuests.find((quest) => ['available', 'offered', 'active', 'ready_to_turn_in'].includes(save.quests[quest.id]?.status))
  const progress = lesson ? save.quests[lesson.id] : null
  const offered = progress && ['available', 'offered'].includes(progress.status)
  const otherOffers = guidance.available.filter((entry) => !entry.id.startsWith('rosetta_tutorial_'))
  return <DialogueWindow save={save} title="Rosetta" ariaLabel="Orientações de Rosetta" portraitAssetId="npc.rosetta.portrait" eyebrow="GUARDIÃ DO PORTAL"
    lines={content.npcs.npc_rosetta.dialogue} quest={lesson} onClose={onClose}>
    <div className="rosetta-guide__content">
      {lesson && progress ? <section className="rosetta-tutorial" aria-label="Lição de Rosetta">
        <span className="eyebrow">TUTORIAL · LIÇÃO {rosettaTutorialQuests.findIndex((quest) => quest.id === lesson.id) + 1} DE {rosettaTutorialQuests.length}</span>
        <h3>{lesson.title}</h3>
        {lesson.objectives.map((objective) => <p key={objective.id} className="rosetta-tutorial__objective"><CheckCircle2 size={14} /><span>{objective.label}</span><strong>{progress.objectives[objective.id] ?? 0}/{objective.required}</strong></p>)}
        {offered && lesson.acceptanceItems && <div className="rosetta-tutorial__gifts"><small>Você recebe ao aceitar</small>{lesson.acceptanceItems.map((input) => <span key={input.itemId}><AssetImage assetId={content.items[input.itemId].iconAssetId} />{input.quantity}× {content.items[input.itemId].name}</span>)}</div>}
        <small>Ao entregar: {lesson.rewards.map((reward) => `${reward.value} ${reward.type === 'gold' ? 'Ouro' : 'XP'}`).join(' · ')}</small>
        <div className="rosetta-tutorial__actions">
          {offered && <><button type="button" onClick={() => { if (progress.status === 'offered') decline(lesson.id); onClose() }}>Agora não</button>
            <button type="button" className="rosetta-tutorial__accept" onClick={() => { if (progress.status === 'available') offer(lesson.id); accept(lesson.id) }}>Aceitar missão</button></>}
          {progress.status === 'active' && onOpenInventory && lesson.objectives.some((objective) => objective.type === 'equip') && <button type="button" onClick={onOpenInventory}>Abrir mochila</button>}
          {progress.status === 'ready_to_turn_in' && <button type="button" className="rosetta-tutorial__accept" onClick={() => complete(lesson.id, 'npc_rosetta')}>Entregar lição</button>}
        </div>
      </section> : <p className="rosetta-tutorial__done"><CheckCircle2 size={16} /> As quatro lições foram concluídas. Continue explorando Terran e os caminhos do Portal.</p>}
      {onShowPaths && <button type="button" className="rosetta-guide__paths" onClick={onShowPaths}><Route size={16} /> Mostrar caminhos dourados no mapa</button>}
      {guidance.next && guidance.next.id !== lesson?.id && <article className="rosetta-guide__next">
        <h3><Compass size={16}/> O que fazer agora</h3>
          <strong>{guidance.next.title}</strong>
          <p>{guidance.next.instruction}</p>
          <small>Responsável: {guidance.next.npcName} · {guidance.next.locationName}</small>
      </article>}
      <article className="rosetta-guide__missions">
        <h3><ClipboardList size={16}/> Missões que pode receber</h3>
        <small>{guidance.activeCount} missões em andamento · sem limite</small>
        {!otherOffers.length && <p>Nenhuma outra missão está disponível pelos requisitos atuais.</p>}
        {otherOffers.length > 0 && <details><summary>Ver {otherOffers.length} ofertas pela cidade</summary>{otherOffers.map((entry) => <div key={entry.id} className="rosetta-guide__mission">
          <strong>{entry.title}</strong><span>Fale com {entry.npcName} · {entry.locationName}</span>
        </div>)}</details>}
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
