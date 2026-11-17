import { describe, expect, it } from 'vitest'
import { content } from '../content/catalog'
import { rosettaTutorialQuests } from '../content/rosettaTutorial'
import { createNewSave } from '../domain/game/createSave'
import { migrateAndValidateSave } from './saveSchema'

describe('save 17: tutorial, mochila e slot vestido separado', () => {
  it('migra v14 sem vestir ou recompensar equipamentos automaticamente', () => {
    const save = createNewSave('owner', 'Lysa', 'character.terririan.default', content)
    const legacy = structuredClone(save) as unknown as Record<string, unknown>
    legacy.schemaVersion = 14; legacy.gameVersion = '0.12.0'
    delete (legacy.character as Record<string, unknown>).basicArmorInstanceId
    delete legacy.equippedBasicArmor
    for (const quest of rosettaTutorialQuests) delete (legacy.quests as Record<string, unknown>)[quest.id]
    const updated = migrateAndValidateSave(legacy)
    expect(updated.schemaVersion).toBe(18)
    expect(updated.equippedBasicArmor).toBeNull()
    expect(updated.character.basicArmorInstanceId).toBeNull()
    expect(updated.inventory).toEqual(save.inventory)
    expect(updated.wallet).toEqual(save.wallet)
    expect(updated.boundItems).toEqual(save.boundItems)
    expect(updated.quests.rosetta_tutorial_equip.status).toBe('available')
    expect(updated.quests.rosetta_tutorial_refine.status).toBe('locked')
    expect(updated.eventLog).toContain('SaveMigrated:14->15')
    expect(updated.eventLog).toContain('SaveMigrated:16->17')
    expect(migrateAndValidateSave(updated)).toEqual(updated)
  })

  it('preserva a peça única e reforço ao migrar v16, rejeitando referências ausentes e itens irregulares', () => {
    const save = createNewSave('owner', 'Lysa', 'character.terririan.default', content)
    save.inventory.push({
      instanceId: 'tunic', definitionId: 'equipment_worn_linen_tunic', quantity: 1,
      rarity: 'common', locked: false, favorite: false,
      acquiredAt: save.updatedAt, refinementLevel: 1,
    })
    save.character.basicArmorInstanceId = 'tunic'
    save.schemaVersion = 16
    delete (save as unknown as Record<string, unknown>).equippedBasicArmor
    const restored = migrateAndValidateSave(save)
    expect(restored.schemaVersion).toBe(18)
    expect(restored.equippedBasicArmor).toMatchObject({ instanceId: 'tunic', refinementLevel: 1 })
    expect(restored.inventory).toHaveLength(0)
    const missing = structuredClone(save); missing.character.basicArmorInstanceId = 'absent'
    expect(() => migrateAndValidateSave(missing)).toThrow()
    const stacked = structuredClone(save); stacked.inventory[0].quantity = 2
    expect(() => migrateAndValidateSave(stacked)).toThrow()
    const foreign = structuredClone(save)
    foreign.character.basicArmorInstanceId = null
    foreign.inventory[0].definitionId = 'drop_fungal_nucleus'
    foreign.inventory[0].refinementLevel = 1
    expect(() => migrateAndValidateSave(foreign)).toThrow()
  })
})
