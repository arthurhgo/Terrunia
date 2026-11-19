import { getPresencePortrait } from '../../content/npcVisuals'
import type { TerranNpcPresence } from '../../content/types'
import { drawEquipmentLayer } from '../characters/equipmentCanvas'
import type { VisualItem } from '../characters/equipmentVisuals'
import type { CityActor } from './cityCast'
import type { MovingCityActor } from './cityLife'
import { CITY_NPC_SIZE, type WorldPoint } from './cityWorld'
import { ACTOR_PALETTES, drawPixelActor, drawPlayerAura, WORLD_ACTOR_SCALE, type ActorFacing } from './pixelActorArt'
import { drawActorImage, getWorldSprite } from './worldSprites'

export function drawTerranPlayer(ctx: CanvasRenderingContext2D, { x, y }: WorldPoint,
  sheet: HTMLImageElement | null, frame: number, walking: boolean, facing: ActorFacing,
  palette: string, equipped: readonly VisualItem[]) {
  const stride = walking ? Math.floor(frame / 8) % 3 : 0
  drawPlayerAura(ctx, x, y, frame)
  ctx.fillStyle = '#162728'; ctx.fillRect(Math.round(x - 5), Math.round(y - 2), 10, 3)
  drawEquipmentLayer(ctx, equipped, 'back', facing, x, y)
  if (!drawActorImage(ctx, sheet, x, y, facing, stride, CITY_NPC_SIZE)) {
    drawPixelActor(ctx, x, y, facing, stride, ACTOR_PALETTES[palette] ?? ACTOR_PALETTES.terririan, WORLD_ACTOR_SCALE)
  }
  drawEquipmentLayer(ctx, equipped, 'front', facing, x, y)
}

export function drawTerranNpc(ctx: CanvasRenderingContext2D, actor: CityActor | MovingCityActor,
  point: WorldPoint, frame: number) {
  const palette = ACTOR_PALETTES[actor.palette] ?? ACTOR_PALETTES.knowledge
  const variantPalette = actor.variant === 0 ? palette : actor.variant === 1
    ? { ...palette, hair: '#c7b594', accent: '#a5c3b0' }
    : { ...palette, hair: '#5a434d', skin: '#c08e7c', accent: '#d3a0bd' }
  const movingActor = actor as MovingCityActor
  const facing = movingActor.facing ?? 'down'
  const stride = movingActor.moving ? Math.floor(frame / 8) % 3 : 0
  drawTerranResident(ctx, actor.presence, point, variantPalette, facing, stride)
}

export function drawTerranResident(ctx: CanvasRenderingContext2D, presence: TerranNpcPresence,
  { x, y }: WorldPoint, palette: typeof ACTOR_PALETTES.knowledge, facing: ActorFacing = 'down', stride = 0) {
  ctx.fillStyle = '#1a282b'; ctx.fillRect(x - 5, y - 2, 10, 3)
  if (!drawActorImage(ctx, getWorldSprite(getPresencePortrait(presence)), x, y, facing, stride, CITY_NPC_SIZE)) {
    drawPixelActor(ctx, x, y, facing, 0, palette, 1)
  }
}
