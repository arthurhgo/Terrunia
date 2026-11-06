import { describe, expect, it } from 'vitest'
import { content } from '../../content/catalog'
import { createNewSave } from '../game/createSave'
import { applyFieldConsumable } from './fieldConsumables'
import { deriveCharacterStats } from '../character/derivedStats'

const createExpedition = () => {
  const save = createNewSave('owner', 'Vinnie', 'character.terririan.default', content)
  save.world.currentLocationId = 'astravel_entry'
  return save
}

describe('poções na exploração', () => {
  it('cura em Astravél, consome somente um item e preserva o save de entrada', () => {
    const save = createExpedition()
    const maximum = deriveCharacterStats(save, content).life.value
    save.vitals.hp = maximum - 7
    save.inventory.push({ instanceId: 'tonic_field', definitionId: 'consumable_minor_tonic',
      quantity: 2, rarity: 'common', locked: false, favorite: false, acquiredAt: save.updatedAt })
    const r = useFieldConsumable(save, 'tonic_field', save.updatedAt)
    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.value.vitals.hp).toBeGreaterThan(save.vitals.hp)
    expect(r.value.inventory[0].quantity).toBe(1)
    expect(save.inventory[0].quantity).toBe(2)
  })
  it('impede beber poção com vida máxima e usar itens ofensivos sem combate', () => {
    const save = createExpedition()
    const instance = { quantity: 1, rarity: 'common' as const, locked: false, favorite: false, acquiredAt: save.updatedAt }
    save.inventory.push({ ...instance, instanceId: 'tonic', definitionId: 'consumable_minor_tonic' })
    expect(useFieldConsumable(save, 'tonic', save.updatedAt)).toMatchObject({ ok: false, code: 'ALREADY_FULL' })
    save.inventory.push({ ...instance, instanceId: 'bomb', definitionId: 'consumable_resonance_flask' })
    expect(useFieldConsumable(save, 'bomb', save.updatedAt).ok).toBe(false)
  })
})
