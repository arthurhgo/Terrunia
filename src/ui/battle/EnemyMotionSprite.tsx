import { biomeEnemyDefinitions } from '../../content/biomeExpeditions'
import type { CSSProperties } from 'react'
import { resolveAsset } from '../../assets/assetRegistry'
import { AssetImage } from '../components/AssetImage'
import './enemyMotion.css'

export type EnemyMotionState = 'idle' | 'attack' | 'hit' | 'defeat'

/** VISUAL_DRAFT: per-species kinetic fallback until dedicated 4×4 PNG atlases land.
 * Every existing enemy has a distinctive tempo and movement, never a static card.
 */
export const legacyEnemyMotion: Record<string, { idleMs: number; lunge: number; sway: number; tint: string }> = {
  'enemy.fungorro-crawler': { idleMs: 940, lunge: 7, sway: 2, tint: '#b7df80' },
  'enemy.spore-sower': { idleMs: 1220, lunge: 5, sway: 3, tint: '#b38acc' },
  'enemy.fungal-slime': { idleMs: 870, lunge: 3, sway: 4, tint: '#b4e6a6' },
  'enemy.fungal-horror': { idleMs: 1420, lunge: 8, sway: 2, tint: '#cb93be' },
  'enemy.colossus-mycelium': { idleMs: 1950, lunge: 4, sway: 1, tint: '#a786e7' },
  'enemy.ruin-corrupted-sentinel': { idleMs: 2300, lunge: 0, sway: 1, tint: '#9a86f7' },
  'enemy.luminous-slime': { idleMs: 1100, lunge: 3, sway: 3, tint: '#74eee2' },
  'enemy.void-moth': { idleMs: 760, lunge: 10, sway: 5, tint: '#af9de8' },
  'enemy.spore-mantis': { idleMs: 680, lunge: 12, sway: 2, tint: '#d4b676' },
  'enemy.ruin-sentinel': { idleMs: 1620, lunge: 5, sway: 1, tint: '#8ad6dc' },
  'enemy.blackroot-titan': { idleMs: 2100, lunge: 6, sway: 1, tint: '#c7a57b' },
  ...Object.fromEntries(biomeEnemyDefinitions.map((enemy, i) => [enemy.assetId, {
    idleMs: 800 + (i % 4) * 260, lunge: 6 + (i % 4) * 2, sway: 2 + (i % 3),
    tint: i < 5 ? '#d9c777' : '#e5bb8b',
  }])),
}

/** Presentation-only animation: domain controls damage, attack timing and death. */
export function EnemyMotionSprite({ assetId, motion = 'idle', reducedMotion = false }: {
  assetId: string; motion?: EnemyMotionState; reducedMotion?: boolean
}) {
  const asset = resolveAsset(assetId)
  const sheet = asset.motionSheet
  if (reducedMotion) return <AssetImage assetId={assetId} alt="" className="enemy-motion-fallback" />
  if (!sheet) {
    const profile = legacyEnemyMotion[assetId]
    if (!profile) return <AssetImage assetId={assetId} alt="" className="enemy-motion-fallback" />
    const style = {
      '--idle-shift': `${profile.sway}px`,
      '--attack-shift': `${profile.lunge}px`,
      '--creature-glow': profile.tint,
      animationDuration: `${motion === 'idle' ? profile.idleMs : motion === 'attack' ? 540 : motion === 'hit' ? 420 : 800}ms`,
    } as CSSProperties
    return <span key={`${assetId}:${motion}`} className="enemy-motion-legacy"
      data-motion={motion} data-asset={assetId} style={style} aria-hidden="true">
      <AssetImage assetId={assetId} alt="" className="enemy-motion-fallback" />
    </span>
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
