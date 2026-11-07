import type { ContentCatalog } from '../../content/catalog'
import type { TrailDefinition } from '../../content/types'
import { getPlayableBiome } from '../../content/biomeRegistry'
import type { GameSave } from '../game/types'
import { fail, ok, type Result } from '../shared/types'
import { completeTrailNode } from './trailEngine'

/**
 * v0.5.10 OWNER_DECISION: provisional sequential gates, not permanent canon.
 * No level or Clan lock is introduced; these are completion-only access gates.
 */
export const BIOME_PREREQUISITES: Readonly<Record<string, string>> = {
  biome_cerrado_mistico: 'astravel_boss_preview',
  biome_deserto_elduran: 'cerrado_storm_04',
}

/** Pure selector shared by Portal UI and entry transaction. */
export const canEnterBiome = (save: GameSave, biomeId: string, catalog: ContentCatalog): Result<TrailDefinition> => {
  const biome = getPlayableBiome(biomeId)
  const trailId = biome?.trailIds[0]
  const trail = trailId ? catalog.trails[trailId] : undefined
  if (!trail || !trail.nodes.length || trail.nodes[0].type !== 'entry') {
    return fail('BIOME_NOT_PLAYABLE', 'Essa região ainda não possui uma expedição jogável.')
  }
  if (save.battle) return fail('BATTLE_ACTIVE', 'Finalize o combate atual antes de entrar em outra região.')
  if (save.world.currentLocationId !== 'location_terran_portal_plaza') {
    return fail('NOT_AT_PORTAL', 'Retorne à Praça do Portal para escolher o próximo destino.')
  }
  if (save.vitals.hp <= 0) return fail('PLAYER_EXHAUSTED', 'Descanse na Base antes de explorar.')
  const prerequisite = BIOME_PREREQUISITES[biomeId]
  if (prerequisite && save.world.trailNodeStates[prerequisite] !== 'completed') {
    return fail('REGION_GATE', biomeId === 'biome_cerrado_mistico'
      ? 'Conclua o Colosso Micélio em Astravél para liberar o Cerrado.'
      : 'Conclua o percurso do Cerrado Místico para liberar Elduran.')
  }
  return ok(trail)
}

/**
 * Backward-compatible entry for old saves: register only missing node states.
 * Never reset cleared nodes, XP, inventory, or a previous boss reward.
 */
export const enterBiomeTrail = (save: GameSave, biomeId: string, catalog: ContentCatalog, now: string): Result<GameSave> => {
  const access = canEnterBiome(save, biomeId, catalog)
  if (!access.ok) return access
  const trail = access.value
  const entry = trail.nodes[0]
  const next = structuredClone(save)
  for (const node of trail.nodes) {
    next.world.trailNodeStates[node.id] ??= node.type === 'boss' ? 'boss' : 'locked'
  }
  const firstVisit = next.world.trailNodeStates[entry.id] !== 'completed'
  next.world.currentLocationId = entry.id
  if (!next.world.unlockedLocationIds.includes(entry.id)) next.world.unlockedLocationIds.push(entry.id)

  if (firstVisit) {
    next.world.trailNodeStates[entry.id] = 'current'
    const started = completeTrailNode(next, trail, entry.id, now)
    if (!started.ok) return started
    started.value.save.eventLog.push('BiomeEntered:' + biomeId)
    return ok(started.value.save)
  }

  next.updatedAt = now
  next.revision += 1
  next.eventLog.push('BiomeRevisited:' + biomeId)
  return ok(next)
}
