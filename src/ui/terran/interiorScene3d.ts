import { createDepthSpritePainter } from '../world/depthSprites'
import type { WorldViewport } from '../world/worldViewport'
import type { VisualItem } from '../characters/equipmentVisuals'
import type { WorldPoint } from './cityWorld'
import type { InteriorProjection } from './interiorProjection'
import type { InteriorResident } from './interiorLayout'
import type { TerranInteriorId } from './roomContent'
import { buildInteriorRoom } from './interiorRoomModel'
import { ACTOR_PALETTES, type ActorFacing } from './pixelActorArt'
import { drawTerranPlayer, drawTerranResident } from './terranActors'

type Projected = ReturnType<InteriorProjection['project']>

/** Bake the solid geometry into a low-resolution color and depth buffer once per viewport. */
export function createInteriorScene(locationId: TerranInteriorId, clanPortalOpen: boolean,
  { width, height }: WorldViewport, camera: InteriorProjection) {
  const slab = document.createElement('canvas')
  slab.width = width
  slab.height = height
  const paint = slab.getContext('2d')
  const drawSprite = createDepthSpritePainter(camera.scale)
  if (!paint || !drawSprite) return null

  const image = paint.createImageData(width, height)
  const depth = new Float32Array(width * height).fill(-Infinity)
  const surface = { width, height, left: 0, top: 0, depth }
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
    const i = (y * width + x) * 4
    const light = Math.max(0, 1 - Math.hypot(x / width - 0.5, y / height - 0.56) * 1.65) * 16
    image.data[i] = 11 + light * 0.7
    image.data[i+1] = 21 + light
    image.data[i+2] = 30 + light * 1.2
    image.data[i+3] = 255
  }
  const triangle = (a: Projected, b: Projected, c: Projected, rgb: readonly number[], grain: number) => {
    const den = (b.y-c.y)*(a.x-c.x) + (c.x-b.x)*(a.y-c.y)
    if (Math.abs(den) < 1e-6) return
    const minX = Math.max(0, Math.floor(Math.min(a.x,b.x,c.x)))
    const maxX = Math.min(width-1, Math.ceil(Math.max(a.x,b.x,c.x)))
    const minY = Math.max(0, Math.floor(Math.min(a.y,b.y,c.y)))
    const maxY = Math.min(height-1, Math.ceil(Math.max(a.y,b.y,c.y)))
    for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) {
      const dx = x+0.5-c.x, dy = y+0.5-c.y
      const u = ((b.y-c.y)*dx + (c.x-b.x)*dy)/den
      const v = ((c.y-a.y)*dx + (a.x-c.x)*dy)/den
      const w = 1-u-v
      if (u < -1e-6 || v < -1e-6 || w < -1e-6) continue
      const z = a.depth*u + b.depth*v + c.depth*w
      const i = y*width+x
      if (z < depth[i]) continue
      depth[i] = z
      const texture = ((Math.imul(x, 19019) ^ Math.imul(y, 51707)) & 7) - 3
      image.data[i*4] = rgb[0] + texture * grain
      image.data[i*4+1] = rgb[1] + texture * grain
      image.data[i*4+2] = rgb[2] + texture * grain
    }
  }
  const room = buildInteriorRoom(locationId, clanPortalOpen)
  for (const face of room.faces) {
    const polygon = face.corners.map(([x, y, z]) => camera.project({ x, y }, z))
    for (let i = 1; i < polygon.length - 1; i++) {
      triangle(polygon[0], polygon[i], polygon[i+1], face.color, face.grain)
    }
  }
  for (const { at: [east,south,z], color, radius } of room.lights) {
    const source = camera.project({ x: east, y: south }, z)
    const range = radius * camera.scale
    for (let y = Math.max(0, Math.floor(source.y-range)); y <= Math.min(height-1, source.y+range); y++) {
      for (let x = Math.max(0, Math.floor(source.x-range)); x <= Math.min(width-1, source.x+range); x++) {
        const i = y*width+x
        const distance = Math.hypot(x-source.x, y-source.y, depth[i]-source.depth)
        if (distance >= range) continue
        const glow = Math.round((1-distance/range)**2 * 13) / 13 * 0.54
        for (let c=0; c<3; c++) image.data[i*4+c] += color[c]*glow
      }
    }
  }
  paint.putImageData(image, 0, 0)

  return (ctx: CanvasRenderingContext2D, player: WorldPoint, sheet: HTMLImageElement | null, frame: number,
    facing: ActorFacing, walking: boolean, portraitId: string, residents: readonly InteriorResident[],
    equipment: readonly VisualItem[], destination?: WorldPoint) => {
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(slab, 0, 0)
    if (destination) {
      const point = camera.project(destination, 1)
      const i = Math.floor(point.y) * width + Math.floor(point.x)
      if (point.depth > depth[i]) {
        ctx.fillStyle = '#edc87e'
        ctx.fillRect(Math.round(point.x)-3, Math.round(point.y), 7, 1)
        ctx.fillRect(Math.round(point.x), Math.round(point.y)-2, 1, 5)
      }
    }
    const actors = [{ point: camera.project(player), resident: null },
      ...residents.map(resident => ({ point: camera.project(resident.position), resident }))]
      .sort((a,b) => a.point.depth - b.point.depth)
    for (const { point, resident } of actors) {
      drawSprite(ctx, surface, point, (stamp, feet) => resident
        ? drawTerranResident(stamp, resident.presence, feet, ACTOR_PALETTES[resident.palette] ?? ACTOR_PALETTES.knowledge)
        : drawTerranPlayer(stamp, feet, sheet, frame, walking, facing,
          portraitId.includes('sigil') ? 'sigil' : 'terririan', equipment))
    }
  }
}
