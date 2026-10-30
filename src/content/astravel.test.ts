import { describe, expect, it } from 'vitest'
import { content } from './catalog'
import { ASTRAVEL_SECTORS } from './astravel'

const nodes = content.trails.trail_astravel_entry.nodes.filter((node) => node.encounterId)

describe('remake de Astravél', () => {
  it('liga quinze encontros únicos, cinco por trecho, a monstros, missões e drops válidos', () => {
    expect(nodes).toHaveLength(15)
    expect(new Set(nodes.map((node) => node.encounterId)).size).toBe(15)
    for (const sector of ASTRAVEL_SECTORS) expect(nodes.filter((node) => node.sectorId === sector.id)).toHaveLength(5)
    for (const node of nodes) {
      const encounter = content.encounters[node.encounterId!]
      expect(encounter.trailNodeId).toBe(node.id)
      expect(encounter.enemyDefinitionIds.length).toBeGreaterThan(0)
      expect(encounter.enemyDefinitionIds.length).toBeLessThanOrEqual(4)
      for (const enemyId of encounter.enemyDefinitionIds) {
        for (const drop of content.enemies[enemyId].lootDefinitionIds) expect(encounter.rewards.lootDefinitionIds).toContain(drop)
      }
      for (const itemId of encounter.rewards.lootDefinitionIds) expect(content.items[itemId]).toBeDefined()
      if (node.requiresQuestId) expect(content.quests[node.requiresQuestId]).toBeDefined()
    }
  })

  it('aumenta a pressão entre trechos, mantém dois apoios e preserva os componentes do chefe', () => {
    const threats = ASTRAVEL_SECTORS.map((sector) => nodes.filter((node) => node.sectorId === sector.id)
      .reduce((total, node) => total + content.encounters[node.encounterId!].enemyDefinitionIds.reduce((sum, id) =>
        sum + content.enemies[id].maxHp + content.enemies[id].attackPower, 0), 0))
    expect(threats[1]).toBeGreaterThan(threats[0])
    expect(threats[2]).toBeGreaterThan(threats[1])
    expect(nodes.filter((node) => node.checkpoint)).toHaveLength(2)
    for (const id of ['fragment_mycelial_essence', 'item_gem_esmeralda_crescimento', 'quest_hunter_insignia']) {
      expect(content.items[id].convertToEssence).toBe(false)
      expect(content.items[id].sellable).toBe(false)
    }
  })
})
