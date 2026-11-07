type ProgressBarProps = {
  value: number
  max: number
  label: string
  tone?: 'xp' | 'essence' | 'health' | 'resonance'
  compact?: boolean
  inside?: boolean
}

export function ProgressBar({
  value,
  max,
  label,
  tone = 'xp',
  compact = false,
  inside = false,
}: ProgressBarProps) {
  const safeMax = Math.max(1, max)
  const percent = Math.min(100, Math.max(0, (value / safeMax) * 100))
  return (
    <div className={`progress progress--${tone} ${compact ? 'progress--compact' : ''} ${inside ? 'progress--inbar' : ''}`}>
      {!inside && <div className="progress__labels">
        <span>{label}</span>
        <strong>
          {value.toLocaleString('pt-BR')} / {max.toLocaleString('pt-BR')}
        </strong>
      </div>}
      <div
        className="progress__track"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={Math.min(value, max)}
      >
        <span className="progress__fill" style={{ width: `${percent}%` }} />
        {inside && <span className="progress__inbar"><strong>{label}</strong><span>{value.toLocaleString("pt-BR")}/{max.toLocaleString("pt-BR")} · {Math.round(percent)}%</span></span>}
      </div>
    </div>
  )
}
