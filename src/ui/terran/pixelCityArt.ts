import { content } from '../../content/catalog'
import { TERRAN_LOCATION_IDS, type TerranLocationId } from '../../content/terran'
import type { CityActor } from './cityCast'
import type { MovingCityActor } from './cityLife'
import { ACTOR_PALETTES, drawPixelActor, drawPlayerAura, WORLD_ACTOR_SCALE, type ActorFacing } from './pixelActorArt'
import { PLAYER_HOME_CENTER, PLAYER_HOME_DOOR } from './roomContent'

export const CITY_WIDTH = 384
export const CITY_HEIGHT = 256
export type WorldPoint = { x: number; y: number }

export const getCityPoint = (id: TerranLocationId): WorldPoint => {
  const { x, y } = content.terranLocations[id].mapPosition
  return { x: Math.round(x * CITY_WIDTH / 100), y: Math.round(y * CITY_HEIGHT / 100) }
}

export const getCityDoor = (id: TerranLocationId): WorldPoint => {
  const point = getCityPoint(id)
  return id === 'location_terran_portal_plaza' ? { x: point.x, y: point.y + 20 } : { x: point.x, y: point.y + 24 }
}

const colors = {
  grass: '#273f38', grassLight: '#345044', grassDark: '#1c342f', road: '#786a54',
  roadLight: '#938269', stone: '#b0a18a', ink: '#121b26', wall: '#8c7560',
  roof: '#3e5269', roofLit: '#637d8d', wood: '#594435', glow: '#54b7d9',
}

const drawBuilding = (ctx: CanvasRenderingContext2D, id: TerranLocationId, frame: number) => {
  const p = getCityPoint(id)
  if (id === 'location_terran_portal_plaza') {
    ctx.fillStyle = '#45535c'; ctx.fillRect(p.x - 31, p.y - 16, 62, 40)
    ctx.fillStyle = '#968875'; ctx.fillRect(p.x - 27, p.y - 12, 54, 32)
    ctx.fillStyle = '#303d4d'; ctx.fillRect(p.x - 19, p.y - 11, 38, 30)
    ctx.fillStyle = '#286382'; ctx.fillRect(p.x - 15, p.y - 7, 30, 22)
    ctx.fillStyle = frame % 48 < 24 ? '#50b6d9' : '#86e1eb'; ctx.fillRect(p.x - 9, p.y - 10, 18, 24)
    ctx.fillStyle = '#d4f5eb'; ctx.fillRect(p.x - 3, p.y - 7, 6, 17)
    return
  }
  const roofs: Record<string, string> = {
    knowledge: '#55638b', exploration: '#7e6151', bond: '#586f75',
    defense: '#7f5952', clan: '#785a80', healing: '#537b6a',
  }
  const location = content.terranLocations[id]
  const roof = roofs[location.tone] ?? colors.roof
  ctx.fillStyle = '#18272c'; ctx.fillRect(p.x - 23, p.y - 18, 46, 36)
  ctx.fillStyle = colors.wall; ctx.fillRect(p.x - 18, p.y - 9, 36, 27)
  ctx.fillStyle = colors.wood; ctx.fillRect(p.x - 6, p.y + 4, 12, 14)
  ctx.fillStyle = '#d3ac70'; ctx.fillRect(p.x - 4, p.y + 5, 8, 11)
  ctx.fillStyle = '#3a3433'; ctx.fillRect(p.x - 19, p.y - 14, 38, 7)
  ctx.fillStyle = roof
  ctx.beginPath()
  ctx.moveTo(p.x - 23, p.y - 14); ctx.lineTo(p.x - 14, p.y - 24)
  ctx.lineTo(p.x + 13, p.y - 24); ctx.lineTo(p.x + 23, p.y - 14)
  ctx.lineTo(p.x + 23, p.y - 8); ctx.lineTo(p.x - 23, p.y - 8); ctx.closePath(); ctx.fill()
  ctx.fillStyle = colors.roofLit; ctx.fillRect(p.x - 12, p.y - 21, 23, 2)
  ctx.fillStyle = colors.ink; ctx.fillRect(p.x - 15, p.y + 1, 7, 7); ctx.fillRect(p.x + 8, p.y + 1, 7, 7)
  ctx.fillStyle = colors.glow; ctx.fillRect(p.x - 13, p.y + 3, 3, 3); ctx.fillRect(p.x + 10, p.y + 3, 3, 3)
  ctx.fillStyle = '#584c41'; ctx.fillRect(p.x - 8, p.y + 17, 16, 3)
}

/** Personal residence: additional property, not another Terran institution. */
const drawPlayerHome = (ctx: CanvasRenderingContext2D, unlocked: boolean) => {
  const { x, y } = PLAYER_HOME_CENTER
  ctx.fillStyle = '#132633'; ctx.fillRect(x - 23, y - 18, 46, 37)
  ctx.fillStyle = '#8c806f'; ctx.fillRect(x - 18, y - 8, 36, 25)
  ctx.fillStyle = unlocked ? '#527896' : '#3e5068'
  ctx.beginPath()
  ctx.moveTo(x - 23, y - 12); ctx.lineTo(x - 12, y - 25)
  ctx.lineTo(x + 13, y - 25); ctx.lineTo(x + 23, y - 12)
  ctx.lineTo(x + 23, y - 7); ctx.lineTo(x - 23, y - 7); ctx.closePath(); ctx.fill()
  ctx.fillStyle = '#d6ad6c'; ctx.fillRect(x - 16, y - 5, 7, 7); ctx.fillRect(x + 9, y - 5, 7, 7)
  ctx.fillStyle = unlocked ? '#63cbd8' : '#263744'
  ctx.fillRect(x - 14, y - 3, 3, 3); ctx.fillRect(x + 11, y - 3, 3, 3)
  ctx.fillStyle = '#654934'; ctx.fillRect(x - 6, y + 3, 12, 15)
  ctx.fillStyle = unlocked ? '#e5ba6a' : '#6d6661'; ctx.fillRect(x - 4, y + 5, 8, 12)
  ctx.fillStyle = '#aa8e70'; ctx.fillRect(x - 10, y + 18, 20, 3)
  if (unlocked) { ctx.fillStyle = '#77dbe1'; ctx.fillRect(x - 2, y - 24, 4, 3) }
}

const drawTree = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
  ctx.fillStyle = '#172f2c'; ctx.fillRect(x - 7, y - 12, 14, 14)
  ctx.fillStyle = '#47654c'; ctx.fillRect(x - 5, y - 15, 10, 10)
  ctx.fillStyle = '#35553f'; ctx.fillRect(x - 8, y - 10, 16, 7)
  ctx.fillStyle = '#8b6449'; ctx.fillRect(x - 2, y - 3, 4, 8)
  ctx.fillStyle = '#71936a'; ctx.fillRect(x - 4, y - 13, 4, 3)
}

export const drawPixelCity = (
  ctx: CanvasRenderingContext2D,
  player: WorldPoint,
  playerSprite: HTMLImageElement | null,
  frame: number,
  walking: boolean,
  facing: ActorFacing,
  playerPalette: string,
  cityCast: readonly (CityActor | MovingCityActor)[],
  homeUnlocked = false,
) => {
  ctx.imageSmoothingEnabled = false
  ctx.clearRect(0, 0, CITY_WIDTH, CITY_HEIGHT)
  ctx.fillStyle = colors.grass; ctx.fillRect(0, 0, CITY_WIDTH, CITY_HEIGHT)
  for (let ty = 0; ty < CITY_HEIGHT; ty += 16) {
    for (let tx = 0; tx < CITY_WIDTH; tx += 16) {
      const n = (tx * 19 + ty * 37 + tx * ty) % 7
      ctx.fillStyle = n < 3 ? colors.grassDark : colors.grassLight
      ctx.fillRect(tx + 3 + n, ty + 5, 2, 2)
      if (n === 1) ctx.fillRect(tx + 11, ty + 11, 2, 3)
    }
  }
  const plaza = getCityPoint('location_terran_portal_plaza')
  for (const id of TERRAN_LOCATION_IDS) {
    if (id === 'location_terran_portal_plaza') continue
    const to = getCityDoor(id)
    ctx.fillStyle = colors.road
    ctx.fillRect(Math.min(plaza.x, to.x) - 9, plaza.y - 9, Math.abs(plaza.x - to.x) + 18, 18)
    ctx.fillRect(to.x - 9, Math.min(plaza.y, to.y) - 9, 18, Math.abs(plaza.y - to.y) + 18)
  }
  ctx.fillStyle = colors.road
  ctx.fillRect(PLAYER_HOME_DOOR.x - 9, PLAYER_HOME_DOOR.y, 18, plaza.y - PLAYER_HOME_DOOR.y - 17)
  for (let x = 0; x < CITY_WIDTH; x += 31) {
    for (let y = 0; y < CITY_HEIGHT; y += 27) {
      const n = (x * 31 + y * 7) % 11
      if (n < 3 && (x < 22 || y < 17 || x > CITY_WIDTH - 25 || y > CITY_HEIGHT - 20)) drawTree(ctx, x + 5, y + 7)
    }
  }
  ctx.fillStyle = '#b09c7c'; ctx.fillRect(plaza.x - 37, plaza.y - 25, 74, 56)
  ctx.fillStyle = colors.roadLight; ctx.fillRect(plaza.x - 32, plaza.y - 20, 64, 46)
  TERRAN_LOCATION_IDS.forEach((id) => drawBuilding(ctx, id, frame))
  drawPlayerHome(ctx, homeUnlocked)
  const stride = walking ? Math.floor(frame / 8) % 3 : 0
  const renderPlayer = () => {
    drawPlayerAura(ctx, player.x, player.y, frame)
    ctx.fillStyle = '#162728'; ctx.fillRect(Math.round(player.x - 5), Math.round(player.y - 2), 10, 3)
    if (playerSprite?.complete && playerSprite.naturalWidth >= 128 && playerSprite.naturalHeight >= 128) {
      const row = { down: 0, left: 1, right: 2, up: 3 }[facing]
      ctx.drawImage(playerSprite, stride * 32, row * 32, 32, 32, Math.round(player.x - 8), Math.round(player.y - 16), 16, 16)
    } else {
      drawPixelActor(ctx, player.x, player.y, facing, stride,
        ACTOR_PALETTES[playerPalette] ?? ACTOR_PALETTES.terririan, WORLD_ACTOR_SCALE)
    }
  }
  const actors = [...cityCast].sort((a, b) => a.point.y - b.point.y)
  let playerDrawn = false
  for (const actor of actors) {
    if (!playerDrawn && player.y <= actor.point.y) { renderPlayer(); playerDrawn = true }
    ctx.fillStyle = '#1a282b'; ctx.fillRect(actor.point.x - 5, actor.point.y - 2, 10, 3)
    const palette = ACTOR_PALETTES[actor.palette] ?? ACTOR_PALETTES.knowledge
    const variantPalette = actor.variant === 0 ? palette : actor.variant === 1
      ? { ...palette, hair: '#c7b594', accent: '#a5c3b0' }
      : { ...palette, hair: '#5a434d', skin: '#c08e7c', accent: '#d3a0bd' }
    const movingActor = actor as MovingCityActor
    drawPixelActor(ctx, actor.point.x, actor.point.y, movingActor.facing ?? 'down',
      movingActor.moving ? Math.floor(frame / 8) % 3 : 0, variantPalette, 1)
    if (actor.marker) {
      ctx.fillStyle = actor.marker === '!' ? '#f1c76c' : '#77d2a8'
      ctx.fillRect(actor.point.x - 3, actor.point.y - 23, 6, 6)
      ctx.fillStyle = colors.ink; ctx.fillRect(actor.point.x, actor.point.y - 22, 1, 3)
    }
  }
  if (!playerDrawn) renderPlayer()
}
