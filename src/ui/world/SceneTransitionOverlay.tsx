import { useEffect, useRef, useState } from 'react'
import type { WorldScene } from '../../domain/world/worldScene'

type Transition = {
  id: number
  from: WorldScene['kind']
  to: WorldScene['kind']
}

const sceneLabel: Record<WorldScene['kind'], string> = {
  terran: 'Terran',
  expedition: 'Astravél',
  dungeon: 'Câmaras Fúngicas',
  combat: 'Combate',
}

const transitionCopy = (from: WorldScene['kind'], to: WorldScene['kind']) => {
  if (to === 'combat') return { eyebrow: 'RESSONÂNCIA HOSTIL', title: 'Combate iniciado' }
  if (from === 'combat') return { eyebrow: 'FLUXO RESTABELECIDO', title: `Retorno a ${sceneLabel[to]}` }
  if (to === 'dungeon') return { eyebrow: 'LIMIAR DA RUÍNA', title: sceneLabel[to] }
  if (to === 'expedition') return { eyebrow: 'TRAVESSIA PELO PORTAL', title: sceneLabel[to] }
  return { eyebrow: 'REGISTRO DE RETORNO', title: sceneLabel[to] }
}

export function SceneTransitionOverlay({ scene, reducedMotion }: { scene: WorldScene; reducedMotion: boolean }) {
  const previousRef = useRef(scene.kind)
  const sequenceRef = useRef(0)
  const [transition, setTransition] = useState<Transition | null>(null)

  useEffect(() => {
    const previous = previousRef.current
    previousRef.current = scene.kind
    if (reducedMotion) {
      setTransition(null)
      return
    }
    if (previous === scene.kind) return

    sequenceRef.current += 1
    const next = { id: sequenceRef.current, from: previous, to: scene.kind }
    setTransition(next)
    const timer = window.setTimeout(() => setTransition((current) => current?.id === next.id ? null : current), 720)
    return () => window.clearTimeout(timer)
  }, [reducedMotion, scene.kind])

  if (!transition) return null
  const copy = transitionCopy(transition.from, transition.to)
  return (
    <div className="world-scene-transition" role="status" aria-live="polite">
      <span>{copy.eyebrow}</span>
      <strong>{copy.title}</strong>
      <i aria-hidden="true" />
    </div>
  )
}
