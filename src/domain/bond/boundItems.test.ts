import { describe, expect, it } from 'vitest'
import { content, type ContentCatalog } from '../../content/catalog'
import { bindPrologueWeapon, createNewSave } from '../game/createSave'
import {
  canBindSlot,
  createBoundItem,
  evaluateGemCompatibility,
  getBoundSlotCapacity,
  getGradeThreeGemCandidates,
  performGradeThreeRite,
  performGradeTwoRite,
} from './boundItems'

const makeRiteSave = () => {
  const save = createNewSave(
    'user_1',
    'Aron',
    'character.terririan.default',
    content,
    '2026-08-10T12:00:00.000Z',
    { saveId: 'save_1', characterId: 'char_1' },
  )
  const bound = bindPrologueWeapon(
    save,
    content,
    '2026-08-10T12:01:00.000Z',
    'bound_1',
  )
  if (!bound.ok) throw new Error(bound.message)
  bound.value.world.currentLocationId = 'location_terran_bond_workshop'
  bound.value.inventory.push({
    instanceId: 'fragment_1',
    definitionId: 'fragment_mycelial_essence',
    quantity: 1,
    rarity: 'rare',
    locked: false,
    favorite: false,
    acquiredAt: '2026-08-10T12:02:00.000Z',
  })
  return bound.value
}

const makeGradeThreeRiteSave = () => {
  const save = makeRiteSave()
  save.boundItems.bound_1.resonance = 300
  const gradeTwo = performGradeTwoRite(
    save,
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
  return gradeTwo.value
}

describe('itens vinculados', () => {
  it('registra as dez Joias previstas pela especificação v0.4', () => {
    expect(Object.keys(content.gems)).toHaveLength(10)
    expect(content.gems).toHaveProperty('esmeralda_crescimento')
    expect(content.gems).toHaveProperty('coracao_kethzar')
  })

  it('aplica exatamente os slots canônicos dos sete Graus', () => {
    expect(getBoundSlotCapacity(1)).toEqual({ essences: 0, gems: 0, runes: 0, superiorRunes: 0 })
    expect(getBoundSlotCapacity(2)).toEqual({ essences: 1, gems: 0, runes: 0, superiorRunes: 0 })
    expect(getBoundSlotCapacity(3)).toEqual({ essences: 1, gems: 1, runes: 0, superiorRunes: 0 })
    expect(getBoundSlotCapacity(4)).toEqual({ essences: 1, gems: 1, runes: 1, superiorRunes: 0 })
    expect(getBoundSlotCapacity(5)).toEqual({ essences: 2, gems: 2, runes: 1, superiorRunes: 0 })
    expect(getBoundSlotCapacity(6)).toEqual({ essences: 2, gems: 2, runes: 1, superiorRunes: 1 })
    expect(getBoundSlotCapacity(7)).toEqual({ essences: 0, gems: 0, runes: 0, superiorRunes: 0 })
  })

  it('cria instância única de Grau I e registra a memória do vínculo', () => {
    const item = createBoundItem(
      'char_1',
      content.boundItemBases.bound_weapon_prologue_base,
      '2026-08-10T12:00:00.000Z',
      'bound_1',
    )
    expect(item).toMatchObject({ id: 'bound_1', ownerCharacterId: 'char_1', grade: 1, slot: 'weapon' })
    expect(item.memories[0].sourceId).toBe('prologue_bond')
  })

  it('impede substituir um vínculo existente', () => {
    const result = canBindSlot(
      { weapon: 'bound_1', shield: null, armor: null, necklace: null, bracelet: null },
      'weapon',
    )
    expect(result).toMatchObject({ ok: false, code: 'BOUND_SLOT_OCCUPIED' })
  })

  it('rejeita o Rito de Grau II sem Ressonância mínima', () => {
    const result = performGradeTwoRite(
      makeRiteSave(),
      'bound_1',
      'fragment_1',
      content,
      '2026-08-10T12:03:00.000Z',
    )
    expect(result).toMatchObject({ ok: false, code: 'BOUND_RESONANCE_REQUIRED' })
  })

  it('rejeita Ritos fora da Oficina dos Vínculos', () => {
    const save = makeRiteSave()
    save.world.currentLocationId = 'location_terran_portal_plaza'
    save.boundItems.bound_1.resonance = 100
    const result = performGradeTwoRite(
      save,
      'bound_1',
      'fragment_1',
      content,
      '2026-08-10T12:03:00.000Z',
    )
    expect(result).toMatchObject({ ok: false, code: 'RITE_REQUIRES_WORKSHOP' })
  })

  it('executa Infusão e avanço ao Grau II de forma atômica', () => {
    const save = makeRiteSave()
    save.boundItems.bound_1.resonance = 100
    const result = performGradeTwoRite(
      save,
      'bound_1',
      'fragment_1',
      content,
      '2026-08-10T12:03:00.000Z',
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.boundItems.bound_1).toMatchObject({
      grade: 2,
      resonanceThreshold: 300,
      visualStage: 2,
      components: { essences: ['essence_mycelial'] },
    })
    expect(result.value.inventory).toHaveLength(0)
    expect(result.value.boundItems.bound_1.memories).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ sourceId: 'bond_rite_grade_2' }),
      ]),
    )
    expect(result.value.world.worldFlags).toContain('bound_weapon_grade_2')
    expect(save.boundItems.bound_1.grade).toBe(1)
    expect(save.inventory).toHaveLength(1)
  })

  it('rejeita repetir a primeira Infusão', () => {
    const save = makeRiteSave()
    save.boundItems.bound_1.resonance = 100
    const first = performGradeTwoRite(
      save,
      'bound_1',
      'fragment_1',
      content,
      '2026-08-10T12:03:00.000Z',
    )
    expect(first.ok).toBe(true)
    if (!first.ok) return
    const repeated = performGradeTwoRite(
      first.value,
      'bound_1',
      'fragment_1',
      content,
      '2026-08-10T12:04:00.000Z',
    )
    expect(repeated).toMatchObject({ ok: false, code: 'BOUND_GRADE_INVALID' })
  })

  it('lista somente Joias compatíveis e desprotegidas para o Grau III', () => {
    const save = makeGradeThreeRiteSave()
    expect(getGradeThreeGemCandidates(save, 'bound_1', content)).toEqual([
      {
        inventoryInstanceId: 'gem_1',
        itemDefinitionId: 'item_gem_esmeralda_crescimento',
        gemId: 'esmeralda_crescimento',
      },
    ])
    save.inventory[0].favorite = true
    expect(getGradeThreeGemCandidates(save, 'bound_1', content)).toEqual([])
  })

  it('rejeita Joia incompatível por regra data-driven', () => {
    const save = makeGradeThreeRiteSave()
    const incompatibleCatalog: ContentCatalog = {
      ...content,
      gems: {
        ...content.gems,
        esmeralda_crescimento: {
          ...content.gems.esmeralda_crescimento,
          compatibility: {
            anyEssenceTags: [],
            blockedEssenceTags: ['fungal'],
          },
        },
      },
    }
    expect(
      evaluateGemCompatibility(
        save.boundItems.bound_1,
        'esmeralda_crescimento',
        incompatibleCatalog,
      ),
    ).toMatchObject({ ok: false, code: 'GEM_INCOMPATIBLE' })
    expect(
      performGradeThreeRite(
        save,
        'bound_1',
        'gem_1',
        incompatibleCatalog,
        '2026-08-10T12:05:00.000Z',
      ),
    ).toMatchObject({ ok: false, code: 'GEM_INCOMPATIBLE' })
  })

  it('executa Lapidação e avanço ao Grau III de forma atômica', () => {
    const save = makeGradeThreeRiteSave()
    const result = performGradeThreeRite(
      save,
      'bound_1',
      'gem_1',
      content,
      '2026-08-10T12:05:00.000Z',
    )
    expect(result.ok).toBe(true)
    if (!result.ok) return
    expect(result.value.boundItems.bound_1).toMatchObject({
      grade: 3,
      resonanceThreshold: 700,
      visualStage: 3,
      components: {
        essences: ['essence_mycelial'],
        gems: ['esmeralda_crescimento'],
      },
    })
    expect(result.value.boundItems.bound_1.skillTree.discoveredNodeIds).toEqual(
      expect.arrayContaining([
        'weapon_gem_focus_1',
        'weapon_gem_amplification_1',
        'weapon_synergy_mycelial_emerald_1',
      ]),
    )
    expect(result.value.inventory).toHaveLength(0)
    expect(result.value.world.worldFlags).toContain('bound_weapon_grade_3')
    expect(save.boundItems.bound_1.grade).toBe(2)
    expect(save.inventory).toHaveLength(1)
  })

  it('Grau III aceita exatamente uma Joia e não permite repetir o rito', () => {
    const save = makeGradeThreeRiteSave()
    const first = performGradeThreeRite(
      save,
      'bound_1',
      'gem_1',
      content,
      '2026-08-10T12:05:00.000Z',
    )
    expect(first.ok).toBe(true)
    if (!first.ok) return
    const repeated = performGradeThreeRite(
      first.value,
      'bound_1',
      'gem_1',
      content,
      '2026-08-10T12:06:00.000Z',
    )
    expect(repeated).toMatchObject({ ok: false, code: 'BOUND_GRADE_INVALID' })
    expect(first.value.boundItems.bound_1.components.gems).toHaveLength(1)
  })
})
