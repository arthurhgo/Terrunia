import { useEffect, useState } from 'react'
import type { AttributeDie } from '../../domain/game/types'
import { battleDieShape, projectBattleDie } from './battleDieGeometry'
import { BATTLE_PRESENTATION } from './presentationTiming'
import './battleDie3d.css'

const material = {
  player: [227, 177, 98],
  enemy: [183, 135, 181],
  weapon: [132, 193, 196],
} as const

type Props = {
  sides: AttributeDie
  face?: number
  rollTo?: number
  rolling?: boolean
  compact?: boolean
  tone?: keyof typeof material
  ariaLabel?: string
}

export function BattleDie3D({ sides, face, rollTo, rolling = false, compact = false, tone = 'player', ariaLabel }: Props) {
  const [progress, setProgress] = useState(0)
  useEffect(() => {
    if (!rolling || window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches) return
    const start = performance.now()
    let frame: number
    const tick = (now: number) => {
      const ratio = Math.max(0, Math.min(1, (now-start) / BATTLE_PRESENTATION.dieSpinMs))
      setProgress(ratio)
      if (ratio < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [rolling])

  const facets = projectBattleDie(sides, face ?? rollTo, rolling ? progress : undefined)
  const label = face ? facets.find(facet => facet.value === face) : facets.at(-1)
  return <svg viewBox="0 0 96 96" role="img"
    aria-label={ariaLabel ?? `Dado d${sides}${face ? ', face ' + face : ''}`}
    data-die-shape={battleDieShape[sides]} data-die-sides={sides} data-die-face={face}
    className="die-icon battle-die-3d">
    {facets.map(facet => {
      const light = facet.light * (face === facet.value ? 1.1 : 1)
      const fill = material[tone].map(channel => Math.round(Math.min(255, channel*light))).join(' ')
      return <polygon key={facet.value} points={facet.points}
        fill={`rgb(${fill})`} stroke="#251c29" strokeWidth="1.2" strokeLinejoin="round" />
    })}
    {label && !rolling && !compact && <text className="battle-die-3d__number" x={label.x} y={label.y}
      fontSize={Math.min(26, Math.max(12, Math.sqrt(label.area)*25))}
      textAnchor="middle" dominantBaseline="central">{face ?? `d${sides}`}</text>}
  </svg>
}
