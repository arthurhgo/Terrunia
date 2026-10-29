/** VISUAL_DRAFT — actor silhouettes use an exact 16×16 pixel matrix, scaled by whole numbers. */
export type ActorFacing = 'up' | 'down' | 'left' | 'right'
export type ActorPalette = {
  outline: string
  hair: string
  skin: string
  cloth: string
  light: string
  accent: string
  boots: string
}

export const ACTOR_PALETTES: Record<string, ActorPalette> = {
  terririan: { outline: '#17262e', hair: '#47372b', skin: '#d5a78b', cloth: '#365878', light: '#7295a2', accent: '#cbb77e', boots: '#302e35' },
  sigil: { outline: '#1c2035', hair: '#d7c8a3', skin: '#c79382', cloth: '#5b4884', light: '#9282b9', accent: '#78ddd5', boots: '#2b2a40' },
  knowledge: { outline: '#1c2035', hair: '#aaa297', skin: '#e4bda5', cloth: '#454d7e', light: '#7589ad', accent: '#dbba74', boots: '#282e44' },
  exploration: { outline: '#1e2a27', hair: '#60432f', skin: '#cb9d7b', cloth: '#527050', light: '#93a775', accent: '#ccb174', boots: '#33352b' },
  bond: { outline: '#252c38', hair: '#504d6e', skin: '#d9b49c', cloth: '#356877', light: '#6ba9a5', accent: '#d5bb7e', boots: '#28343d' },
  defense: { outline: '#282831', hair: '#49332c', skin: '#c89e88', cloth: '#7b5150', light: '#b5877c', accent: '#d8c794', boots: '#39353c' },
  clan: { outline: '#282439', hair: '#8d6e68', skin: '#d9a78b', cloth: '#765578', light: '#a17aaf', accent: '#e0b66e', boots: '#2f2e43' },
  healing: { outline: '#21302d', hair: '#9c7c53', skin: '#e1b89c', cloth: '#477e68', light: '#8cb8a0', accent: '#e2d398', boots: '#323e36' },
  portal: { outline: '#192d3e', hair: '#d1bb9a', skin: '#e2be9b', cloth: '#376985', light: '#80b6c5', accent: '#96e7f7', boots: '#283f51' },
}

/** The player and city NPCs share the same 16×16 world scale. */
export const WORLD_ACTOR_SCALE = 1

/** VISUAL_DRAFT — a pixel ring identifies the controlled Terrírian without changing its scale. */
export function drawPlayerAura(
  ctx: CanvasRenderingContext2D,
  centerX: number,
  footY: number,
  frame = 0,
) {
  const pulse = Math.floor(frame / 18) % 2
  ctx.save()
  ctx.globalAlpha = pulse ? 0.9 : 0.68
  ctx.fillStyle = '#ffe482'
  ctx.fillRect(Math.round(centerX - 9), Math.round(footY - 3), 18, 1)
  ctx.fillRect(Math.round(centerX - 6), Math.round(footY - 5), 12, 1)
  ctx.fillRect(Math.round(centerX - 6), Math.round(footY), 12, 1)
  ctx.fillStyle = '#c98d22'
  ctx.fillRect(Math.round(centerX - 10), Math.round(footY - 2), 2, 2)
  ctx.fillRect(Math.round(centerX + 8), Math.round(footY - 2), 2, 2)
  ctx.restore()
}

const cache = new Map<string, readonly string[]>()

function paint(grid: string[][], x: number, y: number, width: number, height: number, pixel: string) {
  for (let iy = y; iy < y + height; iy += 1) {
    for (let ix = x; ix < x + width; ix += 1) {
      if (grid[iy]?.[ix] !== undefined) grid[iy][ix] = pixel
    }
  }
}

/** Public matrix for artists/tests: '.' transparent, each other glyph one palette color. */
export function getActorMatrix(facing: ActorFacing, stride = 0): readonly string[] {
  const step = ((stride % 3) + 3) % 3
  const key = `${facing}:${step}`
  const existing = cache.get(key)
  if (existing) return existing
  const grid = Array.from({ length: 16 }, () => Array<string>(16).fill('.'))
  const leaning = step === 1 ? -1 : step === 2 ? 1 : 0
  paint(grid, 4, 2, 8, 7, 'o')
  paint(grid, 5, 3, 6, 5, facing === 'up' ? 'h' : 's')
  paint(grid, 5, 1, 6, 3, 'h')
  paint(grid, 4, 8, 8, 5, 'o')
  paint(grid, 5, 8, 6, 5, 'c')
  paint(grid, 5, 8, 6, 2, 'l')
  paint(grid, 7, 10, 2, 2, 'a')
  paint(grid, 3, 9 + Math.max(0, leaning), 2, 4, 'l')
  paint(grid, 11, 9 + Math.max(0, -leaning), 2, 4, 'c')
  paint(grid, 5 + (step === 1 ? -1 : 0), 13, 3, 3, 'b')
  paint(grid, 9 + (step === 2 ? 1 : 0), 13, 3, 3, 'b')
  if (facing === 'down') {
    paint(grid, 6, 5, 1, 1, 'o')
    paint(grid, 9, 5, 1, 1, 'o')
  } else if (facing === 'up') {
    paint(grid, 5, 5, 6, 3, 'h')
    paint(grid, 6, 9, 4, 4, 'l')
  } else if (facing === 'left') {
    paint(grid, 4, 4, 3, 4, 'h')
    paint(grid, 6, 5, 1, 1, 'o')
    paint(grid, 10, 8, 2, 5, 'o')
  } else {
    paint(grid, 9, 4, 3, 4, 'h')
    paint(grid, 9, 5, 1, 1, 'o')
    paint(grid, 4, 8, 2, 5, 'o')
  }
  const matrix = grid.map((line) => line.join(''))
  cache.set(key, matrix)
  return matrix
}

/** Actors use the exact 16×16 matrix and an integer scale selected by the scene. */
export function drawPixelActor(
  ctx: CanvasRenderingContext2D, centerX: number, footY: number,
  facing: ActorFacing, stride: number, palette: ActorPalette, scale = 2,
) {
  const rows = getActorMatrix(facing, stride)
  const colors: Record<string, string> = {
    o: palette.outline, h: palette.hair, s: palette.skin, c: palette.cloth,
    l: palette.light, a: palette.accent, b: palette.boots,
  }
  const left = Math.round(centerX - 8 * scale)
  const top = Math.round(footY - 16 * scale)
  for (let y = 0; y < 16; y += 1) {
    for (let x = 0; x < 16; x += 1) {
      const color = colors[rows[y][x]]
      if (!color) continue
      ctx.fillStyle = color
      ctx.fillRect(left + x * scale, top + y * scale, scale, scale)
    }
  }
}
