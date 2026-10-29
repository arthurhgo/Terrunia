import { describe, expect, it } from 'vitest'
import { content } from '../../content/catalog'
import { TERRAN_LOCATION_IDS } from '../../content/terran'
import { createNewSave } from '../../domain/game/createSave'
import { PLAYER_HOME_FLAG, restAtHome } from '../../domain/terran/services'
import { BASE_LOCATION_ID } from '../../domain/terran/base'
import { getCityDoor } from './pixelCityArt'
import { findCityPath, isCityWalkable } from './cityNavigation'
import { PLAYER_HOME_CENTER, PLAYER_HOME_DOOR, PLAYER_HOME_INTERIOR_ID, getRoomName, roomFurniture } from './roomContent'
import { getInteriorResidents, isInteriorWalkable } from './interiorLayout'

const save = createNewSave('owner', 'Terrírian', 'character.terririan.default', content, '2026-10-29T18:30:00Z')

describe('Casa do Terrírian e interiores temáticos', () => {
  it('a residência adicional não substitui uma das seis instituições', () => {
    expect(getRoomName(PLAYER_HOME_INTERIOR_ID)).toBe('Base do Terrírian')
    expect(Object.keys(content.terranLocations)).toHaveLength(7)
    expect(PLAYER_HOME_CENTER.x).toBe(192)
    expect(isCityWalkable(PLAYER_HOME_CENTER)).toBe(false)
    expect(isCityWalkable(PLAYER_HOME_DOOR)).toBe(true)
    expect(getInteriorResidents(save, PLAYER_HOME_INTERIOR_ID)).toEqual([])
    expect(isInteriorWalkable({ x: 316, y: 202 })).toBe(true)
  })
  it('o caminho do Portal à casa é acessível pela malha de colisão', () => {
    const portalDoor = getCityDoor('location_terran_portal_plaza')
    const path = findCityPath(portalDoor, PLAYER_HOME_DOOR)
    expect(path.length).toBeGreaterThan(0)
    expect(path.every(isCityWalkable)).toBe(true)
  })
  it('cada instituição possui móveis interativos identificáveis sem lógica acoplada à arte', () => {
    for (const id of TERRAN_LOCATION_IDS) {
      if (id === 'location_terran_portal_plaza') continue
      expect(roomFurniture[id].length).toBeGreaterThanOrEqual(2)
      expect(roomFurniture[id].some((item) => item.behavior === 'services')).toBe(true)
      expect(roomFurniture[id].every((item) => isInteriorWalkable(item.point))).toBe(true)
    }
    expect(roomFurniture[PLAYER_HOME_INTERIOR_ID].some((item) => item.behavior === 'rest')).toBe(true)
    expect(roomFurniture[PLAYER_HOME_INTERIOR_ID].some((item) => item.behavior === 'inspect')).toBe(true)
  })
  it('o repouso usa o desbloqueio já previsto, sem novo sistema de recompensa', () => {
    const locked = restAtHome(save, content, '2026-10-29T18:30:00Z')
    expect(locked.ok).toBe(false)
    const unlocked = structuredClone(save)
    unlocked.world.worldFlags.push(PLAYER_HOME_FLAG)
    unlocked.vitals.hp = Math.max(1, unlocked.vitals.hp - 3)
    unlocked.world.currentLocationId = BASE_LOCATION_ID
    const result = restAtHome(unlocked, content, '2026-10-29T18:30:00Z')
    expect(result.ok).toBe(true)
    if (result.ok) expect(result.value.vitals.hp).toBeGreaterThan(unlocked.vitals.hp)
  })
})
