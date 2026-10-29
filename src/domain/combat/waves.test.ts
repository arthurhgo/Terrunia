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
})
