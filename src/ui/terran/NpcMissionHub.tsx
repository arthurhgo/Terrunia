import { useEffect, useRef, useState } from 'react'
import { BookOpen, MessageCircle, Wrench } from 'lucide-react'
import { content } from '../../content/catalog'
import type { TerranLocationDefinition } from '../../content/types'
import { getPresencePortrait } from '../../content/npcVisuals'
import { getTerranDialogue } from '../../domain/terran/cityDialogue'
import { getNpcActionableQuests, getQuestStatusLabel } from '../../domain/quests/questSelectors'
import type { GameSave } from '../../domain/game/types'
import { npcQuestActiveBriefs, npcQuestBriefs } from '../../content/npcConversations'
import { AssetImage } from '../components/AssetImage'
import { DialogueWindow } from './DialogueWindow'
import { QuestNpcPanel } from './TerranServices'
import './npcMissionHub.css'

type Presence = TerranLocationDefinition['npcPresences'][number]

/** One NPC, one dialog. Actionable missions are the landing section; conversation
 * and available services live in the same compact topic list, not duplicate buttons.
 */
export function NpcMissionHub({ save, presence, initialQuestId, onClose, onServices }: {
  save: GameSave
  presence: Presence
  initialQuestId: string
  onClose: () => void
  onServices?: () => void
}) {
  const quests = presence.npcId ? getNpcActionableQuests(save, presence.npcId, content) : []
  const [topic, setTopic] = useState<string>(initialQuestId)
  const previousStatuses = useRef<Record<string, string>>({})
  // Accepted missions move to the end; offer the next available quest in the same dialogue.
  useEffect(() => {
    const oldStatus = previousStatuses.current[topic]
    const newStatus = save.quests[topic]?.status
    if ((oldStatus === 'available' || oldStatus === 'offered') && newStatus === 'active') {
      const next = quests.find((quest) => ['available', 'offered'].includes(save.quests[quest.id]?.status ?? ''))
      if (next) setTopic(next.id)
    }
    previousStatuses.current = Object.fromEntries(quests.map((quest) => [quest.id, save.quests[quest.id]?.status ?? 'locked']))
  }, [save.revision, topic, presence.npcId])
  const selected = quests.find((q) => q.id === topic) ?? quests[0]
  const talking = topic === 'talk'
  const portrait = getPresencePortrait(presence)
  const script = getTerranDialogue(save, presence)
  const progress = selected ? save.quests[selected.id] : null
  const message = selected ? progress?.status === 'active'
    ? npcQuestActiveBriefs[selected.id] ?? selected.summary
    : npcQuestBriefs[selected.id] ?? selected.summary : ''

  return <DialogueWindow save={save} title={presence.label} eyebrow={presence.roleLabel}
    portraitAssetId={portrait} lines={[...script]} quest={talking ? undefined : selected}
    showConversation={talking} className="npc-mission-hub" onClose={onClose}>
    <section className="npc-mission-hub__content" aria-label={'Assuntos de ' + presence.label}>
      <nav aria-label={'Assuntos do NPC ' + presence.label} className="npc-mission-hub__topics">
        {quests.map((quest) => <button key={quest.id} type="button" aria-pressed={topic === quest.id}
          data-quest-status={save.quests[quest.id]?.status}
          onClick={() => setTopic(quest.id)}>
          <BookOpen size={15} aria-hidden="true"/>
          <span><strong>{quest.title}</strong><small>{getQuestStatusLabel(save.quests[quest.id]?.status ?? 'locked')}</small></span>
        </button>)}
        <button type="button" aria-pressed={talking} onClick={() => setTopic('talk')}>
          <MessageCircle size={15} aria-hidden="true"/><span><strong>Conversar com {presence.label}</strong><small>Assuntos e lore</small></span>
        </button>
        {onServices && <button type="button" onClick={onServices}>
          <Wrench size={15} aria-hidden="true"/><span><strong>Serviços</strong><small>Comércio e treinamento</small></span>
        </button>}
      </nav>
      {!talking && selected && <div className="npc-mission-hub__detail" data-quest-status={progress?.status}>
        <div className="npc-mission-hub__quote">
          <AssetImage assetId={portrait} alt={presence.label}/>
          <p>{message}</p>
        </div>
        <QuestNpcPanel embedded save={save} questId={selected.id} onClose={onClose}/>
      </div>}
      {talking && <p className="npc-mission-hub__talk-note">Escolha respostas na conversa acima. Suas missões e recompensas continuam preservadas.</p>}
    </section>
  </DialogueWindow>
}
