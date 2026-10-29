import { describe, expect, it } from 'vitest'
import { createNewSave } from '../../domain/game/createSave'
import { content } from '../../content/catalog'
import { TERRAN_LOCATION_IDS } from '../../content/terran'
import { findInteriorPath, getInteriorResidents, hasTerranInterior, INTERIOR_EXIT, INTERIOR_SPAWN, isInteriorWalkable, TERRAN_INTERIOR_IDS } from './interiorLayout'

const save = createNewSave('owner', 'Nira', 'character.terririan.default', content, '2026-10-29T15:00:00Z')

describe('Interiores de Terran', () => {
  it('tem exatamente seis instituições exploráveis e mantém o Portal exterior', () => {
    expect(TERRAN_INTERIOR_IDS).toHaveLength(6)
    for (const id of TERRAN_LOCATION_IDS) {
      expect(hasTerranInterior(id)).toBe(content.terranLocations[id].category === 'institution')
    }
    expect(hasTerranInterior('location_terran_portal_plaza')).toBe(false)
  })
  it('posiciona moradores internos sem expor NPCs condicionais indevidamente', () => {
    const residents = getInteriorResidents(save, 'location_terran_eldamar_house')
    expect(residents.map((npc) => npc.presence.label)).toContain('Eldamar')
    expect(residents.map((npc) => npc.presence.label)).not.toContain('Elvira')
    expect(residents.every((npc) => isInteriorWalkable(npc.position))).toBe(true)
    expect(getInteriorResidents(save, 'location_terran_portal_plaza')).toEqual([])
    expect(getInteriorResidents(save, 'location_terran_clan_hall').map((npc) => npc.presence.id))
      .not.toContain('presence_class_masters')
  })
  it('oferece caminho contínuo entre a porta, os NPCs e o posto de serviços', () => {
    expect(isInteriorWalkable({ x: 191, y: 130 })).toBe(false)
    expect(isInteriorWalkable(INTERIOR_EXIT)).toBe(true)
    const path = findInteriorPath(INTERIOR_SPAWN, { x: 151, y: 128 })
    expect(path.length).toBeGreaterThan(0)
    expect(path.every((point) => isInteriorWalkable(point))).toBe(true)
    const exitPath = findInteriorPath({ x: 75, y: 116 }, INTERIOR_EXIT)
    expect(exitPath.length).toBeGreaterThan(0)
  })
})
