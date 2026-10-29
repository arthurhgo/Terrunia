import { content } from '../../content/catalog'
import type { GameSave } from '../../domain/game/types'

export type JourneyStep = {
  id: string
  label: string
}

const terranStep = (save: GameSave): JourneyStep[] => {
  const location = content.terranLocations[save.world.currentLocationId]
  if (!location || save.world.currentLocationId === 'terran') return [{ id: 'terran', label: 'Terran' }]
  if (location.id === 'location_terran_portal_plaza') {
    return [{ id: 'terran', label: 'Terran' }, { id: 'portal', label: 'Portal' }]
  }
  return [{ id: 'terran', label: 'Terran' }, { id: location.id, label: location.shortName }]
}

/** Save-derived route from Terran to the character's current physical context. */
export function getWorldJourney(save: GameSave): JourneyStep[] {
  const locationId = save.world.currentLocationId
  const trailNode = content.trails.trail_astravel_entry.nodes.find((node) => node.id === locationId)
  const inDungeon = locationId === content.dungeons.dungeon_fungal_chambers.id

  const steps = trailNode || inDungeon
    ? [
        { id: 'terran', label: 'Terran' },
        { id: 'portal', label: 'Portal' },
        { id: 'astravel', label: 'Astravél' },
        ...(inDungeon
          ? [{ id: 'fungal-chambers', label: 'Câmaras' }]
          : [{ id: trailNode!.id, label: trailNode!.label }]),
      ]
    : terranStep(save)

  if (save.battle) steps.push({ id: `battle:${save.battle.id}`, label: 'Batalha' })
  return steps
}
