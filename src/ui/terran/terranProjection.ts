import { CITY_HEIGHT, CITY_WIDTH, type WorldPoint } from './cityWorld'
import type { WorldViewport } from '../world/worldViewport'
import { isometricGround, projectIsometric } from '../world/isometricProjection'

export { pitchSin, pitchCos } from '../world/isometricProjection'

// VISUAL_DRAFT. The Studio export uses +X east, +Y up, +Z south, and 0.05 units per map pixel.
export const STUDIO_UNITS_PER_PIXEL = 0.05
export function projectTerran(point: WorldPoint, height = 0) {
  return projectIsometric(point.x - CITY_WIDTH / 2, point.y - CITY_HEIGHT / 2, height)
}

export function terranScreenToGround(point: WorldPoint, camera: WorldPoint): WorldPoint {
  const ground = isometricGround(point.x + camera.x, point.y + camera.y)
  return { x: CITY_WIDTH / 2 + ground.x, y: CITY_HEIGHT / 2 + ground.y }
}

export function terranViewportCorners(camera: WorldPoint, { width, height }: WorldViewport) {
  return [{ x: 0, y: 0 }, { x: width, y: 0 }, { x: width, y: height }, { x: 0, y: height }]
    .map((point) => terranScreenToGround(point, camera))
}
