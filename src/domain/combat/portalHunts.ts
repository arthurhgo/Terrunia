import type { ContentCatalog } from '../../content/catalog'
import type { GameSave } from '../game/types'
import { fail, ok, type Result } from '../shared/types'

export const PORTAL_HUNT_IDS = [
  'encounter_portal_luminous_nest',
  'encounter_portal_spore_hunt',
  'encounter_portal_ruin_watch',
  'encounter_portal_mycelial_track',
  'encounter_portal_ruin_guard',
] as const

/** CONTENT_DRAFT: the original three hunts remain unlocked after the first battle.
 * New hunts only open when their relevant main chapter is delivered. */
export const PORTAL_HUNT_STORY_GATES: Partial<Record<(typeof PORTAL_HUNT_IDS)[number], {
  questId: string; description: string
}>> = {
  encounter_portal_mycelial_track: {
    questId: 'main_astravel_lost_hunters',
    description: 'Entregue “Caçadores Perdidos” a Vorren para liberar o Rastro Micelial.',
  },
  encounter_portal_ruin_guard: {
    questId: 'main_astravel_corruption',
    description: 'Entregue “A Raiz da Corrupção” a Lithwynn para liberar os Guardiões do Limiar.',
  },
}

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
  const gate = PORTAL_HUNT_STORY_GATES[encounterId as (typeof PORTAL_HUNT_IDS)[number]]
  if (gate && save.quests[gate.questId]?.status !== 'completed') {
    return fail('HUNT_STORY_LOCKED', gate.description)
  }
  if (save.vitals.hp <= 0) return fail('HUNT_LIFE', 'Descanse na Base antes de combater.')
  return ok(true)
}
