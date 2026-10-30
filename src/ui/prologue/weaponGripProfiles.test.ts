import { describe, expect, it } from 'vitest'
import { content } from '../../content/catalog'
import { getWeaponGripProfile, weaponGripProfiles } from './weaponGripProfiles'

describe('Preview de armas vinculadas na mão do Terrírian', () => {
  it('mantém um ponto de encaixe parametrizado para os sete arquétipos iniciais', () => {
    const weapons = Object.values(content.boundItemBases)
      .filter((item) => item.slot === 'weapon' && item.id !== 'bound_weapon_prologue_base')
    expect(weapons).toHaveLength(7)
    for (const weapon of weapons) {
      const grip = weaponGripProfiles[weapon.id]
      expect(grip, weapon.name).toBeDefined()
      expect(getWeaponGripProfile(weapon.id)).toBe(grip)
      expect(grip.size).toBeGreaterThanOrEqual(26)
      expect(grip.size).toBeLessThanOrEqual(55)
      expect(grip.x).toBeGreaterThan(45)
      expect(grip.x).toBeLessThan(80)
      expect(grip.y).toBeGreaterThan(40)
      expect(grip.y).toBeLessThan(80)
      expect(grip.handleX).toBeGreaterThan(0)
      expect(grip.handleX).toBeLessThan(100)
      expect(grip.handleY).toBeGreaterThan(0)
      expect(grip.handleY).toBeLessThan(100)
    }
  })

  it('faz fallback visual sem bloquear sprites manuais adicionados futuramente', () => {
    expect(getWeaponGripProfile('equipment.future.placeholder')).toMatchObject({
      size: 42, x: 63, y: 61,
    })
  })
})
