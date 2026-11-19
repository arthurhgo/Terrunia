import { resolveAsset } from '../../assets/assetRegistry'
import type { VisualItem } from '../characters/equipmentVisuals'
import type { WorldViewport } from '../world/worldViewport'
import { createDepthSpritePainter } from '../world/depthSprites'
import type { MovingCityActor } from './cityLife'
import { CITY_HEIGHT, CITY_WIDTH, type WorldPoint } from './cityWorld'
import type { ActorFacing } from './pixelActorArt'
import { drawTerranNpc, drawTerranPlayer } from './terranActors'
import { pitchCos, pitchSin, projectTerran, STUDIO_UNITS_PER_PIXEL } from './terranProjection'

type Terrain = {
  image: HTMLCanvasElement
  depth: Float32Array
  left: number
  top: number
}

const fileHeader = 40
const canvasBackground = '#17272c'
function canvasContext(width: number, height: number) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas indisponível.')
  return context
}

function projectPsf(x: number, height: number, z: number) {
  return projectTerran({
    x: CITY_WIDTH / 2 + x / STUDIO_UNITS_PER_PIXEL,
    y: CITY_HEIGHT / 2 + z / STUDIO_UNITS_PER_PIXEL,
  }, height / STUDIO_UNITS_PER_PIXEL)
}

// Cache the orthographic color and depth of the static city at native pixel resolution.
function rasterizeTerrain(buffer: ArrayBuffer): Terrain {
  if (buffer.byteLength < fileHeader) throw new Error('PSF incompleto.')
  const header = new DataView(buffer)
  const count = header.getUint32(4, true)
  const spacing = header.getFloat32(8, true)
  const bounds = Array.from({ length: 6 }, (_, i) => header.getFloat32(12 + i * 4, true))
  if (header.getUint32(0, true) !== 0x31465350 || header.getUint32(36, true) !== 0
    || !count || count > 1_000_000 || buffer.byteLength !== fileHeader + count * 20
    || !Number.isFinite(spacing) || spacing <= 0 || !bounds.every(Number.isFinite)) {
    throw new Error('PSF de Terran inválido.')
  }

  const corners = [bounds[0], bounds[3]].flatMap((x) =>
    [bounds[1], bounds[4]].flatMap((height) => [bounds[2], bounds[5]].map((z) => projectPsf(x, height, z))))
  const left = Math.floor(Math.min(...corners.map(({ x }) => x))) - 6
  const top = Math.floor(Math.min(...corners.map(({ y }) => y))) - 6
  const width = Math.ceil(Math.max(...corners.map(({ x }) => x))) - left + 7
  const height = Math.ceil(Math.max(...corners.map(({ y }) => y))) - top + 7
  if (width > 1600 || height > 1600) throw new Error('PSF excede a área da cidade.')

  const ctx = canvasContext(width, height)
  const image = ctx.createImageData(width, height)
  const depth = new Float32Array(width * height).fill(-Infinity)
  const positions = new Float32Array(buffer, fileHeader, count * 3)
  const normals = new Int8Array(buffer, fileHeader + count * 12, count * 4)
  const colors = new Uint8Array(buffer, fileHeader + count * 16, count * 4)
  const radius = Math.max(1, Math.min(5, spacing / STUDIO_UNITS_PER_PIXEL * 0.88))
  const radiusSquared = radius * radius
  for (let i = 0; i < count; i++) {
    const n = i * 4, p = i * 3
    const nx = normals[n] / 127, ny = normals[n + 1] / 127, nz = normals[n + 2] / 127
    const forward = (nx + nz) * Math.SQRT1_2
    const toward = forward * pitchCos + ny * pitchSin
    const flags = normals[n + 3]
    if (!(flags & 2) && toward < -0.1) continue
    const shade = flags & 1 ? 1.13 : 0.54 + Math.max(0, nx * 0.39 + ny * 0.78 + nz * 0.48) * 0.60
    const red = Math.round(colors[n] * shade / 8) * 8
    const green = Math.round(colors[n + 1] * shade / 8) * 8
    const blue = Math.round(colors[n + 2] * shade / 8) * 8
    const point = projectPsf(positions[p], positions[p + 1], positions[p + 2])
    const cx = point.x - left, cy = point.y - top
    const alongX = (nx - nz) * Math.SQRT1_2
    const alongY = forward * pitchSin - ny * pitchCos
    for (let y = Math.max(0, Math.ceil(cy - radius)); y <= Math.min(height - 1, cy + radius); y++) {
      for (let x = Math.max(0, Math.ceil(cx - radius)); x <= Math.min(width - 1, cx + radius); x++) {
        const dx = x - cx, dy = y - cy
        if (dx * dx + dy * dy > radiusSquared) continue
        // Project the disc's own surface depth with a limit for grazing angles.
        const tilt = Math.abs(toward) < 0.22 ? 0 : -(dx * alongX + dy * alongY) / toward
        const sample = point.depth + Math.max(-radius, Math.min(radius, tilt))
        const index = y * width + x
        if (sample <= depth[index]) continue
        depth[index] = sample
        const pixel = index * 4
        image.data[pixel] = red
        image.data[pixel + 1] = green
        image.data[pixel + 2] = blue
        image.data[pixel + 3] = 255
      }
    }
  }
  ctx.putImageData(image, 0, 0)
  return { image: ctx.canvas, depth, left, top }
}

let terrain: Promise<Terrain> | undefined
export async function loadTerranSplatScene() {
  terrain ??= fetch(resolveAsset('city.terran.splat').path).then(async (response) => {
    if (!response.ok) throw new Error('Cena de Terran indisponível.')
    return rasterizeTerrain(await response.arrayBuffer())
  }).catch((error: unknown) => {
    terrain = undefined
    throw error
  })
  const map = await terrain
  const drawSprite = createDepthSpritePainter()
  if (!drawSprite) throw new Error('Canvas indisponível.')
  const clampCamera = (center: number, view: number, start: number, size: number) => Math.round(
    size + 36 >= view
      ? Math.max(start - 18, Math.min(start + size + 18 - view, center - view / 2))
      : start + (size - view) / 2)

  return {
    cameraAt(player: WorldPoint, viewport: WorldViewport): WorldPoint {
      const point = projectTerran(player)
      return {
        x: clampCamera(point.x, viewport.width, map.left, map.image.width),
        y: clampCamera(point.y - 28, viewport.height, map.top, map.image.height),
      }
    },

    draw(ctx: CanvasRenderingContext2D, camera: WorldPoint, player: WorldPoint,
      sheet: HTMLImageElement | null, frame: number, walking: boolean, facing: ActorFacing,
      playerPalette: string, actors: readonly MovingCityActor[], equipment: readonly VisualItem[], goal?: WorldPoint) {
      ctx.imageSmoothingEnabled = false
      ctx.fillStyle = canvasBackground
      ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height)
      ctx.drawImage(map.image, map.left - camera.x, map.top - camera.y)
      if (goal) {
        const point = projectTerran(goal)
        const x = Math.round(point.x - camera.x), y = Math.round(point.y - camera.y)
        ctx.fillStyle = '#edc87e'
        ctx.fillRect(x - 4, y, 9, 1)
        ctx.fillRect(x, y - 2, 1, 5)
      }
      const depthSurface = { width: map.image.width, height: map.image.height,
        left: map.left - camera.x, top: map.top - camera.y, depth: map.depth }
      const sprites = [
        { point: projectTerran(player), resident: null },
        ...actors.map((actor) => ({ point: projectTerran(actor.point), resident: actor })),
      ].sort((a, b) => a.point.depth - b.point.depth)
      for (const { point, resident } of sprites) {
        drawSprite(ctx, depthSurface, { x: point.x - camera.x, y: point.y - camera.y, depth: point.depth },
          (stamp, feet) => resident ? drawTerranNpc(stamp, resident, feet, frame)
            : drawTerranPlayer(stamp, feet, sheet, frame, walking, facing, playerPalette, equipment))
      }
    },
  }
}
