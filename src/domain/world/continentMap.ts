import type { GameSave } from '../game/types'
import { getDiscoveredTerranLocationIds } from '../terran/cityEngine'
import { content } from '../../content/catalog'

export type ContinentSite = {
  id: string
  name: string
  description: string
  x: number
  y: number
  type: 'city' | 'institution' | 'region' | 'ruin'
  discovered: boolean
}

/**
 * Cartographic positions are an illustrative UI layout, not new lore or travel
 * coordinates. Discovery comes only from the existing persisted world state.
 */
const cityPositions: Record<string, { x: number; y: number }> = {
  location_terran_portal_plaza: { x: 44, y: 62 },
  location_terran_eldamar_house: { x: 40, y: 55 },
  location_terran_vorren_post: { x: 48, y: 54 },
  location_terran_bond_workshop: { x: 50, y: 61 },
  location_terran_zareth_barracks: { x: 48, y: 70 },
  location_terran_clan_hall: { x: 40, y: 70 },
  location_terran_daeryn_house: { x: 37, y: 63 },
}

export function getContinentSites(save: GameSave): ContinentSite[] {
  const discovered = new Set(getDiscoveredTerranLocationIds(save))
  const trailVisited = save.world.unlockedLocationIds.includes('astravel_entry')
    || save.world.currentLocationId.startsWith('astravel_')
    || Object.entries(save.world.trailNodeStates).some(([id, status]) =>
      id !== 'astravel_boss_preview' && status === 'completed')
  const ruinDiscovered = save.world.worldFlags.includes('fungal_chambers_threshold_discovered')
    || save.world.worldFlags.includes('colossus_mycelium_defeated')
    || ['bossCurrent', 'completed'].includes(save.world.trailNodeStates.astravel_boss_preview)
    || save.world.currentLocationId === content.dungeons.dungeon_fungal_chambers.id

  return [
    { id: 'terran', name: 'Terran', description: 'Cidade-base e centro de serviços dos Terrírians.', x: 44, y: 62, type: 'city', discovered: true },
    ...Object.entries(cityPositions).map(([id, position]): ContinentSite => {
      const place = content.terranLocations[id]
      return {
        id, name: place.name, description: place.role,
        ...position, type: 'institution', discovered: discovered.has(id),
      }
    }),
    {
      id: 'astravel_entry', name: 'Floresta de Astravél',
      description: 'Primeira região explorável fora da cidade de Terran.',
      x: 69, y: 44, type: 'region', discovered: trailVisited,
    },
    {
      id: 'fungal_chambers', name: 'Câmaras Fúngicas',
      description: 'Ruína descoberta durante a exploração de Astravél.',
      x: 79, y: 29, type: 'ruin', discovered: ruinDiscovered,
    },
  ]
}
