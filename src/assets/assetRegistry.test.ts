/// <reference types="node" />
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { assetRegistry, boundSlotPreviewAssetIds, resolveAsset } from './assetRegistry'
import { BOUND_SLOTS } from '../domain/shared/types'
import { itemDefinitions } from '../content/items'
import { boundItemBaseDefinitions } from '../content/items'
import { visualEquipmentCatalog } from '../content/visualEquipment'
import { gemComponentDefinitions } from '../content/gems'
import { enemyDefinitions } from '../content/enemies'
import { npcDefinitions } from '../content/npcs'
import { essenceComponentDefinitions } from '../content/essences'

describe('grade pixel art v0.1', () => {
  it('registra exatamente cinco prévias para os cinco vínculos, sem criar equipamento', () => {
    expect(Object.keys(boundSlotPreviewAssetIds).sort()).toEqual([...BOUND_SLOTS].sort())
    for (const slot of BOUND_SLOTS) {
      const asset = resolveAsset(boundSlotPreviewAssetIds[slot])
      expect(asset.pixelArt).toBe(true)
      expect(asset.path).toContain(`/equipment/slot-previews/${slot}.png`)
    }
  })

  it('oferece duas aparências neutras e preserva os ícones do conteúdo existente', () => {
    expect(resolveAsset('character.terririan.default').pixelArt).toBe(true)
    expect(resolveAsset('character.terririan.sigil').pixelArt).toBe(true)
    for (const item of itemDefinitions) {
      expect(resolveAsset(item.iconAssetId).pixelArt).toBe(true)
    }
  })

  it('cobre as sete armas do manual e doze conceitos dos outros Vínculos', () => {
    expect(visualEquipmentCatalog).toHaveLength(19)
    expect(visualEquipmentCatalog.filter((item) => item.slot === 'weapon')).toHaveLength(7)
    expect(visualEquipmentCatalog.filter((item) => item.source === 'concept')).toHaveLength(12)
    expect(new Set(visualEquipmentCatalog.map((item) => item.id)).size).toBe(19)
    for (const item of visualEquipmentCatalog) {
      expect(resolveAsset(item.assetId).path).toBe(item.assetPath)
      expect(resolveAsset(item.assetId).pixelArt).toBe(true)
    }
    for (const slot of BOUND_SLOTS) {
      expect(visualEquipmentCatalog.some((item) => item.slot === slot)).toBe(true)
    }
    for (const boundItem of boundItemBaseDefinitions) {
      for (const assetId of Object.values(boundItem.assetIdByGrade)) {
        expect(resolveAsset(assetId).pixelArt, boundItem.id).toBe(true)
      }
    }
  })

  it('registra sete sprites nativos de evolução sem mudar os slots', () => {
    const weapon = boundItemBaseDefinitions.find((item) => item.id === 'bound_weapon_prologue_base')
    for (const grade of [1, 2, 3, 4, 5, 6, 7] as const) {
      const assetId = weapon?.assetIdByGrade[grade]
      expect(assetId).toBe(`equipment.weapon.prologue.g${grade}`)
      expect(resolveAsset(assetId ?? '').pixelArt).toBe(true)
    }
  })

  it('mantém todas as imagens pixel art como PNGs reais em resolução nativa', () => {
    for (const entry of Object.values(assetRegistry).filter((asset) => asset.pixelArt)) {
      const absolutePath = join(process.cwd(), 'public', entry.path.slice(1))
      expect(existsSync(absolutePath), entry.id).toBe(true)
      const bytes = readFileSync(absolutePath)
      expect(bytes.subarray(1, 4).toString('ascii')).toBe('PNG')
      const dimensions = entry.id === 'enemy.colossus-mycelium' ? 48 :
        entry.path.startsWith('/assets/characters/') || entry.path.startsWith('/assets/npcs/') ||
        entry.path.startsWith('/assets/enemies/') ? 32 : 16
      expect(bytes.readUInt32BE(16), entry.id).toBe(dimensions)
      expect(bytes.readUInt32BE(20), entry.id).toBe(dimensions)
      expect(bytes[25]).toBe(6) // RGBA
    }
  })

  it('cobre cada joia, essência, monstro e NPC existente com arte própria', () => {
    for (const gem of gemComponentDefinitions) {
      expect(resolveAsset(gem.iconAssetId).pixelArt, gem.name).toBe(true)
    }
    for (const essence of essenceComponentDefinitions) {
      expect(resolveAsset(`essence.${essence.id.replace('essence_', '').replaceAll('_', '-')}`).pixelArt).toBe(true)
    }
    for (const enemy of enemyDefinitions) {
      expect(resolveAsset(enemy.assetId).pixelArt, enemy.name).toBe(true)
    }
    for (const npc of npcDefinitions) {
      expect(resolveAsset(npc.portraitAssetId).pixelArt, npc.name).toBe(true)
    }
  })

  it('publica índice legível pelo Work e coordenadas exatas dos atlas de 16 e 32 pixels', () => {
    type SpriteRow = { assetId: string; path: string; family: string; width: number; height: number;
      atlas: null | { path: string; x: number; y: number; width: number; height: number } }
    const manifest = JSON.parse(readFileSync(join(process.cwd(), 'public/assets/manifests/terrunia-sprites-v0.1.json'), 'utf8')) as {
      schemaVersion: string; entries: SpriteRow[]
    }
    expect(manifest.schemaVersion).toBe('0.1')
    const ids = manifest.entries.map((entry) => entry.assetId)
    expect(new Set(ids).size).toBe(ids.length)
    expect(ids).toHaveLength(133)
    expect(manifest.entries.filter((entry) => entry.family === 'item')).toHaveLength(70)
    expect(manifest.entries.filter((entry) => entry.family === 'monster')).toHaveLength(10)
    expect(manifest.entries.filter((entry) => entry.family === 'npc')).toHaveLength(51)
    for (const id of ['item.simple-ether', 'item.field-compress', 'item.antidote',
      'npc.daeryn.portrait', 'npc.sylwen.portrait', 'npc.vorren.portrait', 'npc.lithwynn.portrait']) {
      expect(ids, id).toContain(id)
    }
    for (const sprite of manifest.entries) {
      const asset = resolveAsset(sprite.assetId)
      expect(asset.path, sprite.assetId).toBe(sprite.path)
      expect(asset.pixelArt).toBe(true)
      if (sprite.atlas) {
        const atlasFile = join(process.cwd(), 'public', sprite.atlas.path.slice(1))
        const png = readFileSync(atlasFile)
        expect(sprite.atlas.width).toBe(sprite.width)
        expect(sprite.atlas.height).toBe(sprite.height)
        expect(sprite.atlas.x + sprite.width).toBeLessThanOrEqual(png.readUInt32BE(16))
        expect(sprite.atlas.y + sprite.height).toBeLessThanOrEqual(png.readUInt32BE(20))
        expect(sprite.atlas.x % sprite.width).toBe(0)
        expect(sprite.atlas.y % sprite.height).toBe(0)
      }
    }
    expect(ids.sort()).toEqual(Object.keys(assetRegistry).filter((id) =>
      assetRegistry[id].pixelArt && id !== 'character.terririan.map').sort())
  })

  it('mantém fallback para IDs ainda sem arte', () => {
    expect(resolveAsset('unknown.asset').fallback).toBe('/assets/placeholders/generic.svg')
  })
})
