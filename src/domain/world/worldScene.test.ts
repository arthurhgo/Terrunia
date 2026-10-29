import { describe, expect, it } from 'vitest'
import { content } from '../../content/catalog'
import { bindPrologueWeapon, createNewSave } from '../game/createSave'
import { createBattle } from '../combat/engine'
import { getWorldScene } from './worldScene'

const playableSave = () => {
  const draft = createNewSave(
    'world-scene-owner',
    'Nira',
    'character.terririan.default',
    content,
    '2026-10-28T20:00:00.000Z',
    { saveId: 'world-scene-save', characterId: 'world-scene-character' },
  )
  const bound = bindPrologueWeapon(
    draft,
    content,
    '2026-10-28T20:01:00.000Z',
    'world-scene-weapon',
  )
  if (!bound.ok) throw new Error(bound.message)
  return bound.value
}

describe('seletor da viewport imersiva', () => {
  it('mantém Terran e suas instituições na mesma cena', () => {
    const save = playableSave()
    save.world.currentLocationId = 'location_terran_bond_workshop'
    expect(getWorldScene(save, content)).toEqual({
      kind: 'terran',
      key: 'terran:location_terran_bond_workshop',
    })
  })

  it('seleciona expedição e dungeon pela localização persistida', () => {
    const save = playableSave()
    save.world.currentLocationId = 'astravel_fungorro_01'
    expect(getWorldScene(save, content).kind).toBe('expedition')

    save.world.currentLocationId = 'dungeon_fungal_chambers'
    expect(getWorldScene(save, content).kind).toBe('dungeon')
  })

  it('mantém o combate sobre a localização de origem', () => {
    const save = playableSave()
    save.world.currentLocationId = 'astravel_fungorro_01'
    save.battle = createBattle(
      save,
      content.encounters.encounter_fungorro_01,
      content,
      'world-scene-battle',
    )
    expect(getWorldScene(save, content)).toEqual({
      kind: 'combat',
      key: 'combat:world-scene-battle',
    })
    expect(save.world.currentLocationId).toBe('astravel_fungorro_01')
  })
})
