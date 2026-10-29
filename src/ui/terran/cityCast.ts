import { TERRAN_LOCATION_IDS, type TerranLocationId } from '../../content/terran'
import type { TerranNpcPresence } from '../../content/types'
import type { GameSave } from '../../domain/game/types'
import { getNpcQuestMarker, getVisibleNpcsInLocation } from '../../domain/terran/cityNpcs'
import { getCityPoint, type WorldPoint } from './pixelCityArt'

export type CityActor = {
  id: string
  presence: TerranNpcPresence
  locationId: TerranLocationId
  point: WorldPoint
  palette: string
  variant: number
  marker: '!' | '✓' | null
}

const spots: readonly WorldPoint[] = [
  { x: -17, y: 29 }, { x: 18, y: 30 }, { x: 0, y: 34 },
]

export function getCityCast(save: GameSave): CityActor[] {
  return TERRAN_LOCATION_IDS.flatMap((locationId) => {
    const institution = getCityPoint(locationId)
    return getVisibleNpcsInLocation(save, locationId).slice(0, spots.length).map(({ presence }, index) => ({
      id: presence.id,
      presence,
      locationId,
      point: { x: institution.x + spots[index].x, y: institution.y + spots[index].y },
      palette: locationId === 'location_terran_portal_plaza' ? 'portal' : locationId === 'location_terran_eldamar_house' ? 'knowledge'
        : locationId === 'location_terran_vorren_post' ? 'exploration' : locationId === 'location_terran_bond_workshop' ? 'bond'
          : locationId === 'location_terran_zareth_barracks' ? 'defense' : locationId === 'location_terran_clan_hall' ? 'clan' : 'healing',
      variant: index,
      marker: getNpcQuestMarker(save, presence),
    }))
  })
}
