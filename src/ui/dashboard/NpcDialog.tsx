import { BookOpenCheck, CheckCheck, Circle, ScrollText, X } from 'lucide-react'
import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { content } from '../../content/catalog'
import { getQuestStatusLabel } from '../../domain/quests/questSelectors'
import { getActiveQuestCount, MAX_ACTIVE_QUESTS } from '../../domain/quests/questEngine'
import type { GameSave } from '../../domain/game/types'
import { useGameStore } from '../../state/gameStore'
import { AssetImage } from '../components/AssetImage'
import { GameButton } from '../components/GameButton'
import { Modal } from '../components/Modal'

export function NpcDialog({ open, onClose, save }: { open: boolean; onClose: () => void; save: GameSave }) {
  const discover = useGameStore((state) => state.discoverEldamar)
  const offerQuest = useGameStore((state) => state.offerQuest)
  const declineQuest = useGameStore((state) => state.declineQuest)
  const acceptQuest = useGameStore((state) => state.acceptQuest)
  const turnInQuest = useGameStore((state) => state.turnInQuest)
  const npc = content.npcs.npc_eldamar
  const quest = content.quests.vs_astravel_first_contact
  const progress = save.quests[quest.id]

  useEffect(() => {
    if (!open) return
    if (!save.relationships.npc_eldamar.discovered) discover()
    if (progress.status === 'available') offerQuest(quest.id)
  }, [discover, offerQuest, open, progress.status, quest.id, save.relationships.npc_eldamar.discovered])

  const accept = () => { acceptQuest(quest.id); onClose() }
  const decline = () => { declineQuest(quest.id); onClose() }
  const complete = () => { turnInQuest(quest.id, npc.id); onClose() }
  const offered = ['available', 'offered'].includes(progress.status)
  const questLimitReached = getActiveQuestCount(save) >= MAX_ACTIVE_QUESTS

  return (
    <Modal open={open} onClose={onClose} eyebrow="TERRAN · ARQUIVO DOS REGISTROS" title={`${npc.name}, ${npc.title}`} className="npc-modal" footer={
      offered ? <div className="quest-offer-actions"><GameButton variant="ghost" onClick={decline}><X size={17} /> Agora não</GameButton><GameButton variant="primary" onClick={accept} disabled={questLimitReached}><BookOpenCheck size={17} /> Aceitar missão</GameButton></div>
        : progress.status === 'ready_to_turn_in' ? <GameButton variant="primary" onClick={complete}><CheckCheck size={17} /> Concluir missão</GameButton>
          : <GameButton variant="ghost" onClick={onClose}>Encerrar conversa</GameButton>
    }>
      <div className="npc-dialogue"><AssetImage assetId={npc.portraitAssetId} /><div className="dialogue-lines">{npc.dialogue.map((line) => <p key={line}>“{line}”</p>)}</div></div>
      {offered ? <div className="quest-offer quest-offer--detailed"><ScrollText size={25} /><div><p className="eyebrow">OFERTA DE MISSÃO · {getQuestStatusLabel(progress.status)}</p><h3>{quest.title}</h3><p>{quest.summary}</p><div className="quest-offer__objectives">{quest.objectives.map((objective) => <span key={objective.id}><Circle size={13} />{objective.label}<strong>0/{objective.required}</strong></span>)}</div><div className="quest-offer__rewards"><small>RECOMPENSAS</small>{quest.rewards.map((reward) => <strong key={reward.type}>{reward.type}: +{reward.value}</strong>)}</div></div></div> : null}
      {offered && questLimitReached ? <div className="quest-limit-alert"><strong>LIMITE DE MISSÕES ATINGIDO</strong><span>Você já possui {MAX_ACTIVE_QUESTS} missões em andamento. Conclua uma antes de aceitar outra.</span><Link className="game-button game-button--ghost" to="/quests" onClick={onClose}>Ver missões</Link></div> : null}
      {progress.status === 'ready_to_turn_in' ? <div className="quest-offer quest-offer--ready"><CheckCheck size={25} /><div><p className="eyebrow">OBJETIVOS CONCLUÍDOS</p><h3>{quest.title}</h3><p>O registro está pronto para entrega. As recompensas só serão aplicadas ao concluir a missão.</p></div></div> : null}
    </Modal>
  )
}
