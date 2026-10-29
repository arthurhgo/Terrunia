import type { TrailDefinition, TrailNodeDefinition } from '../../content/types'
import type { TrailNodeStatus } from '../../domain/game/types'
import { ACTOR_PALETTES, drawPixelActor, drawPlayerAura, WORLD_ACTOR_SCALE, type ActorFacing } from '../terran/pixelActorArt'
import type { WorldPoint } from '../terran/pixelCityArt'
import { ASTRAVEL_HEIGHT, ASTRAVEL_WIDTH, getAstravelDecorations, getAstravelPoint } from './astravelNavigation'

type Statuses = Record<string, TrailNodeStatus>

function pixel(ctx: CanvasRenderingContext2D, color: string, x: number, y: number, w: number, h: number) {
  ctx.fillStyle = color
  ctx.fillRect(Math.round(x), Math.round(y), w, h)
}

function tree(ctx: CanvasRenderingContext2D, x: number, y: number, rune: boolean) {
  pixel(ctx, '#15292a', x - 7, y - 20, 19, 21)
  pixel(ctx, '#604c40', x - 2, y - 13, 6, 16)
  pixel(ctx, '#244b43', x - 9, y - 24, 19, 16)
  pixel(ctx, '#356d55', x - 6, y - 28, 13, 17)
  pixel(ctx, '#548c67', x - 4, y - 25, 6, 6)
  pixel(ctx, '#1c3436', x + 3, y - 18, 6, 5)
  if (rune) {
    pixel(ctx, '#76d2c8', x, y - 9, 2, 4)
    pixel(ctx, '#c6efbb', x + 1, y - 11, 2, 2)
  }
}

function mushroom(ctx: CanvasRenderingContext2D, x: number, y: number, frame: number, large = false) {
  const size = large ? 9 : 5
  pixel(ctx, '#a7af91', x - 2, y - size, 4, size + 2)
  pixel(ctx, '#5a466b', x - size, y - size - 3, size * 2, 5)
  pixel(ctx, Math.floor(frame / 20) % 2 ? '#be95c0' : '#8d7ea8', x - size + 2, y - size - 5, size * 2 - 4, 4)
  pixel(ctx, '#e4d4d0', x - 2, y - size - 3, 3, 2)
}

function landmark(ctx: CanvasRenderingContext2D, node: TrailNodeDefinition, frame: number, status: TrailNodeStatus | undefined) {
  const point = getAstravelPoint(node)
  const { x, y } = point
  if (node.type === 'entry') {
    pixel(ctx, '#263b47', x - 13, y - 25, 26, 25)
    pixel(ctx, '#8a9889', x - 10, y - 24, 20, 19)
    pixel(ctx, '#193a48', x - 6, y - 19, 12, 17)
    pixel(ctx, '#84dbe1', x - 2, y - 16, 4, 12)
  } else if (node.type === 'camp') {
    pixel(ctx, '#5b4739', x - 15, y - 9, 30, 10)
    pixel(ctx, '#ab8260', x - 12, y - 17, 24, 10)
    pixel(ctx, '#ceb88b', x - 5, y - 20, 10, 12)
    pixel(ctx, '#453a34', x + 6, y - 7, 6, 5)
  } else if (node.type === 'event') {
    pixel(ctx, '#2c3441', x - 18, y - 30, 36, 32)
    pixel(ctx, '#777586', x - 16, y - 33, 8, 32)
    pixel(ctx, '#777586', x + 8, y - 33, 8, 32)
    pixel(ctx, '#9c9aaa', x - 19, y - 35, 38, 6)
    pixel(ctx, '#2c2340', x - 7, y - 21, 14, 19)
    pixel(ctx, '#a881b7', x - 2, y - 16, 4, 10)
  } else if (node.type === 'boss') {
    pixel(ctx, '#262736', x - 20, y - 29, 40, 30)
    pixel(ctx, '#544b5f', x - 16, y - 35, 32, 31)
    pixel(ctx, '#6d5972', x - 22, y - 39, 44, 10)
    pixel(ctx, '#e0b4bf', x - 7, y - 29, 5, 4)
    pixel(ctx, '#e0b4bf', x + 3, y - 29, 5, 4)
  } else {
    mushroom(ctx, x, y, frame, true)
    mushroom(ctx, x + 10, y - 1, frame)
  }
  const active = status === 'current' || status === 'bossCurrent'
  pixel(ctx, status === 'completed' ? '#79bda6' : active ? '#f0cc7a' : '#657477', x - 4, y - 38, 8, 8)
  pixel(ctx, active && Math.floor(frame / 15) % 2 === 0 ? '#fff0b8' : '#203134', x - 2, y - 36, 4, 4)
}

/** VISUAL_DRAFT: 384×256, integer pixels and no art-defined collision. */
export function drawAstravel(
  ctx: CanvasRenderingContext2D, trail: TrailDefinition, statuses: Statuses,
  player: WorldPoint, sprite: HTMLImageElement | null, frame: number, walking: boolean,
  facing: ActorFacing, variant: 'terririan' | 'sigil',
) {
  ctx.imageSmoothingEnabled = false
  ctx.clearRect(0, 0, ASTRAVEL_WIDTH, ASTRAVEL_HEIGHT)
  pixel(ctx, '#152f31', 0, 0, ASTRAVEL_WIDTH, ASTRAVEL_HEIGHT)
  for (let y = 0; y < ASTRAVEL_HEIGHT; y += 16) {
    for (let x = 0; x < ASTRAVEL_WIDTH; x += 16) {
      const seed = (x * 17 + y * 31 + x * y) % 13
      pixel(ctx, seed < 5 ? '#1d3b38' : '#264a3e', x, y, 16, 16)
      pixel(ctx, seed % 2 ? '#3a6552' : '#2e5850', x + seed % 8, y + 9, 3, 2)
      if (seed === 7) pixel(ctx, '#41796a', x + 12, y + 4, 2, 3)
    }
  }
  // A runic stream frames the forest. Path/collision coordinates remain independent.
  for (let y = 0; y < ASTRAVEL_HEIGHT; y += 8) {
    const x = 23 + Math.floor(Math.sin(y / 25) * 10)
    pixel(ctx, '#1a5562', x, y, 17, 8)
    pixel(ctx, '#32849a', x + 3, y + 2, 7, 3)
    pixel(ctx, '#65b5b1', x + 11, y + 6, 4, 2)
  }
  const points = trail.nodes.map(getAstravelPoint)
  for (let segment = 1; segment < points.length; segment += 1) {
    const a = points[segment - 1], b = points[segment]
    const steps = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y) / 4)
    for (let step = 0; step <= steps; step += 1) {
      const fraction = step / steps
      const x = Math.round((a.x + (b.x - a.x) * fraction) / 4) * 4
      const y = Math.round((a.y + (b.y - a.y) * fraction) / 4) * 4
      pixel(ctx, '#655c4b', x - 12, y - 9, 24, 18)
      if (step % 4 === 0) pixel(ctx, '#82745e', x - 5, y + 2, 5, 3)
    }
  }
  for (const decoration of getAstravelDecorations(trail)) {
    if (decoration.kind === 'tree') tree(ctx, decoration.x, decoration.y, decoration.rune)
    else mushroom(ctx, decoration.x, decoration.y, frame)
  }
  for (let i = 0; i < 22; i += 1) {
    const x = (i * 53 + Math.floor(frame / 12) * (i % 3 + 1)) % ASTRAVEL_WIDTH
    const y = (i * 37 + 23) % ASTRAVEL_HEIGHT
    pixel(ctx, i % 2 ? '#8cd7a1' : '#8abbd2', x, y, 2, 2)
  }
  trail.nodes.forEach((node) => landmark(ctx, node, frame, statuses[node.id]))
  drawPlayerAura(ctx, player.x, player.y, frame)
  pixel(ctx, '#11282b', player.x - 5, player.y - 2, 10, 3)
  const stride = walking ? Math.floor(frame / 8) % 3 : 0
  if (sprite?.complete && sprite.naturalWidth >= 128 && sprite.naturalHeight >= 128) {
    const row = { down: 0, left: 1, right: 2, up: 3 }[facing]
    ctx.drawImage(sprite, stride * 32, row * 32, 32, 32, Math.round(player.x - 8), Math.round(player.y - 16), 16, 16)
  } else drawPixelActor(ctx, player.x, player.y, facing, stride, ACTOR_PALETTES[variant], WORLD_ACTOR_SCALE)
}
