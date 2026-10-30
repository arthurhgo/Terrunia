import { content } from '../../content/catalog'
import { TERRAN_LOCATION_IDS, type TerranLocationId } from '../../content/terran'
import { terranLandmarks, type TerranLandmark } from '../../content/terranExploration'

export type WorldPoint = { x: number; y: number }
export const CITY_WIDTH = 768
export const CITY_HEIGHT = 512
export const CITY_VIEW_WIDTH = 384
export const CITY_VIEW_HEIGHT = 256
export const CITY_NPC_SIZE = 28
export const CITY_BUILDING_SCALE = 1.5
export const PLAYER_HOME_CENTER: WorldPoint = { x: 384, y: 106 }
export const PLAYER_HOME_DOOR: WorldPoint = { x: 384, y: 142 }

export const getCityPoint = (id: TerranLocationId): WorldPoint => {
  const { x, y } = content.terranLocations[id].mapPosition
  return { x: Math.round(x * CITY_WIDTH / 100), y: Math.round(y * CITY_HEIGHT / 100) }
}
export const getCityDoor = (id: TerranLocationId): WorldPoint => {
  const point = getCityPoint(id)
  return { x: point.x, y: point.y + 36 }
}
export const getCityCamera = (point: WorldPoint): WorldPoint => ({
  x: Math.max(0, Math.min(CITY_WIDTH - CITY_VIEW_WIDTH, Math.round(point.x - CITY_VIEW_WIDTH / 2))),
  y: Math.max(0, Math.min(CITY_HEIGHT - CITY_VIEW_HEIGHT, Math.round(point.y - CITY_VIEW_HEIGHT / 2))),
})
export const cityScreenToWorld = (point: WorldPoint, camera: WorldPoint): WorldPoint => ({ x: point.x + camera.x, y: point.y + camera.y })
export const getLandmarkApproach = (landmark: TerranLandmark): WorldPoint => ({ x: landmark.point.x, y: landmark.point.y + landmark.bottom + 12 })

export const cityCollisionRects = [
  ...TERRAN_LOCATION_IDS.map((id) => {
    const point = getCityPoint(id), portal = id === 'location_terran_portal_plaza'
    return { x: point.x - (portal ? 47 : 36), y: point.y - (portal ? 29 : 38), width: portal ? 94 : 72, height: portal ? 52 : 68 }
  }),
  { x: PLAYER_HOME_CENTER.x - 36, y: PLAYER_HOME_CENTER.y - 38, width: 72, height: 68 },
  ...terranLandmarks.map((landmark) => ({ x: landmark.point.x - landmark.halfWidth, y: landmark.point.y - landmark.top,
    width: landmark.halfWidth * 2, height: landmark.top + landmark.bottom })),
]

export const getCityDistrict = (point: WorldPoint): string => point.y < 185 ? 'Alameda dos Registros'
  : point.x < 255 ? 'Jardins de Daeryn' : point.x > 520 && point.y < 380 ? 'Bairro do Mercado'
  : point.y > 370 ? 'Distrito dos Vínculos' : 'Praça do Portal'
