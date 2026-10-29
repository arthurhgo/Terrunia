import type { ContentCatalog } from '../../content/catalog'
import type { GameSave } from '../game/types'
import { fail, ok, type Result } from '../shared/types'

export const PORTAL_HUNT_IDS = [
  'encounter_portal_luminous_nest',
  'encounter_portal_spore_hunt',
  'encounter_portal_ruin_watch',
] as const

export const isPortalHuntId = (id: string): id is (typeof PORTAL_HUNT_IDS)[number] =>
  PORTAL_HUNT_IDS.some((entry) => entry === id)

export function canStartPortalHunt(
  save: GameSave,
  encounterId: string,
  catalog: ContentCatalog,
): Result<true> {
  if (!isPortalHuntId(encounterId) || !catalog.encounters[encounterId]) {
    return fail('HUNT_NOT_FOUND', 'Esta caçada ainda não existe.')
  }
  if (save.battle || save.world.currentLocationId !== 'location_terran_portal_plaza') {
    return fail('HUNT_LOCATION', 'Inicie a caçada na Praça do Portal, fora de combate.')
  }
  if (save.world.trailNodeStates.astravel_fungorro_01 !== 'completed') {
    return fail('HUNT_LOCKED', 'Conclua o primeiro encontro em Astravél para liberar as caçadas.')
  }
  if (save.vitals.hp <= 0) return fail('HUNT_LIFE', 'Descanse na Base antes de combater.')
  return ok(true)
}
