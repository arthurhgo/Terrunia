import type { WorldPoint } from './pixelCityArt'
import type { TerranInteriorId } from './roomContent'

/** VISUAL_DRAFT: room coordinates, collision and entry points share one source of truth. */
export type RoomRect = { x: number; y: number; w: number; h: number }
export type RoomPlan = {
  floor: readonly RoomRect[]
  obstacles: readonly RoomRect[]
  spawn: WorldPoint
  exit: WorldPoint
  service: WorldPoint
  residents: readonly WorldPoint[]
  tile: 'slate' | 'moss' | 'arcane' | 'stone' | 'ceremony' | 'wood' | 'home' | 'forge'
}

const rect = (x: number, y: number, w: number, h: number): RoomRect => ({ x, y, w, h })
const point = (x: number, y: number): WorldPoint => ({ x, y })

export const ROOM_PLANS: Record<TerranInteriorId, RoomPlan> = {
  location_terran_forge: {
    floor: [rect(49, 73, 288, 167), rect(83, 57, 69, 35)],
    obstacles: [rect(163, 125, 56, 28), rect(270, 99, 35, 30)],
    spawn: point(192, 219), exit: point(192, 233), service: point(284, 191),
    residents: [point(127, 133), point(244, 160)], tile: 'forge',
  },
  location_terran_eldamar_house: {
    floor: [rect(103, 67, 178, 173), rect(72, 108, 240, 106)],
    obstacles: [rect(173, 127, 42, 18)],
    spawn: point(149, 219), exit: point(149, 233), service: point(274, 181),
    residents: [point(134, 109), point(192, 101), point(249, 110), point(135, 153),
      point(192, 160), point(247, 152), point(190, 193)],
    tile: 'slate',
  },
  location_terran_vorren_post: {
    floor: [rect(41, 110, 302, 130), rect(94, 72, 195, 44)],
    obstacles: [rect(167, 159, 49, 18)],
    spawn: point(263, 219), exit: point(263, 233), service: point(301, 197),
    residents: [point(73, 142), point(130, 136), point(192, 130), point(254, 138),
      point(310, 144), point(131, 185), point(254, 183)],
    tile: 'moss',
  },
  location_terran_bond_workshop: {
    floor: [rect(30, 83, 324, 157), rect(102, 63, 180, 36)],
    obstacles: [rect(166, 126, 52, 21)],
    spawn: point(192, 219), exit: point(192, 233), service: point(310, 198),
    residents: [point(75, 113), point(142, 111), point(235, 111), point(307, 115),
      point(102, 162), point(281, 162), point(191, 182)],
    tile: 'arcane',
  },
  location_terran_zareth_barracks: {
    floor: [rect(109, 61, 166, 179), rect(43, 113, 298, 78)],
    obstacles: [rect(170, 122, 42, 18)],
    spawn: point(236, 219), exit: point(236, 233), service: point(291, 169),
    residents: [point(151, 91), point(233, 91), point(83, 142), point(146, 155),
      point(237, 153), point(299, 141), point(192, 193)],
    tile: 'stone',
  },
  location_terran_clan_hall: {
    floor: [rect(122, 66, 140, 174), rect(75, 89, 234, 59)],
    obstacles: [rect(175, 133, 35, 20)],
    spawn: point(192, 219), exit: point(192, 233), service: point(250, 193),
    residents: [point(113, 115), point(163, 109), point(224, 109), point(277, 115),
      point(153, 173), point(233, 173), point(192, 196)],
    tile: 'ceremony',
  },
  location_terran_daeryn_house: {
    floor: [rect(44, 94, 295, 146), rect(60, 60, 103, 51), rect(248, 76, 73, 46)],
    obstacles: [rect(170, 142, 43, 16)],
    spawn: point(150, 220), exit: point(150, 233), service: point(297, 194),
    residents: [point(93, 111), point(146, 113), point(193, 115), point(259, 118),
      point(314, 135), point(144, 180), point(236, 181)],
    tile: 'wood',
  },
  location_terran_portal_plaza: {
    floor: [], obstacles: [], spawn: point(192, 219), exit: point(192, 233),
    service: point(317, 202), residents: [], tile: 'stone',
  },
  interior_terririan_home: {
    floor: [rect(105, 98, 180, 142), rect(124, 68, 137, 43)],
    obstacles: [rect(174, 135, 38, 16)],
    spawn: point(192, 219), exit: point(192, 233), service: point(249, 189),
    residents: [], tile: 'home',
  },
}

export const getRoomPlan = (id: TerranInteriorId): RoomPlan => ROOM_PLANS[id]

export const containsRoomPoint = (rect: RoomRect, p: WorldPoint): boolean =>
  p.x >= rect.x && p.x < rect.x + rect.w && p.y >= rect.y && p.y < rect.y + rect.h

export const isRoomWalkable = (id: TerranInteriorId, p: WorldPoint): boolean => {
  const plan = getRoomPlan(id)
  return plan.floor.some((area) => containsRoomPoint(area, p)) &&
    !plan.obstacles.some((area) => containsRoomPoint(area, p))
}
