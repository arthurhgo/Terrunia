import { describe, expect, it } from 'vitest'
import { BALANCE } from '../../content/balance'
import { content } from '../../content/catalog'
import { createNewSave, bindPrologueWeapon } from '../game/createSave'
import { adjustCharacterAttribute, nextAttributeDie } from './attributeProgression'

const now = '2026-11-04T17:00:00.000Z'
const fresh = () => createNewSave('test-owner', 'Terrírian', 'character.terririan.default', content, now)

describe('Evolução de dados — dois Pontos por avanço', () => {
  it('só permite d4 → d6 → d8 → d10 → d12, sem dados ímpares', () => {
    expect(BALANCE.attributeDieFaceStep).toBe(2)
    expect(BALANCE.attributePointsPerDieUpgrade).toBe(2)
    expect(BALANCE.attributeDieOrder).toEqual([4, 6, 8, 10, 12])
    for (let i = 0; i < BALANCE.attributeDieOrder.length - 1; i++) {
      expect(nextAttributeDie(BALANCE.attributeDieOrder[i], 1)).toBe(BALANCE.attributeDieOrder[i + 1])
      expect(nextAttributeDie(BALANCE.attributeDieOrder[i + 1], -1)).toBe(BALANCE.attributeDieOrder[i])
    }
    expect(nextAttributeDie(12, 1)).toBeUndefined()
    expect(nextAttributeDie(4, -1)).toBeUndefined()
  })

  it('cobra 2 pontos por avanço e não permite gastar só 1 ponto', () => {
    const initial = fresh()
    expect(initial.character.unspentAttributePoints).toBe(3)
    const first = adjustCharacterAttribute(initial, 'strength', 1, now)
    expect(first.ok).toBe(true)
    if (!first.ok) return
    expect(first.value.character.attributes.strength.die).toBe(6)
    expect(first.value.character.unspentAttributePoints).toBe(1)
    expect(initial.character.attributes.strength.die).toBe(4)
    expect(adjustCharacterAttribute(first.value, 'strength', 1, now))
      .toMatchObject({ ok: false, code: 'ATTRIBUTE_POINTS_REQUIRED' })

    const nextSave = structuredClone(first.value)
    nextSave.character.unspentAttributePoints = 2
    const second = adjustCharacterAttribute(nextSave, 'strength', 1, now)
    expect(second.ok).toBe(true)
    if (second.ok) {
      expect(second.value.character.attributes.strength.die).toBe(8)
      expect(second.value.character.unspentAttributePoints).toBe(0)
    }
  })

  it('chega a d12 após 8 pontos e devolve os mesmos 8 antes do Vínculo', () => {
    const save = fresh()
    save.character.unspentAttributePoints = 8
    let current = save
    for (const die of [6, 8, 10, 12]) {
      const result = adjustCharacterAttribute(current, 'cunning', 1, now)
      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.value.character.attributes.cunning.die).toBe(die)
      current = result.value
    }
    expect(current.character.unspentAttributePoints).toBe(0)
    expect(adjustCharacterAttribute(current, 'cunning', 1, now))
      .toMatchObject({ ok: false, code: 'ATTRIBUTE_AT_MAXIMUM' })
    for (const die of [10, 8, 6, 4]) {
      const result = adjustCharacterAttribute(current, 'cunning', -1, now)
      expect(result.ok).toBe(true)
      if (!result.ok) return
      expect(result.value.character.attributes.cunning.die).toBe(die)
      current = result.value
    }
    expect(current.character.unspentAttributePoints).toBe(8)
  })

  it('bloqueia restituição após o primeiro Vínculo sem alterar o save', () => {
    const save = fresh()
    const upgraded = adjustCharacterAttribute(save, 'strength', 1, now)
    if (!upgraded.ok) throw Error(upgraded.message)
    const bonded = bindPrologueWeapon(upgraded.value, content, now)
    if (!bonded.ok) throw Error(bonded.message)
    const result = adjustCharacterAttribute(bonded.value, 'strength', -1, now)
    expect(result).toMatchObject({ ok: false, code: 'ATTRIBUTE_REFUND_LOCKED' })
    expect(bonded.value.character.attributes.strength.die).toBe(6)
    expect(bonded.value.character.unspentAttributePoints).toBe(1)
  })
})
