import { BookOpenCheck, ScrollText } from 'lucide-react'
import { useEffect } from 'react'
import { content } from '../../content/catalog'
import type { GameSave } from '../../domain/game/types'
import { useGameStore } from '../../state/gameStore'
import { AssetImage } from '../components/AssetImage'
import { GameButton } from '../components/GameButton'
import { Modal } from '../components/Modal'

export function NpcDialog({ open, onClose, save }: { open: boolean; onClose: () => void; save: GameSave }) {
  const discover = useGameStore((state) => state.discoverEldamar)
  const acceptQuest = useGameStore((state) => state.acceptQuest)
  const npc = content.npcs.npc_eldamar
  const quest = content.quests.vs_astravel_first_contact
  const progress = save.quests[quest.id]

  useEffect(() => {
    if (open && !save.relationships.npc_eldamar.discovered) discover()
  }, [discover, open, save.relationships.npc_eldamar.discovered])

  const accept = () => {
    acceptQuest(quest.id)
    onClose()
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      eyebrow="TERRAN · ARQUIVO DOS REGISTROS"
      title={`${npc.name}, ${npc.title}`}
      className="npc-modal"
      footer={
        progress.status === 'available' ? (
          <GameButton variant="primary" onClick={accept}><BookOpenCheck size={17} /> Aceitar missão</GameButton>
        ) : (
          <GameButton variant="ghost" onClick={onClose}>Encerrar conversa</GameButton>
        )
      }
    >
      <div className="npc-dialogue">
        <AssetImage assetId={npc.portraitAssetId} />
        <div className="dialogue-lines">
          {npc.dialogue.map((line) => <p key={line}>“{line}”</p>)}
        </div>
      </div>
      <div className="quest-offer">
        <ScrollText size={21} />
        <div><p className="eyebrow">MISSÃO DE VERTICAL SLICE · {quest.status}</p><h3>{quest.title}</h3><p>{quest.summary}</p></div>
      </div>
    </Modal>
  )
}
