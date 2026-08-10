import type { EnemyDefinition } from './types'

export const enemyDefinitions = [
  {
    id: 'enemy_fungorro_crawler',
    name: 'Fungorro Rastejante',
    level: 1,
    maxHp: 8,
    mitigation: 1,
    attackPower: 3,
    xpReward: 15,
    goldReward: 8,
    boundResonanceReward: 12,
    lootDefinitionIds: ['drop_fungal_nucleus'],
    weaknessTags: ['light', 'fire'],
    assetId: 'enemy.fungorro-crawler',
    status: 'BALANCE_DRAFT',
  },
] satisfies EnemyDefinition[]
