import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'
import { content } from '../../content/catalog'
import { DEFAULT_CHARACTER_APPEARANCE } from '../../domain/character/appearance'
import { bindPrologueWeapon, createNewSave } from '../../domain/game/createSave'
import { CharacterComposite, EquippedCharacter } from './EquippedCharacter'
import { getEquipmentAnchor, getVisualEquipment, VISUAL_EQUIPMENT_ORDER } from './equipmentVisuals'
import { readCosmeticAvatar, rememberCosmeticAvatar } from './deviceAvatar'

afterEach(() => { cleanup(); localStorage.clear() })
const fresh = () => createNewSave('secret-owner', 'Testa', 'character.terririan.default', content,
  '2026-11-05T20:00:00Z', undefined, undefined, DEFAULT_CHARACTER_APPEARANCE)
const armed = () => {
  const saved = bindPrologueWeapon(fresh(), content, '2026-11-05T20:00:01Z', 'weapon-tester')
  if (!saved.ok) throw new Error(saved.message)
  return saved.value
}

describe('visual do equipamento vinculado: fonte única', () => {
  it('não inventa equipamentos em slots vazios e reconhece arma realmente vinculada', () => {
    expect(getVisualEquipment(fresh())).toHaveLength(0)
    const save = armed()
    const actual = getVisualEquipment(save)
    expect(actual).toHaveLength(1)
    expect(actual[0]).toMatchObject({ slot: 'weapon', itemId: 'bound_weapon_prologue_base' })
    expect(actual[0].assetId).toBe(content.boundItemBases.bound_weapon_prologue_base.assetIdByGrade[1])
    expect(VISUAL_EQUIPMENT_ORDER).toEqual(['armor','necklace','bracelet','shield','weapon'])
  })

  it('arma é presa à mão correta nas quatro direções e fica atrás nas costas', () => {
    const weapon = getVisualEquipment(armed())[0]
    const down = getEquipmentAnchor(weapon, 'down')
    const left = getEquipmentAnchor(weapon, 'left')
    const right = getEquipmentAnchor(weapon, 'right')
    const up = getEquipmentAnchor(weapon, 'up')
    expect(right.x).toBeGreaterThan(16)
    expect(left.x).toBeLessThan(16)
    expect(down.y).toBeGreaterThan(20)
    expect(up.layer).toBe('back')
    expect(right.layer).toBe('front')
    expect([up, left, right, down].every((a) => a.size > 0 && a.handleY > 0 && a.handleY <= 1)).toBe(true)
  })

  it('React usa a mesma âncora do canvas e preserva imagem do player, não um retrato genérico', () => {
    const save = armed()
    const { container, rerender } = render(<EquippedCharacter save={save} facing="right" alt="Player equipado" />)
    const weapon = container.querySelector('[data-slot="weapon"]') as HTMLImageElement
    expect(weapon).toBeInTheDocument()
    expect(weapon.style.left).toBe(String(getEquipmentAnchor(getVisualEquipment(save)[0], 'right').x / 32 * 100) + '%')
    expect(screen.getByRole('img', { name: 'Player equipado' })).toHaveAttribute('src', expect.stringContaining('data:image/svg+xml'))
    rerender(<EquippedCharacter save={save} facing="up" />)
    expect(container.querySelector('.equipped-character__layer--back')).toHaveAttribute('data-slot', 'weapon')
  })

  it('usa proteção simples no slot de armadura e nunca duplica com a armadura vinculada', () => {
    const save = armed()
    save.equippedBasicArmor = {
      instanceId: 'tunic', definitionId: 'equipment_worn_linen_tunic',
      quantity: 1, rarity: 'common', locked: false, favorite: false, acquiredAt: save.updatedAt,
    }
    const equipped = getVisualEquipment(save)
    expect(equipped.map((item) => item.slot)).toEqual(['armor', 'weapon'])
    expect(equipped[0].itemId).toBe('equipment_worn_linen_tunic')
  })

  it('login só reutiliza dados COSMÉTICOS do dispositivo, sem nome nem identidade da conta', () => {
    const save = armed()
    rememberCosmeticAvatar(save)
    const avatar = readCosmeticAvatar()
    expect(avatar?.appearance).toEqual(DEFAULT_CHARACTER_APPEARANCE)
    expect(avatar?.visuals).toHaveLength(1)
    expect(JSON.stringify(avatar)).not.toContain('secret-owner')
    expect(JSON.stringify(avatar)).not.toContain('Testa')
    const { container } = render(<CharacterComposite appearance={avatar?.appearance}
      portraitAssetId={avatar?.portraitAssetId} visuals={avatar?.visuals ?? []} />)
    expect(container.querySelectorAll('.equipped-character__layer')).toHaveLength(1)
    localStorage.clear()
    expect(readCosmeticAvatar()).toBeNull()
  })
})
