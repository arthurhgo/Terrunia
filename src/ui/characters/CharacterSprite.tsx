import { useMemo } from 'react'
import type { CharacterAppearance } from '../../domain/character/appearance'
import { DEFAULT_CHARACTER_APPEARANCE, normalizeAppearance } from '../../domain/character/appearance'
import { getActorMatrix } from '../terran/pixelActorArt'
import { AssetImage } from '../components/AssetImage'

/** Pixel renderer uses the same actor matrix as Terran; colors and layers are
 * interchangeable data rather than hardwired gameplay sprites.
 */
export function appearanceSpriteSvg(raw: CharacterAppearance): string {
  const a = normalizeAppearance(raw)
  const grid = getActorMatrix('down', 0).map((line) => line.split(''))
  const pixel = (x: number, y: number, ink: string) => {
    if (grid[y] && grid[y][x] !== undefined) grid[y][x] = ink
  }
  // Shape: three body frames; the remaining sprite stays 16 × 16.
  if (a.frame === 'leve') {
    for (let y = 9; y < 12; y += 1) { pixel(4, y, '.'); pixel(11, y, '.') }
  } else if (a.frame === 'robusto') {
    for (let y = 9; y < 12; y += 1) { pixel(3, y, 'o'); pixel(12, y, 'o') }
  }
  if (a.presentation === 'feminino') {
    pixel(5, 10, 'l'); pixel(10, 10, 'l'); pixel(4, 12, 'c'); pixel(11, 12, 'c')
  } else if (a.presentation === 'masculino') {
    pixel(4, 8, 'c'); pixel(11, 8, 'c')
  }
  if (a.face === 'redondo') {
    pixel(4, 6, 's'); pixel(11, 6, 's')
  } else if (a.face === 'angular') {
    pixel(4, 7, 'o'); pixel(11, 7, 'o')
  }
  if (a.hairStyle === 'raspado') {
    for (let y = 1; y <= 3; y += 1) for (let x = 5; x <= 10; x += 1) pixel(x, y, y === 1 ? 'o' : 's')
  }
  if (a.hairStyle === 'longo') {
    for (let y = 4; y <= 9; y += 1) { pixel(4, y, 'h'); pixel(11, y, 'h') }
  }
  if (a.hairStyle === 'trancas') {
    for (let y = 5; y <= 12; y += 1) { pixel(4, y, 'h'); pixel(12, y, 'h') }
    pixel(12, 13, 'a')
  }
  if (a.hairStyle === 'cacheado') {
    for (let x = 4; x <= 11; x += 1) { pixel(x, 1, 'h'); if (x % 2 === 0) pixel(x, 0, 'h') }
    for (let y = 2; y <= 5; y += 1) { pixel(3, y, 'h'); pixel(12, y, 'h') }
  }
  if (a.beard === 'curta' || a.beard === 'cheia') {
    for (let x = 6; x <= 9; x += 1) pixel(x, 7, 'h')
    if (a.beard === 'cheia') for (let x = 6; x <= 9; x += 1) pixel(x, 8, 'h')
  }
  if (a.outfit === 'manto') {
    for (let y = 9; y <= 13; y += 1) { pixel(3, y, 'l'); pixel(12, y, 'l') }
    pixel(7, 10, 'a'); pixel(8, 10, 'a')
  } else if (a.outfit === 'aventureiro') {
    for (let x = 5; x <= 10; x += 1) pixel(x, 11, x === 7 || x === 8 ? 'a' : 'o')
    pixel(5, 9, 'l'); pixel(10, 9, 'l')
  } else {
    pixel(7, 10, 'a'); pixel(8, 10, 'a')
  }
  // Eyes are independent of skin; never read them from the gameplay attribute table.
  pixel(6, 5, 'e'); pixel(9, 5, 'e')
  const palette: Record<string, string> = {
    o: '#182631', h: a.hairColor, s: a.skinTone, c: a.outfitPrimary,
    l: a.outfitSecondary, a: '#efcf84', b: '#302b32', e: a.eyeColor,
  }
  const rects: string[] = []
  grid.forEach((row, y) => row.forEach((glyph, x) => {
    const fill = palette[glyph]
    if (fill) rects.push(`<rect x="${x}" y="${y}" width="1" height="1" fill="${fill}"/>`)
  }))
  return `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" shape-rendering="crispEdges">${rects.join('')}</svg>`
}

export const appearanceSpriteUri = (appearance: CharacterAppearance): string =>
  'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(appearanceSpriteSvg(appearance))

/** Legacy players still use their registered sprite, with no migration required. */
export function CharacterSprite({ appearance, portraitAssetId, alt = '', className = '' }: {
  appearance?: CharacterAppearance
  portraitAssetId?: string
  alt?: string
  className?: string
}) {
  const sprite = useMemo(() => appearanceSpriteUri(appearance ?? DEFAULT_CHARACTER_APPEARANCE), [appearance])
  return appearance
    ? <img src={sprite} alt={alt} className={`character-sprite ${className}`.trim()} draggable={false} style={{ imageRendering: 'pixelated' }} />
    : <AssetImage assetId={portraitAssetId ?? 'character.terririan.default'} alt={alt} className={className} />
}
