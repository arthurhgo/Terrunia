import type { ContentCatalog } from '../../content/catalog'
import { TERRAN_LOCATION_IDS, type TerranLocationId } from '../../content/terran'
import type { GameSave, QuestStatus } from '../game/types'
import { fail, ok, type Result } from '../shared/types'

const terranLocationIdSet = new Set<string>(TERRAN_LOCATION_IDS)

export const isTerranLocationId = (locationId: string): locationId is TerranLocationId =>
  terranLocationIdSet.has(locationId)

export const getDiscoveredTerranLocationIds = (save: GameSave): TerranLocationId[] =>
  TERRAN_LOCATION_IDS.filter((locationId) => save.world.unlockedLocationIds.includes(locationId))

export const getTerranQuestDestination = (
  save: GameSave,
  catalog: ContentCatalog,
): { questId: string; locationId: TerranLocationId; status: QuestStatus } | null => {
  const priority: QuestStatus[] = ['active', 'available', 'completed', 'failed']

  for (const status of priority) {
    for (const progress of Object.values(save.quests)) {
      if (progress.status !== status) continue
      const locationId = catalog.quests[progress.questId]?.terranFlow?.[status]
      if (locationId && isTerranLocationId(locationId)) {
        return { questId: progress.questId, locationId, status }
      }
    }
  }

  return null
}

export const visitTerranLocation = (
  save: GameSave,
  locationId: string,
  catalog: ContentCatalog,
  now = new Date().toISOString(),
): Result<{ save: GameSave; firstVisit: boolean }> => {
  const location = catalog.terranLocations[locationId]
  if (!location || !isTerranLocationId(locationId)) {
    return fail('UNKNOWN_TERRAN_LOCATION', 'Esta localização não pertence à estrutura oficial de Terran.')
  }
  if (save.battle) {
    return fail('TERRAN_TRAVEL_DURING_BATTLE', 'Não é possível circular por Terran durante uma batalha.')
  }

  const firstVisit = !save.world.unlockedLocationIds.includes(locationId)
  if (!firstVisit && save.world.currentLocationId === locationId) {
    return ok({ save, firstVisit: false })
  }

  const next = structuredClone(save)
  next.world.currentLocationId = locationId
  if (firstVisit) next.world.unlockedLocationIds.push(locationId)
  next.updatedAt = now
  next.revision += 1
  next.eventLog.push(
    firstVisit
      ? `TerranLocationDiscovered:${locationId}`
      : `TerranLocationVisited:${locationId}`,
  )

  return ok({ save: next, firstVisit })
}
