import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'

type ModalProps = {
  open: boolean
  title: string
  eyebrow?: string
  children: ReactNode
  footer?: ReactNode
  onClose: () => void
  className?: string
}

export function Modal({ open, title, eyebrow, children, footer, onClose, className = '' }: ModalProps) {
  useEffect(() => {
    if (!open) return undefined
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={onClose}>
      <div
        className={`modal-card ${className}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <span className="modal-card__rune" aria-hidden="true">◆</span>
        <header className="modal-card__header">
          <div>
            {eyebrow && <p className="eyebrow">{eyebrow}</p>}
            <h2 id="modal-title">{title}</h2>
          </div>
          <button className="icon-button" type="button" aria-label="Fechar" onClick={onClose}>
            <X size={18} />
          </button>
        </header>
        <div className="modal-card__content">{children}</div>
        {footer && <footer className="modal-card__footer">{footer}</footer>}
      </div>
    </div>
  )
}
