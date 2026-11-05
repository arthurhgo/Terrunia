import { describe, expect, it, vi } from 'vitest'
import { DEFAULT_CHARACTER_APPEARANCE } from '../../domain/character/appearance'
import { appearanceSpriteSheetUri, appearanceSheetSvg, PLAYER_SPRITE_SIZE } from '../characters/CharacterSprite'
import { drawCinematicFrame } from './cinematicArt'

describe('sprite canônico do personagem nas historinhas', () => {
  it('gera a mesma spritesheet 32px com quatro direções usada em Terran e interiores', () => {
    expect(PLAYER_SPRITE_SIZE).toBe(32)
    const svg = appearanceSheetSvg(DEFAULT_CHARACTER_APPEARANCE)
    expect(svg).toContain('width="128" height="128"')
    expect(svg).toContain('translate(0 0)')
    expect(svg).toContain('translate(0 96)')
    expect(appearanceSpriteSheetUri(DEFAULT_CHARACTER_APPEARANCE)).toContain('data:image/svg+xml')
  })

  it('prefere a spritesheet customizada nas cutscenes em vez do personagem padrão', () => {
    const canvas = {
      fillRect: vi.fn(), drawImage: vi.fn(), save: vi.fn(), restore: vi.fn(),
      translate: vi.fn(), scale: vi.fn(), imageSmoothingEnabled: false,
    } as unknown as CanvasRenderingContext2D
    const sheet = { complete: true, naturalWidth: 128, naturalHeight: 128 } as HTMLImageElement
    drawCinematicFrame(canvas, 'portal', 0, 0, 'terririan', sheet, true)
    expect(canvas.drawImage).toHaveBeenCalled()
    expect(vi.mocked(canvas.drawImage).mock.calls[0][0]).toBe(sheet)
  })
})
