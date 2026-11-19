import { isometricGround, projectIsometric } from '../world/isometricProjection'
import type { WorldViewport } from '../world/worldViewport'
import type { WorldPoint } from './cityWorld'
import type { RoomPlan } from './roomGeometry'

export const roomWallHeight = (plan: RoomPlan) =>
  plan.tile.startsWith('castle-') ? 49 : plan.tile === 'slate' || plan.tile === 'ceremony' ? 45 : 36

// Fit the cutaway slab without changing the azimuth or pitch of Terran.
export function createInteriorProjection(plan: RoomPlan, viewport: WorldViewport) {
  const floor = plan.floor.length ? plan.floor : [{ x: 48, y: 64, w: 288, h: 176 }]
  const corners = floor.flatMap(({ x, y, w, h }) =>
    [x - 6, x + w + 6].flatMap(east =>
      [y - 6, y + h + 16].flatMap(south =>
        [-13, roomWallHeight(plan) + 5].map(height => projectIsometric(east, south, height)))))
  const minX = Math.min(...corners.map(p => p.x))
  const maxX = Math.max(...corners.map(p => p.x))
  const minY = Math.min(...corners.map(p => p.y))
  const maxY = Math.max(...corners.map(p => p.y))
  const scale = Math.min(viewport.width * 0.94 / (maxX - minX), viewport.height * 0.83 / (maxY - minY))
  const offsetX = viewport.width / 2 - (minX + maxX) / 2 * scale
  const offsetY = viewport.height * 0.53 - (minY + maxY) / 2 * scale

  return {
    scale,
    project(point: WorldPoint, height = 0) {
      const p = projectIsometric(point.x, point.y, height)
      return { x: offsetX + p.x * scale, y: offsetY + p.y * scale, depth: p.depth * scale }
    },
    ground(point: WorldPoint) {
      return isometricGround((point.x - offsetX) / scale, (point.y - offsetY) / scale)
    },
  }
}

export type InteriorProjection = ReturnType<typeof createInteriorProjection>
