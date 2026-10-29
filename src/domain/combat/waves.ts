import type { ContentCatalog } from '../../content/catalog'
import type { EncounterDefinition } from '../../content/types'
import type { GameSave } from '../game/types'
import type { BattleState } from './types'
import { createBattle } from './engine'

/** BALANCE_DRAFT — endless, deterministic enemy roster, no boss or story-node replay. */
export const waveEncounter = (catalog: ContentCatalog, requestedWave: number): EncounterDefinition => {
  const wave = Number.isSafeInteger(requestedWave) && requestedWave > 0 ? requestedWave : 1
  const enemyIds = Array.from({ length: Math.min(4, 1 + Math.floor(wave / 3)) },
    (_, index) => (index + wave) % 3 === 0 ? 'enemy_spore_sower' : 'enemy_fungorro_crawler')
  const baseXp = enemyIds.reduce((sum, id) => sum + catalog.enemies[id].xpReward, 0)
  const baseGold = enemyIds.reduce((sum, id) => sum + catalog.enemies[id].goldReward, 0)
  const baseResonance = enemyIds.reduce((sum, id) => sum + catalog.enemies[id].boundResonanceReward, 0)
  const multiplier = 1 + Math.min(200, wave - 1) * 0.12
  return {
    id: 'encounter_astravel_wave',
    name: 'Ondas da Ruína — ' + wave,
    locationLabel: 'Portal de Astravél',
    victoryTitle: 'Onda ' + wave + ' superada',
    victorySummary: 'Os ecos hostis recuam. É possível recolher o espólio e iniciar outra onda.',
    trailNodeId: 'astravel_entry',
    enemyDefinitionIds: enemyIds,
    canFlee: false,
    rewards: {
      characterXp: Math.floor(baseXp * multiplier),
      gold: Math.floor(baseGold * multiplier),
      boundResonance: Math.floor(baseResonance * multiplier),
      lootDefinitionIds: enemyIds.map((id) => catalog.enemies[id].lootDefinitionIds[0]),
    },
    status: 'BALANCE_DRAFT',
  }
}

export const createWaveBattle = (save: GameSave, catalog: ContentCatalog, wave: number): BattleState => {
  const requested = Number.isSafeInteger(wave) && wave > 0 ? wave : 1
  const battle = createBattle(save, waveEncounter(catalog, requested), catalog)
  const difficulty = Math.min(50, 1 + (requested - 1) * 0.14)
  for (const enemy of Object.values(battle.combatants).filter((actor) => actor.side === 'enemy')) {
    enemy.maxHp = Math.max(1, Math.ceil(enemy.maxHp * difficulty))
    enemy.hp = enemy.maxHp
    enemy.attackPower = Math.max(1, Math.ceil(enemy.attackPower * (1 + (difficulty - 1) * 0.65)))
    enemy.mitigation += Math.floor((requested - 1) / 5)
  }
  battle.waveIndex = requested
  return battle
}
