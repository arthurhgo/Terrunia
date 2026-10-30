import { describe, expect, it } from 'vitest'
import { TERRAN_LOCATION_IDS } from '../../content/terran'
import { findCityPath, isCityWalkable } from './cityNavigation'
import { getCityDoor, getCityPoint } from './pixelCityArt'
import { getCityCast } from './cityCast'
import { content } from '../../content/catalog'
import { createNewSave } from '../../domain/game/createSave'

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
      const destination = { x: actor.point.x, y: Math.min(248, actor.point.y + 7) }
      expect(isCityWalkable(destination)).toBe(true)
      expect(findCityPath(origin, destination).length).toBeGreaterThan(0)
    }
  })
})
