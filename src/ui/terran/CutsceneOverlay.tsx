import { useState } from 'react'
import { SkipForward, ArrowRight } from 'lucide-react'
import type { Cutscene } from '../../domain/terran/cutscenes'
import { PixelCinematicCanvas } from './PixelCinematicCanvas'

export function CutsceneOverlay({ scene, portraitAssetId, reducedMotion, onComplete }: {
  scene: Cutscene
  portraitAssetId: string
  reducedMotion: boolean
  onComplete: () => void
}) {
  const [step, setStep] = useState(0)
  const next = () => {
    if (step < scene.lines.length - 1) setStep(step + 1)
    else onComplete()
  }

  return (
    <div className={`terran-cutscene terran-cutscene--${scene.tone}`} role="dialog" aria-modal="true" aria-label={scene.title}>
      <div className="terran-cutscene__scene" aria-hidden="true">
        <PixelCinematicCanvas tone={scene.tone} step={step} portraitAssetId={portraitAssetId} reducedMotion={reducedMotion} />
      </div>
      <div className="terran-cutscene__script">
        <span className="eyebrow">CRÔNICA DO NEXO · {step + 1}/{scene.lines.length}</span>
        <h2>{scene.title}</h2>
        <p key={`${scene.id}-${step}`}>{scene.lines[step]}</p>
        <div className="terran-cutscene__actions">
          <button type="button" onClick={onComplete}><SkipForward size={15} /> Pular cena</button>
          <button type="button" onClick={next}>{step < scene.lines.length - 1 ? 'Continuar' : 'Voltar a Terran'} <ArrowRight size={16} /></button>
        </div>
      </div>
    </div>
  )
}
