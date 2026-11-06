import { describe, expect, it } from 'vitest'
import { content } from './catalog'
import { createNewSave } from '../domain/game/createSave'
import { getDiscoveredEnemyIds, getDiscoveredProgressiveFauna, progressiveFaunaLore } from './progressiveFaunaLore'

describe('lore descoberto por vitórias reais', () => {
  it('não revela espécies apenas pela oferta, combate não recolhido ou abertura do bestiário', () => {
    const save = createNewSave('field-lore', 'Lysa', 'character.terririan.default', content)
    save.quests.side_astravel_thornback_signs.status = 'available'
    save.eventLog.push('PortalHuntStarted:encounter_portal_mycelial_track')
    expect(getDiscoveredProgressiveFauna(save, content)).toEqual([])
    expect(getDiscoveredEnemyIds(save, content).size).toBe(0)
  })

  it('registra apenas espécies combatidas em encontro vencido e recompensas recolhidas', () => {
    const save = createNewSave('field-lore', 'Lysa', 'character.terririan.default', content)
    save.eventLog.push('BattleWon:encounter_portal_mycelial_track')
    const known = getDiscoveredProgressiveFauna(save, content)
    expect(known.map((entry) => entry.enemyId)).toEqual([
      'enemy_spore_bulwark', 'enemy_mycelial_stalker',
    ].sort((a,b) => progressiveFaunaLore.findIndex(x=>x.enemyId===a)-progressiveFaunaLore.findIndex(x=>x.enemyId===b)))
    expect(known.every((entry) => entry.status === 'CONTENT_DRAFT')).toBe(true)
    expect(known.some((entry) => entry.enemyId === 'enemy_ruin_warden')).toBe(false)
  })

  it('descobre espécies do Modo Ondas pelos IDs realmente derrotados, sem spoilers', () => {
    const save = createNewSave('field-wave', 'Lysa', 'character.terririan.default', content)
    save.eventLog.push('BattleWon:encounter_astravel_wave')
    expect(getDiscoveredProgressiveFauna(save, content)).toEqual([])
    save.eventLog.push('EnemyStudied:enemy_mycelial_stalker')
    save.eventLog.push('EnemyStudied:enemy_ruin_warden')
    const discovered = getDiscoveredProgressiveFauna(save, content)
    expect(discovered.map((entry) => entry.enemyId)).toEqual([
      'enemy_mycelial_stalker', 'enemy_ruin_warden',
    ])
    expect(getDiscoveredEnemyIds(save, content).has('enemy_spore_bulwark')).toBe(false)
    save.eventLog.push('EnemyStudied:enemy_not_in_catalog')
    expect(getDiscoveredEnemyIds(save, content).has('enemy_not_in_catalog')).toBe(false)
  })

  it('usa registros da rota concluída sem gerar novos campos de save', () => {
    const save = createNewSave('field-lore', 'Lysa', 'character.terririan.default', content)
    const before = structuredClone(save)
    const completed = content.encounters.encounter_astravel_moth_03
    expect(completed).toBeDefined()
    save.world.completedEncounterIds.push(completed.id)
    expect(getDiscoveredProgressiveFauna(save, content).some((entry) => entry.enemyId === 'enemy_fungorro_thornback')).toBe(true)
    expect(save.eventLog).toEqual(before.eventLog)
    expect(before.eventLog).toContain('CharacterCreated')
  })
})
