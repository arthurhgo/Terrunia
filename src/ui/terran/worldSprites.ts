import { resolveAsset } from '../../assets/assetRegistry'
import type { ActorFacing } from './pixelActorArt'

const images = new Map<string, HTMLImageElement>()
export function getWorldSprite(assetId: string): HTMLImageElement | null {
  if (typeof Image === 'undefined') return null
  const cached = images.get(assetId)
  if (cached) return cached
  const image = new Image()
  const asset = resolveAsset(assetId)
  image.src = asset.path
  image.onerror = () => { image.onerror = null; image.src = asset.fallback }
  images.set(assetId, image)
  return image
}

/** Native 32px PNGs are actual actor images, not palettes for a generic silhouette. */
export function drawActorImage(ctx: CanvasRenderingContext2D, image: HTMLImageElement | null,
  x: number, footY: number, facing: ActorFacing, stride = 0): boolean {
  if (!image?.complete || !image.naturalWidth || !image.naturalHeight) return false
  ctx.save()
  ctx.imageSmoothingEnabled = false
  const sheet = image.naturalWidth >= 128 && image.naturalHeight >= 128
  const bob = stride === 1 ? -1 : 0
  if (sheet) {
    const row = { down: 0, left: 1, right: 2, up: 3 }[facing]
    ctx.drawImage(image, stride * 32, row * 32, 32, 32, Math.round(x - 16), Math.round(footY - 32 + bob), 32, 32)
  } else {
    ctx.translate(Math.round(x), Math.round(footY + bob))
    if (facing === 'left') ctx.scale(-1, 1)
    ctx.drawImage(image, -16, -32, 32, 32)
  }
  ctx.restore()
  return true
}
