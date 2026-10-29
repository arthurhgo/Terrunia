import type { DungeonDefinition, DungeonRoomDefinition } from '../../content/types'
import { ACTOR_PALETTES, drawPixelActor, type ActorFacing } from '../terran/pixelActorArt'
import type { WorldPoint } from '../terran/pixelCityArt'
import { DUNGEON_GRID, DUNGEON_HEIGHT, DUNGEON_WIDTH, isDungeonWalkable } from './dungeonNavigation'

type DrawState = { discovered: ReadonlySet<string>; defeated: boolean }
const fill = (ctx: CanvasRenderingContext2D, color: string, x: number, y: number, w: number, h: number) => {
  ctx.fillStyle = color
  ctx.fillRect(Math.round(x), Math.round(y), w, h)
}

function mushroom(ctx: CanvasRenderingContext2D, x: number, y: number, purple: boolean, frame: number) {
  fill(ctx, '#91a9a0', x - 2, y - 3, 4, 7)
  fill(ctx, purple ? '#765d98' : '#568c7e', x - 7, y - 9, 14, 6)
  fill(ctx, purple ? '#c6a0d8' : '#9acfb1', x - 5, y - 11, 10, 4)
  if (Math.floor(frame / 20) % 2 === 0) fill(ctx, '#ece3cc', x, y - 9, 2, 2)
}

function rune(ctx: CanvasRenderingContext2D, x: number, y: number) {
  fill(ctx, '#526276', x - 6, y - 8, 12, 16)
  fill(ctx, '#b4a6ba', x - 2, y - 6, 4, 11)
  fill(ctx, '#7fbbbd', x - 4, y - 3, 8, 2)
}

function landmark(ctx: CanvasRenderingContext2D, room: DungeonRoomDefinition, frame: number, state: DrawState) {
  const { x, y } = room.landmark
  if (room.kind === 'entry') {
    fill(ctx, '#4d534d', x - 12, y - 13, 24, 17)
    fill(ctx, '#b9b396', x - 9, y - 16, 18, 6)
    fill(ctx, '#314954', x - 7, y - 8, 14, 11)
    fill(ctx, '#83c5bf', x - 2, y - 6, 4, 9)
  }
  if (room.kind === 'spores') {
    mushroom(ctx, x - 8, y, true, frame)
    mushroom(ctx, x + 9, y + 2, false, frame)
  }
  if (room.kind === 'roots') {
    rune(ctx, x, y - 6)
    fill(ctx, '#674c5e', x - 20, y - 3, 12, 4)
    fill(ctx, '#674c5e', x + 9, y - 7, 12, 5)
  }
  if (room.kind === 'boss') {
    fill(ctx, '#26353b', x - 22, y - 12, 44, 18)
    fill(ctx, '#66546c', x - 17, y - 22, 34, 24)
    fill(ctx, '#917093', x - 12, y - 28, 24, 14)
    if (!state.defeated) {
      fill(ctx, '#ebc9d8', x - 10, y - 15, 5, 4)
      fill(ctx, '#ebc9d8', x + 5, y - 15, 5, 4)
    } else fill(ctx, '#5e8c86', x - 12, y - 18, 24, 6)
  }
  const discovered = state.discovered.has(room.id)
  fill(ctx, discovered ? '#76b8a1' : '#e3c27b', x - 3, y - 38, 6, 6)
  fill(ctx, discovered ? '#b7e5c4' : '#f8e9b0', x - 1, y - 36, 2, 2)
}

/** VISUAL_DRAFT: fixed 384x256 bitmap and integer pixels; collision is separate. */
export function drawFungalDungeon(
  ctx: CanvasRenderingContext2D, dungeon: DungeonDefinition, player: WorldPoint,
  sprite: HTMLImageElement | null, frame: number, walking: boolean,
  facing: ActorFacing, variant: 'terririan' | 'sigil', state: DrawState,
) {
  ctx.imageSmoothingEnabled = false
  ctx.clearRect(0, 0, DUNGEON_WIDTH, DUNGEON_HEIGHT)
  fill(ctx, '#101c24', 0, 0, DUNGEON_WIDTH, DUNGEON_HEIGHT)

  for (let y = 0; y < DUNGEON_HEIGHT; y += DUNGEON_GRID) {
    for (let x = 0; x < DUNGEON_WIDTH; x += DUNGEON_GRID) {
      const point = { x: x + 4, y: y + 4 }
      if (isDungeonWalkable(point, dungeon)) {
        const seed = (x * 11 + y * 7 + x * y) % 23
        fill(ctx, seed < 7 ? '#39494a' : '#2a3d42', x, y, 8, 8)
        if (seed % 5 === 0) fill(ctx, '#44605d', x + 2, y + 3, 3, 2)
        if (seed === 11) fill(ctx, '#6c7175', x, y + 7, 8, 1)
      } else {
        const adjacent = [[8, 0], [-8, 0], [0, 8], [0, -8]]
          .some(([dx, dy]) => isDungeonWalkable({ x: point.x + dx, y: point.y + dy }, dungeon))
        fill(ctx, adjacent ? '#7c6b6c' : '#182b32', x, y, 8, 8)
        if (adjacent) fill(ctx, '#46474f', x, y + 5, 8, 3)
      }
    }
  }

  for (const room of dungeon.rooms) {
    const { x, y } = room.landmark
    const decorative = [
      { x: x - 31, y: y - 19 }, { x: x + 25, y: y + 18 },
      { x: x - 24, y: y + 19 },
    ]
    for (let i = 0; i < decorative.length; i += 1) {
      const point = decorative[i]
      if (isDungeonWalkable(point, dungeon)) mushroom(ctx, point.x, point.y, i % 2 === 0, frame)
    }
    landmark(ctx, room, frame, state)
  }
  for (let index = 0; index < 15; index += 1) {
    const room = dungeon.rooms[index % dungeon.rooms.length]
    const { rect } = room
    const x = rect.x + 12 + ((index * 31 + Math.floor(frame / 24)) % Math.max(1, rect.width - 24))
    const y = rect.y + 12 + ((index * 17) % Math.max(1, rect.height - 24))
    if (isDungeonWalkable({ x, y }, dungeon)) fill(ctx, index % 2 ? '#a5b3d3' : '#b5cfad', x, y, 2, 2)
  }

  fill(ctx, '#17282d', player.x - 9, player.y - 4, 18, 4)
  const stride = walking ? Math.floor(frame / 8) % 3 : 0
  if (sprite?.complete && sprite.naturalWidth >= 128 && sprite.naturalHeight >= 128) {
    const row = { down: 0, left: 1, right: 2, up: 3 }[facing]
    ctx.drawImage(sprite, stride * 32, row * 32, 32, 32, Math.round(player.x - 16), Math.round(player.y - 32), 32, 32)
  } else drawPixelActor(ctx, player.x, player.y, facing, stride, ACTOR_PALETTES[variant], 2)
}
