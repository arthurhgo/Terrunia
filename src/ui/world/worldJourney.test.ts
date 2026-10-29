import { describe, expect, it } from 'vitest'
import { content } from '../../content/catalog'
import { FUNGAL_DUNGEON_ID } from '../../domain/exploration/dungeonEngine'
import { createNewSave } from '../../domain/game/createSave'
import { getWorldJourney } from './worldJourney'

const makeSave = () => createNewSave(
  'journey-owner',
  'Nira',
  'character.terririan.default',
  content,
  '2026-10-29T00:00:00.000Z',
  { saveId: 'journey-save', characterId: 'journey-character' },
)

describe('percurso persistente do mundo', () => {
  it('mostra Terran e a instituição atual na cidade', () => {
    const save = makeSave()
    save.world.currentLocationId = 'location_terran_eldamar_house'
    expect(getWorldJourney(save).map((step) => step.label)).toEqual(['Terran', 'Eldamar'])
  })

  it('liga a base ao marco atual de Astravél', () => {
    const save = makeSave()
    save.world.currentLocationId = 'astravel_fungorro_01'
    expect(getWorldJourney(save).map((step) => step.label)).toEqual([
      'Terran', 'Portal', 'Astravél', 'Presença Fungorra',
    ])
  })

  it('liga a base ao interior das Câmaras Fúngicas', () => {
    const save = makeSave()
    save.world.currentLocationId = FUNGAL_DUNGEON_ID
    expect(getWorldJourney(save).map((step) => step.label)).toEqual([
      'Terran', 'Portal', 'Astravél', 'Câmaras',
    ])
  })
})
