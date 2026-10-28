/// <reference types="node" />
import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { assetRegistry, boundSlotPreviewAssetIds, resolveAsset } from './assetRegistry'
import { BOUND_SLOTS } from '../domain/shared/types'
import { itemDefinitions } from '../content/items'

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

  it('mantém todas as imagens pixel art como PNGs reais em resolução nativa', () => {
    for (const entry of Object.values(assetRegistry).filter((asset) => asset.pixelArt)) {
      const absolutePath = join(process.cwd(), 'public', entry.path.slice(1))
      expect(existsSync(absolutePath), entry.id).toBe(true)
      const bytes = readFileSync(absolutePath)
      expect(bytes.subarray(1, 4).toString('ascii')).toBe('PNG')
      const dimensions = entry.id.startsWith('character.') ? 32 : 16
      expect(bytes.readUInt32BE(16)).toBe(dimensions)
      expect(bytes.readUInt32BE(20)).toBe(dimensions)
      expect(bytes[25]).toBe(6) // RGBA
    }
  })

  it('mantém fallback para IDs ainda sem arte', () => {
    expect(resolveAsset('unknown.asset').fallback).toBe('/assets/placeholders/generic.svg')
  })
})
