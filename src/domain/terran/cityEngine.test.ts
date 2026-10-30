import { describe, expect, it } from 'vitest'
import { content } from '../../content/catalog'
import { createNewSave } from '../game/createSave'
import {
  getDiscoveredTerranLocationIds,
  getTerranQuestDestination,
  visitTerranLocation,
  discoverCityLandmark,
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
  it('registra cada ponto explorado uma vez e preserva recursos e progresso', () => {
    const original = createSave()
    const found = discoverCityLandmark(original, 'city_contract_board', original.updatedAt)
    if (!found.ok) throw new Error(found.message)
    expect(found.value.world.worldFlags).toContain('TerranLandmarkDiscovered:city_contract_board')
    expect(found.value.wallet).toEqual(original.wallet)
    expect(found.value.essence).toEqual(original.essence)
    expect(found.value.quests).toEqual(original.quests)
    expect(original.world.worldFlags).not.toContain('TerranLandmarkDiscovered:city_contract_board')
    const again = discoverCityLandmark(found.value, 'city_contract_board', original.updatedAt)
    expect(again.ok && again.value).toBe(found.value)
    expect(discoverCityLandmark(original, 'no_landmark', original.updatedAt).ok).toBe(false)
    original.world.currentLocationId = 'astravel_entry'
    expect(discoverCityLandmark(original, 'city_contract_board', original.updatedAt).ok).toBe(false)
  })
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

  it('orienta somente missões aceitas e rastreadas', () => {
    const save = createSave()
    expect(getTerranQuestDestination(save, content)).toBeNull()

    save.quests.vs_astravel_first_contact.status = 'active'
    save.quests.vs_astravel_first_contact.tracked = true
    expect(getTerranQuestDestination(save, content)).toMatchObject({
      locationId: 'location_terran_portal_plaza',
      status: 'active',
    })

    save.quests.vs_astravel_first_contact.status = 'ready_to_turn_in'
    expect(getTerranQuestDestination(save, content)).toMatchObject({
      locationId: 'location_terran_eldamar_house',
      status: 'ready_to_turn_in',
    })
  })

  it('não orienta uma missão ativa quando o jogador desativa o tracker', () => {
    const save = createSave()
    save.quests.vs_astravel_first_contact.status = 'active'
    save.quests.vs_astravel_first_contact.tracked = false
    expect(getTerranQuestDestination(save, content)).toBeNull()
  })
})
