import { describe, expect, it } from 'vitest'
import { TERRAN_LOCATION_IDS } from '../../content/terran'
import { findCityPath, isCityWalkable } from './cityNavigation'
import { getCityDoor, getCityPoint } from './pixelCityArt'
import { getCityCast } from './cityCast'
import { content } from '../../content/catalog'
import { createNewSave } from '../../domain/game/createSave'
import { terranLandmarks } from '../../content/terranExploration'
import { CITY_HEIGHT, CITY_NPC_SIZE, CITY_WIDTH, getCityCamera, CITY_VIEW_WIDTH, CITY_VIEW_HEIGHT, cityScreenToWorld, getLandmarkApproach } from './cityWorld'

describe('navegação pela cidade pixelada', () => {
  it('bloqueia as paredes dos edifícios sem bloquear suas entradas', () => {
    for (const id of TERRAN_LOCATION_IDS) {
      expect(isCityWalkable(getCityPoint(id))).toBe(false)
      expect(isCityWalkable(getCityDoor(id))).toBe(true)
    }
  })

  it('encontra caminhos para as sete instituições sem atravessar paredes', () => {
    const origin = getCityDoor('location_terran_portal_plaza')
    for (const id of TERRAN_LOCATION_IDS) {
      if (id === 'location_terran_portal_plaza') continue
      const path = findCityPath(origin, getCityDoor(id))
      expect(path.length).toBeGreaterThan(0)
      expect(path.every(isCityWalkable)).toBe(true)
      expect(path.at(-1)).toEqual(getCityDoor(id))
    }
  })

  it('recalcula destinos obstruídos para uma célula transitável', () => {
    const path = findCityPath(getCityDoor('location_terran_portal_plaza'), getCityPoint('location_terran_eldamar_house'))
    expect(path.length).toBeGreaterThan(0)
    expect(path.every(isCityWalkable)).toBe(true)
  })

  it('permite aproximar-se de todos os NPCs externos da cidade', () => {
    const save = createNewSave('owner', 'Nômade', 'character.terririan.default', content, '2026-10-28T12:00:00Z')
    const origin = getCityDoor('location_terran_portal_plaza')
    for (const actor of getCityCast(save)) {
      const destination = { x: actor.point.x, y: Math.min(CITY_HEIGHT - 24, actor.point.y + 7) }
      expect(isCityWalkable(destination)).toBe(true)
      expect(findCityPath(origin, destination).length).toBeGreaterThan(0)
    }
  })

  it('acompanha o jogador por uma cidade quatro vezes maior, sem revelar além das bordas', () => {
    expect(CITY_WIDTH * CITY_HEIGHT).toBe(CITY_VIEW_WIDTH * CITY_VIEW_HEIGHT * 4)
    expect(CITY_NPC_SIZE).toBeLessThan(32)
    for (const point of [{ x: 24, y: 40 }, { x: 384, y: 292 }, { x: 744, y: 488 }]) {
      const camera = getCityCamera(point)
      expect(camera.x).toBeGreaterThanOrEqual(0)
      expect(camera.y).toBeGreaterThanOrEqual(0)
      expect(camera.x + CITY_VIEW_WIDTH).toBeLessThanOrEqual(CITY_WIDTH)
      expect(camera.y + CITY_VIEW_HEIGHT).toBeLessThanOrEqual(CITY_HEIGHT)
      const screen = { x: point.x - camera.x, y: point.y - camera.y }
      expect(screen.x).toBeGreaterThanOrEqual(0)
      expect(screen.x).toBeLessThanOrEqual(CITY_VIEW_WIDTH)
      expect(cityScreenToWorld(screen, camera)).toEqual(point)
    }
    expect(getCityCamera({ x: 384, y: 292 }).x).not.toBe(getCityCamera({ x: 600, y: 292 }).x)
  })

  it('permite explorar todos os pontos e impede atravessar os objetos sólidos', () => {
    for (const landmark of terranLandmarks) {
      expect(isCityWalkable(landmark.point), landmark.name).toBe(false)
      const goal = getLandmarkApproach(landmark)
      expect(isCityWalkable(goal), landmark.name).toBe(true)
      const path = findCityPath(getCityDoor('location_terran_portal_plaza'), goal)
      expect(path.length, landmark.name).toBeGreaterThan(0)
      expect(path.every(isCityWalkable), landmark.name).toBe(true)
    }
  })
})
