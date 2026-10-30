import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import type { GameSave } from '../../domain/game/types'
import type { QuestDefinition } from '../../content/types'
import { buildNpcConversation } from '../../domain/terran/npcConversation'
import { AssetImage } from '../components/AssetImage'
import { EquippedCharacter } from '../characters/EquippedCharacter'

function Conversation({ save, portraitAssetId, title, lines, quest }: {
  save: GameSave; portraitAssetId: string; title: string; lines: string[]; quest?: QuestDefinition
}) {
  const conversation = buildNpcConversation(save, portraitAssetId, lines, quest)
  const [nodeId, setNodeId] = useState(conversation.startId)
  const [reply, setReply] = useState('')
  const speech = useRef<HTMLDivElement>(null)
  const scroll = useRef<HTMLDivElement>(null)
  const node = conversation.nodes[nodeId] ?? conversation.nodes[conversation.startId]
  return <div ref={scroll} className="vn-conversation">
    <div className="vn-cast__npc"><AssetImage assetId={portraitAssetId} alt={title} /></div>
    <div className="vn-conversation__body">
      <div ref={speech} className="vn-speech" tabIndex={-1} role="status" aria-live="polite" aria-atomic="true"><p>{node.text}</p></div>
      <div className="vn-player-reply"><div className="vn-cast__player"><EquippedCharacter save={save} /></div>
        <span><strong>{save.character.name}</strong>{reply || 'Escolha sua resposta.'}</span></div>
      <div className="vn-replies" role="group" aria-label={`Respostas para ${title}`}>
        {node.choices.map((choice) => <button type="button" key={choice.id} onClick={() => {
          setReply(choice.label); setNodeId(choice.nextId)
          if (scroll.current) scroll.current.scrollTop = 0
          speech.current?.focus({ preventScroll: true })
        }}><span aria-hidden="true">›</span>{choice.label}</button>)}
      </div>
    </div>
  </div>
}

/** One speaker, one portrait and one spoken text; player replies branch without changing progress. */
export function DialogueWindow({ open = true, save, title, portraitAssetId, eyebrow, lines = [], children,
  footer, onClose, ariaLabel, className = '', quest }: {
  open?: boolean; save: GameSave; title: string; portraitAssetId: string; eyebrow?: string
  lines?: string[]; children?: ReactNode; footer?: ReactNode; ariaLabel?: string; onClose: () => void; className?: string; quest?: QuestDefinition
}) {
  const titleId = useId()
  const panel = useRef<HTMLDivElement>(null)
  const closeRef = useRef(onClose); closeRef.current = onClose
  useEffect(() => {
    if (!open) return
    const previous = document.activeElement as HTMLElement | null
    panel.current?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); closeRef.current() }
      if (event.key === 'Tab' && panel.current) {
        const targets = [...panel.current.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input, select, [tabindex="0"]')]
        const first = targets[0], last = targets.at(-1)
        if (event.shiftKey && (document.activeElement === first || document.activeElement === panel.current)) { event.preventDefault(); last?.focus() }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
      }
    }
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('keydown', onKey); previous?.focus() }
  }, [open])
  if (!open) return null
  return createPortal(<div className="vn-overlay">
    <div ref={panel} tabIndex={-1} role="dialog" aria-modal="true" aria-label={ariaLabel} aria-labelledby={ariaLabel ? undefined : titleId} className={`vn-dialog ${className}`}>
      <section className="vn-textbox">
        <header><div>{eyebrow && <span className="eyebrow">{eyebrow}</span>}<h2 id={titleId}>{title}</h2></div>
          <button type="button" className="vn-close" aria-label="Encerrar diálogo" onClick={onClose}>×</button></header>
        <Conversation key={`${portraitAssetId}:${quest?.id ?? 'ambient'}`} save={save} portraitAssetId={portraitAssetId} title={title} lines={lines} quest={quest} />
        {children && <div className="vn-details">{children}</div>}
        {footer && <footer>{footer}</footer>}
      </section>
    </div>
  </div>, document.body)
}
