import { describe, expect, it } from 'vitest'
import { content } from '../../content/catalog'
import { bindPrologueWeapon, createNewSave } from '../game/createSave'
import { getFlatStatBonus, getSkillNodeState, unlockSkillNode } from './skillTree'

const makeSave = () => {
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
  return bound.value
}

describe('Skill Tree data-driven', () => {
  it('desbloqueia node com Ponto de Essência e persiste no vínculo', () => {
    const save = makeSave()
    save.essence.essencePoints = 1
    const node = content.skillTreeNodes.weapon_bond_core
    expect(getSkillNodeState(save, node, content)).toBe('available')
    const result = unlockSkillNode(save, node, content, '2026-08-10T12:02:00.000Z')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.essence.essencePoints).toBe(0)
    expect(result.value.boundItems.bound_1.skillTree.unlockedNodeIds).toContain(node.id)
  })

  it('mantém Node B bloqueado sem Node A', () => {
    const save = makeSave()
    save.essence.essencePoints = 4
    save.boundItems.bound_1.resonance = 100
    expect(getSkillNodeState(save, content.skillTreeNodes.weapon_resonant_edge, content)).toBe('locked')
  })

  it('mantém ramo fúngico oculto sem componente e o revela após infusão', () => {
    const save = makeSave()
    const node = content.skillTreeNodes.weapon_fungal_memory
    expect(getSkillNodeState(save, node, content)).toBe('hidden')
    save.boundItems.bound_1.grade = 2
    save.boundItems.bound_1.components.essences.push('essence_fungal_weak')
    expect(getSkillNodeState(save, node, content)).toBe('available')
  })

  it('não compra node sem pontos suficientes', () => {
    const save = makeSave()
    const result = unlockSkillNode(
      save,
      content.skillTreeNodes.weapon_bond_core,
      content,
      '2026-08-10T12:02:00.000Z',
    )
    expect(result).toMatchObject({ ok: false, code: 'INSUFFICIENT_ESSENCE_POINTS' })
  })

  it('revela ramos de Joia e sinergia somente após a Lapidação compatível', () => {
    const save = makeSave()
    const focus = content.skillTreeNodes.weapon_gem_focus_1
    const synergy = content.skillTreeNodes.weapon_synergy_mycelial_emerald_1
    expect(getSkillNodeState(save, focus, content)).toBe('hidden')
    expect(getSkillNodeState(save, synergy, content)).toBe('hidden')

    save.boundItems.bound_1.grade = 3
    save.boundItems.bound_1.components.essences.push('essence_mycelial')
    save.boundItems.bound_1.components.gems.push('esmeralda_crescimento')
    expect(getSkillNodeState(save, focus, content)).toBe('discovered')
    expect(getSkillNodeState(save, synergy, content)).toBe('discovered')
  })

  it('aplica o modificador próprio da Joia mesmo antes de comprar seus nodes', () => {
    const save = makeSave()
    save.boundItems.bound_1.grade = 3
    save.boundItems.bound_1.components.essences.push('essence_mycelial')
    save.boundItems.bound_1.components.gems.push('esmeralda_crescimento')
    expect(getFlatStatBonus(save, content, 'maxHp')).toBe(2)
  })
})
