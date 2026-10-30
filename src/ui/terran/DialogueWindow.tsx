import { useEffect, useId, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import type { GameSave } from '../../domain/game/types'
import { AssetImage } from '../components/AssetImage'
import { EquippedCharacter } from '../characters/EquippedCharacter'

/** Visual-novel composition: two large actors remain above one shared bottom dialogue panel. */
export function DialogueWindow({ open = true, save, title, portraitAssetId, eyebrow, lines = [], children,
  footer, onClose, ariaLabel, className = '' }: {
  open?: boolean; save: GameSave; title: string; portraitAssetId: string; eyebrow?: string
  lines?: string[]; children?: ReactNode; footer?: ReactNode; ariaLabel?: string; onClose: () => void; className?: string
}) {
  const [line, setLine] = useState(0)
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
      <div className="vn-cast" aria-label="Personagens em diálogo">
        <div className="vn-cast__npc"><AssetImage assetId={portraitAssetId} alt={title} /><span>{title}</span></div>
        <div className="vn-cast__player"><EquippedCharacter save={save} /><span>{save.character.name}</span></div>
      </div>
      <section className="vn-textbox">
        <header><div>{eyebrow && <span className="eyebrow">{eyebrow}</span>}<h2 id={titleId}>{title}</h2></div>
          <button type="button" className="vn-close" aria-label="Encerrar diálogo" onClick={onClose}>×</button></header>
        {lines.length > 0 && <div className="vn-speech"><p>{lines[Math.min(line, lines.length - 1)]}</p>
          {lines.length > 1 && <button type="button" aria-label="Próxima fala" onClick={() => setLine((line + 1) % lines.length)}>▾ <small>{line + 1}/{lines.length}</small></button>}
        </div>}
        {children && <div className="vn-details">{children}</div>}
        {footer && <footer>{footer}</footer>}
      </section>
    </div>
  </div>, document.body)
}
