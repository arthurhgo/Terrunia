import { describe, expect, it } from 'vitest'
import { content } from '../../content/catalog'
import { createNewSave } from '../../domain/game/createSave'
import { getCityCast } from './cityCast'
import { getNpcPatrol } from './cityLife'
import type { CityActor } from './cityCast'
import { isCityWalkable } from './cityNavigation'

const makeCast = () => getCityCast(createNewSave(
  'owner', 'Caminhante', 'character.terririan.default', content, '2026-10-28T12:00:00Z',
))

// Future-sidequest sample only: no existing institutional resident is placed outside.
const hypotheticalStreetQuestActor: CityActor = {
  id: 'future_street_quest_actor',
  locationId: 'location_terran_portal_plaza',
  presence: { id: 'future_street_quest_actor', label: 'Visitante', presence: 'visitor', roleLabel: 'Missão futura' },
  point: { x: 192, y: 192 }, palette: 'exploration', variant: 0, marker: '!',
}

describe('vida ambiental dos moradores de Terran', () => {
  it('respeita a posição inicial e não altera os dados dos NPCs', () => {
    const actors = makeCast()
    const origin = structuredClone(actors)
    for (const actor of actors) {
      const first = getNpcPatrol(actor, 0)
      expect(first.point).toEqual(actor.point)
      expect(first.moving).toBe(false)
    }
    expect(actors).toEqual(origin)
  })

  it('move moradores em ciclos determinísticos sem atravessar edifícios', () => {
    const actors = [hypotheticalStreetQuestActor]
    expect(makeCast()).toEqual([])
    let animated = 0
    for (const actor of actors) {
      let changed = false
      for (let t = 0; t < 40; t += 0.25) {
        const live = getNpcPatrol(actor, t)
        expect(isCityWalkable(live.point)).toBe(true)
        expect(getNpcPatrol(actor, t)).toEqual(live)
        if (live.point.x !== actor.point.x || live.point.y !== actor.point.y) changed = true
      }
      if (changed) animated += 1
    }
    expect(animated).toBeGreaterThan(actors.length / 2)
  })
})
