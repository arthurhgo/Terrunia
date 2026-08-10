import { describe, expect, it } from 'vitest'
import { content } from '../content/catalog'
import { createNewSave } from '../domain/game/createSave'
import { migrateAndValidateSave } from './saveSchema'

describe('save versionado', () => {
  it('valida save atual', () => {
    const save = createNewSave(
      'user_1',
      'Aron',
      'character.terririan.default',
      content,
      '2026-08-10T12:00:00.000Z',
      { saveId: 'save_1', characterId: 'char_1' },
    )
    expect(migrateAndValidateSave(save).saveId).toBe('save_1')
  })

  it('migra schema 0 sem apagar progresso', () => {
    const save = createNewSave(
      'user_1',
      'Aron',
      'character.terririan.default',
      content,
      '2026-08-10T12:00:00.000Z',
      { saveId: 'save_1', characterId: 'char_1' },
    )
    const legacy = { ...save, schemaVersion: 0, eventLog: undefined }
    const migrated = migrateAndValidateSave(legacy)
    expect(migrated.schemaVersion).toBe(3)
    expect(migrated.character.name).toBe('Aron')
    expect(migrated.eventLog).toContain('SaveMigrated:0->1')
    expect(migrated.eventLog).toContain('SaveMigrated:1->2')
    expect(migrated.eventLog).toContain('SaveMigrated:2->3')
  })

  it('migra schema 1, preserva progresso e libera o acampamento após a primeira vitória', () => {
    const save = createNewSave(
      'user_1',
      'Aron',
      'character.terririan.default',
      content,
      '2026-08-10T12:00:00.000Z',
      { saveId: 'save_1', characterId: 'char_1' },
    )
    save.wallet.gold = 77
    save.world.completedEncounterIds.push('encounter_fungorro_01')
    const legacy = {
      ...save,
      schemaVersion: 1,
      gameVersion: '0.1.0',
      world: {
        ...save.world,
        trailNodeStates: {
          astravel_entry: 'completed',
          astravel_fungorro_01: 'completed',
          astravel_locked_03: 'locked',
          astravel_boss_preview: 'boss',
        },
      },
    }
    const migrated = migrateAndValidateSave(legacy)
    expect(migrated.schemaVersion).toBe(3)
    expect(migrated.wallet.gold).toBe(77)
    expect(migrated.world.trailNodeStates.astravel_camp_03).toBe('current')
    expect(migrated.eventLog).toContain('SaveMigrated:1->2')
    expect(migrated.eventLog).toContain('SaveMigrated:2->3')
  })

  it('migra schema 2 e libera o chefe somente após o limiar descoberto', () => {
    const save = createNewSave(
      'user_1',
      'Aron',
      'character.terririan.default',
      content,
      '2026-08-10T12:00:00.000Z',
      { saveId: 'save_1', characterId: 'char_1' },
    )
    const legacy = {
      ...save,
      schemaVersion: 2,
      gameVersion: '0.2.0',
      world: {
        ...save.world,
        trailNodeStates: {
          ...save.world.trailNodeStates,
          astravel_ruin_threshold_05: 'completed',
          astravel_boss_preview: 'boss',
        },
        worldFlags: ['fungal_chambers_threshold_discovered'],
      },
    }
    const migrated = migrateAndValidateSave(legacy)
    expect(migrated.schemaVersion).toBe(3)
    expect(migrated.gameVersion).toBe('0.3.0')
    expect(migrated.world.trailNodeStates.astravel_boss_preview).toBe('bossCurrent')
    expect(migrated.eventLog).toContain('SaveMigrated:2->3')
  })

  it('rejeita nome inválido em save importado', () => {
    const save = createNewSave(
      'user_1',
      'Aron',
      'character.terririan.default',
      content,
      '2026-08-10T12:00:00.000Z',
      { saveId: 'save_1', characterId: 'char_1' },
    )
    save.character.name = '<script>'
    expect(() => migrateAndValidateSave({ ...save, character: { ...save.character, name: '' } })).toThrow()
  })

  it('rejeita referência de Vínculo inconsistente', () => {
    const save = createNewSave(
      'user_1',
      'Aron',
      'character.terririan.default',
      content,
      '2026-08-10T12:00:00.000Z',
      { saveId: 'save_1', characterId: 'char_1' },
    )
    save.character.bondedEquipment.weapon = 'bound_missing'
    expect(() => migrateAndValidateSave(save)).toThrow()
  })

  it('rejeita barra de Essência que deveria ter sido convertida em ponto', () => {
    const save = createNewSave(
      'user_1',
      'Aron',
      'character.terririan.default',
      content,
      '2026-08-10T12:00:00.000Z',
      { saveId: 'save_1', characterId: 'char_1' },
    )
    save.essence.current = save.essence.required
    expect(() => migrateAndValidateSave(save)).toThrow()
  })
})
