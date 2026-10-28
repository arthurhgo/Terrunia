import { content } from '../../content/catalog'
import { TERRAN_LOCATION_IDS, type TerranLocationId } from '../../content/terran'

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
  // A resident is visible in front of each institution, with no scene swap.
  const nx = p.x + 17, ny = p.y + 15
  ctx.fillStyle = colors.ink; ctx.fillRect(nx - 4, ny - 7, 8, 10)
  ctx.fillStyle = location.tone === 'healing' ? '#7cbaa6' : '#b1a36f'; ctx.fillRect(nx - 3, ny - 4, 6, 5)
  ctx.fillStyle = '#d6ab8c'; ctx.fillRect(nx - 2, ny - 7, 4, 3)
  ctx.fillStyle = colors.wood; ctx.fillRect(nx - 3, ny + 1, 2, 4); ctx.fillRect(nx + 1, ny + 1, 2, 4)
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
  for (let x = 0; x < CITY_WIDTH; x += 31) {
    for (let y = 0; y < CITY_HEIGHT; y += 27) {
      const n = (x * 31 + y * 7) % 11
      if (n < 3 && (x < 22 || y < 17 || x > CITY_WIDTH - 25 || y > CITY_HEIGHT - 20)) drawTree(ctx, x + 5, y + 7)
    }
  }
  ctx.fillStyle = '#b09c7c'; ctx.fillRect(plaza.x - 37, plaza.y - 25, 74, 56)
  ctx.fillStyle = colors.roadLight; ctx.fillRect(plaza.x - 32, plaza.y - 20, 64, 46)
  TERRAN_LOCATION_IDS.forEach((id) => drawBuilding(ctx, id, frame))
  const bob = walking && frame % 12 < 6 ? 1 : 0
  ctx.fillStyle = '#1a282b'; ctx.fillRect(Math.round(player.x - 9), Math.round(player.y - 3), 18, 5)
  if (playerSprite?.complete && playerSprite.naturalWidth > 0) {
    ctx.drawImage(playerSprite, Math.round(player.x - 16), Math.round(player.y - 30 + bob), 32, 32)
  } else {
    ctx.fillStyle = '#223d70'; ctx.fillRect(player.x - 5, player.y - 17 + bob, 10, 15)
    ctx.fillStyle = '#d5a78b'; ctx.fillRect(player.x - 4, player.y - 24 + bob, 8, 8)
  }
}
