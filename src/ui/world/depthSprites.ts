import { pitchCos, pitchSin } from './isometricProjection'

type DepthSurface = { width: number; height: number; left: number; top: number; depth: Float32Array }
type SpritePoint = { x: number; y: number; depth: number }

/** Draws an upright pixel sprite at its feet, clipping pixels behind solid scenery. */
export function createDepthSpritePainter(scale = 1) {
  const side = Math.ceil(64 * scale)
  const foot = { x: 32, y: 48 }
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = side
  const stamp = canvas.getContext('2d', { willReadFrequently: true })
  if (!stamp) return null
  stamp.imageSmoothingEnabled = false
  const anchorX = Math.round(foot.x * scale)
  const anchorY = Math.round(foot.y * scale)

  return (ctx: CanvasRenderingContext2D, surface: DepthSurface, point: SpritePoint,
    draw: (target: CanvasRenderingContext2D, feet: typeof foot) => void) => {
    const left = Math.round(point.x) - anchorX
    const top = Math.round(point.y) - anchorY
    if (left >= ctx.canvas.width || top >= ctx.canvas.height || left + side <= 0 || top + side <= 0) return
    stamp.clearRect(0, 0, side, side)
    stamp.save()
    stamp.setTransform(scale, 0, 0, scale, anchorX - foot.x * scale, anchorY - foot.y * scale)
    draw(stamp, foot)
    stamp.restore()

    const sx = left - surface.left, sy = top - surface.top
    const pixels = stamp.getImageData(0, 0, side, side)
    let clipped = false
    for (let y = Math.max(0, -sy); y < Math.min(side, surface.height - sy); y++) {
      const depth = point.depth + Math.max(0, anchorY - y - 3 * scale) * pitchSin / pitchCos + 3 * scale
      for (let x = Math.max(0, -sx); x < Math.min(side, surface.width - sx); x++) {
        const alpha = (y * side + x) * 4 + 3
        if (pixels.data[alpha] && surface.depth[(y + sy) * surface.width + x + sx] > depth) {
          pixels.data[alpha] = 0
          clipped = true
        }
      }
    }
    if (clipped) stamp.putImageData(pixels, 0, 0)
    ctx.drawImage(canvas, left, top)
  }
}
