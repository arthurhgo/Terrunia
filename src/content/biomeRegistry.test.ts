import { describe, expect, it } from 'vitest'
import { content } from './catalog'
import { biomeRegistry, getPlayableBiome } from './biomeRegistry'

describe('v0.5.10 biome manifests', () => {
  it('keeps Astravél as the only playable entry, with the canonical 15 encounters', () => {
    expect(biomeRegistry).toHaveLength(5)
    const open = biomeRegistry.filter((biome) => biome.playable)
    expect(open.map((biome) => biome.id)).toEqual(['biome_astravel'])
    expect(getPlayableBiome('biome_astravel')?.trailIds).toContain('trail_astravel_entry')
    expect(content.trails.trail_astravel_entry.nodes.filter((node) => node.type !== 'entry')).toHaveLength(15)
  })
  it('never offers a placeholder region as a destination', () => {
    for (const biome of biomeRegistry.filter((entry) => !entry.playable)) {
      expect(biome.status).toBe('CONTENT_DRAFT')
      expect(biome.trailIds).toHaveLength(0)
      expect(getPlayableBiome(biome.id)).toBeNull()
    }
  })
})
