import { useEffect, useState } from 'react'
import type { AttributeDie } from '../../domain/game/types'
import { DieIcon } from '../components/DieIcon'
import { DraggableBattleDie } from './DraggableBattleDie'

export type BattleDiceEvent = {
  id: string
  sides: AttributeDie
  face: number
  damage: number
  action: string
  actorName?: string
  actorSide?: 'player' | 'enemy'
  kind?: 'initiative' | 'damage'
  initiativeTotal?: number
}

/** Shows the result that the deterministic battle engine actually recorded.
 * A player's attack die starts rolling only after an upward drag and release.
 */
export function BattleDicePlatform({ roll, reducedMotion, awaitingClick = false, onRoll }: {
  roll: BattleDiceEvent | null
  reducedMotion: boolean
  awaitingClick?: boolean
  onRoll?: () => void
}) {
  const [settled, setSettled] = useState(reducedMotion && !awaitingClick)
  useEffect(() => {
    if (!roll) return
    if (awaitingClick) { setSettled(false); return }
    const begin = window.setTimeout(() => setSettled(reducedMotion), 0)
    if (reducedMotion) return () => window.clearTimeout(begin)
    const timer = window.setTimeout(() => setSettled(true), 780)
    return () => { window.clearTimeout(begin); window.clearTimeout(timer) }
  }, [roll, reducedMotion, awaitingClick])

  if (!roll) return null
  const initiative = roll.kind === 'initiative'
  const description = initiative ? 'iniciativa' : roll.action
  return <aside className={`battle-dice-platform ${awaitingClick ? 'is-awaiting-click' : settled ? 'is-settled' : 'is-rolling'} ${roll.actorSide === 'enemy' ? 'is-enemy-roll' : 'is-player-roll'}`}
    role="status" aria-live="polite" aria-label={`Lançamento visual de d${roll.sides} para ${description}`}>
    <header>
      <span>{initiative ? 'ROLAGEM DE INICIATIVA' : roll.actorSide === 'enemy' ? 'ROLAGEM DO INIMIGO' : 'ROLAGEM DO TERRÍRIAN'}</span>
      <strong>{roll.actorName ? `${roll.actorName} · ${roll.action}` : roll.action}</strong>
    </header>
    <div className="battle-dice-platform__stage">
      <span className="battle-dice-platform__rune" aria-hidden="true" />
      <span className="battle-dice-platform__shadow" aria-hidden="true" />
      {awaitingClick
        ? <DraggableBattleDie sides={roll.sides} onThrow={() => onRoll?.()}
            ariaLabel={`Arrastar dado d${roll.sides} para cima para rolar`} />
        : <div className="battle-dice-platform__die" key={roll.id}>
            <DieIcon sides={roll.sides} face={roll.face} />
          </div>}
    </div>
    <div className="battle-dice-platform__result">
      <small>d{roll.sides} · {awaitingClick ? 'Aguardando lançamento' : settled ? 'Dado assentado' : 'Rolando na plataforma…'}</small>
      <strong>{awaitingClick ? 'Arraste para cima e solte' : settled
        ? initiative ? `Iniciativa: ${roll.initiativeTotal ?? roll.face}` : `${roll.damage} de dano`
        : 'Rolando…'}</strong>
    </div>
    <p>{initiative
      ? 'Iniciativa real: valor-base do combatente + face do dado. O resultado define a ordem dos turnos.'
      : 'Face registrada pelo motor de combate. O dano permanece calculado pela fórmula atual.'}</p>
  </aside>
}
