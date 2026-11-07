import type { TrailNodeDefinition } from '../../content/types'
import type { AstravelDecoration } from './astravelNavigation'

type NewRegion = 'cerrado' | 'elduran'
const px = (ctx: CanvasRenderingContext2D, color: string, x: number, y: number, w: number, h: number) => {
  ctx.fillStyle = color
  ctx.fillRect(Math.round(x), Math.round(y), w, h)
}

/** VISUAL_DRAFT: native canvas terrain in the shared 768×512 world coordinate system. */
export function drawBiomeTerrain(
  ctx: CanvasRenderingContext2D, region: NewRegion, camera: { x: number; y: number },
) {
  const cerrado = region === 'cerrado'
  const ground = cerrado ? ['#4c4932', '#575039', '#655a3a'] : ['#80694a', '#917452', '#a1855a']
  const speck = cerrado ? '#8b8850' : '#d0af78'
  px(ctx, ground[0], 0, 0, 768, 512)
  for (let y = Math.floor(camera.y / 16) * 16; y <= camera.y + ctx.canvas.height + 16; y += 16) {
    for (let x = Math.floor(camera.x / 16) * 16; x <= camera.x + ctx.canvas.width + 16; x += 16) {
      const seed = Math.abs((x * 17 + y * 23 + x * y) >> 4) % 11
      px(ctx, ground[seed % 3], x, y, 16, 16)
      if (seed < 5) px(ctx, speck, x + 3 + seed, y + 7, 4, 2)
    }
  }
  if (cerrado) {
    // Dry seasonal streams and patches of fire grass (cosmetic, not collision).
    for (let y = 0; y < 512; y += 8) {
      const x = 15 + Math.round(Math.sin(y / 34) * 12)
      px(ctx, '#3d6860', x, y, 10, 8)
      px(ctx, '#74a79b', x + 3, y + 3, 3, 2)
    }
  } else {
    // Repeated dune contours. Walkability remains owned by navigation, not art.
    for (let y = 35; y < 512; y += 69) {
      for (let x = 0; x < 768; x += 12) {
        const slope = Math.round(Math.sin(x / 52 + y / 34) * 9)
        px(ctx, '#ba9864', x, y + slope, 12, 2)
        px(ctx, '#6f5c42', x + 1, y + slope + 3, 7, 1)
      }
    }
  }
}

export function drawBiomeDecoration(
  ctx: CanvasRenderingContext2D, region: NewRegion, decor: AstravelDecoration,
) {
  const { x, y } = decor
  if (region === 'cerrado') {
    if (decor.kind === 'tree') {
      px(ctx, '#233b32', x - 4, y - 26, 9, 28)
      px(ctx, '#548466', x - 2, y - 26, 5, 25)
      px(ctx, '#233b32', x - 9, y - 17, 7, 6)
      px(ctx, '#67916c', x - 8, y - 15, 6, 11)
      px(ctx, '#416f4e', x + 3, y - 20, 7, 6)
      px(ctx, '#7cab75', x + 6, y - 20, 3, 11)
      if (decor.rune) px(ctx, '#9bccdb', x + 1, y - 11, 2, 3)
    } else {
      px(ctx, '#d1854b', x - 4, y - 3, 9, 3)
      px(ctx, '#bfbd74', x, y - 9, 3, 8)
      px(ctx, '#ecb56a', x - 2, y - 9, 7, 3)
    }
  } else if (decor.kind === 'tree') {
    px(ctx, '#5e4a3d', x - 10, y - 19, 20, 19)
    px(ctx, '#b49b71', x - 7, y - 25, 15, 24)
    px(ctx, '#d5b584', x - 6, y - 23, 4, 15)
    px(ctx, '#715c49', x + 2, y - 16, 5, 15)
    if (decor.rune) px(ctx, '#7ecad8', x + 3, y - 10, 3, 5)
  } else {
    px(ctx, '#806957', x - 5, y - 5, 10, 5)
    px(ctx, '#d0b38a', x - 1, y - 8, 6, 5)
  }
}

/** Distinctive landmarks, replacing fungus heads in the new regions. */
export function drawBiomeBattleMarker(ctx: CanvasRenderingContext2D, region: NewRegion, node: TrailNodeDefinition) {
  const x = Math.round(node.position.x * 768 / 100)
  const y = Math.round(node.position.y * 512 / 100)
  if (node.type === 'boss') {
    px(ctx, region === 'cerrado' ? '#514f51' : '#6d5b45', x - 17, y - 31, 34, 31)
    px(ctx, region === 'cerrado' ? '#c0a063' : '#d7b988', x - 15, y - 37, 30, 7)
    px(ctx, '#70c5c2', x - 3, y - 24, 6, 14)
    return
  }
  if (node.type === 'entry') {
    px(ctx, '#324151', x - 12, y - 25, 24, 25)
    px(ctx, '#6bd4db', x - 6, y - 20, 12, 18)
    px(ctx, '#173541', x - 3, y - 16, 6, 14)
    return
  }
  if (region === 'cerrado') {
    px(ctx, '#6a6441', x - 10, y - 10, 20, 12)
    px(ctx, '#b9b77b', x - 5, y - 16, 10, 14)
    px(ctx, '#6ac99c', x - 2, y - 18, 4, 10)
  } else {
    px(ctx, '#785d46', x - 12, y - 14, 24, 14)
    px(ctx, '#d9c08d', x - 9, y - 19, 18, 17)
    px(ctx, '#6a5148', x - 2, y - 13, 5, 10)
  }
}
