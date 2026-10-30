import { describe, expect, it } from 'vitest'
import { content } from '../content/catalog'
import { rosettaTutorialQuests } from '../content/rosettaTutorial'
import { createNewSave } from '../domain/game/createSave'
import { migrateAndValidateSave } from './saveSchema'

describe('save 15: tutorial e proteção simples', () => {
  it('migra v14 sem vestir, aceitar, dar Ouro ou entregar as túnicas automaticamente', () => {
    const save = createNewSave('owner', 'Lysa', 'character.terririan.default', content)
    const legacy = structuredClone(save) as unknown as Record<string, unknown>
    legacy.schemaVersion = 14; legacy.gameVersion = '0.12.0'
    delete (legacy.character as Record<string, unknown>).basicArmorInstanceId
    for (const quest of rosettaTutorialQuests) delete (legacy.quests as Record<string, unknown>)[quest.id]
    const updated = migrateAndValidateSave(legacy)
    expect(updated.schemaVersion).toBe(15)
    expect(updated.character.basicArmorInstanceId).toBeNull()
    expect(updated.inventory).toEqual(save.inventory)
    expect(updated.wallet).toEqual(save.wallet)
    expect(updated.boundItems).toEqual(save.boundItems)
    expect(updated.quests.rosetta_tutorial_equip.status).toBe('available')
    expect(updated.quests.rosetta_tutorial_refine.status).toBe('locked')
    expect(updated.eventLog).toContain('SaveMigrated:14->15')
    expect(migrateAndValidateSave(updated)).toEqual(updated)
  })

  it('preserva equipamento e reforço e rejeita referência ausente, pilha de armaduras ou reforço em loot', () => {
    const save = createNewSave('owner', 'Lysa', 'character.terririan.default', content)
    save.inventory.push({ instanceId: 'tunic', definitionId: 'equipment_worn_linen_tunic', quantity: 1, rarity: 'common', locked: false, favorite: false, acquiredAt: save.updatedAt, refinementLevel: 1 })
    save.character.basicArmorInstanceId = 'tunic'
    expect(migrateAndValidateSave(save)).toEqual(save)
    const missing = structuredClone(save); missing.character.basicArmorInstanceId = 'absent'
    expect(() => migrateAndValidateSave(missing)).toThrow()
    const stacked = structuredClone(save); stacked.inventory[0].quantity = 2
    expect(() => migrateAndValidateSave(stacked)).toThrow()
    const foreign = structuredClone(save); foreign.character.basicArmorInstanceId = null; foreign.inventory[0].definitionId = 'drop_fungal_nucleus'
    expect(() => migrateAndValidateSave(foreign)).toThrow()
  })
})
