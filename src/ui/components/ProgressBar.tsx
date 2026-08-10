type ProgressBarProps = {
  value: number
  max: number
  label: string
  tone?: 'xp' | 'essence' | 'health' | 'resonance'
  compact?: boolean
}

export function ProgressBar({
  value,
  max,
  label,
  tone = 'xp',
  compact = false,
}: ProgressBarProps) {
  const safeMax = Math.max(1, max)
  const percent = Math.min(100, Math.max(0, (value / safeMax) * 100))
  return (
    <div className={`progress progress--${tone} ${compact ? 'progress--compact' : ''}`}>
      <div className="progress__labels">
        <span>{label}</span>
        <strong>
          {value.toLocaleString('pt-BR')} / {max.toLocaleString('pt-BR')}
        </strong>
      </div>
      <div
        className="progress__track"
        role="progressbar"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={Math.min(value, max)}
      >
        <span className="progress__fill" style={{ width: `${percent}%` }} />
      </div>
    </div>
  )
}
