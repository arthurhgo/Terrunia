import { CLAN_HALL_MINI_PORTAL_ID } from '../../content/clanCastlesV05142'
import { interiorPalettes } from './interiorArt'
import { roomWallHeight } from './interiorProjection'
import { containsRoomPoint, getRoomPlan } from './roomGeometry'
import { roomFurniture, type RoomFurniture, type TerranInteriorId } from './roomContent'

export type RoomVertex = [east: number, south: number, height: number]
export type RoomFace = { corners: readonly RoomVertex[]; color: [number, number, number]; grain: number }
type RoomLight = { at: RoomVertex; color: RoomFace['color']; radius: number }

const wood = '#715234'
const paper = '#e4cc96'
const iron = '#778491'
const brass = '#b48c56'
const glass = '#87ccd1'
const pigment = ['#a86369', '#69a580', '#658faa', '#c39957', '#8274ac']
const rgb = (hex: string, light: number): RoomFace['color'] => {
  const value = Number.parseInt(hex.slice(1), 16)
  return [value >> 16, value >> 8 & 255, value & 255].map(n => Math.round(n * light)) as RoomFace['color']
}

const propHeights = {
  shelf: 32, forge: 39, anvil: 14, bed: 18, chest: 16, banner: 31, portal: 33,
  herbs: 22, rack: 28, market: 21, desk: 20, map: 19, potions: 27,
}
type Prop = keyof typeof propHeights
const propKinds: Record<string, Prop> = {
  forge_furnace: 'forge', forge_anvil: 'anvil', bond_anvil: 'anvil', eldamar_archive: 'shelf',
  vorren_bestiary: 'shelf', vorren_map: 'map', zareth_weapons: 'rack', clan_banners: 'banner',
  daeryn_herbs: 'herbs', daeryn_healing_shelf: 'potions', daeryn_shop: 'potions',
  bond_station: 'market', home_bed: 'bed', home_chest: 'chest',
}

function propType(item: RoomFurniture): Prop {
  if (item.behavior === 'portal') return 'portal'
  if (item.id.endsWith('_banner')) return 'banner'
  if (item.id.endsWith('_arsenal')) return 'market'
  return propKinds[item.id] ?? 'desk'
}

export const interiorPropHeight = (item: RoomFurniture) => propHeights[propType(item)]

/** VISUAL_DRAFT. Volumes use the actual walkable footprint, room objects and entrance. */
export function buildInteriorRoom(locationId: TerranInteriorId, clanPortalOpen: boolean) {
  const plan = getRoomPlan(locationId)
  const theme = interiorPalettes[plan.tile]
  const faces: RoomFace[] = []
  const lights: RoomLight[] = []
  const lightAt = (at: RoomVertex, color: string, radius: number) => lights.push({ at, color: rgb(color, 1), radius })
  const face = (corners: readonly RoomVertex[], color: string, light = 1, grain = 2) =>
    faces.push({ corners, color: rgb(color, light), grain })
  const top = (x: number, y: number, w: number, d: number, z: number, color: string, light = 1, grain = 2) =>
    face([[x, y, z], [x+w, y, z], [x+w, y+d, z], [x, y+d, z]], color, light, grain)
  const box = (x: number, y: number, w: number, d: number, base: number, height: number, color: string) => {
    const z = base + height
    top(x, y, w, d, z, color)
    face([[x+w,y,base], [x+w,y+d,base], [x+w,y+d,z], [x+w,y,z]], color, 0.64)
    face([[x,y+d,base], [x+w,y+d,base], [x+w,y+d,z], [x,y+d,z]], color, 0.82)
  }
  const desk = (x: number, y: number, w: number, d: number, color = wood, base = 0) => {
    for (const east of [x, x + w - 4]) for (const south of [y, y + d - 4]) box(east,south,4,4,base,13,wood)
    box(x-1,y-1,w+2,d+2,base+12,4,color)
  }
  const coins = (x: number, y: number, z: number) => {
    for (let i=0; i<4; i++) box(x+i*3,y+(i%2)*3,2,3,z,1,brass)
  }
  const lantern = (x: number, y: number, z: number, glow = '#efb86b') => {
    box(x,y,6,6,z,2,brass)
    box(x+1,y+1,4,4,z+2,7,glow)
    box(x,y,6,6,z+9,2,brass)
    lightAt([x+3,y+3,z+6],glow,39)
  }
  const plant = (x: number, y: number, z: number, color = '#648b64') => {
    box(x,y,7,7,z,5,'#9e6749')
    box(x+2,y+2,3,3,z+5,10,color)
    box(x-2,y+1,6,6,z+8,3,color)
    box(x+4,y-2,6,7,z+11,3,color)
  }
  const vial = (x: number, y: number, z: number, color: string) => {
    box(x,y,4,4,z,6,color)
    box(x+1,y+1,2,2,z+6,2,paper)
  }
  const wall = (x: number, y: number, length: number, alongEast: boolean) => {
    const h = roomWallHeight(plan)
    const span = (offset: number, inset: number, width: number, depth: number, z: number, height: number, color: string) => {
      if (alongEast) box(x+offset,y+inset,width,depth,z,height,color)
      else box(x+inset,y+offset,depth,width,z,height,color)
    }
    span(0,-6,length,6,0,h,theme.wall)
    span(0,-6,length,7,h,3,theme.light)
    span(0,-0.1,length,1,2,3,theme.trim)
    for (let i = 2; i < length - 3; i += 16) {
      span(i,-0.05,Math.min(10,length-i),0.15,8+(i%3)*6,2,theme.light)
    }
    for (let i = 24; i + 13 < length; i += 58) {
      span(i-8,0,16,1,10,18,'#171f2b')
      span(i-6,1,12,0.5,12,13,theme.glow)
      span(i-4,1,8,0.5,25,2,theme.glow)
      span(i-0.6,1.5,1.2,0.4,12,15,theme.wall)
      span(i-6,1.5,12,0.4,18,1.4,theme.wall)
      span(i-9,0,18,2,8,2,theme.trim)
    }
  }
  // Room plans are unions of a few rectangles. Only exposed edges get walls.
  const edges = (axis: 'x' | 'y', size: 'w' | 'h') =>
    [...new Set(plan.floor.flatMap(r => [r[axis], r[axis] + r[size]]))].sort((a,b) => a-b)
  const xs = edges('x','w'), ys = edges('y','h')
  const hasFloor = (x: number, y: number) => plan.floor.some(r => containsRoomPoint(r, { x,y }))
  const planks = plan.tile === 'wood' || plan.tile === 'home' || plan.tile === 'moss'
  const tileWidth = planks ? 31 : 18, tileDepth = planks ? 8 : 15
  for (let j=0; j<ys.length-1; j++) for (let i=0; i<xs.length-1; i++) {
    const x=xs[i], y=ys[j], w=xs[i+1]-x, d=ys[j+1]-y
    if (!hasFloor(x+0.5,y+0.5)) continue
    box(x,y,w,d,-12,12,theme.wall)
    for (let ty=y; ty<y+d; ty+=tileDepth) for (let tx=x; tx<x+w; tx+=tileWidth) {
      const light = [0.88,0.94,1,1.05,1.12][(Math.floor(tx/5)*7+Math.floor(ty/3)*13)%5]
      top(tx,ty,Math.min(x+w-tx,tileWidth-0.85),Math.min(y+d-ty,tileDepth-0.85),0.1,theme.floor,light)
    }
    if (!hasFloor(x+0.5,y-0.5)) wall(x,y,w,true)
    if (!hasFloor(x-0.5,y+0.5)) wall(x,y,d,false)
    if (!hasFloor(x+w+0.5,y+0.5)) box(x+w-1,y,1,d,-1,3,theme.trim)
    if (!hasFloor(x+0.5,y+d+0.5)) {
      const door = plan.exit.x
      const hasDoor = y+d-plan.exit.y<10 && door>x && door<x+w
      if (hasDoor) {
        box(x,y+d-1,Math.max(0,door-13-x),1,-1,3,theme.trim)
        box(Math.min(x+w,door+13),y+d-1,Math.max(0,x+w-door-13),1,-1,3,theme.trim)
      } else box(x,y+d-1,w,1,-1,3,theme.trim)
    }
  }
  if (!plan.floor.length) return { faces, lights }

  const { x: exitX, y: exitY } = plan.exit
  const front = Math.max(...ys)
  for (let i=2; i>=0; i--) box(exitX-13,front+i*4,26,4,-12,12-i*3,theme.light)
  for (const x of [exitX-16, exitX+11]) {
    box(x,front-7,5,6,0,6,theme.wall)
    lantern(x,front-7,6)
  }
  if (plan.tile !== 'forge') {
    const rug = plan.tile === 'ceremony' ? '#655183' : plan.tile === 'home' ? '#385e70' : theme.wall
    top(plan.spawn.x-17,exitY-43,34,42,0.3,theme.trim)
    top(plan.spawn.x-15,exitY-41,30,38,0.5,rug)
    for (let i=0; i<3; i++) {
      const y = exitY-33+i*10
      face([[exitX-5,y,0.7],[exitX,y-3,0.7],[exitX+5,y,0.7],[exitX,y+3,0.7]],theme.trim)
    }
  }
  for (const r of plan.obstacles) {
    desk(r.x,r.y,r.w,r.h,plan.tile === 'forge' ? iron : theme.light)
    box(r.x+4,r.y+4,13,9,16,2,theme.trim)
    lantern(r.x+r.w-9,r.y+3,16)
  }

  for (const item of roomFurniture[locationId]) {
    if (item.id === CLAN_HALL_MINI_PORTAL_ID && !clanPortalOpen) continue
    const { x, y } = item.point
    const kind = propType(item)
    if (kind === 'shelf' || kind === 'potions') {
      box(x-17,y-11,34,11,0,kind === 'shelf' ? 31 : 25,wood)
      for (let row=0; row<(kind === 'shelf' ? 3 : 2); row++) {
        box(x-15,y-0.1,30,1.4,3+row*9,7,'#342b2a')
        box(x-17,y-0.2,34,2.7,2+row*9,1.6,theme.trim)
        for (let i=0; i<6; i++) {
          const c = pigment[(i+row*2)%pigment.length]
          if (kind === 'shelf') box(x-14+i*5,y+1,3,2,4+row*9,4+(i%3),c)
          else vial(x-13+i*5,y+1,4+row*9,c)
        }
      }
      box(x-18,y-12,36,13,kind === 'shelf' ? 30 : 24,2,theme.trim)
    } else if (kind === 'forge') {
      box(x-20,y-18,40,24,0,25,'#76574d')
      box(x-14,y+5,28,3,3,16,'#422925')
      box(x-12,y+8,24,1.6,4,9,'#d16843')
      for(let i=0; i<5; i++) box(x-11+i*4,y+9,3,2,5,4+i%3,'#ffc470')
      box(x-21,y-19,42,25,24,4,'#9b7461')
      box(x-8,y-15,16,15,27,12,'#514645')
      box(x-9,y-16,18,17,37,3,'#968373')
      lightAt([x,y+13,9],'#ffc176',62)
    } else if (kind === 'anvil') {
      box(x-11,y-6,22,12,0,6,wood)
      box(x-6,y-5,12,10,6,5,'#495264')
      box(x-17,y-6,34,12,11,3,iron)
      box(x-21,y-3,4,6,12,2,theme.trim)
    } else if (kind === 'bed') {
      box(x-13,y-20,26,37,0,6,wood)
      box(x-11,y-18,22,31,6,4,paper)
      box(x-11,y-10,22,23,10,2,'#4f849b')
      box(x-11,y+2,22,3,12,0.6,theme.trim)
      box(x-9,y-17,15,6,10,2,'#f4e3c0')
      box(x-14,y-21,28,3,0,18,theme.light)
    } else if (kind === 'chest') {
      box(x-10,y-7,20,13,0,10,wood)
      box(x-11,y-8,22,15,10,5,'#a77b50')
      for (const dx of [-8,6]) box(x+dx,y-8,2,15,15,0.6,brass)
      box(x-2,y+7,4,2,6,5,theme.trim)
    } else if (kind === 'banner' || kind === 'rack') {
      box(x-14,y-5,28,5,0,3,wood)
      for (const dx of [-12,10]) box(x+dx,y-4,2,3,0,30,wood)
      box(x-14,y-4,28,3,27,2,brass)
      for (let i=0; i<3; i++) {
        if (kind === 'banner') { box(x-11+i*8,y-2,6,1,10+i%2*2,17,pigment[i]); box(x-10+i*8,y-1,4,1,19,3,theme.trim) }
        else { box(x-10+i*8,y-1,2,1,5,19,iron); box(x-12+i*8,y-1,6,2,9,2,brass) }
      }
    } else if (kind === 'portal') {
      box(x-13,y-9,26,17,0,4,theme.wall)
      for (const dx of [-13,8]) box(x+dx,y-7,5,6,4,25,theme.light)
      box(x-13,y-7,26,6,28,5,theme.trim)
      box(x-7,y-6,14,1.5,4,23,theme.glow)
      box(x-3,y-4,6,0.5,7,18,glass)
      lightAt([x,y,15],theme.glow,51)
    } else {
      const wide = kind === 'market' ? 32 : 26
      desk(x-wide/2,y-10,wide,17,kind === 'market' ? theme.trim : wood)
      if (kind === 'herbs') {
        plant(x-11,y-7,16); plant(x+2,y-5,16,'#8fbb86')
      } else if (kind === 'map') {
        top(x-11,y-7,22,12,16.2,paper)
        top(x-8,y-1,14,1.3,16.4,'#8d6257')
        top(x-3,y-6,2,7,16.4,'#739581')
      } else {
        box(x-11,y-7,10,7,16,2,kind === 'market' ? '#89593f' : paper)
        if (kind === 'market') {
          box(x-11,y-7,10,7,18,2,theme.glow)
          coins(x-1,y-2,16)
          for (const dx of [-16,14]) box(x+dx,y-9,2,2,16,13,wood)
          for (let i=0; i<8; i++) {
            box(x-18+i*4.5,y-11,4.5,12,29,2,i%2 ? '#b68559' : '#944e50')
          }
        }
        lantern(x+5,y-6,16,kind === 'market' ? theme.glow : undefined)
      }
    }
  }
  return { faces, lights }
}
