/** Appearance is data only; no combat rules or image paths depend on these values.
 * The sprite renderer can later be replaced by assetRegistry sprites.
 */
export const BODY_PRESENTATIONS = ['masculino', 'feminino', 'neutro'] as const
export const BODY_FRAMES = ['leve', 'medio', 'robusto'] as const
export const HAIR_STYLES = ['curto', 'longo', 'trancas', 'cacheado', 'raspado'] as const
export const FACE_STYLES = ['suave', 'angular', 'redondo'] as const
export const BEARD_STYLES = ['nenhuma', 'curta', 'cheia'] as const
export const OUTFIT_STYLES = ['tunica', 'manto', 'aventureiro'] as const

export type CharacterAppearance = {
  presentation: (typeof BODY_PRESENTATIONS)[number]
  frame: (typeof BODY_FRAMES)[number]
  skinTone: string
  face: (typeof FACE_STYLES)[number]
  hairStyle: (typeof HAIR_STYLES)[number]
  hairColor: string
  eyeColor: string
  beard: (typeof BEARD_STYLES)[number]
  outfit: (typeof OUTFIT_STYLES)[number]
  outfitPrimary: string
  outfitSecondary: string
}

export const DEFAULT_CHARACTER_APPEARANCE: CharacterAppearance = {
  presentation: 'neutro',
  frame: 'medio',
  skinTone: '#c99475',
  face: 'suave',
  hairStyle: 'curto',
  hairColor: '#503c34',
  eyeColor: '#537c73',
  beard: 'nenhuma',
  outfit: 'tunica',
  outfitPrimary: '#41657b',
  outfitSecondary: '#c9a96a',
}
export const APPEARANCE_SKIN_PALETTE = ['#f1d1b2','#dba77e','#c99475','#a77154','#7c4b38','#4c302c'] as const
export const APPEARANCE_HAIR_PALETTE = ['#211d27','#503c34','#916344','#c4a26b','#e6cba4','#c9dbe2','#863e53','#4e72a7'] as const
export const APPEARANCE_EYE_PALETTE = ['#537c73','#658eba','#624a34','#9b8345','#965b8f'] as const
export const APPEARANCE_CLOTH_PALETTE = ['#41657b','#375b46','#773f55','#72568d','#b99455','#313d55','#d5c1a5'] as const

export const safeAppearanceColor = (value: string, fallback: string) =>
  /^#[0-9a-fA-F]{6}$/.test(value) ? value.toLowerCase() : fallback

export const normalizeAppearance = (candidate: CharacterAppearance): CharacterAppearance => ({
  ...candidate,
  skinTone: safeAppearanceColor(candidate.skinTone, DEFAULT_CHARACTER_APPEARANCE.skinTone),
  hairColor: safeAppearanceColor(candidate.hairColor, DEFAULT_CHARACTER_APPEARANCE.hairColor),
  eyeColor: safeAppearanceColor(candidate.eyeColor, DEFAULT_CHARACTER_APPEARANCE.eyeColor),
  outfitPrimary: safeAppearanceColor(candidate.outfitPrimary, DEFAULT_CHARACTER_APPEARANCE.outfitPrimary),
  outfitSecondary: safeAppearanceColor(candidate.outfitSecondary, DEFAULT_CHARACTER_APPEARANCE.outfitSecondary),
})
