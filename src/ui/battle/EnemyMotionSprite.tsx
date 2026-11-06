import type { CSSProperties } from 'react'
import { resolveAsset } from '../../assets/assetRegistry'
import { AssetImage } from '../components/AssetImage'
import './enemyMotion.css'

export type EnemyMotionState = 'idle' | 'attack' | 'hit' | 'defeat'

/** Presentation-only animation: domain controls damage, attack timing and death. */
export function EnemyMotionSprite({ assetId, motion = 'idle', reducedMotion = false }: {
  assetId: string; motion?: EnemyMotionState; reducedMotion?: boolean
}) {
  const asset = resolveAsset(assetId)
  const sheet = asset.motionSheet
  if (!sheet || reducedMotion) {
    return <AssetImage assetId={assetId} alt="" className="enemy-motion-fallback" />
  }
  const duration = motion === 'attack' ? sheet.attackMs
    : motion === 'hit' ? sheet.hitMs
      : motion === 'defeat' ? sheet.defeatMs : sheet.idleMs
  const style = {
    backgroundImage: `url("${sheet.path}")`,
    animationDuration: `${duration}ms`,
  } satisfies CSSProperties
  // Remount on state change so one-shot attack/hit/defeat frames restart reliably.
  return <span key={`${assetId}:${motion}`} className={`enemy-motion-sprite enemy-motion-sprite--${sheet.rhythm}`}
    data-motion={motion}
    data-asset={assetId}
    style={style} aria-hidden="true" />
}
