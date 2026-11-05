import { resolveAsset } from '../../assets/assetRegistry'
import type { ActorFacing } from '../terran/pixelActorArt'
import { drawActorImage } from '../terran/worldSprites'
import { getEquipmentAnchor, type VisualItem } from './equipmentVisuals'

const cache = new Map<string, HTMLImageElement>()
const getEquipmentImage = (assetId: string): HTMLImageElement | null => {
  if (typeof Image === 'undefined') return null
  const existing = cache.get(assetId)
  if (existing) return existing
  const image = new Image()
  const asset = resolveAsset(assetId)
  image.src = asset.path
  image.onerror = () => { image.onerror = null; image.src = asset.fallback }
  cache.set(assetId, image)
  return image
}

export function drawEquipmentLayer(ctx: CanvasRenderingContext2D, visuals: readonly VisualItem[],
  layer: 'front' | 'back', facing: ActorFacing, x: number, footY: number, size = 32) {
  for (const item of visuals) {
    const anchor = getEquipmentAnchor(item, facing)
    if (anchor.layer !== layer) continue
    const image = getEquipmentImage(item.assetId)
    if (!image?.complete || !image.naturalWidth || !image.naturalHeight) continue
    const scale = size / 32
    const targetSize = anchor.size * scale
    ctx.save()
    ctx.imageSmoothingEnabled = false
    ctx.translate(Math.round(x - size / 2 + anchor.x * scale), Math.round(footY - size + anchor.y * scale))
    ctx.rotate(anchor.angle * Math.PI / 180)
    ctx.drawImage(image, -targetSize * anchor.handleX, -targetSize * anchor.handleY, targetSize, targetSize)
    ctx.restore()
  }
}

/** Draw the ACTUAL bound equipment around the actor, with correct occlusion per direction. */
export function drawEquippedActor(ctx: CanvasRenderingContext2D, playerSheet: HTMLImageElement | null,
  x: number, footY: number, facing: ActorFacing, stride: number, visuals: readonly VisualItem[],
  size = 32): boolean {
  drawEquipmentLayer(ctx, visuals, 'back', facing, x, footY, size)
  const drawn = drawActorImage(ctx, playerSheet, x, footY, facing, stride, size)
  if (drawn) drawEquipmentLayer(ctx, visuals, 'front', facing, x, footY, size)
  return drawn
}
