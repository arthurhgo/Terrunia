import { useEffect, useRef } from 'react'
import { ACTOR_PALETTES, drawPixelActor } from '../terran/pixelActorArt'

type CombatPlayerSpriteProps = {
  portraitAssetId: string
  defeated: boolean
  hit: boolean
}

const drawDefeated = (ctx: CanvasRenderingContext2D, palette: typeof ACTOR_PALETTES.terririan) => {
  const scale = 6
  const blocks: Array<[number, number, number, number, string]> = [
    [2, 10, 4, 4, palette.boots], [5, 8, 6, 5, palette.cloth],
    [10, 7, 5, 5, palette.outline], [11, 8, 3, 3, palette.skin],
    [12, 7, 3, 2, palette.hair], [6, 8, 4, 2, palette.light],
    [4, 12, 9, 2, palette.outline], [8, 9, 2, 2, palette.accent],
  ]
  for (const [x, y, width, height, color] of blocks) {
    ctx.fillStyle = color
    ctx.fillRect(x * scale, y * scale, width * scale, height * scale)
  }
}

/** VISUAL_DRAFT — back-facing battle pose and a dedicated defeated frame. */
export function CombatPlayerSprite({ portraitAssetId, defeated, hit }: CombatPlayerSpriteProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.imageSmoothingEnabled = false
    const palette = portraitAssetId.includes('sigil') ? ACTOR_PALETTES.sigil : ACTOR_PALETTES.terririan
    if (defeated) drawDefeated(ctx, palette)
    else drawPixelActor(ctx, 56, 102, 'up', 0, palette, 6)
  }, [defeated, portraitAssetId])

  return (
    <canvas
      ref={canvasRef}
      width={112}
      height={112}
      className={`combat-player-sprite ${defeated ? 'is-defeated' : ''} ${hit ? 'is-hit' : ''}`}
      role="img"
      aria-label={defeated ? 'Terrírian derrotado' : 'Terrírian em posição de combate'}
    />
  )
}
