import type { ActorFacing } from '../terran/pixelActorArt'
import type { VisualItem } from './equipmentVisuals'
import { BASIC_ARMOR_MATERIAL_PALETTES } from '../../content/visualEquipment'

export type ArmorTone = 'shade' | 'base' | 'light' | 'rune'
export type ArmorPixel = { x: number; y: number; w: number; h: number; tone: ArmorTone }

/** VISUAL_DRAFT: pixel torso/cuffs instead of placing an inventory icon over the sprite.
 * Native coordinates match the 32×32 Terrírian in CharacterSprite.
 * Future hand-authored wearables may replace this via assetRegistry without touching rules.
 */
export const armorPixels = (facing: ActorFacing): ArmorPixel[] => {
  const side = facing === 'left' || facing === 'right'
  const back = facing === 'up'
  const pixels: ArmorPixel[] = [
    { x: 9, y: 18, w: 15, h: 8, tone: 'shade' },
    { x: 10, y: 18, w: 13, h: 6, tone: 'base' },
    { x: 11, y: 18, w: 11, h: 2, tone: 'light' },
    { x: 11, y: 25, w: 11, h: 2, tone: 'shade' },
    { x: 7, y: 18, w: 3, h: 8, tone: 'shade' },
    { x: 8, y: 19, w: 2, h: 5, tone: 'base' },
    { x: 24, y: 18, w: 3, h: 8, tone: 'shade' },
    { x: 24, y: 19, w: 2, h: 5, tone: 'base' },
    { x: 12, y: 23, w: 9, h: 1, tone: 'shade' },
  ]
  if (side) pixels.push({ x: 18, y: 20, w: 3, h: 3, tone: 'light' })
  else if (back) pixels.push({ x: 15, y: 20, w: 4, h: 4, tone: 'shade' })
  else pixels.push({ x: 15, y: 20, w: 3, h: 3, tone: 'rune' })
  return pixels
}

export const armorPalette = (visual: VisualItem) => {
  // Color follows the exact worn piece; quality/rarity remain separate data.
  if(visual.palette){
    const p=visual.palette
    const base=(visual.forgeGrade??1)===3?p.gradeThree:p.base
    return {shade:base,base,light:(visual.forgeGrade??1)>=2?p.metallic:p.trim,rune:p.glow}
  }
  const material = BASIC_ARMOR_MATERIAL_PALETTES[visual.itemId]
  if (material) return material
  const tier = visual.visualTier ?? 1
  return tier >= 5
    ? { shade: '#253d4e', base: '#4f779c', light: '#91d5db', rune: '#e5db90' }
    : tier >= 3
    ? { shade: '#384d60', base: '#748a9d', light: '#bdc8cc', rune: '#a7d8f2' }
    : tier === 2
    ? { shade: '#4d3c37', base: '#9d745a', light: '#d1aa8b', rune: '#e8c17a' }
    : { shade: '#37413d', base: '#697769', light: '#a6ac8c', rune: '#c0a472' }
}
