import { describe, expect, it } from 'vitest'
import { content } from '../../content/catalog'
import { createNewSave } from '../game/createSave'
import {
  getDiscoveredTerranLocationIds,
  getTerranQuestDestination,
  visitTerranLocation,
} from './cityEngine'

const createSave = () =>
  createNewSave(
    'terran-test-owner',
    'Aron',
    'character.terririan.default',
    content,
    '2026-08-12T12:00:00.000Z',
    { saveId: 'save-terran', characterId: 'character-terran' },
  )

describe('Terran city engine', () => {
  it('descobre uma instituição, salva a localização e não duplica a descoberta', () => {
    const first = visitTerranLocation(
      createSave(),
      'location_terran_eldamar_house',
      content,
      '2026-08-12T12:01:00.000Z',
    )
    expect(first.ok).toBe(true)
    if (!first.ok) return

    expect(first.value.firstVisit).toBe(true)
    expect(first.value.save.world.currentLocationId).toBe('location_terran_eldamar_house')
    expect(getDiscoveredTerranLocationIds(first.value.save)).toEqual([
      'location_terran_eldamar_house',
    ])

    const repeated = visitTerranLocation(
      first.value.save,
      'location_terran_eldamar_house',
      content,
      '2026-08-12T12:02:00.000Z',
    )
    expect(repeated).toEqual({ ok: true, value: { save: first.value.save, firstVisit: false } })
  })

  it('rejeita local legado ou externo como instituição de Terran', () => {
    const result = visitTerranLocation(createSave(), 'taverna', content)
    expect(result).toMatchObject({ ok: false, code: 'UNKNOWN_TERRAN_LOCATION' })
  })

  it('orienta a missão disponível para Eldamar e a missão ativa para o Portal', () => {
    const save = createSave()
    expect(getTerranQuestDestination(save, content)).toMatchObject({
      questId: 'vs_astravel_first_contact',
      locationId: 'location_terran_eldamar_house',
      status: 'available',
    })

    save.quests.vs_astravel_first_contact.status = 'active'
    expect(getTerranQuestDestination(save, content)).toMatchObject({
      locationId: 'location_terran_portal_plaza',
      status: 'active',
    })
  })
})
