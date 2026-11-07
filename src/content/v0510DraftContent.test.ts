import { describe, expect, it } from 'vitest'
import { content } from './catalog'
import { boundItemBaseDefinitions } from './items'
import { biomeRegistry } from './biomeRegistry'
import { boundRuneDrafts, getLiveRareDrops, rareDropDrafts } from './v0510DraftEconomy'
import { legacyEnemyMotion } from '../ui/battle/EnemyMotionSprite'
import { resolveAsset } from '../assets/assetRegistry'

describe('v0.5.10 content integration and canon guards', () => {
  it('supports three grade-locked techniques for every existing weapon family', () => {
    const weapons = boundItemBaseDefinitions.filter((item) => item.slot === 'weapon')
    expect(weapons).toHaveLength(7)
    for (const weapon of weapons) {
      expect(weapon.skillUnlocks.map((unlock) => unlock.grade)).toEqual([1, 2, 3])
      for (const unlock of weapon.skillUnlocks) {
        expect(content.combatSkills[unlock.skillId]).toBeDefined()
      }
    }
  })
  it('registers four draft Clan techniques, without granting them at creation', () => {
    const ids = ['skill_clan_dunavar_guard', 'skill_clan_rustal_glyph',
      'skill_clan_cebios_orb', 'skill_clan_estres_flux']
    expect(ids).toHaveLength(4)
    for (const id of ids) expect(content.combatSkills[id]?.status).toBe('BALANCE_DRAFT')
  })
  it('covers all existing enemies with native animation or species-specific fallback', () => {
    const monsters = Object.values(content.enemies)
    expect(monsters).toHaveLength(14)
    const native = monsters.filter((enemy) => Boolean(resolveAsset(enemy.assetId).motionSheet))
    expect(native).toHaveLength(4)
    for (const enemy of monsters) {
      const asset = resolveAsset(enemy.assetId)
      expect(Boolean(asset.motionSheet || legacyEnemyMotion[enemy.assetId])).toBe(true)
    }
  })
  it('keeps biomes, chance tables and rune effects non-canonical until approved', () => {
    expect(biomeRegistry).toHaveLength(5)
    expect(biomeRegistry.filter((biome) => biome.playable)).toHaveLength(1)
    expect(rareDropDrafts).toHaveLength(25)
    expect(getLiveRareDrops()).toHaveLength(0)
    for (const drop of rareDropDrafts) {
      expect(drop.chance).toBeGreaterThanOrEqual(.0015)
      expect(drop.chance).toBeLessThanOrEqual(.015)
      expect(drop.enabled).toBe(false)
    }
    expect(boundRuneDrafts).toHaveLength(13)
    for (const rune of boundRuneDrafts) {
      expect(rune.minGrade).toBe(4)
      expect(rune.status).toBe('BALANCE_DRAFT')
    }
  })
})
