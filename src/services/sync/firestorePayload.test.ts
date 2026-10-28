import { describe, expect, it } from 'vitest'
import { content } from '../../content/catalog'
import { createBattle } from '../../domain/combat/engine'
import { bindPrologueWeapon, createNewSave } from '../../domain/game/createSave'
import { toFirestorePayload } from './firestorePayload'

describe('payload seguro para Firestore', () => {
  it('remove undefined recursivamente sem modificar o save original', () => {
    const save = createNewSave('owner_1', 'Aren', 'character.terririan.default', content)
    const bound = bindPrologueWeapon(save, content)
    if (!bound.ok) throw new Error(bound.message)
    const active = bound.value
    active.battle = createBattle(active, content.encounters.encounter_fungorro_01, content)
    const enemy = active.battle.combatants.combatant_enemy_fungorro_crawler_1
    // Simulates a save persisted by the version that wrote the optional key.
    enemy.aiSkillEveryRounds = undefined
    const clean = toFirestorePayload(active)

    expect(enemy).toHaveProperty('aiSkillEveryRounds')
    expect(clean.battle?.combatants.combatant_enemy_fungorro_crawler_1)
      .not.toHaveProperty('aiSkillEveryRounds')
    expect(clean.saveId).toBe(active.saveId)
    expect(clean.battle?.encounterId).toBe(active.battle.encounterId)
    expect(clean).not.toBe(active)
  })

  it('preserva dados válidos e posições de arrays, inclusive em estruturas aninhadas', () => {
    const payload = { a: undefined, b: 0, c: null, nested: { x: undefined, y: 'ok' }, list: [1, undefined, { missing: undefined, n: 2 }] }
    expect(toFirestorePayload(payload)).toEqual({ b: 0, c: null, nested: { y: 'ok' }, list: [1, null, { n: 2 }] })
    expect(payload).toHaveProperty('a')
  })
})
