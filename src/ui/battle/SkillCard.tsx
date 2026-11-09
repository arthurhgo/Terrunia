import { useRef } from 'react'
import type { CSSProperties } from 'react'
import { Clock3 } from 'lucide-react'
import type { CombatSkillDefinition } from '../../content/types'
import type { previewCombatSkill } from '../../domain/combat/skillPreview'
import { AssetImage } from '../components/AssetImage'

type Preview = ReturnType<typeof previewCombatSkill>
type Props = {
  skill: CombatSkillDefinition
  preview: Preview
  remaining: number
  unavailable: string | null
  onInspect: () => void
  onLeave: () => void
  onPin: () => void
  onUse: () => void
}

export function SkillCard({ skill, preview, remaining, unavailable, onInspect, onLeave, onPin, onUse }: Props) {
  const lastPointer = useRef('mouse')
  const cooldown = Math.max(0, Math.floor(skill.cooldownTurns ?? 0))
  const angle = cooldown > 0 ? Math.round(360 * Math.min(1, remaining / cooldown)) : 0
  const minMax = preview.ranges.length
    ? preview.ranges.map(({ minimum, maximum }) => minimum === maximum ? String(minimum) : `${minimum}–${maximum}`).join(' + ')
    : '—'
  const dieLabel = preview.die
    ? `d${preview.die}${preview.weaponBonusDie ? `+d${preview.weaponBonusDie}` : ''}`
    : '—'
  return <button type="button"
    className={['pixel-battle__skill-card', remaining > 0 ? 'is-cooling' : 'is-ready',
      unavailable ? 'is-unavailable' : ''].join(' ')}
    aria-label={`Usar ${skill.name}; dado ${dieLabel}; dano ${minMax}; ${unavailable ?? 'disponível'}`}
    aria-disabled={Boolean(unavailable)}
    aria-describedby={`skill-tooltip-${skill.id}`}
    onMouseEnter={onInspect}
    onMouseLeave={onLeave}
    onFocus={onInspect}
    onBlur={onLeave}
    onPointerDown={(event) => { lastPointer.current = event.pointerType }}
    onKeyDown={() => { lastPointer.current = 'keyboard' }}
    onClick={(event) => {
      if (lastPointer.current === 'touch' && event.detail > 0) onPin()
      else if (unavailable) onPin()
      else onUse()
    }}>
    <span className="pixel-battle__skill-icon">
      <AssetImage assetId={skill.iconAssetId ?? `skill.${skill.id}`} alt="" />
      {remaining > 0 && <span className="pixel-battle__cooldown-mask"
        style={{ '--cooldown-angle': `${angle}deg` } as CSSProperties} aria-hidden="true" />}
      {remaining > 0 && <span className="pixel-battle__cooldown-clock" aria-hidden="true">
        <Clock3 size={13} /><b>{remaining}T</b>
      </span>}
    </span>
    <span className="pixel-battle__skill-name">{skill.name}</span>
    <span className="pixel-battle__skill-cost">{skill.mpCost} MP</span>
    <span className="pixel-battle__skill-stats"><span>🎲 {dieLabel}</span><span>✦ {minMax}</span></span>
    {unavailable && <span className="pixel-battle__skill-reason">{remaining > 0 ? 'EM RECARGA' : unavailable}</span>}
  </button>
}
