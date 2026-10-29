import { describe, expect, it } from 'vitest'
import { content } from '../../content/catalog'
import { createNewSave } from '../game/createSave'
import { createBattle } from './engine'
import { createPortalWaveEncounter, getPortalWaveEnemyIds, getPortalWaveScale } from './waveEngine'

describe('modo infinito do Portal', () => {
  it('aumenta pressão, limita a formação e introduz chefe a cada cinco ondas', () => {
    expect(getPortalWaveScale(1)).toBe(1)
    expect(getPortalWaveScale(8)).toBeGreaterThan(getPortalWaveScale(2))
    expect(getPortalWaveEnemyIds(1)).toHaveLength(1)
    expect(getPortalWaveEnemyIds(7).length).toBeLessThanOrEqual(3)
    expect(getPortalWaveEnemyIds(5)).toContain('enemy_colossus_mycelium')
    expect(getPortalWaveEnemyIds(10)).toContain('enemy_colossus_mycelium')
  })

  it('gera encontro e escala os atributos sem mutar o catálogo', () => {
    const save = createNewSave('wave-owner', 'Nira', 'character.terririan.default', content)
    const encounter = createPortalWaveEncounter(6, content)
    const enemyId = encounter.enemyDefinitionIds[0]
    const baseHp = content.enemies[enemyId].maxHp
    const battle = createBattle(save, encounter, content, 'wave-battle', {
      enemyScale: getPortalWaveScale(6),
      source: { type: 'portalWave', runId: 'wave-run', wave: 6 },
    })
    const enemy = Object.values(battle.combatants).find((combatant) => combatant.side === 'enemy')!
    expect(enemy.maxHp).toBeGreaterThan(baseHp)
    expect(battle.source).toEqual({ type: 'portalWave', runId: 'wave-run', wave: 6 })
    expect(content.enemies[enemyId].maxHp).toBe(baseHp)
  })
})
