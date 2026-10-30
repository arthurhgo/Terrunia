import { describe, expect, it } from 'vitest'
import { BALANCE } from '../../content/balance'
import { content } from '../../content/catalog'
import { createNewSave, bindPrologueWeapon } from '../game/createSave'
import { adjustCharacterAttribute, nextAttributeDie } from './attributeProgression'

const now = '2026-10-30T00:00:00.000Z'
const fresh = () => createNewSave('test-owner', 'Terrírian', 'character.terririan.default', content, now)

describe('Evolução de dados de atributo de dois em dois', () => {
  it('avança exatamente d4 → d6 → d8 → d10 → d12, sem dados ímpares ou intermediários', () => {
    expect(BALANCE.attributeDieFaceStep).toBe(2)
    const path = BALANCE.attributeDieOrder
    expect(path).toEqual([4, 6, 8, 10, 12])
    for (let index = 0; index < path.length - 1; index += 1) {
      expect(nextAttributeDie(path[index], 1)).toBe(path[index + 1])
      expect(nextAttributeDie(path[index + 1], -1)).toBe(path[index])
    }
    expect(nextAttributeDie(12, 1)).toBeUndefined()
    expect(nextAttributeDie(4, -1)).toBeUndefined()
  })

  it('consome um ponto por avanço de +2 faces e preserva pontos excedentes', () => {
    const initial = fresh()
    expect(initial.character.unspentAttributePoints).toBe(3)
    const first = adjustCharacterAttribute(initial, 'strength', 1, now)
    expect(first.ok).toBe(true)
    if (!first.ok) return
    expect(first.value.character.attributes.strength.die).toBe(6)
    expect(first.value.character.unspentAttributePoints).toBe(2)
    expect(initial.character.attributes.strength.die).toBe(4)
    const second = adjustCharacterAttribute(first.value, 'strength', 1, now)
    expect(second.ok).toBe(true)
    if (!second.ok) return
    expect(second.value.character.attributes.strength.die).toBe(8)
    expect(second.value.character.unspentAttributePoints).toBe(1)
    const third = adjustCharacterAttribute(second.value, 'strength', 1, now)
    expect(third.ok).toBe(true)
    if (!third.ok) return
    expect(third.value.character.attributes.strength.die).toBe(10)
    expect(third.value.character.unspentAttributePoints).toBe(0)
    expect(adjustCharacterAttribute(third.value, 'strength', 1, now)).toMatchObject({ ok: false, code: 'ATTRIBUTE_POINTS_REQUIRED' })
  })

  it('aplica limite em d12 e restitui um ponto por retorno de -2 faces antes do Vínculo', () => {
    const save = fresh()
    save.character.unspentAttributePoints = 4
    let current = save
    for (const die of [6, 8, 10, 12]) {
      const result = adjustCharacterAttribute(current, 'cunning', 1, now)
      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.value.character.attributes.cunning.die).toBe(die)
      current = result.value
    }
    expect(adjustCharacterAttribute(current, 'cunning', 1, now)).toMatchObject({ ok: false, code: 'ATTRIBUTE_AT_MAXIMUM' })
    for (const die of [10, 8, 6, 4]) {
      const result = adjustCharacterAttribute(current, 'cunning', -1, now)
      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.value.character.attributes.cunning.die).toBe(die)
      current = result.value
    }
    expect(current.character.unspentAttributePoints).toBe(4)
    expect(adjustCharacterAttribute(current, 'cunning', -1, now)).toMatchObject({ ok: false, code: 'ATTRIBUTE_AT_MINIMUM' })
  })

  it('bloqueia restituição após Vínculo sem alterar o save', () => {
    const save = fresh()
    const upgraded = adjustCharacterAttribute(save, 'strength', 1, now)
    if (!upgraded.ok) throw Error(upgraded.message)
    const bonded = bindPrologueWeapon(upgraded.value, content, now)
    if (!bonded.ok) throw Error(bonded.message)
    const result = adjustCharacterAttribute(bonded.value, 'strength', -1, now)
    expect(result).toMatchObject({ ok: false, code: 'ATTRIBUTE_REFUND_LOCKED' })
    expect(bonded.value.character.attributes.strength.die).toBe(6)
  })
})
