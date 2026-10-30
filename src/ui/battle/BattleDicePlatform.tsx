import { useEffect, useState } from 'react'
import type { AttributeDie } from '../../domain/game/types'
import { DieIcon } from '../components/DieIcon'

export type BattleDiceEvent = {
  id: string
  sides: AttributeDie
  /** A scene-only face. The live damage displayed below comes from the combat log. */
  face: number
  damage: number
  action: string
}

export function BattleDicePlatform({ roll, reducedMotion }: { roll: BattleDiceEvent | null; reducedMotion: boolean }) {
  const [settled, setSettled] = useState(reducedMotion)
  useEffect(() => {
    if (!roll) return
    const begin = window.setTimeout(() => setSettled(reducedMotion), 0)
    if (reducedMotion) return () => window.clearTimeout(begin)
    const timer = window.setTimeout(() => setSettled(true), 780)
    return () => { window.clearTimeout(begin); window.clearTimeout(timer) }
  }, [roll, reducedMotion])

  if (!roll) return null
  return <aside className={`battle-dice-platform ${settled ? 'is-settled' : 'is-rolling'}`}
    role="status" aria-live="polite" aria-label={`Lançamento visual de d${roll.sides} para ${roll.action}`}>
    <header><span>RITUAL DO DADO</span><strong>{roll.action}</strong></header>
    <div className="battle-dice-platform__stage">
      <span className="battle-dice-platform__rune" aria-hidden="true" />
      <span className="battle-dice-platform__shadow" aria-hidden="true" />
      <div className="battle-dice-platform__die" key={roll.id}>
        <DieIcon sides={roll.sides} face={roll.face} />
      </div>
    </div>
    <div className="battle-dice-platform__result">
      <small>d{roll.sides} · {settled ? 'Dado assentado' : 'Lançando na plataforma…'}</small>
      <strong>{settled ? `${roll.damage} de dano` : 'Rolando…'}</strong>
    </div>
    <p>A face é uma representação visual. O dano mostrado é o resultado real calculado pelas regras atuais.</p>
  </aside>
}
