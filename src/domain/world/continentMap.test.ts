import { describe, expect, it } from 'vitest'
import { content } from '../../content/catalog'
import { createNewSave } from '../game/createSave'
import { getContinentSites } from './continentMap'

describe('Névoa do continente de Terran', () => {
  it('começa com apenas a cidade-base descoberta, sem revelar regiões futuras', () => {
    const save = createNewSave('owner', 'Terrírian', 'character.terririan.default', content)
    const sites = getContinentSites(save)
    expect(sites.find((site) => site.id === 'terran')?.discovered).toBe(true)
    expect(sites.find((site) => site.id === 'astravel_entry')?.discovered).toBe(false)
    expect(sites.find((site) => site.id === 'fungal_chambers')?.discovered).toBe(false)
    expect(sites.filter((site) => site.type === 'institution' && site.discovered)).toHaveLength(0)
  })
  it('revela apenas locais visitados no save e preserva os outros sob neblina', () => {
    const save = createNewSave('owner', 'Terrírian', 'character.terririan.default', content)
    save.world.unlockedLocationIds.push('location_terran_eldamar_house', 'astravel_entry')
    let sites = getContinentSites(save)
    expect(sites.find((site) => site.id === 'location_terran_eldamar_house')?.discovered).toBe(true)
    expect(sites.find((site) => site.id === 'location_terran_bond_workshop')?.discovered).toBe(false)
    expect(sites.find((site) => site.id === 'astravel_entry')?.discovered).toBe(true)
    expect(sites.find((site) => site.id === 'fungal_chambers')?.discovered).toBe(false)
    save.world.worldFlags.push('fungal_chambers_threshold_discovered')
    sites = getContinentSites(save)
    expect(sites.find((site) => site.id === 'fungal_chambers')?.discovered).toBe(true)
  })
})
