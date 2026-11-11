import { describe, expect, it } from 'vitest'
import { getEnemyReadouts, getImpactReadout } from './combatReadoutsV05153'
import type { Combatant } from './types'

const actor = (stats: Partial<Combatant> = {}): Combatant => ({
  id: 'actor', definitionId: 'enemy_fungorro', name: 'Combatente',
  side: 'enemy', hp: 14, maxHp: 14, mp: 0, maxMp: 0, attackPower: 5, mitigation: 2,
  initiative: 3, alive: true, defending: false, skillIds: [], statusEffects: [], ...stats,
})

describe('v0.5.15.3 — readouts sem alterar dano ou RNG', () => {
  it('compara somente dados observáveis dos combatentes', () => {
    const enemy = actor({ attackPower: 8, mitigation: 9, statusEffects: [
      { definitionId: 'status_poison', sourceId: 'actor', remainingTurns: 2 },
    ] })
    const player = actor({ id: 'combatant_player', side: 'player', hp: 2, maxHp: 12, attackPower: 7 })
    const snapshot = structuredClone({ enemy, player })
    expect(getEnemyReadouts(enemy, player, true)).toEqual([
      'PROTEGIDO', 'ATAQUE ELEVADO', 'DEFESA RESISTENTE', 'EFEITO ATIVO', 'SUA VIDA CRÍTICA',
    ])
    expect({ enemy, player }).toEqual(snapshot)
  })
  it('diferencia crítico, dano comum e defesa efetiva sem rolagem extra', () => {
    expect(getImpactReadout(12, true)).toBe('CRÍTICO!')
    expect(getImpactReadout(6, false)).toBe('ACERTO')
    expect(getImpactReadout(0, false)).toBe('SEM DANO')
    expect(getImpactReadout(0, true)).toBe('SEM DANO')
  })
})
