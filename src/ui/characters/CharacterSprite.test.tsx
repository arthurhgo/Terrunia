import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { DEFAULT_CHARACTER_APPEARANCE } from '../../domain/character/appearance'
import { createNewSave } from '../../domain/game/createSave'
import { content } from '../../content/catalog'
import { migrateAndValidateSave } from '../../persistence/saveSchema'
import { CharacterSprite, CharacterPortrait, appearanceSpriteSvg, appearanceSpriteUri, appearanceSpriteSheetUri, appearanceSheetSvg, appearanceHeadUri } from './CharacterSprite'

describe('criador modular de sprites', () => {
  it('personaliza cores e penteados em pixels sem impactar atributos', () => {
    const preset = { ...DEFAULT_CHARACTER_APPEARANCE, hairStyle: 'cacheado' as const, hairColor: '#cc2299', skinTone: '#aa7755' }
    const svg = appearanceSpriteSvg(preset)
    expect(svg).toContain('shape-rendering="crispEdges"')
    expect(svg).toContain('width="32" height="32"')
    expect(svg).toContain('#cc2299')
    expect(svg).toContain('#aa7755')
    expect(appearanceSpriteUri(preset)).toContain('data:image/svg+xml')
    expect(appearanceSheetSvg(preset)).toContain('width="128" height="128"')
    expect(appearanceSpriteSheetUri(preset)).toContain('data:image/svg+xml')
    render(<CharacterSprite appearance={preset} alt="Terrírian personalizado" />)
    expect(screen.getByRole('img', { name: 'Terrírian personalizado' })).toHaveAttribute('src', appearanceSpriteUri(preset))
    expect(appearanceSpriteSvg(preset, 'up')).not.toEqual(appearanceSpriteSvg(preset, 'down'))
    expect(appearanceSpriteSvg(preset, 'left')).not.toEqual(appearanceSpriteSvg(preset, 'right'))
    render(<CharacterPortrait appearance={preset} alt="Rosto customizado" />)
    expect(screen.getByRole('img', { name: 'Rosto customizado' })).toHaveAttribute('src', appearanceHeadUri(preset))
  })
  it('persiste customização no save e preserva saves antigos sem visual customizado', () => {
    const preset = { ...DEFAULT_CHARACTER_APPEARANCE, frame: 'robusto' as const, outfit: 'manto' as const }
    const now = '2026-11-05T12:00:00.000Z'
    const customized = createNewSave('owner','Ria','character.terririan.default',content,now,undefined,undefined,preset)
    const parsed = migrateAndValidateSave(customized)
    expect(parsed.character.appearance).toMatchObject(preset)
    expect(parsed.character.attributes.strength.die).toBe(4)
    expect(parsed.character.clan.clanId).toBeNull()
    const legacy = migrateAndValidateSave(createNewSave('owner','Lua','character.terririan.default',content))
    expect(legacy.character.appearance).toBeUndefined()
  })
})
