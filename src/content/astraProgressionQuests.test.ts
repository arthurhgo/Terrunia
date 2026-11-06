import { describe, expect, it } from 'vitest'
import { assetRegistry } from '../assets/assetRegistry'
import { content } from './catalog'
import { getAstravelChapterProgress } from '../domain/quests/astravelJourney'
import { createNewSave } from '../domain/game/createSave'
import { refreshQuestAvailability } from '../domain/quests/questEngine'
import { migrateAndValidateSave } from '../persistence/saveSchema'
import { waveEncounter } from '../domain/combat/waves'

const newEnemyIds = [
  'enemy_fungorro_thornback', 'enemy_spore_bulwark',
  'enemy_mycelial_stalker', 'enemy_ruin_warden',
] as const
const optionalQuestIds = [
  'side_astravel_spore_shells',
  'side_astravel_mycelial_tracking',
  'side_astravel_ruin_wardens',
  'side_astravel_thornback_signs',
  'side_astravel_forge_chitin',
] as const

describe('v0.5.9 · progressão de inimigos, missões e capítulos', () => {
  it('introduz quatro espécies com materiais válidos e sprites substituíveis', () => {
    const levels = newEnemyIds.map((id) => {
      const enemy = content.enemies[id]
      expect(enemy).toBeDefined()
      expect(enemy.lootDefinitionIds.length).toBeGreaterThan(0)
      for (const lootId of enemy.lootDefinitionIds) expect(content.items[lootId]).toBeDefined()
      expect(assetRegistry[enemy.assetId]?.path).toContain('/assets/enemies/progression/')
      expect(assetRegistry[enemy.assetId]?.fallback).toBeTruthy()
      return enemy.level
    })
    expect(levels).toEqual([2, 3, 4, 5])
    const trailEncounters = content.trails.trail_astravel_entry.nodes
      .flatMap((node) => node.encounterId ? content.encounters[node.encounterId].enemyDefinitionIds : [])
    for (const id of newEnemyIds) expect(trailEncounters).toContain(id)
  })

  it('mistura novas espécies em Ondas, sem replicar loot do Colosso', () => {
    const seen = new Set<string>()
    for (let wave = 1; wave <= 24; wave++) {
      const encounter = waveEncounter(content, wave)
      encounter.enemyDefinitionIds.forEach((id) => seen.add(id))
      expect(encounter.enemyDefinitionIds.length).toBeLessThanOrEqual(4)
      expect(encounter.rewards.lootDefinitionIds).not.toContain('fragment_mycelial_essence')
      expect(encounter.rewards.boundMemory).toBeUndefined()
    }
    for (const id of newEnemyIds) expect(seen.has(id)).toBe(true)
  })

  it('mantém as secundárias opcionais, com entregas em sequência e suprimentos reais', () => {
    let save = createNewSave('stage-owner', 'Lysa', 'character.terririan.default', content)
    for (const id of optionalQuestIds) {
      expect(save.quests[id].status).toBe('locked')
      const quest = content.quests[id]
      expect(quest.category).toBe('secondary')
      for (const reward of quest.itemRewards ?? []) expect(content.items[reward.itemId]).toBeDefined()
    }
    save.quests.vs_astravel_first_contact.status = 'completed'
    save.quests.main_vorren_bestiary.status = 'completed'
    save.character.level = 2
    save = refreshQuestAvailability(save, content, save.updatedAt)
    expect(save.quests.side_astravel_thornback_signs.status).toBe('available')
    expect(save.quests.side_astravel_spore_shells.status).toBe('locked')
    expect(save.quests.side_astravel_forge_chitin.status).toBe('locked')
    save.character.level = 3
    save = refreshQuestAvailability(save, content, save.updatedAt)
    expect(save.quests.side_astravel_spore_shells.status).toBe('available')
    expect(save.quests.side_astravel_forge_chitin.status).toBe('available')
    expect(save.quests.side_astravel_mycelial_tracking.status).toBe('locked')

    save.quests.side_astravel_spore_shells.status = 'completed'
    save.quests.main_astravel_lost_hunters.status = 'completed'
    save.character.level = 4
    save = refreshQuestAvailability(save, content, save.updatedAt)
    expect(save.quests.side_astravel_mycelial_tracking.status).toBe('available')
    expect(save.quests.side_astravel_ruin_wardens.status).toBe('locked')

    save.quests.side_astravel_mycelial_tracking.status = 'completed'
    save.quests.main_astravel_corruption.status = 'completed'
    save.character.level = 5
    save = refreshQuestAvailability(save, content, save.updatedAt)
    expect(save.quests.side_astravel_ruin_wardens.status).toBe('available')
    expect(save.quests.side_astravel_ruin_wardens.tracked).toBe(false)
    expect(save.quests.side_astravel_ruin_wardens.status).not.toBe('active')
  })

  it('recupera novas missões ao migrar um save legado sem apagar progresso', () => {
    const old = createNewSave('legacy-owner', 'Lysa', 'character.terririan.default', content)
    old.wallet.gold = 88
    for (const id of optionalQuestIds) delete old.quests[id]
    const migrated = migrateAndValidateSave(old)
    expect(migrated.wallet.gold).toBe(88)
    for (const id of optionalQuestIds) expect(migrated.quests[id].status).toBe('locked')
  })

  it('exibe a sequência de três trechos sem alterar estados de missão', () => {
    const save = createNewSave('journey-owner', 'Lysa', 'character.terririan.default', content)
    const before = structuredClone(save)
    const chapters = getAstravelChapterProgress(save, content)
    expect(chapters).toHaveLength(3)
    expect(chapters.map((chapter) => chapter.total)).toEqual([5, 5, 5])
    expect(chapters.map((chapter) => chapter.questId)).toEqual([
      'vs_astravel_first_contact', 'main_astravel_lost_hunters', 'main_astravel_corruption',
    ])
    expect(save).toEqual(before)
  })
})
