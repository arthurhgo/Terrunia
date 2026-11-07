import { describe, expect, it } from 'vitest'
import { content } from '../../content/catalog'
import { biomeRegistry } from '../../content/biomeRegistry'
import { getLiveRareDrops } from '../../content/v0510DraftEconomy'
import { createNewSave } from '../game/createSave'
import { completeTrailNode } from './trailEngine'
import { canEnterBiome, enterBiomeTrail } from './biomeAccess'

const atPortal = () => {
  const save = createNewSave('biome-user', 'Nira', 'character.terririan.default', content)
  save.world.currentLocationId = 'location_terran_portal_plaza'
  return save
}

describe('v0.5.10 · biomas jogáveis com progressão segura', () => {
  it('conserva os gates de Astravél -> Cerrado -> Elduran sem acesso prematuro', () => {
    const save = atPortal()
    expect(canEnterBiome(save, 'biome_cerrado_mistico', content).ok).toBe(false)
    expect(canEnterBiome(save, 'biome_deserto_elduran', content).ok).toBe(false)
    save.world.trailNodeStates.astravel_boss_preview = 'completed'
    expect(canEnterBiome(save, 'biome_cerrado_mistico', content).ok).toBe(true)
    expect(canEnterBiome(save, 'biome_deserto_elduran', content).ok).toBe(false)
    save.world.trailNodeStates.cerrado_storm_04 = 'completed'
    expect(canEnterBiome(save, 'biome_deserto_elduran', content).ok).toBe(true)
  })

  it('migra entradas de saves existentes sem resetar inventário ou XP', () => {
    const save = atPortal()
    save.world.trailNodeStates.astravel_boss_preview = 'completed'
    save.wallet.gold = 443
    save.character.xp = 90
    for (const node of content.trails.trail_cerrado_mistico.nodes) delete save.world.trailNodeStates[node.id]
    const result = enterBiomeTrail(save, 'biome_cerrado_mistico', content, '2026-11-07T16:00:00Z')
    expect(result.ok).toBe(true)
    if (!result.ok) return
    const next = result.value
    expect(next.world.currentLocationId).toBe('cerrado_entry')
    expect(next.world.trailNodeStates.cerrado_entry).toBe('completed')
    expect(next.world.trailNodeStates.cerrado_shadow_01).toBe('current')
    expect(next.world.trailNodeStates.cerrado_storm_04).toBe('boss')
    expect(next.wallet.gold).toBe(443)
    expect(next.character.xp).toBe(90)
    expect(save.world.trailNodeStates.cerrado_shadow_01).toBeUndefined()
  })

  it('entra em Elduran preservando a conclusão do Cerrado e proíbe reroll da entrada', () => {
    const original = atPortal()
    original.world.trailNodeStates.astravel_boss_preview = 'completed'
    const first = enterBiomeTrail(original, 'biome_cerrado_mistico', content, '2026-11-07T16:01:00Z')
    if (!first.ok) throw Error(first.message)
    const firstBattle = completeTrailNode(first.value, content.trails.trail_cerrado_mistico, 'cerrado_shadow_01', '2026-11-07T16:02:00Z')
    if (!firstBattle.ok) throw Error(firstBattle.message)
    const resumed = structuredClone(firstBattle.value.save)
    resumed.world.currentLocationId = 'location_terran_portal_plaza'
    const revisit = enterBiomeTrail(resumed, 'biome_cerrado_mistico', content, '2026-11-07T16:03:00Z')
    if (!revisit.ok) throw Error(revisit.message)
    expect(revisit.value.world.trailNodeStates.cerrado_shadow_01).toBe('completed')
    expect(revisit.value.world.trailNodeStates.cerrado_glow_02).toBe('current')
    expect(revisit.value.eventLog.filter((x) => x === 'BiomeEntered:biome_cerrado_mistico')).toHaveLength(1)
    const elduranGate = structuredClone(revisit.value)
    elduranGate.world.currentLocationId = 'location_terran_portal_plaza'
    elduranGate.world.trailNodeStates.cerrado_storm_04 = 'completed'
    const elduran = enterBiomeTrail(elduranGate, 'biome_deserto_elduran', content, '2026-11-07T16:04:00Z')
    if (!elduran.ok) throw Error(elduran.message)
    expect(elduran.value.world.currentLocationId).toBe('elduran_entry')
    expect(elduran.value.world.trailNodeStates.elduran_jackals_01).toBe('current')
    expect(elduran.value.world.trailNodeStates.cerrado_shadow_01).toBe('completed')
  })

  it('não concede runas ou peças vinculadas via drops comuns', () => {
    expect(biomeRegistry.filter((biome) => biome.playable)).toHaveLength(3)
    expect(getLiveRareDrops()).toEqual([])
    for (const region of ['cerrado', 'elduran'] as const) {
      const trail = Object.values(content.trails).find((value) => value.regionId === region)!
      const stages = trail.nodes.filter((node) => node.type !== 'entry')
      expect(stages).toHaveLength(4)
      for (const node of stages) {
        const encounter = content.encounters[node.encounterId!]
        expect(encounter).toBeDefined()
        expect(encounter.trailNodeId).toBe(node.id)
        for (const id of encounter.rewards.lootDefinitionIds) {
          const item = content.items[id]
          expect(item.category).toBe('material')
          expect(item.questLocked).toBe(false)
          expect(item.canInfuseBoundItem).toBe(false)
          expect(item.infusionComponentId).toBeUndefined()
          expect(item.gemComponentId).toBeUndefined()
        }
      }
    }
  })
})
