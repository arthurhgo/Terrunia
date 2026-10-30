import { drawActorImage, getWorldSprite } from './worldSprites'
import { getPresencePortrait } from '../../content/npcVisuals'
import { PLAYER_HOME_INTERIOR_ID, roomFurniture, type TerranInteriorId } from './roomContent'
import { getRoomPlan } from './roomGeometry'
import type { InteriorResident } from './interiorLayout'
import type { WorldPoint } from './pixelCityArt'
import { ACTOR_PALETTES, drawPixelActor, drawPlayerAura, type ActorFacing } from './pixelActorArt'

/** Seven distinctive interiors, rendered from one geometry and furniture registry. VISUAL_DRAFT. */
const palettes = {
  forge: { wall: '#382f30', floor: '#665348', light: '#8e7160', trim: '#c9915b', glow: '#f6ac65' },
  slate: { wall: '#25344b', floor: '#555d69', light: '#778399', trim: '#bfa77c', glow: '#87b5db' },
  moss: { wall: '#293d34', floor: '#566857', light: '#879677', trim: '#c1a879', glow: '#83dbb0' },
  arcane: { wall: '#213e49', floor: '#52606a', light: '#879ca3', trim: '#e0b76d', glow: '#49e1df' },
  stone: { wall: '#3d3940', floor: '#626267', light: '#8c898c', trim: '#c8a17b', glow: '#dba77d' },
  ceremony: { wall: '#362d48', floor: '#655473', light: '#987ca7', trim: '#e0bd83', glow: '#c7a2ff' },
  wood: { wall: '#35514b', floor: '#947959', light: '#b79b75', trim: '#ddc091', glow: '#92dfbd' },
  home: { wall: '#293d55', floor: '#856d56', light: '#b09a79', trim: '#d9b87a', glow: '#7cdce5' },
} as const

export function drawTerranInterior(
  ctx: CanvasRenderingContext2D,
  locationId: TerranInteriorId,
  player: WorldPoint,
  sheet: HTMLImageElement | null,
  frame: number,
  facing: ActorFacing,
  walking: boolean,
  portraitId: string,
  residents: readonly InteriorResident[],
) {
  const plan = getRoomPlan(locationId)
  const theme = palettes[plan.tile]
  const { floor, obstacles } = plan
  ctx.imageSmoothingEnabled = false

  const block = (x: number, y: number, w: number, h: number, color: string) => {
    ctx.fillStyle = color
    ctx.fillRect(Math.round(x), Math.round(y), w, h)
  }

  // The shape itself is different in every home; unused canvas is dark exterior.
  block(0, 0, 384, 256, '#08111d')
  for (const [i, area] of floor.entries()) {
    block(area.x - 7, area.y - 8, area.w + 14, area.h + 15, '#142431')
    block(area.x - 3, area.y - 4, area.w + 6, area.h + 8, theme.trim)
    block(area.x, area.y, area.w, area.h, theme.wall)
    if (i === 0) {
      // Rear wall is higher in library/Clan Hall and wider in field buildings.
      const wallHeight = ['slate', 'ceremony'].includes(plan.tile) ? 38 : 29
      block(area.x + 4, area.y + 3, area.w - 8, wallHeight, theme.wall)
      block(area.x + 5, area.y + wallHeight, area.w - 10, 3, theme.trim)
      for (const x of [area.x + Math.floor(area.w / 4), area.x + Math.floor(area.w * .72)]) {
        block(x - 10, area.y + 8, 20, 24, '#142734')
        block(x - 7, area.y + 11, 14, 17, '#32647c')
        block(x - 4, area.y + 14, 8, 4, theme.glow)
        block(x - 1, area.y + 11, 2, 17, '#1c3443')
      }
    }
  }

  // Clip to the union of traversable floor shapes: no rectangular template remains.
  ctx.save()
  ctx.beginPath()
  for (const area of floor) ctx.rect(area.x, area.y, area.w, area.h)
  ctx.clip()
  block(0, 0, 384, 256, theme.floor)
  for (let y = 0; y < 256; y += 12) {
    for (let x = 0; x < 384; x += 16) {
      const n = (Math.floor(x / 16) * 7 + Math.floor(y / 12) * 13) % 5
      block(x, y, 15, 11, n === 0 ? theme.light : theme.floor)
      block(x, y, 14, 1, theme.trim + '55')
    }
  }
  // A room-specific floor feature hints at its use, without acting as collision.
  if (plan.tile === 'ceremony') {
    block(182, 155, 20, 60, '#493d68'); block(187, 160, 10, 50, '#9477a8')
  } else if (plan.tile === 'arcane') {
    block(121, 177, 140, 21, '#284d59'); block(137, 181, 110, 8, '#3c7783')
  } else if (plan.tile === 'moss') {
    block(94, 204, 196, 8, '#405b44')
    for (let i = 0; i < 8; i++) block(100 + i * 24, 206, 8, 2, '#7a9b78')
  } else if (plan.tile === 'home') {
    block(130, 175, 123, 34, '#40687a'); block(133, 178, 117, 28, '#537c81')
  } else if (plan.tile === 'slate') {
    for (let i = 0; i < 6; i++) block(144 + i * 13, 190, 9, 13, '#49516b')
  } else if (plan.tile === 'stone') {
    block(148, 188, 89, 14, '#4d4548'); block(152, 190, 82, 3, '#937b6a')
  } else {
    block(113, 203, 154, 11, '#766c52'); block(117, 205, 145, 3, '#b09b73')
  }
  ctx.restore()

  // Rear walls and windows are painted above floor tile textures.
  const back = floor[0]
  if (back) {
    const wallHeight = ['slate', 'ceremony'].includes(plan.tile) ? 38 : 29
    block(back.x + 4, back.y + 3, back.w - 8, wallHeight, theme.wall)
    block(back.x + 5, back.y + wallHeight, back.w - 10, 3, theme.trim)
    for (const x of [back.x + Math.floor(back.w / 4), back.x + Math.floor(back.w * .72)]) {
      block(x - 10, back.y + 8, 20, 24, '#142734')
      block(x - 7, back.y + 11, 14, 17, '#32647c')
      block(x - 4, back.y + 14, 8, 4, theme.glow)
      block(x - 1, back.y + 11, 2, 17, '#1c3443')
    }
  }

  // Furniture silhouettes and hit targets share their IDs and positions.
  for (const item of roomFurniture[locationId]) {
    const { x, y } = item.point
    if (locationId === 'location_terran_forge' && item.id === 'forge_furnace') {
      block(x - 24, y - 25, 48, 30, '#332b2d'); block(x - 18, y - 22, 36, 25, '#8d6350')
      block(x - 13, y - 15, 26, 18, '#492e2b'); block(x - 10, y - 8, 20, 11, '#e7854f')
      block(x - 5, y - 11 + Math.floor(frame / 15) % 2, 10, 12, '#f7d18a')
    } else if (item.behavior === 'archive') {
      block(x - 21, y - 33, 42, 36, '#2b252b')
      block(x - 18, y - 30, 36, 31, '#835c39')
      for (let shelf = 0; shelf < 3; shelf++) {
        for (let book = 0; book < 6; book++) {
          const spine = ['#cc975e', '#557e8e', '#9a617c', '#628464'][((book + shelf * 3) % 4)]
          block(x - 15 + book * 5, y - 27 + shelf * 10, 4, 8, spine)
        }
        block(x - 18, y - 19 + shelf * 10, 36, 2, '#d1a46a')
      }
    } else if (item.behavior === 'rest') {
      block(x - 23, y - 16, 46, 21, '#4c3a32')
      block(x - 20, y - 14, 40, 16, '#49748e')
      block(x - 17, y - 12, 13, 8, '#f0e6c9')
    } else if (plan.tile === 'arcane' && item.behavior === 'inspect') {
      block(x - 14, y - 10, 28, 12, '#384e5c'); block(x - 9, y - 17, 17, 8, '#849fa9')
      block(x - 2, y - 20, 4, 8, theme.glow)
    } else if (plan.tile === 'ceremony' && item.behavior === 'inspect') {
      for (let i = 0; i < 4; i++) {
        block(x - 19 + i * 12, y - 31, 9, 29, ['#537c93','#53866f','#97668c','#b6a16e'][i])
        block(x - 17 + i * 12, y - 24, 5, 5, theme.trim)
      }
    } else if (item.behavior === 'inspect') {
      block(x - 17, y - 17, 34, 20, '#453c35')
      block(x - 14, y - 14, 28, 14, theme.trim)
      for (let i = 0; i < 4; i++) block(x - 11 + i * 6, y - 12, 3, 10, i % 2 ? theme.wall : theme.glow)
    } else {
      block(x - 19, y - 14, 38, 18, '#44382f')
      block(x - 16, y - 16, 32, 8, theme.trim)
      block(x - 8, y - 12, 16, 5, theme.glow)
    }
  }

  // Solid centerpiece matches the pathfinding obstacles and differs by room.
  for (const obstacle of obstacles) {
    block(obstacle.x - 2, obstacle.y + 3, obstacle.w + 4, obstacle.h, '#1a1a22')
    block(obstacle.x, obstacle.y, obstacle.w, obstacle.h - 2, '#594735')
    block(obstacle.x + 4, obstacle.y + 3, obstacle.w - 8, 4, theme.trim)
    if (plan.tile === 'arcane') block(obstacle.x + 12, obstacle.y + 2, obstacle.w - 24, 3, theme.glow)
  }

  // Room-specific EXIT is authoritative: door location follows navigation geometry.
  const door = plan.exit
  block(door.x - 14, door.y - 8, 28, 25, '#292421')
  block(door.x - 10, door.y - 5, 20, 19, '#5b4434')
  block(door.x - 7, door.y - 3, 14, 3, theme.trim)
  block(door.x - 4, door.y + 2, 8, 2, theme.glow)

  const drawPlayer = () => {
    drawPlayerAura(ctx, player.x, player.y, frame)
    if (!drawActorImage(ctx, sheet, player.x, player.y, facing, walking ? Math.floor(frame / 8) % 3 : 0)) {
      drawPixelActor(ctx, player.x, player.y, facing, 0, ACTOR_PALETTES[portraitId.includes('sigil') ? 'sigil' : 'terririan'], 1)
    }
  }

  const ordered = [...residents].sort((a, b) => a.position.y - b.position.y)
  let drawn = false
  for (const resident of ordered) {
    if (!drawn && player.y < resident.position.y) { drawPlayer(); drawn = true }
    const { x, y } = resident.position
    block(x - 6, y - 2, 12, 3, '#192631')
    if (!drawActorImage(ctx, getWorldSprite(getPresencePortrait(resident.presence)), x, y, 'down')) {
      drawPixelActor(ctx, x, y, 'down', 0, ACTOR_PALETTES[resident.palette] ?? ACTOR_PALETTES.knowledge, 1)
    }
  }
  if (!drawn) drawPlayer()

  // Player's home intentionally has no NPC by default.
  if (locationId === PLAYER_HOME_INTERIOR_ID) {
    block(145, 112, 92, 3, '#cbb17e')
  }
}
