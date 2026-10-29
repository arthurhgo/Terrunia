import type { ContentCatalog } from '../../content/catalog'
import type { EncounterDefinition } from '../../content/types'
import type { PortalWaveRun } from '../game/types'

const WAVE_POOL = [
  'enemy_luminous_slime',
  'enemy_fungorro_crawler',
  'enemy_void_moth',
  'enemy_spore_sower',
  'enemy_spore_mantis',
  'enemy_ruin_sentinel',
] as const

/** BALANCE_DRAFT — endless linear pressure with a party-size cap and a boss every five waves. */
export const getPortalWaveScale = (wave: number) => 1 + Math.max(0, wave - 1) * 0.08

export function getPortalWaveEnemyIds(wave: number): string[] {
  const safeWave = Math.max(1, Math.floor(wave))
  if (safeWave % 5 === 0) {
    const support = WAVE_POOL[(safeWave / 5 - 1) % WAVE_POOL.length]
    return safeWave >= 10 ? ['enemy_colossus_mycelium', support] : ['enemy_colossus_mycelium']
  }
  const count = Math.min(3, 1 + Math.floor((safeWave - 1) / 2))
  const unlocked = Math.min(WAVE_POOL.length, 2 + Math.floor((safeWave - 1) / 2))
  return Array.from({ length: count }, (_, index) => WAVE_POOL[(safeWave + index - 1) % unlocked])
}

export function createPortalWaveEncounter(wave: number, catalog: ContentCatalog): EncounterDefinition {
  const safeWave = Math.max(1, Math.floor(wave))
  const enemyDefinitionIds = getPortalWaveEnemyIds(safeWave)
  const enemies = enemyDefinitionIds.map((id) => catalog.enemies[id]).filter(Boolean)
  const rewardScale = 1 + Math.floor((safeWave - 1) / 3) * 0.2
  const lootDefinitionIds = enemies
    .flatMap((enemy) => enemy.lootDefinitionIds.slice(0, 1))
    .slice(0, 3)

  return {
    id: 'encounter_portal_wave',
    name: `Portal sem Fim · Onda ${safeWave}`,
    locationLabel: `Nexo do Portal · Onda ${safeWave}`,
    victoryTitle: `Onda ${safeWave} superada`,
    victorySummary: 'Os ecos recuam por um instante. Colete os drops antes de abrir a próxima onda.',
    trailNodeId: 'portal_wave',
    enemyDefinitionIds,
    canFlee: false,
    portalMode: 'wave',
    rewards: {
      characterXp: Math.ceil(enemies.reduce((total, enemy) => total + enemy.xpReward, 0) * rewardScale),
      gold: Math.ceil(enemies.reduce((total, enemy) => total + enemy.goldReward, 0) * rewardScale),
      boundResonance: Math.ceil(enemies.reduce((total, enemy) => total + enemy.boundResonanceReward, 0) * rewardScale),
      lootDefinitionIds,
    },
    status: 'BALANCE_DRAFT',
  }
}

export const advanceWaveRun = (run: PortalWaveRun, rewardScore: number): PortalWaveRun => ({
  ...run,
  clearedWaves: Math.max(run.clearedWaves, run.currentWave),
  score: run.score + Math.max(0, Math.floor(rewardScore)),
})

export const nextWaveRun = (run: PortalWaveRun): PortalWaveRun => ({
  ...run,
  currentWave: run.currentWave + 1,
})
