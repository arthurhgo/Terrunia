import type { GameSave } from '../../domain/game/types'
import { getWorldJourney } from './worldJourney'

export function WorldJourneyBar({ save }: { save: GameSave }) {
  const steps = getWorldJourney(save)
  return (
    <nav className="world-journey" aria-label="Caminho da base até o personagem">
      <ol>
        {steps.map((step, index) => {
          const current = index === steps.length - 1
          return (
            <li key={step.id} className={current ? 'is-current' : 'is-complete'} aria-current={current ? 'step' : undefined}>
              <i aria-hidden="true" />
              <span>{step.label}</span>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
