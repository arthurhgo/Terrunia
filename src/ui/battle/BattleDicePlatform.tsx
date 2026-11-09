import { useEffect, useState } from 'react'
import type { AttributeDie } from '../../domain/game/types'
import type { CharacterAppearance } from '../../domain/character/appearance'
import { DieIcon } from '../components/DieIcon'
import { AssetImage } from '../components/AssetImage'
import { CharacterPortrait } from '../characters/CharacterSprite'
import { BATTLE_PRESENTATION } from './presentationTiming'

export type BattleDiceEvent = {
  id: string
  sides: AttributeDie
  face: number
  damage: number
  action: string
  actorId?: string
  targetId?: string
  actorName?: string
  actorSide?: 'player' | 'enemy'
  kind?: 'initiative' | 'damage'
  initiativeTotal?: number
  weaponBonusRoll?: { sides: AttributeDie; face: number }
  /** True only when the combat engine resolved a natural-maximum damage roll. */
  critical?: boolean
}

/** Full-arena VFX, not a dialog. Die visibly travels from actions into the world.
 * The engine commits after its real result has been presented.
 */
export function BattleDicePlatform({ roll, reducedMotion, awaitingClick = false, playerAppearance,
  playerPortraitAssetId, enemyPortraitAssetId }: {
  roll: BattleDiceEvent | null
  reducedMotion: boolean
  awaitingClick?: boolean
  playerAppearance?: CharacterAppearance
  playerPortraitAssetId?: string
  enemyPortraitAssetId?: string
}) {
  const [settled, setSettled] = useState(reducedMotion && !awaitingClick)
  useEffect(() => {
    if (!roll) return
    if (awaitingClick) { setSettled(false); return }
    const begin = window.setTimeout(() => setSettled(reducedMotion), 0)
    if (reducedMotion) return () => window.clearTimeout(begin)
    const timer = window.setTimeout(() => setSettled(true), BATTLE_PRESENTATION.dieSpinMs)
    return () => { window.clearTimeout(begin); window.clearTimeout(timer) }
  }, [roll, reducedMotion, awaitingClick])

  if (!roll) return null
  const initiative = roll.kind === 'initiative'
  return <div className={`battle-dice-platform battle-dice-platform--in-arena
      ${awaitingClick ? 'is-awaiting-click' : settled ? 'is-settled' : 'is-rolling'}
      ${roll.actorSide === 'enemy' ? 'is-enemy-roll' : 'is-player-roll'}
      ${roll.critical && !initiative ? 'is-critical-roll' : ''}`}
    role="status" aria-live="polite" aria-label={`Lançamento visual de d${roll.sides} para ${initiative ? 'iniciativa' : roll.action}`}>
    <div className="battle-dice-platform__veil" aria-hidden="true" />
    <div className="battle-dice-platform__actor" aria-label={`Quem está rolando: ${roll.actorName ?? 'Combatente'}`}>
      <span className="battle-dice-platform__actor-face" aria-hidden="true">
        {roll.actorSide === 'player'
          ? <CharacterPortrait appearance={playerAppearance} portraitAssetId={playerPortraitAssetId} />
          : <AssetImage assetId={enemyPortraitAssetId ?? 'enemy.fungorro-crawler'} alt="" />}
      </span>
      <strong>{roll.actorName ?? 'Combatente'}</strong>
      <small>{initiative ? 'INICIATIVA' : roll.action}</small>
    </div>
    {!awaitingClick && <div className="battle-dice-platform__stage">
      <span className="battle-dice-platform__shadow" aria-hidden="true" />
      <div className="battle-dice-platform__die" key={roll.id}>
        <DieIcon sides={roll.sides} face={settled ? roll.face : undefined} />
      </div>
      {settled && <div className="battle-dice-platform__result">
        <strong>{initiative ? `Iniciativa ${roll.initiativeTotal ?? roll.face}` : `d${roll.sides}: ${roll.face}`}</strong>
        {!initiative && roll.weaponBonusRoll && <small>Arma d{roll.weaponBonusRoll.sides}: {roll.weaponBonusRoll.face}</small>}
        {!initiative && roll.critical && <span className="battle-dice-platform__critical">ACERTO CRÍTICO!</span>}
        {!initiative && <small>{roll.damage} de dano</small>}
      </div>}
    </div>}
  </div>
}
