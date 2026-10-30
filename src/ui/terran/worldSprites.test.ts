import { describe, expect, it, vi } from 'vitest'
import { drawActorImage } from './worldSprites'
import { content } from '../../content/catalog'
import { getPresencePortrait, npcVisualDefinitions } from '../../content/npcVisuals'
import { resolveAsset } from '../../assets/assetRegistry'
import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'

describe('identidade visual dos personagens', () => {
  it('desenha o PNG selecionado de 32px diretamente, inclusive ao virar à esquerda', () => {
    const image = { complete: true, naturalWidth: 32, naturalHeight: 32 } as HTMLImageElement
    const context = { save: vi.fn(), restore: vi.fn(), translate: vi.fn(), scale: vi.fn(), drawImage: vi.fn(), imageSmoothingEnabled: true } as unknown as CanvasRenderingContext2D
    expect(drawActorImage(context, image, 100, 100, 'left')).toBe(true)
    expect(context.drawImage).toHaveBeenCalledWith(image, -16, -32, 32, 32)
    expect(context.scale).toHaveBeenCalledWith(-1, 1)
    expect(drawActorImage(context, null, 100, 100, 'right')).toBe(false)
  })
  it('cada NPC e cada morador possuem arte identificável e compatível com o registro', () => {
    const hashes = new Set<string>()
    for (const profile of npcVisualDefinitions) hashes.add(createHash('sha256').update(readFileSync('public' + profile.path)).digest('hex'))
    expect(hashes.size).toBe(npcVisualDefinitions.length)
    for (const place of Object.values(content.terranLocations)) for (const presence of place.npcPresences) {
      const asset = resolveAsset(getPresencePortrait(presence))
      expect(asset.pixelArt, presence.label).toBe(true)
      expect(asset.path).toContain('/assets/npcs/')
    }
    for (const npc of Object.values(content.npcs)) expect(resolveAsset(npc.portraitAssetId).pixelArt).toBe(true)
  })
})
