import { describe, expect, it } from 'vitest'
import { content } from '../../content/catalog'
import { bindPrologueWeapon, createNewSave } from '../game/createSave'
import { deriveCharacterStats } from './derivedStats'

describe('status derivados do Nexo', () => {
  it('expõe valor e origem dos status sem duplicar estado no save', () => {
    const base = createNewSave('owner', 'Cael', 'character.terririan.default', content)
    const result = bindPrologueWeapon(base, content, '2026-08-12T12:00:00.000Z', 'bound_weapon')
    if (!result.ok) throw new Error(result.message)
    const stats = deriveCharacterStats(result.value, content)
    expect(stats.life.value).toBeGreaterThan(0)
    expect(stats.physicalAttack.contributions).toEqual(expect.arrayContaining([
      expect.objectContaining({ label: 'Arma Básica Vinculada' }),
    ]))
    expect(result.value).not.toHaveProperty('derivedStats')
  })
})
