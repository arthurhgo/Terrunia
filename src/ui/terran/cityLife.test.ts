import { describe, expect, it } from 'vitest'
import { content } from '../../content/catalog'
import { createNewSave } from '../../domain/game/createSave'
import { getCityCast } from './cityCast'
import { getNpcPatrol } from './cityLife'
import { isCityWalkable } from './cityNavigation'

const makeCast = () => getCityCast(createNewSave(
  'owner', 'Caminhante', 'character.terririan.default', content, '2026-10-28T12:00:00Z',
))

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
    const actors = makeCast()
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
