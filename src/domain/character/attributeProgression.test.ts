import { describe, expect, it } from 'vitest'
import { BALANCE } from '../../content/balance'
import { content } from '../../content/catalog'
import { createNewSave, bindPrologueWeapon } from '../game/createSave'
import { adjustCharacterAttribute, nextAttributeDie, gainCharacterXp } from './attributeProgression'

const now = '2026-11-06T12:00:00.000Z'
const fresh = () => createNewSave('attribute-owner', 'Terrírian', 'character.terririan.default', content, now)
const change = (save: ReturnType<typeof fresh>, id: 'strength' | 'cunning', direction: 1 | -1) => {
  const result = adjustCharacterAttribute(save, id, direction, now)
  if (!result.ok) throw Error(result.message)
  return result.value
}

describe('Atributos — pontos individuais e evolução do dado a cada dois', () => {
  it('mantém somente dados pares e concede exatamente 1 ponto por nível', () => {
    expect(BALANCE.attributeDieOrder).toEqual([4, 6, 8, 10, 12])
    expect(BALANCE.attributePointsPerDieUpgrade).toBe(2)
    expect(BALANCE.attributePointsPerLevel).toBe(1)
    expect(nextAttributeDie(4, 1)).toBe(6)
    const player = fresh().character
    player.xp = 0
    const gained = gainCharacterXp(player, BALANCE.xpThresholds[1])
    expect(gained.levelsGained).toBe(1)
    expect(gained.character.unspentAttributePoints).toBe(player.unspentAttributePoints + 1)
  })

  it('investe 1 ponto d4+1 e só depois do segundo muda d4 para d6', () => {
    const initial = fresh()
    const first = change(initial, 'strength', 1)
    expect(first.character.attributes.strength).toEqual({ die: 4, bonus: 1 })
    expect(first.character.unspentAttributePoints).toBe(5)
    expect(initial.character.attributes.strength.die).toBe(4)
    const second = change(first, 'strength', 1)
    expect(second.character.attributes.strength).toEqual({ die: 6, bonus: 0 })
    expect(second.character.unspentAttributePoints).toBe(4)
    const third = change(second, 'strength', 1)
    expect(third.character.attributes.strength).toEqual({ die: 6, bonus: 1 })
    const fourth = change(third, 'strength', 1)
    expect(fourth.character.attributes.strength).toEqual({ die: 8, bonus: 0 })
  })

  it('sem pontos rejeita a próxima alocação e preserva o estado', () => {
    const initial = fresh()
    initial.character.unspentAttributePoints = 1
    const first = change(initial, 'cunning', 1)
    expect(adjustCharacterAttribute(first, 'cunning', 1, now))
      .toMatchObject({ ok: false, code: 'ATTRIBUTE_POINTS_REQUIRED' })
    expect(first.character.attributes.cunning).toEqual({ die: 4, bonus: 1 })
  })

  it('alcança d12 com 8 investimentos individuais e reembolsa cada ponto antes de vincular', () => {
    let save = fresh()
    save.character.unspentAttributePoints = 8
    for (let i = 0; i < 8; i++) save = change(save, 'cunning', 1)
    expect(save.character.attributes.cunning).toEqual({ die: 12, bonus: 0 })
    expect(save.character.unspentAttributePoints).toBe(0)
    expect(adjustCharacterAttribute(save, 'cunning', 1, now))
      .toMatchObject({ ok: false, code: 'ATTRIBUTE_AT_MAXIMUM' })
    save = change(save, 'cunning', -1)
    expect(save.character.attributes.cunning).toEqual({ die: 10, bonus: 1 })
    for (let i = 1; i < 8; i++) save = change(save, 'cunning', -1)
    expect(save.character.attributes.cunning).toEqual({ die: 4, bonus: 0 })
    expect(save.character.unspentAttributePoints).toBe(8)
  })

  it('bloqueia o reembolso após o primeiro Vínculo, mas permite gastar novos pontos de level', () => {
    let save = fresh()
    save = change(change(save, 'strength', 1), 'strength', 1)
    const bonded = bindPrologueWeapon(save, content, now)
    if (!bonded.ok) throw Error(bonded.message)
    expect(adjustCharacterAttribute(bonded.value, 'strength', -1, now))
      .toMatchObject({ ok: false, code: 'ATTRIBUTE_REFUND_LOCKED' })
    const newAllocation = change(bonded.value, 'strength', 1)
    expect(newAllocation.character.attributes.strength).toEqual({ die: 6, bonus: 1 })
  })
})
