import { describe, expect, it } from 'vitest'
import { content } from '../../content/catalog'
import { waveEncounter } from './waves'

describe('Portal — Modo Ondas (BALANCE_DRAFT)', () => {
  it('cria encontros repetíveis sem utilizar o nó do chefe', () => {
    const first = waveEncounter(content, 1)
    expect(first.trailNodeId).toBe('astravel_entry')
    expect(first.enemyDefinitionIds).toEqual(['enemy_fungorro_crawler'])
    expect(first.rewards.worldFlags).toBeUndefined()
    expect(first.rewards.boundMemory).toBeUndefined()
  })
  it('aumenta quantidade, recompensas e variedade sem ultrapassar quatro inimigos', () => {
    const first = waveEncounter(content, 1)
    const seventh = waveEncounter(content, 7)
    expect(seventh.enemyDefinitionIds.length).toBeGreaterThan(first.enemyDefinitionIds.length)
    expect(seventh.enemyDefinitionIds.length).toBeLessThanOrEqual(4)
    expect(waveEncounter(content, 12).enemyDefinitionIds).toContain('enemy_spore_sower')
    expect(seventh.rewards.characterXp).toBeGreaterThan(first.rewards.characterXp)
    expect(seventh.rewards.lootDefinitionIds).toHaveLength(seventh.enemyDefinitionIds.length)
    for (const itemId of seventh.rewards.lootDefinitionIds) expect(content.items[itemId]).toBeDefined()
  })
  it('coloca Sentinela nas ondas 5, 10 e 15 sem liberar drops únicos do Colosso', () => {
    for (const wave of [5, 10, 15]) {
      const encounter = waveEncounter(content, wave)
      expect(encounter.enemyDefinitionIds).toContain('enemy_ruin_sentinel')
      expect(encounter.enemyDefinitionIds).not.toContain('enemy_colossus_mycelium')
      expect(encounter.rewards.lootDefinitionIds).not.toContain('fragment_mycelial_essence')
      expect(encounter.rewards.lootDefinitionIds).not.toContain('item_gem_esmeralda_crescimento')
      expect(encounter.rewards.worldFlags).toBeUndefined()
      expect(encounter.rewards.boundMemory).toBeUndefined()
    }
  })
  it('introduz quatro criaturas adicionais ao pool de ondas, sem passar de quatro oponentes', () => {
    const newEnemies = new Set(['enemy_luminous_slime', 'enemy_void_moth', 'enemy_spore_mantis', 'enemy_ruin_sentinel'])
    const found = new Set<string>()
    for (let wave = 1; wave <= 24; wave++) {
      const encounter = waveEncounter(content, wave)
      for (const id of encounter.enemyDefinitionIds) if (newEnemies.has(id)) found.add(id)
      expect(encounter.enemyDefinitionIds.length).toBeLessThanOrEqual(4)
      for (const id of encounter.rewards.lootDefinitionIds) expect(content.items[id]).toBeDefined()
    }
    expect(found).toEqual(newEnemies)
  })

})
