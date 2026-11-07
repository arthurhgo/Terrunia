/** VISUAL_DRAFT v0.5.10. Logical pixels: never scale world, hitboxes or sprites independently. */
export type WorldViewport = { width: number; height: number }
export const DEFAULT_WORLD_ZOOM = 1.30

export function calculateWorldViewport(
  containerWidth: number, containerHeight: number, worldWidth: number, worldHeight: number,
  baseWidth = 384, baseHeight = 256, zoomFactor = DEFAULT_WORLD_ZOOM,
): WorldViewport {
  if (![containerWidth, containerHeight, worldWidth, worldHeight].every((n) => Number.isFinite(n) && n > 0)) {
    return { width: baseWidth, height: baseHeight }
  }
  const aspect = containerWidth / containerHeight
  let width = Math.max(baseWidth * zoomFactor, baseHeight * zoomFactor * aspect)
  let height = width / aspect
  if (height < baseHeight * zoomFactor) {
    height = baseHeight * zoomFactor
    width = height * aspect
  }
  const fit = Math.min(1, worldWidth / width, worldHeight / height)
  return { width: Math.max(1, Math.round(width * fit)), height: Math.max(1, Math.round(height * fit)) }
}

export function cameraAt(point: { x: number; y: number }, viewport: WorldViewport, world: WorldViewport) {
  return {
    x: Math.max(0, Math.min(world.width - viewport.width, Math.round(point.x - viewport.width / 2))),
    y: Math.max(0, Math.min(world.height - viewport.height, Math.round(point.y - viewport.height / 2))),
  }
}
