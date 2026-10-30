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
      expect(grip.size).toBeGreaterThanOrEqual(24)
      expect(grip.size).toBeLessThanOrEqual(39)
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

  it('ancora a Espada Longa abaixo da linha do rosto com proporção de arma de uma mão', () => {
    const sword = getWeaponGripProfile('bound_weapon_long_sword')
    expect(sword.size).toBeLessThanOrEqual(30)
    expect(sword.x).toBeGreaterThanOrEqual(58)
    expect(sword.y).toBeGreaterThanOrEqual(62)
    // Positive rotation angles the blade away from the character's face.
    expect(sword.rotation).toBeGreaterThan(0)
    expect(sword.handleY).toBeGreaterThanOrEqual(75)
  })

  it('faz fallback visual sem bloquear sprites manuais adicionados futuramente', () => {
    expect(getWeaponGripProfile('equipment.future.placeholder')).toMatchObject({
      size: 30, x: 62, y: 65,
    })
  })
})
