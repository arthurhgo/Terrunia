import { useMemo } from 'react'
import type { CharacterAppearance } from '../../domain/character/appearance'
import { DEFAULT_CHARACTER_APPEARANCE, normalizeAppearance } from '../../domain/character/appearance'
import type { ActorFacing } from '../terran/pixelActorArt'
import { AssetImage } from '../components/AssetImage'

/**
 * Player and NPCs share a native 32px world footprint. All 4 facings and walk
 * poses use one deterministic pixel composer (not the old oversized 16px doll).
 * Renderer is presentation-only; assets and combat rules remain independent.
 */
export const PLAYER_SPRITE_SIZE = 32
type Pose = { facing: ActorFacing; stride: number }
type Palette = Record<string, string>

function colors(a: CharacterAppearance): Palette {
  return {
    o: '#1a2331', s: a.skinTone, l: '#efcfad', d: '#875d4e',
    h: a.hairColor, j: '#242735', e: a.eyeColor,
    c: a.outfitPrimary, v: '#223649', t: a.outfitSecondary,
    a: '#e3b56f', b: '#322e38', f: '#171b27', w: '#c1b9a1',
  }
}

function buildPixels(a: CharacterAppearance, { facing, stride }: Pose): string {
  const g = Array.from({ length: 32 }, () => Array<string>(32).fill('.'))
  const point = (x: number, y: number, ink: string) => {
    if (x >= 0 && x < 32 && y >= 0 && y < 32) g[y][x] = ink
  }
  const fill = (x: number, y: number, w: number, h: number, ink: string) => {
    for (let row = y; row < y + h; row++) for (let col = x; col < x + w; col++) point(col, row, ink)
  }
  const frame = a.frame === 'robusto' ? 1 : a.frame === 'leve' ? -1 : 0
  const shoulder = 8 - frame
  const torsoWidth = 16 + frame * 2
  const move = ((stride % 3) + 3) % 3
  const step = move === 1 ? -1 : move === 2 ? 1 : 0
  const side = facing === 'left' || facing === 'right'

  // Feet and clothing: same full-height 32px world scale as resident sprites.
  fill(10 + step, 25, 5, 6, 'o'); fill(18 - step, 25, 5, 6, 'o')
  fill(11 + step, 26, 3, 4, 'c'); fill(19 - step, 26, 3, 4, 'c')
  fill(10 + step, 30, 6, 2, 'b'); fill(18 - step, 30, 6, 2, 'b')
  fill(9, 16, 15, 12, 'o')
  fill(shoulder, 17, torsoWidth, 9, 'o')
  fill(shoulder + 1, 17, torsoWidth - 2, 8, 'c')
  fill(11, 25, 11, 2, 'v')
  fill(7 - frame, 18, 3, 9, 'o'); fill(24 + frame, 18, 3, 9, 'o')
  fill(8 - frame, 19, 2, 6, 'c'); fill(24 + frame, 19, 2, 6, 'c')
  fill(7 - frame, 26, 3, 2, 's'); fill(24 + frame, 26, 3, 2, 's')
  fill(13, 17, 7, 2, 't')
  fill(15, 19, 2, 6, 'v')
  if (a.outfit === 'manto') {
    fill(7 - frame, 18, 3, 12, 't'); fill(24 + frame, 18, 3, 12, 't')
    fill(11, 19, 2, 9, 'v'); fill(20, 19, 2, 9, 'v')
    fill(14, 18, 5, 2, 'a')
  } else if (a.outfit === 'aventureiro') {
    fill(10, 20, 13, 3, 't'); fill(14, 21, 4, 8, 'b')
    fill(15, 22, 2, 2, 'a'); fill(10, 24, 13, 2, 'v')
    fill(8, 18, 3, 4, 't')
  } else {
    fill(13, 18, 7, 3, 't'); fill(14, 20, 4, 4, 'v')
    fill(15, 22, 2, 2, 'a')
  }

  // Hair behind face (drawn before head).
  if (a.hairStyle === 'longo' || a.hairStyle === 'trancas') {
    fill(8, 6, 4, 15, 'o'); fill(21, 6, 4, 15, 'o')
    fill(9, 7, 3, 13, 'h'); fill(22, 7, 2, 13, 'h')
    if (a.hairStyle === 'trancas') {
      for (let y = 12; y < 24; y += 3) { point(9, y, 'a'); point(23, y + 1, 'a') }
    }
  }

  // Larger, shaded face typical of the NPC sprites (not a flat 16px icon).
  fill(10, 5, 14, 11, 'o')
  if (a.face === 'redondo') { fill(9, 9, 16, 5, 'o'); fill(10, 10, 14, 4, 's') }
  else if (a.face === 'angular') { point(10, 14, 'o'); point(23, 14, 'o') }
  fill(11, 6, 12, 9, 's')
  fill(11, 6, 2, 8, 'l')
  fill(21, 7, 2, 8, 'd')
  fill(14, 15, 6, 2, 'd')
  fill(15, 16, 4, 2, 's')

  // Hair styles customize silhouettes, not only color.
  if (a.hairStyle !== 'raspado') {
    fill(10, 3, 14, 5, 'o'); fill(11, 4, 12, 4, 'h')
    if (a.hairStyle === 'curto') {
      fill(11, 8, 5, 2, 'h'); fill(10, 7, 2, 5, 'h')
    } else if (a.hairStyle === 'cacheado') {
      for (let x = 10; x <= 23; x += 3) { fill(x, 2 + (x % 2), 3, 4, 'h'); point(x + 1, 2, 'o') }
      fill(9, 6, 3, 5, 'h'); fill(23, 7, 2, 5, 'h')
    } else if (a.hairStyle === 'trancas') {
      fill(11, 8, 4, 3, 'h'); fill(21, 5, 3, 9, 'h')
    } else {
      fill(10, 6, 3, 7, 'h'); fill(21, 6, 3, 7, 'h')
      fill(11, 8, 4, 2, 'h')
    }
  } else {
    fill(11, 4, 12, 2, 'h')
    fill(11, 6, 12, 1, 'd')
  }

  if (facing === 'up') {
    fill(11, 7, 12, 7, 'h')
    fill(13, 9, 8, 3, 'o')
  } else if (side) {
    fill(18, 10, 3, 2, 'j'); fill(19, 10, 2, 1, 'e')
    point(22, 12, 'l')
    fill(19, 14, 3, 1, 'd')
  } else {
    fill(13, 10, 3, 2, 'j'); fill(18, 10, 3, 2, 'j')
    point(14, 11, 'e'); point(19, 11, 'e')
    point(17, 13, 'd')
    fill(15, 14, 4, 1, 'd')
  }
  if (a.beard !== 'nenhuma' && facing !== 'up') {
    fill(13, 15, 8, a.beard === 'cheia' ? 3 : 1, 'h')
    if (a.beard === 'cheia') { point(13, 13, 'h'); point(20, 13, 'h') }
  }

  const map = colors(a)
  const pixels = g.flatMap((row, y) => row.flatMap((token, x) => token === '.' ? [] :
    [`<rect x="${x}" y="${y}" width="1" height="1" fill="${map[token]}"/>`])).join('')
  return facing === 'left' ? `<g transform="translate(32 0) scale(-1 1)">${pixels}</g>` : pixels
}

const svgRoot = (width: number, height: number, inside: string, viewBox = `0 0 ${width} ${height}`) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${viewBox}" shape-rendering="crispEdges">${inside}</svg>`

export function appearanceSpriteSvg(raw: CharacterAppearance, facing: ActorFacing = 'down', stride = 0): string {
  return svgRoot(32, 32, buildPixels(normalizeAppearance(raw), { facing, stride }))
}

export function appearanceSheetSvg(raw: CharacterAppearance): string {
  const a = normalizeAppearance(raw)
  const facings: ActorFacing[] = ['down', 'left', 'right', 'up']
  const frames = facings.flatMap((facing, row) => [0, 1, 2, 0].map((stride, col) =>
    `<g transform="translate(${col * 32} ${row * 32})">${buildPixels(a, { facing, stride })}</g>`)).join('')
  return svgRoot(128, 128, frames)
}

export function appearanceHeadSvg(raw: CharacterAppearance): string {
  return svgRoot(18, 17, buildPixels(normalizeAppearance(raw), { facing: 'down', stride: 0 }), '8 2 18 17')
}

const spriteCache = new Map<string, string>()
function spriteDataUrl(key: string, makeSvg: () => string): string {
  const cached = spriteCache.get(key)
  if (cached) return cached
  const uri = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(makeSvg())
  if (spriteCache.size > 192) spriteCache.clear()
  spriteCache.set(key, uri)
  return uri
}
export const appearanceSpriteUri = (a: CharacterAppearance, facing: ActorFacing = 'down') =>
  spriteDataUrl('body:' + facing + JSON.stringify(a), () => appearanceSpriteSvg(a, facing))
export const appearanceSpriteSheetUri = (a: CharacterAppearance) =>
  spriteDataUrl('sheet:' + JSON.stringify(a), () => appearanceSheetSvg(a))
export const appearanceHeadUri = (a: CharacterAppearance) =>
  spriteDataUrl('head:' + JSON.stringify(a), () => appearanceHeadSvg(a))

/** Legacy saves continue using the assetRegistry portrait. */
export function CharacterSprite({ appearance, portraitAssetId, alt = '', className = '', facing = 'down' }: {
  appearance?: CharacterAppearance; portraitAssetId?: string; alt?: string; className?: string; facing?: ActorFacing
}) {
  const sprite = useMemo(() => appearanceSpriteUri(appearance ?? DEFAULT_CHARACTER_APPEARANCE, facing), [appearance, facing])
  return appearance
    ? <img src={sprite} alt={alt} className={`character-sprite ${className}`.trim()}
        draggable={false} style={{ imageRendering: 'pixelated' }} />
    : <AssetImage assetId={portraitAssetId ?? 'character.terririan.default'} alt={alt} className={className} />
}

/** Shared face image for the creator, turn order and actor dice roll. */
export function CharacterPortrait({ appearance, portraitAssetId, alt = '', className = '' }: {
  appearance?: CharacterAppearance; portraitAssetId?: string; alt?: string; className?: string
}) {
  const src = useMemo(() => appearance ? appearanceHeadUri(appearance) : null, [appearance])
  return src
    ? <img src={src} alt={alt} className={`character-portrait ${className}`.trim()}
        draggable={false} style={{ imageRendering: 'pixelated' }} />
    : <AssetImage assetId={portraitAssetId ?? 'character.terririan.default'} alt={alt} className={className} />
}
