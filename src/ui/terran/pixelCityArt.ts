import { getPresencePortrait } from '../../content/npcVisuals'
import { drawActorImage, getWorldSprite } from './worldSprites'
import { content } from '../../content/catalog'
import { TERRAN_LOCATION_IDS, type TerranLocationId } from '../../content/terran'
import type { CityActor } from './cityCast'
import type { MovingCityActor } from './cityLife'
import { ACTOR_PALETTES, drawPixelActor, drawPlayerAura, WORLD_ACTOR_SCALE, type ActorFacing } from './pixelActorArt'
import { PLAYER_HOME_CENTER, PLAYER_HOME_DOOR } from './roomContent'
import { terranLandmarks, type TerranLandmark } from '../../content/terranExploration'
import { CITY_WIDTH, CITY_HEIGHT, CITY_VIEW_WIDTH, CITY_VIEW_HEIGHT, CITY_BUILDING_SCALE, CITY_NPC_SIZE, getCityCamera, getCityPoint, getCityDoor, type WorldPoint } from './cityWorld'

export { CITY_WIDTH, CITY_HEIGHT, getCityPoint, getCityDoor, type WorldPoint } from './cityWorld'

const colors = {
  grass: '#273f38', grassLight: '#345044', grassDark: '#1c342f', road: '#786a54',
  roadLight: '#938269', stone: '#b0a18a', ink: '#121b26', wall: '#8c7560',
  roof: '#3e5269', roofLit: '#637d8d', wood: '#594435', glow: '#54b7d9',
}

const drawBuilding = (ctx: CanvasRenderingContext2D, id: TerranLocationId, frame: number) => {
  const origin = getCityPoint(id)
  ctx.save(); ctx.translate(origin.x, origin.y); ctx.scale(CITY_BUILDING_SCALE, CITY_BUILDING_SCALE)
  const p = { x: 0, y: 0 }
  if (id === 'location_terran_portal_plaza') {
    ctx.fillStyle = '#45535c'; ctx.fillRect(p.x - 31, p.y - 16, 62, 40)
    ctx.fillStyle = '#968875'; ctx.fillRect(p.x - 27, p.y - 12, 54, 32)
    ctx.fillStyle = '#303d4d'; ctx.fillRect(p.x - 19, p.y - 11, 38, 30)
    ctx.fillStyle = '#286382'; ctx.fillRect(p.x - 15, p.y - 7, 30, 22)
    ctx.fillStyle = frame % 48 < 24 ? '#50b6d9' : '#86e1eb'; ctx.fillRect(p.x - 9, p.y - 10, 18, 24)
    ctx.fillStyle = '#d4f5eb'; ctx.fillRect(p.x - 3, p.y - 7, 6, 17)
    ctx.restore(); return
  }
  const roofs: Record<string, string> = {
    knowledge: '#55638b', exploration: '#7e6151', bond: '#586f75',
    forge: '#9c573d', defense: '#7f5952', clan: '#785a80', healing: '#537b6a',
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
  if (location.viewKind === 'forge') {
    ctx.fillStyle = '#382b29'; ctx.fillRect(p.x + 12, p.y - 30, 8, 20)
    ctx.fillStyle = '#d99b62'; ctx.fillRect(p.x + 10, p.y - 33, 12, 4)
    ctx.fillStyle = frame % 40 < 20 ? '#f0a15e' : '#df6745'; ctx.fillRect(p.x - 13, p.y + 3, 4, 4)
    ctx.fillStyle = '#a5bdc6'; ctx.fillRect(p.x - 4, p.y - 13, 9, 3)
  }
  ctx.fillStyle = '#584c41'; ctx.fillRect(p.x - 8, p.y + 17, 16, 3)
  if (location.viewKind === 'workshop') {
    ctx.fillStyle = '#d3b26d'; ctx.fillRect(-23, -7, 46, 6)
    for (let x = -22; x < 22; x += 8) { ctx.fillStyle = '#814556'; ctx.fillRect(x, -7, 4, 6) }
  }
  if (location.tone === 'clan') {
    for (let i = 0; i < 4; i++) { ctx.fillStyle = ['#d6bb72', '#727fb5', '#62a69b', '#a26486'][i]; ctx.fillRect(-20 + i * 12, -6, 5, 14) }
  }
  if (location.tone === 'knowledge') { ctx.fillStyle = '#d2bb84'; ctx.fillRect(-14, -10, 27, 3) }
  if (location.tone === 'defense') {
    ctx.fillStyle = '#687884'; ctx.fillRect(-25, -13, 7, 34); ctx.fillRect(18, -13, 7, 34)
    ctx.fillStyle = '#d9b675'; ctx.fillRect(-24, -15, 5, 3); ctx.fillRect(19, -15, 5, 3)
  }
  ctx.restore()
}

/** Personal residence: additional property, not another Terran institution. */
const drawPlayerHome = (ctx: CanvasRenderingContext2D, unlocked: boolean) => {
  ctx.save(); ctx.translate(PLAYER_HOME_CENTER.x, PLAYER_HOME_CENTER.y); ctx.scale(CITY_BUILDING_SCALE, CITY_BUILDING_SCALE)
  const x = 0, y = 0
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
  ctx.restore()
}

const drawTree = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
  ctx.fillStyle = '#172f2c'; ctx.fillRect(x - 7, y - 12, 14, 14)
  ctx.fillStyle = '#47654c'; ctx.fillRect(x - 5, y - 15, 10, 10)
  ctx.fillStyle = '#35553f'; ctx.fillRect(x - 8, y - 10, 16, 7)
  ctx.fillStyle = '#8b6449'; ctx.fillRect(x - 2, y - 3, 4, 8)
  ctx.fillStyle = '#71936a'; ctx.fillRect(x - 4, y - 13, 4, 3)
}

function drawLandmark(ctx: CanvasRenderingContext2D, landmark: TerranLandmark, frame: number) {
  const { x, y } = landmark.point
  ctx.fillStyle = '#1a302d'; ctx.fillRect(x - landmark.halfWidth - 3, y - 3, landmark.halfWidth * 2 + 6, 11)
  if (landmark.kind === 'fountain') {
    ctx.fillStyle = '#83948a'; ctx.fillRect(x - 21, y - 10, 42, 17)
    ctx.fillStyle = '#2e6977'; ctx.fillRect(x - 17, y - 8, 34, 11)
    ctx.fillStyle = '#6da9ae'; ctx.fillRect(x - 13 + frame % 3, y - 5, 10, 2); ctx.fillRect(x + 5, y, 9, 2)
    ctx.fillStyle = '#c3b48d'; ctx.fillRect(x - 4, y - 24, 8, 24); ctx.fillRect(x - 8, y - 25, 16, 4)
    ctx.fillStyle = '#82d4d0'; ctx.fillRect(x - 2, y - 29, 4, 6)
  } else if (landmark.kind === 'board') {
    ctx.fillStyle = '#503d30'; ctx.fillRect(x - 12, y - 23, 24, 20); ctx.fillRect(x - 10, y - 6, 3, 12); ctx.fillRect(x + 7, y - 6, 3, 12)
    ctx.fillStyle = '#b4a078'; ctx.fillRect(x - 10, y - 21, 20, 15)
    for (let i = 0; i < 3; i++) { ctx.fillStyle = '#e4d6ad'; ctx.fillRect(x - 8 + i * 6, y - 18 + i % 2 * 3, 4, 7) }
    ctx.fillStyle = '#7ccbe2'; ctx.fillRect(x - 2, y - 25, 4, 4)
  } else if (landmark.kind === 'garden') {
    ctx.fillStyle = '#85674a'; ctx.fillRect(x - 23, y - 10, 46, 18)
    ctx.fillStyle = '#453d2b'; ctx.fillRect(x - 20, y - 8, 40, 13)
    for (let i = 0; i < 6; i++) {
      ctx.fillStyle = '#679455'; ctx.fillRect(x - 18 + i * 7, y - 9, 4, 10)
      ctx.fillStyle = i % 2 ? '#c6c780' : '#a18ab8'; ctx.fillRect(x - 17 + i * 7, y - 11, 3, 3)
    }
  } else if (landmark.kind === 'obelisk') {
    ctx.fillStyle = '#5f716d'; ctx.fillRect(x - 10, y - 4, 20, 7); ctx.fillRect(x - 6, y - 29, 12, 25)
    ctx.fillStyle = '#a4b6aa'; ctx.fillRect(x - 5, y - 28, 3, 22)
    ctx.fillStyle = frame % 60 < 30 ? '#6ab3c7' : '#b2d9d0'; ctx.fillRect(x + 1, y - 23, 2, 5); ctx.fillRect(x - 1, y - 15, 4, 2)
  } else if (landmark.kind === 'crates') {
    for (const [dx, dy] of [[-16, -7], [2, -7], [-4, -19]]) {
      ctx.fillStyle = '#51412f'; ctx.fillRect(x + dx, y + dy, 16, 13)
      ctx.fillStyle = '#a08152'; ctx.fillRect(x + dx + 1, y + dy + 1, 14, 2); ctx.fillRect(x + dx + 6, y + dy + 2, 3, 10)
    }
  } else {
    ctx.fillStyle = '#b18c58'; ctx.fillRect(x - 2, y - 26, 4, 31); ctx.fillRect(x - 14, y - 19, 28, 4)
    ctx.fillStyle = '#586b76'; ctx.fillRect(x - 8, y - 21, 16, 17)
    ctx.fillStyle = '#cab581'; ctx.fillRect(x - 2, y - 18, 4, 11)
  }
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
  camera: WorldPoint = getCityCamera(player),
) => {
  ctx.imageSmoothingEnabled = false
  ctx.clearRect(0, 0, CITY_VIEW_WIDTH, CITY_VIEW_HEIGHT)
  ctx.save(); ctx.translate(-camera.x, -camera.y)
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
    const p = getCityPoint(id)
    ctx.fillStyle = id === 'location_terran_bond_workshop' ? '#53584a' : '#35483d'
    ctx.fillRect(p.x - 58, p.y - 48, 116, 109)
  }
  for (const id of TERRAN_LOCATION_IDS) {
    if (id === 'location_terran_portal_plaza') continue
    const to = getCityDoor(id)
    ctx.fillStyle = colors.road
    ctx.fillRect(Math.min(plaza.x, to.x) - 13, plaza.y - 13, Math.abs(plaza.x - to.x) + 26, 26)
    ctx.fillRect(to.x - 13, Math.min(plaza.y, to.y) - 13, 26, Math.abs(plaza.y - to.y) + 26)
  }
  for (const landmark of terranLandmarks) {
    const p = landmark.point
    ctx.fillStyle = colors.road
    ctx.fillRect(Math.min(plaza.x, p.x) - 7, p.y + landmark.bottom + 5, Math.abs(plaza.x - p.x) + 14, 14)
    ctx.fillRect(plaza.x - 7, Math.min(plaza.y, p.y), 14, Math.abs(plaza.y - p.y) + 15)
  }
  ctx.fillStyle = colors.road
  ctx.fillRect(PLAYER_HOME_DOOR.x - 9, PLAYER_HOME_DOOR.y, 18, plaza.y - PLAYER_HOME_DOOR.y - 17)
  for (let x = 0; x < CITY_WIDTH; x += 31) {
    for (let y = 0; y < CITY_HEIGHT; y += 27) {
      const n = (x * 31 + y * 7) % 11
      if (n < 3 && (x < 22 || y < 17 || x > CITY_WIDTH - 25 || y > CITY_HEIGHT - 20)) drawTree(ctx, x + 5, y + 7)
    }
  }
  ctx.fillStyle = '#b09c7c'; ctx.fillRect(plaza.x - 62, plaza.y - 45, 124, 94)
  ctx.fillStyle = colors.roadLight; ctx.fillRect(plaza.x - 56, plaza.y - 39, 112, 82)
  for (let y = plaza.y - 36; y < plaza.y + 40; y += 10) {
    ctx.fillStyle = '#897d65'; ctx.fillRect(plaza.x - 52, y, 104, 1)
  }
  for (let i = 0; i < 24; i++) {
    const x = 35 + (i * 97) % 690, y = 55 + (i * 53) % 410
    if (Math.abs(x - plaza.x) < 80 || Math.abs(y - plaza.y) < 35) continue
    ctx.fillStyle = '#789068'; ctx.fillRect(x, y, 2, 3)
    ctx.fillStyle = i % 2 ? '#b39d70' : '#957a9e'; ctx.fillRect(x - 1, y - 2, 4, 2)
  }
  const stride = walking ? Math.floor(frame / 8) % 3 : 0
  const renderPlayer = () => {
    drawPlayerAura(ctx, player.x, player.y, frame)
    ctx.fillStyle = '#162728'; ctx.fillRect(Math.round(player.x - 5), Math.round(player.y - 2), 10, 3)
    if (!drawActorImage(ctx, playerSprite, player.x, player.y, facing, stride)) {
      drawPixelActor(ctx, player.x, player.y, facing, stride, ACTOR_PALETTES[playerPalette] ?? ACTOR_PALETTES.terririan, WORLD_ACTOR_SCALE)
    }
  }
  const layers = [
    ...TERRAN_LOCATION_IDS.map((id) => ({ depth: getCityPoint(id).y + 30, draw: () => drawBuilding(ctx, id, frame) })),
    { depth: PLAYER_HOME_CENTER.y + 30, draw: () => drawPlayerHome(ctx, homeUnlocked) },
    ...terranLandmarks.map((landmark) => ({ depth: landmark.point.y + landmark.bottom, draw: () => drawLandmark(ctx, landmark, frame) })),
    { depth: player.y, draw: renderPlayer },
    ...cityCast.map((actor) => ({ depth: actor.point.y, draw: () => {
    ctx.fillStyle = '#1a282b'; ctx.fillRect(actor.point.x - 5, actor.point.y - 2, 10, 3)
    const palette = ACTOR_PALETTES[actor.palette] ?? ACTOR_PALETTES.knowledge
    const variantPalette = actor.variant === 0 ? palette : actor.variant === 1
      ? { ...palette, hair: '#c7b594', accent: '#a5c3b0' }
      : { ...palette, hair: '#5a434d', skin: '#c08e7c', accent: '#d3a0bd' }
    const movingActor = actor as MovingCityActor
    if (!drawActorImage(ctx, getWorldSprite(getPresencePortrait(actor.presence)), actor.point.x, actor.point.y,
      movingActor.facing ?? 'down', movingActor.moving ? Math.floor(frame / 8) % 3 : 0, CITY_NPC_SIZE)) {
      drawPixelActor(ctx, actor.point.x, actor.point.y, movingActor.facing ?? 'down', 0, variantPalette, 1)
    }
    } })),
  ]
  layers.sort((a, b) => a.depth - b.depth).forEach((layer) => layer.draw())
  ctx.restore()
}
