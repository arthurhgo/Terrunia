import type { EncounterDefinition } from './types'
import { enemyDefinitions } from './enemies'

/** v0.5.14 BALANCE_DRAFT: existing enemy species, counts and rewards are configurable.
 * Four rooms x three waves. No new canon is inferred from these encounter tables.
 */
export const FUNGAL_STAGE_GROUPS = [
  ['enemy_fungorro_thornback', 'enemy_fungal_slime'],
  ['enemy_spore_sower', 'enemy_spore_mantis'],
  ['enemy_spore_bulwark', 'enemy_fungorro_thornback', 'enemy_fungal_slime'],
  ['enemy_spore_mantis', 'enemy_void_moth'],
  ['enemy_spore_sower', 'enemy_mycelial_stalker', 'enemy_fungal_slime'],
  ['enemy_fungal_horror', 'enemy_spore_bulwark', 'enemy_spore_sower'],
  ['enemy_mycelial_stalker', 'enemy_ruin_sentinel'],
  ['enemy_fungal_horror', 'enemy_spore_mantis', 'enemy_spore_bulwark'],
  ['enemy_blackroot_titan', 'enemy_mycelial_stalker', 'enemy_spore_sower'],
  ['enemy_ruin_sentinel', 'enemy_spore_bulwark', 'enemy_fungal_horror'],
  ['enemy_ruin_warden', 'enemy_mycelial_stalker', 'enemy_spore_sower'],
  ['enemy_blackroot_titan', 'enemy_spore_bulwark', 'enemy_fungal_horror'],
] as const

export const FUNGAL_ROOM_IDS = [
  'fungal_vestibule', 'fungal_spore_gallery', 'fungal_root_sanctum', 'fungal_core',
] as const

export const FUNGAL_BOSS_RULES = {
  bossDefinitionId: 'enemy_ruin_corrupted_sentinel',
  guardianDefinitionIds: ['enemy_spore_bulwark', 'enemy_mycelial_stalker', 'enemy_fungal_horror'],
  maxAliveGuards: 3,
  summonIntervalRounds: 5,
  healIntervalRounds: 2,
  healFraction: 0.05,
  buffIntervalRounds: 3,
  buffDurationTurns: 2,
  // OWNER_DECISION: all numerical attack/buff details are BALANCE_DRAFT.
  status: 'BALANCE_DRAFT',
} as const

export const FUNGAL_BOSS_ENCOUNTER_ID = 'encounter_fungal_core_sentinel'

const enemyById = Object.fromEntries(enemyDefinitions.map((enemy) => [enemy.id, enemy]))
export const fungalDungeonEncounters: EncounterDefinition[] = [
  ...FUNGAL_STAGE_GROUPS.map((ids, index) => {
    const roomIndex = Math.floor(index / 3)
    const stageIndex = index % 3 + 1
    const roomId = FUNGAL_ROOM_IDS[roomIndex]
    const enemies = ids.map((id) => enemyById[id])
    return {
      id: `encounter_${roomId}_stage_${stageIndex}`,
      name: `Estágio ${stageIndex}/3`,
      locationLabel: ['Vestíbulo Micelial', 'Galeria dos Esporos', 'Santuário das Raízes', 'Núcleo da Ruína'][roomIndex],
      victoryTitle: 'Estágio purificado',
      victorySummary: `Os fungos recuaram. Estágio ${stageIndex}/3 da sala ${roomIndex + 1} concluído.`,
      trailNodeId: 'astravel_boss_preview',
      enemyDefinitionIds: [...ids],
      canFlee: false,
      rewards: {
        characterXp: enemies.reduce((s, e) => s + e.xpReward, 0),
        gold: enemies.reduce((s, e) => s + e.goldReward, 0),
        boundResonance: enemies.reduce((s, e) => s + e.boundResonanceReward, 0),
        lootDefinitionIds: enemies.flatMap((e) => e.lootDefinitionIds),
      },
      status: 'BALANCE_DRAFT' as const,
    }
  }),
  {
    id: FUNGAL_BOSS_ENCOUNTER_ID,
    name: 'Núcleo da Ruína: Sentinela Corrompida',
    locationLabel: 'Câmaras Fúngicas',
    victoryTitle: 'A Sentinela silenciou',
    victorySummary: 'O totem arcano foi neutralizado. O Nexo preserva a memória desta Ruína.',
    trailNodeId: 'astravel_boss_preview',
    enemyDefinitionIds: [FUNGAL_BOSS_RULES.bossDefinitionId, ...FUNGAL_BOSS_RULES.guardianDefinitionIds],
    canFlee: false,
    rewards: {
      characterXp: 120, gold: 60, boundResonance: 256,
      lootDefinitionIds: ['fragment_mycelial_essence', 'item_gem_esmeralda_crescimento'],
      worldFlags: ['fungal_chambers_first_clear', 'astravel_route_cleared'],
      boundMemory: {
        type: 'boss', sourceId: 'enemy_ruin_corrupted_sentinel',
        title: 'Memória da Sentinela Corrompida',
        description: 'O Nexo testemunhou a queda do totem mágico que manipulava as raízes.',
      },
    },
    status: 'BALANCE_DRAFT',
  },
]
