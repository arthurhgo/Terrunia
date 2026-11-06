import { useEffect, useRef } from 'react'
import type { Cutscene } from '../../domain/terran/cutscenes'
import type { CharacterAppearance } from '../../domain/character/appearance'
import { appearanceSpriteSheetUri } from '../characters/CharacterSprite'
import { useWearableAppearance } from '../characters/wearablePalette'
import type { VisualItem } from '../characters/equipmentVisuals'
import { CINEMATIC_HEIGHT, CINEMATIC_WIDTH, drawCinematicFrame } from './cinematicArt'

export function PixelCinematicCanvas({ tone, step, portraitAssetId, appearance, equipment = [], reducedMotion }: {
  tone: Cutscene['tone']; step: number; portraitAssetId: string; appearance?: CharacterAppearance; equipment?: readonly VisualItem[]; reducedMotion: boolean
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const dressedAppearance = useWearableAppearance(appearance, equipment)
  const spriteSource = dressedAppearance ? appearanceSpriteSheetUri(dressedAppearance) : null
  const equipmentKey = equipment.map((item) => item.assetId).join('|')
  const equipmentRef = useRef(equipment)
  equipmentRef.current = equipment
  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    let raf = 0, last = 0, frame = 0
    const sprite = spriteSource ? new Image() : null
    if (sprite && spriteSource) sprite.src = spriteSource
    const animate = (now: number) => {
      if (now - last >= 50) {
        last = now
        drawCinematicFrame(ctx, tone, step, frame++, portraitAssetId.includes('sigil') ? 'sigil' : 'terririan', sprite, Boolean(spriteSource), equipmentRef.current)
      }
      raf = requestAnimationFrame(animate)
    }
    drawCinematicFrame(ctx, tone, step, 0, portraitAssetId.includes('sigil') ? 'sigil' : 'terririan', sprite, Boolean(spriteSource), equipmentRef.current)
    if (sprite && reducedMotion) sprite.onload = () => drawCinematicFrame(ctx, tone, step, 0, 'terririan', sprite, true, equipmentRef.current)
    if (!reducedMotion) raf = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(raf)
  }, [tone, step, portraitAssetId, reducedMotion, spriteSource, equipmentKey])
  return <canvas ref={canvasRef} width={CINEMATIC_WIDTH} height={CINEMATIC_HEIGHT}
    className="terran-cutscene__canvas" aria-hidden="true" />
}
