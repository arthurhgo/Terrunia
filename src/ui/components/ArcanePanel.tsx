import type { ReactNode } from 'react'

type ArcanePanelProps = {
  title?: string
  eyebrow?: string
  subtitle?: string
  action?: ReactNode
  children: ReactNode
  className?: string
  as?: 'section' | 'aside' | 'article'
}

export function ArcanePanel({
  title,
  eyebrow,
  subtitle,
  action,
  children,
  className = '',
  as: Component = 'section',
}: ArcanePanelProps) {
  return (
    <Component className={`arcane-panel ${className}`}>
      <span className="panel-corner panel-corner--tl" aria-hidden="true" />
      <span className="panel-corner panel-corner--tr" aria-hidden="true" />
      <span className="panel-corner panel-corner--bl" aria-hidden="true" />
      <span className="panel-corner panel-corner--br" aria-hidden="true" />
      {(title || eyebrow || subtitle || action) && (
        <header className="arcane-panel__header">
          <div>
            {eyebrow && <p className="eyebrow">{eyebrow}</p>}
            {title && <h2>{title}</h2>}
            {subtitle && <p className="panel-subtitle">{subtitle}</p>}
          </div>
          {action && <div className="arcane-panel__action">{action}</div>}
        </header>
      )}
      <div className="arcane-panel__content">{children}</div>
    </Component>
  )
}
