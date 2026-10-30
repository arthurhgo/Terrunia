import type { TerranLocationId } from '../../content/terran'
import { content } from '../../content/catalog'
import { streetNpcPlacements } from '../../content/streetNpcs'
import type { TerranNpcPresence } from '../../content/types'
import type { GameSave } from '../../domain/game/types'
import { getNpcQuestMarker, getOutdoorCityNpcs } from '../../domain/terran/cityNpcs'
import type { WorldPoint } from './pixelCityArt'
import { getNpcQuestNotice, type NpcMarkerPhase, type NpcWorldMarker } from '../../domain/quests/questSelectors'
import { getCityDoor } from './cityWorld'

export type CityActor = {
  id: string
  presence: TerranNpcPresence
  locationId: TerranLocationId
  point: WorldPoint
  palette: string
  variant: number
  marker: NpcWorldMarker
  markerPhase?: NpcMarkerPhase
  stationary?: boolean
}

/** Street actors use designer-authored stable positions; the room roster is unrelated. */
export function getCityCast(save: GameSave): CityActor[] {
  const eligible = new Map(getOutdoorCityNpcs(save).map(({ presence }) => [presence.id, presence]))
  const street = streetNpcPlacements.flatMap((placement) => {
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
      markerPhase: presence.npcId ? getNpcQuestNotice(save, presence.npcId, content).phase : undefined,
    }]
  })
  const rosetta = content.terranLocations.location_terran_portal_plaza.npcPresences
    .find((presence) => presence.id === 'presence_rosetta')
  return rosetta ? [...street, {
    id: rosetta.id,
    presence: rosetta,
    locationId: 'location_terran_portal_plaza' as const,
    point: { x: getCityDoor('location_terran_portal_plaza').x + 38, y: getCityDoor('location_terran_portal_plaza').y + 4 },
    palette: 'knowledge',
    variant: 0,
    marker: '?' as const,
    markerPhase: 'guide' as const,
    stationary: true,
  }] : street
}
