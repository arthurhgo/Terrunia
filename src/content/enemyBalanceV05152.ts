import type { EnemyDefinition } from './types'

/**
 * v0.5.15.2 · BALANCE_DRAFT (NOT CANON).
 * Overrides only existing species stats. No enemy IDs, rewards, attacks,
 * AI schedules, quest gates, weaknesses or boss mechanics are changed.
 *
 * Early tutorial enemies remain weaker so the player learns combat first;
 * ranged/poison foes trade toughness for pressure, tanks trade damage for HP.
 */
export type EnemyBudget = Pick<EnemyDefinition,'maxHp'|'mitigation'|'attackPower'>

export const ENEMY_BUDGET_V05152:Record<string,EnemyBudget>={
 // Astravél opening / tutorial: keep the first fight approachable.
 enemy_fungorro_crawler: {maxHp:8,mitigation:1,attackPower:3},
 enemy_luminous_slime: {maxHp:7,mitigation:0,attackPower:2},
 enemy_void_moth: {maxHp:8,mitigation:0,attackPower:3},
 enemy_spore_sower: {maxHp:12,mitigation:1,attackPower:3},
 enemy_fungorro_thornback: {maxHp:13,mitigation:1,attackPower:4},
 // Tier I → Tier II transition: different monster roles.
 enemy_fungal_slime: {maxHp:16,mitigation:1,attackPower:4},
 enemy_spore_mantis: {maxHp:16,mitigation:1,attackPower:5},
 enemy_spore_bulwark: {maxHp:21,mitigation:3,attackPower:4},
 enemy_fungal_horror: {maxHp:24,mitigation:2,attackPower:6},
 enemy_mycelial_stalker: {maxHp:23,mitigation:2,attackPower:7},
 enemy_ruin_sentinel: {maxHp:27,mitigation:3,attackPower:6},
 enemy_ruin_warden: {maxHp:35,mitigation:4,attackPower:7},
 // Bosses retain their existing skills, protection and summons.
 enemy_blackroot_titan: {maxHp:48,mitigation:4,attackPower:8},
 enemy_colossus_mycelium: {maxHp:68,mitigation:4,attackPower:9},
 enemy_ruin_corrupted_sentinel: {maxHp:86,mitigation:5,attackPower:9},
 enemy_granite_golem: {maxHp:82,mitigation:4,attackPower:7},
 // Existing Level 6–14 biome expansions: keep them beyond introductory Astravél.
 enemy_lagarto_sombra: {maxHp:32,mitigation:2,attackPower:7},
 enemy_tatu_fulgor: {maxHp:37,mitigation:4,attackPower:7},
 enemy_corvo_bruxo: {maxHp:27,mitigation:1,attackPower:8},
 enemy_lobo_carcaca: {maxHp:40,mitigation:3,attackPower:8},
 enemy_serpente_tempestade: {maxHp:82,mitigation:4,attackPower:10},
 enemy_chacal_sombras: {maxHp:44,mitigation:3,attackPower:9},
 enemy_escorpiao_aco: {maxHp:52,mitigation:5,attackPower:9},
 enemy_serpente_solar: {maxHp:48,mitigation:2,attackPower:10},
 enemy_golem_areia: {maxHp:105,mitigation:6,attackPower:12},
}

export const rebalanceEnemyV05152=(enemy:EnemyDefinition):EnemyDefinition=>({
 ...enemy,...(ENEMY_BUDGET_V05152[enemy.id]??{}),
 status:enemy.status==='CONTENT_DRAFT'?'BALANCE_DRAFT':enemy.status,
})
