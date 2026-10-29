import { content } from '../../content/catalog'
import type { TerranLocationId } from '../../content/terran'
import type { InteriorResident } from './interiorLayout'
import type { WorldPoint } from './pixelCityArt'
import { ACTOR_PALETTES, drawPixelActor, drawPlayerAura, type ActorFacing } from './pixelActorArt'

const tones: Record<string, { wall: string; trim: string; curtain: string }> = {
  knowledge: { wall: '#34415e', trim: '#b89e63', curtain: '#6880ad' },
  exploration: { wall: '#374a3c', trim: '#ba975d', curtain: '#84966f' },
  bond: { wall: '#344e54', trim: '#d1a86d', curtain: '#6cb5b5' },
  defense: { wall: '#554245', trim: '#c9a26d', curtain: '#a97470' },
  clan: { wall: '#4c3b58', trim: '#d8b479', curtain: '#9a7ba6' },
  healing: { wall: '#33534d', trim: '#d2b781', curtain: '#77b3a1' },
}

/** Decorative tilemap VISUAL_DRAFT. No interactive trigger is derived from colors. */
export function drawTerranInterior(
  ctx: CanvasRenderingContext2D,
  locationId: TerranLocationId,
  player: WorldPoint,
  sheet: HTMLImageElement | null,
  frame: number,
  facing: ActorFacing,
  walking: boolean,
  portraitId: string,
  residents: readonly InteriorResident[],
) {
  ctx.imageSmoothingEnabled = false
  const location = content.terranLocations[locationId]
  const theme = tones[location.tone] ?? tones.knowledge
  ctx.fillStyle = '#091522'; ctx.fillRect(0, 0, 384, 256)
  ctx.fillStyle = theme.wall; ctx.fillRect(12, 13, 360, 82)
  ctx.fillStyle = '#182735'; ctx.fillRect(12, 88, 360, 157)
  ctx.fillStyle = '#ad9470'; ctx.fillRect(20, 91, 344, 148)
  for (let y = 94; y < 241; y += 16) {
    for (let x = 25; x < 361; x += 16) {
      const n = (x * 5 + y * 11) % 5
      ctx.fillStyle = n < 2 ? '#947958' : '#a68a65'
      ctx.fillRect(x, y, 15, 15)
      ctx.fillStyle = '#b09b7b'; ctx.fillRect(x, y, 14, 1)
    }
  }
  ctx.fillStyle = '#1b2834'; ctx.fillRect(12, 13, 360, 8)
  ctx.fillStyle = theme.trim; ctx.fillRect(13, 84, 358, 5)
  // Windows, wall banner and shelves.
  for (const x of [52, 308]) {
    ctx.fillStyle = '#19212d'; ctx.fillRect(x, 31, 32, 44)
    ctx.fillStyle = '#4b95ac'; ctx.fillRect(x + 4, 35, 24, 35)
    ctx.fillStyle = '#82cbd2'; ctx.fillRect(x + 7, 39, 18, 4)
    ctx.fillStyle = '#263c52'; ctx.fillRect(x + 15, 35, 3, 36)
    ctx.fillStyle = theme.curtain; ctx.fillRect(x - 3, 30, 6, 43); ctx.fillRect(x + 29, 30, 6, 43)
  }
  ctx.fillStyle = '#1e2d3c'; ctx.fillRect(165, 27, 54, 52)
  ctx.fillStyle = theme.trim; ctx.fillRect(170, 30, 44, 4)
  ctx.fillStyle = theme.curtain; ctx.fillRect(183, 39, 17, 30)
  ctx.fillStyle = '#b6c9c6'; ctx.fillRect(188, 44, 6, 12)
  // Bookshelf on left and service cabinet on right.
  for (const x of [25, 333]) {
    ctx.fillStyle = '#4d3729'; ctx.fillRect(x, 99, 26, 75)
    for (const y of [108, 131, 154]) {
      ctx.fillStyle = '#bd8f59'; ctx.fillRect(x + 2, y, 22, 3)
      ctx.fillStyle = theme.curtain; ctx.fillRect(x + 5, y - 12, 3, 12)
      ctx.fillStyle = '#c9b88d'; ctx.fillRect(x + 9, y - 16, 4, 16)
      ctx.fillStyle = '#6e8279'; ctx.fillRect(x + 15, y - 10, 5, 10)
    }
  }
  // Central study table and sigil rug; collision matches interiorLayout.ts.
  ctx.fillStyle = '#715139'; ctx.fillRect(170, 126, 43, 18)
  ctx.fillStyle = '#b78a57'; ctx.fillRect(172, 125, 39, 5)
  ctx.fillStyle = '#c2b59b'; ctx.fillRect(184, 127, 12, 7)
  ctx.fillStyle = '#31525c'; ctx.fillRect(125, 185, 134, 30)
  ctx.fillStyle = theme.trim; ctx.fillRect(129, 188, 126, 2)
  ctx.fillStyle = '#496576'; ctx.fillRect(146, 193, 94, 17)
  // Glowing service sigil, exit door.
  ctx.fillStyle = '#0b2430'; ctx.fillRect(299, 188, 36, 31)
  ctx.fillStyle = '#42bac1'; ctx.fillRect(314, 190, 8, 20)
  ctx.fillStyle = '#aadfdc'; ctx.fillRect(317, 194, 2, 14)
  ctx.fillStyle = '#3d2d25'; ctx.fillRect(166, 231, 52, 25)
  ctx.fillStyle = '#b78b50'; ctx.fillRect(172, 234, 40, 6)
  ctx.fillStyle = '#60d0db'; ctx.fillRect(184, 237, 16, 3)
  const drawPlayer = () => {
    drawPlayerAura(ctx, player.x, player.y, frame)
    if (sheet?.complete && sheet.naturalWidth >= 128 && sheet.naturalHeight >= 128) {
      const row = { down: 0, left: 1, right: 2, up: 3 }[facing]
      ctx.drawImage(sheet, (walking ? Math.floor(frame / 8) % 3 : 0) * 32, row * 32, 32, 32,
        Math.round(player.x - 8), Math.round(player.y - 16), 16, 16)
    } else {
      drawPixelActor(ctx, player.x, player.y, facing, walking ? Math.floor(frame / 8) % 3 : 0,
        ACTOR_PALETTES[portraitId.includes('sigil') ? 'sigil' : 'terririan'], 1)
    }
  }
  const ordered = [...residents].sort((a, b) => a.position.y - b.position.y)
  let drawn = false
  for (const resident of ordered) {
    if (!drawn && player.y < resident.position.y) { drawPlayer(); drawn = true }
    const { x, y } = resident.position
    ctx.fillStyle = '#1b2731'; ctx.fillRect(x - 6, y - 2, 12, 3)
    drawPixelActor(ctx, x, y, 'down', 0, ACTOR_PALETTES[resident.palette] ?? ACTOR_PALETTES.knowledge, 1)
    if (resident.marker) {
      ctx.fillStyle = '#f2c86e'; ctx.fillRect(x - 3, y - 23, 7, 7)
      ctx.fillStyle = '#19212d'; ctx.fillRect(x, y - 22, 2, 4)
    }
  }
  if (!drawn) drawPlayer()
}
