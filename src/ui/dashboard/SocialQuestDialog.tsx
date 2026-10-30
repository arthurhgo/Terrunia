import { BookOpenCheck, CheckCheck, Circle, ShieldCheck, X } from 'lucide-react'
import { content } from '../../content/catalog'
import type { GameSave } from '../../domain/game/types'
import { resolveQuestDefinition } from '../../domain/quests/questSelectors'
import { useGameStore } from '../../state/gameStore'
import { GameButton } from '../components/GameButton'
import { DialogueWindow } from '../terran/DialogueWindow'

type Props = {
  questId: string | null
  save: GameSave
  onClose: () => void
}

export function SocialQuestDialog({ questId, save, onClose }: Props) {
  const offerQuest = useGameStore((state) => state.offerQuest)
  const declineQuest = useGameStore((state) => state.declineQuest)
  const acceptQuest = useGameStore((state) => state.acceptQuest)
  const performTrial = useGameStore((state) => state.performSocialTrial)
  const turnInQuest = useGameStore((state) => state.turnInQuest)
  const baseDefinition = questId ? content.quests[questId] : null
  const definition = baseDefinition ? resolveQuestDefinition(save, baseDefinition) : null
  const progress = questId ? save.quests[questId] : null
  if (!definition || !progress) return null

  const npc = content.npcs[definition.giverNpcId]
  const openOffer = () => offerQuest(definition.id)
  const decline = () => { declineQuest(definition.id); onClose() }
  const accept = () => acceptQuest(definition.id)
  const complete = () => { turnInQuest(definition.id, definition.turnInNpcId); onClose() }

  return (
    <DialogueWindow save={save} portraitAssetId={npc.portraitAssetId} lines={npc.dialogue} quest={definition} open onClose={onClose} eyebrow={`${definition.category === 'clan' ? 'RECRUTAMENTO DE CLÃ' : definition.category === 'class' ? 'PROVA DE CLASSE' : 'MAIN LORE ADAPTADA'}`} title={npc?.name ?? 'Representante'} className="social-quest-modal" footer={
      progress.status === 'available'
        ? <GameButton variant="primary" onClick={openOffer}><BookOpenCheck size={17} /> Conhecer a prova</GameButton>
        : progress.status === 'offered'
          ? <div className="quest-offer-actions"><GameButton variant="ghost" onClick={decline}><X size={17} /> Ainda não</GameButton><GameButton variant="primary" onClick={accept}><BookOpenCheck size={17} /> Aceitar prova</GameButton></div>
          : progress.status === 'active'
            ? <GameButton variant="primary" onClick={() => performTrial(definition.id)}><ShieldCheck size={17} /> Realizar prova</GameButton>
            : progress.status === 'ready_to_turn_in'
              ? <GameButton variant="primary" onClick={complete}><CheckCheck size={17} /> Concluir prova</GameButton>
              : <GameButton variant="ghost" onClick={onClose}>Encerrar conversa</GameButton>
    }>
      <div className="social-quest-detail">
        <h3>{definition.title}</h3>
        <div className="quest-offer__objectives">
          {definition.objectives.map((objective) => <span key={objective.id}><Circle size={13} />{objective.label}<strong>{progress.objectives[objective.id] ?? 0}/{objective.required}</strong></span>)}
        </div>
      </div>
    </DialogueWindow>
  )
}
