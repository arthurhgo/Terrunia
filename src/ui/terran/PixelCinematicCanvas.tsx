import { useEffect, useRef } from 'react'
import type { Cutscene } from '../../domain/terran/cutscenes'
import { CINEMATIC_HEIGHT, CINEMATIC_WIDTH, drawCinematicFrame } from './cinematicArt'

export function PixelCinematicCanvas({ tone, step, portraitAssetId, reducedMotion }: {
  tone: Cutscene['tone']; step: number; portraitAssetId: string; reducedMotion: boolean
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    let raf = 0, last = 0, frame = 0
    const animate = (now: number) => {
      if (now - last >= 50) {
        last = now
        drawCinematicFrame(ctx, tone, step, frame++, portraitAssetId.includes('sigil') ? 'sigil' : 'terririan')
      }
      raf = requestAnimationFrame(animate)
    }
    drawCinematicFrame(ctx, tone, step, 0, portraitAssetId.includes('sigil') ? 'sigil' : 'terririan')
    if (!reducedMotion) raf = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(raf)
  }, [tone, step, portraitAssetId, reducedMotion])
  return <canvas ref={canvasRef} width={CINEMATIC_WIDTH} height={CINEMATIC_HEIGHT}
    className="terran-cutscene__canvas" aria-hidden="true" />
}
