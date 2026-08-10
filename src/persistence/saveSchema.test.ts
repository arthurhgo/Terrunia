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
    expect(migrated.schemaVersion).toBe(1)
    expect(migrated.character.name).toBe('Aron')
    expect(migrated.eventLog).toContain('SaveMigrated:0->1')
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
