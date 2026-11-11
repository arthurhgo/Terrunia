import { readFileSync, existsSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { npcDefinitions } from './npcs'
import { BASIC_ARMOR_MATERIAL_PALETTES } from './visualEquipment'
import { assetRegistry } from '../assets/assetRegistry'

const dir = join(process.cwd(), 'public/assets/approval/v0516')
const concepts = [
  ['equipment_worn_linen_tunic', 'linen_worn_concept.svg'],
  ['equipment_apprentice_tunic', 'apprentice_tunic_concept.svg'],
  ['equipment_light_leather_vest', 'light_leather_vest_concept.svg'],
  ['equipment_simple_leather_armor', 'simple_leather_armor_concept.svg'],
  ['equipment_terran_guard_armor', 'terran_guard_armor_concept.svg'],
] as const

describe('v0.5.16 — art review assets are semantic, editable and not gameplay-linked', () => {
  it('matches the actual starter-item color identity by ID', () => {
    for (const [itemId, filename] of concepts) {
      const file = join(dir, filename)
      expect(existsSync(file), filename).toBe(true)
      const svg = readFileSync(file, 'utf8')
      const colors = BASIC_ARMOR_MATERIAL_PALETTES[itemId]
      expect(svg).toContain('shape-rendering="crispEdges"')
      expect(svg.toLowerCase()).toContain(colors.base)
      expect(svg.toLowerCase()).toContain(colors.shade)
      expect(svg.toLowerCase()).toContain(colors.light)
    }
  })
  it('uses existing persistent NPC IDs and keeps prototypes outside production asset IDs', () => {
    const expected = [
      ['npc_terran_weaponsmith', 'Torvan', 'torvan_idle_concept.svg'],
      ['npc_terran_armorer', 'Brenna', 'brenna_idle_concept.svg'],
      ['npc_terran_accessory_artisan', 'Ilyra', 'ilyra_idle_concept.svg'],
    ] as const
    for (const [id, name, filename] of expected) {
      const npc = npcDefinitions.find(n => n.id === id)
      expect(npc?.name).toBe(name)
      expect(assetRegistry[npc!.portraitAssetId]).toBeDefined()
      const path = join(dir, filename)
      expect(existsSync(path), filename).toBe(true)
      expect(readFileSync(path, 'utf8')).toContain('shape-rendering="crispEdges"')
    }
    expect(Object.values(assetRegistry).filter(v => v.path.includes('/approval/v0516/'))).toHaveLength(0)
  })
})
