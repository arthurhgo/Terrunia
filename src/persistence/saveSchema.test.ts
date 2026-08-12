import { describe, expect, it } from 'vitest'
import { content } from '../content/catalog'
import { performGradeThreeRite, performGradeTwoRite } from '../domain/bond/boundItems'
import { bindPrologueWeapon, createNewSave } from '../domain/game/createSave'
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
    expect(migrated.schemaVersion).toBe(6)
    expect(migrated.character.name).toBe('Aron')
    expect(migrated.eventLog).toContain('SaveMigrated:0->1')
    expect(migrated.eventLog).toContain('SaveMigrated:1->2')
    expect(migrated.eventLog).toContain('SaveMigrated:2->3')
    expect(migrated.eventLog).toContain('SaveMigrated:3->4')
    expect(migrated.eventLog).toContain('SaveMigrated:4->5')
    expect(migrated.eventLog).toContain('SaveMigrated:5->6')
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
    expect(migrated.schemaVersion).toBe(6)
    expect(migrated.wallet.gold).toBe(77)
    expect(migrated.world.trailNodeStates.astravel_camp_03).toBe('current')
    expect(migrated.eventLog).toContain('SaveMigrated:1->2')
    expect(migrated.eventLog).toContain('SaveMigrated:2->3')
    expect(migrated.eventLog).toContain('SaveMigrated:3->4')
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
    expect(migrated.schemaVersion).toBe(6)
    expect(migrated.gameVersion).toBe('0.6.0')
    expect(migrated.world.trailNodeStates.astravel_boss_preview).toBe('bossCurrent')
    expect(migrated.eventLog).toContain('SaveMigrated:2->3')
    expect(migrated.eventLog).toContain('SaveMigrated:3->4')
  })

  it('migra schema 3 e reconcilia a recompensa do Grau III após o Colosso', () => {
    const base = createNewSave(
      'user_1',
      'Aron',
      'character.terririan.default',
      content,
      '2026-08-10T12:00:00.000Z',
      { saveId: 'save_1', characterId: 'char_1' },
    )
    const bound = bindPrologueWeapon(base, content, '2026-08-10T12:01:00.000Z', 'bound_1')
    if (!bound.ok) throw new Error(bound.message)
    bound.value.boundItems.bound_1.resonance = 104
    bound.value.world.completedEncounterIds.push('encounter_colossus_mycelium_01')
    bound.value.world.worldFlags.push('colossus_mycelium_defeated')

    const migrated = migrateAndValidateSave({
      ...bound.value,
      schemaVersion: 3,
      gameVersion: '0.3.0',
    })
    expect(migrated.schemaVersion).toBe(6)
    expect(migrated.boundItems.bound_1.resonance).toBe(300)
    expect(migrated.inventory).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ definitionId: 'item_gem_esmeralda_crescimento' }),
      ]),
    )
    expect(migrated.world.worldFlags).toContain('grade_3_reward_reconciled')
    expect(migrated.eventLog).toContain('GradeThreeRewardReconciled')
  })

  it('migra schema 4 preservando quest ativa e habilitando o tracker', () => {
    const save = createNewSave(
      'user_1',
      'Aron',
      'character.terririan.default',
      content,
      '2026-08-10T12:00:00.000Z',
      { saveId: 'save_1', characterId: 'char_1' },
    )
    const legacy = structuredClone(save) as unknown as Record<string, unknown>
    legacy.schemaVersion = 4
    legacy.gameVersion = '0.4.0'
    const character = legacy.character as Record<string, unknown>
    delete character.titleIds
    const quests = legacy.quests as Record<string, Record<string, unknown>>
    quests.vs_astravel_first_contact.status = 'active'
    delete quests.vs_astravel_first_contact.tracked
    const migrated = migrateAndValidateSave(legacy)
    expect(migrated.schemaVersion).toBe(6)
    expect(migrated.character.titleIds).toEqual([])
    expect(migrated.quests.vs_astravel_first_contact.tracked).toBe(true)
    expect(migrated.eventLog).toContain('SaveMigrated:4->5')
    expect(migrated.eventLog).toContain('SaveMigrated:5->6')
  })

  it('valida e recarrega Grau III com exatamente uma Joia', () => {
    const base = createNewSave(
      'user_1',
      'Aron',
      'character.terririan.default',
      content,
      '2026-08-10T12:00:00.000Z',
      { saveId: 'save_1', characterId: 'char_1' },
    )
    const bound = bindPrologueWeapon(base, content, '2026-08-10T12:01:00.000Z', 'bound_1')
    if (!bound.ok) throw new Error(bound.message)
    bound.value.world.currentLocationId = 'location_terran_bond_workshop'
    bound.value.boundItems.bound_1.resonance = 300
    bound.value.inventory.push({
      instanceId: 'fragment_1',
      definitionId: 'fragment_mycelial_essence',
      quantity: 1,
      rarity: 'rare',
      locked: false,
      favorite: false,
      acquiredAt: '2026-08-10T12:02:00.000Z',
    })
    const gradeTwo = performGradeTwoRite(
      bound.value,
      'bound_1',
      'fragment_1',
      content,
      '2026-08-10T12:03:00.000Z',
    )
    if (!gradeTwo.ok) throw new Error(gradeTwo.message)
    gradeTwo.value.inventory.push({
      instanceId: 'gem_1',
      definitionId: 'item_gem_esmeralda_crescimento',
      quantity: 1,
      rarity: 'rare',
      locked: false,
      favorite: false,
      acquiredAt: '2026-08-10T12:04:00.000Z',
    })
    const gradeThree = performGradeThreeRite(
      gradeTwo.value,
      'bound_1',
      'gem_1',
      content,
      '2026-08-10T12:05:00.000Z',
    )
    if (!gradeThree.ok) throw new Error(gradeThree.message)

    const reloaded = migrateAndValidateSave(structuredClone(gradeThree.value))
    expect(reloaded.boundItems.bound_1).toMatchObject({
      grade: 3,
      components: {
        essences: ['essence_mycelial'],
        gems: ['esmeralda_crescimento'],
      },
    })
    const overfilled = structuredClone(reloaded)
    overfilled.boundItems.bound_1.components.gems.push('esmeralda_crescimento')
    expect(() => migrateAndValidateSave(overfilled)).toThrow()
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
