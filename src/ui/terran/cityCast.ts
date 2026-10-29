import type { TerranLocationId } from '../../content/terran'
import { streetNpcPlacements } from '../../content/streetNpcs'
import type { TerranNpcPresence } from '../../content/types'
import type { GameSave } from '../../domain/game/types'
import { getNpcQuestMarker, getOutdoorCityNpcs } from '../../domain/terran/cityNpcs'
import type { WorldPoint } from './pixelCityArt'

export type CityActor = {
  id: string
  presence: TerranNpcPresence
  locationId: TerranLocationId
  point: WorldPoint
  palette: string
  variant: number
  marker: '!' | '✓' | null
}

/** Street actors use designer-authored stable positions; the room roster is unrelated. */
export function getCityCast(save: GameSave): CityActor[] {
  const eligible = new Map(getOutdoorCityNpcs(save).map(({ presence }) => [presence.id, presence]))
  return streetNpcPlacements.flatMap((placement) => {
    const presence = eligible.get(placement.id)
    if (!presence) return []
    return [{
      id: placement.id,
      presence,
      locationId: placement.locationId,
      point: { ...placement.point },
      palette: placement.palette,
      variant: placement.variant,
      marker: getNpcQuestMarker(save, presence),
    }]
  })
}
