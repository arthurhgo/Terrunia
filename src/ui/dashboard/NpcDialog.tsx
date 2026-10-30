import { BookOpenCheck, CheckCheck, Circle, ScrollText, X } from 'lucide-react'
import { useEffect } from 'react'
import { content } from '../../content/catalog'
import { getQuestStatusLabel } from '../../domain/quests/questSelectors'
import type { GameSave } from '../../domain/game/types'
import { useGameStore } from '../../state/gameStore'
import { GameButton } from '../components/GameButton'
import { DialogueWindow } from '../terran/DialogueWindow'

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

  return (
    <DialogueWindow save={save} portraitAssetId={npc.portraitAssetId} lines={npc.dialogue} quest={quest} open={open} onClose={onClose} eyebrow={npc.title} title={npc.name} className="npc-modal" footer={
      offered ? <div className="quest-offer-actions"><GameButton variant="ghost" onClick={decline}><X size={17} /> Agora não</GameButton><GameButton variant="primary" onClick={accept}><BookOpenCheck size={17} /> Aceitar missão</GameButton></div>
        : progress.status === 'ready_to_turn_in' ? <GameButton variant="primary" onClick={complete}><CheckCheck size={17} /> Concluir missão</GameButton>
          : <GameButton variant="ghost" onClick={onClose}>Encerrar conversa</GameButton>
    }>
      {offered ? <div className="quest-offer quest-offer--detailed"><ScrollText size={25} /><div><p className="eyebrow">OFERTA DE MISSÃO · {getQuestStatusLabel(progress.status)}</p><h3>{quest.title}</h3><div className="quest-offer__objectives">{quest.objectives.map((objective) => <span key={objective.id}><Circle size={13} />{objective.label}<strong>0/{objective.required}</strong></span>)}</div><div className="quest-offer__rewards"><small>RECOMPENSAS</small>{quest.rewards.map((reward) => <strong key={reward.type}>{reward.type}: +{reward.value}</strong>)}</div></div></div> : null}
      {progress.status === 'ready_to_turn_in' ? <div className="quest-offer quest-offer--ready"><CheckCheck size={25} /><div><p className="eyebrow">OBJETIVOS CONCLUÍDOS</p><h3>{quest.title}</h3></div></div> : null}
    </DialogueWindow>
  )
}
