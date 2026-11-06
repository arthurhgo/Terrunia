import type { ContentCatalog } from './catalog'
import type { GameSave } from '../domain/game/types'

/** CONTENT_DRAFT: field observations, not a newly established ancient-world canon. */
export const progressiveFaunaLore = [
  { id: 'fauna_fungorro_thornback', enemyId: 'enemy_fungorro_thornback',
    title: 'Espinhos da Fronteira',
    description: 'Os Fungorros Espinhais apresentam placas rígidas entre os esporos. O Núcleo Fúngico recolhido em combate permite novas análises de Eldamar.',
    status: 'CONTENT_DRAFT' },
  { id: 'fauna_spore_bulwark', enemyId: 'enemy_spore_bulwark',
    title: 'Carapaça de Esporos',
    description: 'O Casco de Esporos apresenta maior resistência aos golpes. A Quitina recuperada interessa aos ofícios e às encomendas de Terran.',
    status: 'CONTENT_DRAFT' },
  { id: 'fauna_mycelial_stalker', enemyId: 'enemy_mycelial_stalker',
    title: 'Rastros de Micélio',
    description: 'Rastreadores Miceliais se destacam pela agressividade e pela dispersão de esporos. Suas fibras podem ser vendidas, convertidas ou entregues a quem as requisita.',
    status: 'CONTENT_DRAFT' },
  { id: 'fauna_ruin_warden', enemyId: 'enemy_ruin_warden',
    title: 'Marcas no Limiar',
    description: 'Os Vigias do Limiar resistem por meio de placas densas marcadas pela Ruína. As lascas recuperadas documentam a passagem e servem às encomendas de Terran.',
    status: 'CONTENT_DRAFT' },
] as const

/** Reveals only species in encounters already won and claimed on this specific save.
 * Repeatable Portal hunts/waves count via BattleWon events; no automatic discovery
 * on opening an NPC, viewing a locked quest or merely entering battle.
 */
export function getDiscoveredEnemyIds(
  save: Pick<GameSave, 'eventLog' | 'world'>, catalog: ContentCatalog,
): Set<string> {
  const won = new Set<string>([
    ...save.world.completedEncounterIds,
    ...save.eventLog.flatMap((event) => event.startsWith('BattleWon:') ? [event.slice('BattleWon:'.length)] : []),
  ])
  const direct = save.eventLog.flatMap((event) => event.startsWith('EnemyStudied:')
    ? [event.slice('EnemyStudied:'.length)] : [])
  // Legacy static encounter wins remain readable without any save migration.
  // For generated waves, the exact defeated species comes from EnemyStudied events.
  return new Set([...direct.filter((id) => Boolean(catalog.enemies[id])),
    ...[...won].flatMap((encounterId) => catalog.encounters[encounterId]?.enemyDefinitionIds ?? [])])
}

export function getDiscoveredProgressiveFauna(save: GameSave, catalog: ContentCatalog) {
  const seen = getDiscoveredEnemyIds(save, catalog)
  return progressiveFaunaLore.filter((entry) => seen.has(entry.enemyId))
}
