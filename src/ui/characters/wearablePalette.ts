import { useEffect, useMemo, useState } from 'react'
import { resolveAsset } from '../../assets/assetRegistry'
import type { CharacterAppearance } from '../../domain/character/appearance'
import type { VisualItem } from './equipmentVisuals'

export type WearablePalette = { primary: string; secondary: string }
const cache = new Map<string, WearablePalette>()
const pending = new Map<string, Promise<WearablePalette | null>>()

/** Derive actual cloth colors from opaque armor art rather than placing the
 * inventory icon on the character. Missing/unreadable sprite = keep original outfit.
 * Only appearance is affected: armor mitigation stays in the domain.
 */
export function sampleWearablePalette(assetId: string): Promise<WearablePalette | null> {
  const old = cache.get(assetId)
  if (old) return Promise.resolve(old)
  const inflight = pending.get(assetId)
  if (inflight) return inflight
  if (typeof Image === 'undefined' || typeof document === 'undefined') return Promise.resolve(null)
  const work = new Promise<WearablePalette | null>((resolve) => {
    const image = new Image()
    image.onload = () => {
      try {
        const canvas = document.createElement('canvas')
        canvas.width = 32; canvas.height = 32
        const ctx = canvas.getContext('2d', { willReadFrequently: true })
        if (!ctx) { resolve(null); return }
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height)
        const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data
        const buckets = new Map<string, number>()
        for (let i = 0; i < pixels.length; i += 4) {
          const [r, g, b, alpha] = [pixels[i], pixels[i + 1], pixels[i + 2], pixels[i + 3]]
          if (alpha < 170) continue
          const lightness = (r + g + b) / 3
          // Skip black outlines, glints and almost-transparent artifact backgrounds.
          if (lightness < 32 || lightness > 240) continue
          const quant = (value: number) => Math.min(240, Math.max(16, Math.round(value / 16) * 16))
          const hex = '#' + [quant(r), quant(g), quant(b)].map((value) => value.toString(16).padStart(2, '0')).join('')
          buckets.set(hex, (buckets.get(hex) ?? 0) + 1)
        }
        const ranked = [...buckets.entries()].sort((a, b) => b[1] - a[1])
        if (!ranked.length) { resolve(null); return }
        const primary = ranked[0][0]
        const secondary = ranked.find(([hex]) => hex !== primary && (
          Math.abs(parseInt(hex.slice(1, 3), 16) - parseInt(primary.slice(1, 3), 16)) +
          Math.abs(parseInt(hex.slice(3, 5), 16) - parseInt(primary.slice(3, 5), 16)) +
          Math.abs(parseInt(hex.slice(5, 7), 16) - parseInt(primary.slice(5, 7), 16)) > 60
        ))?.[0] ?? ranked[1]?.[0] ?? primary
        const palette = { primary, secondary }
        cache.set(assetId, palette)
        resolve(palette)
      } catch { resolve(null) }
    }
    image.onerror = () => resolve(null)
    image.src = resolveAsset(assetId).path
  })
  pending.set(assetId, work)
  void work.finally(() => pending.delete(assetId))
  return work
}

/** Same generated costume in preview, battle, city, interiors and cutscenes. */
export function useWearableAppearance(
  appearance: CharacterAppearance | undefined, visuals: readonly VisualItem[],
): CharacterAppearance | undefined {
  const armorAsset = visuals.find((item) => item.slot === 'armor')?.assetId
  const [sample, setSample] = useState<{ assetId: string; colors: WearablePalette } | null>(null)
  useEffect(() => {
    let active = true
    if (!armorAsset) return () => { active = false }
    void sampleWearablePalette(armorAsset).then((colors) => {
      if (active && colors) setSample({ assetId: armorAsset, colors })
    })
    return () => { active = false }
  }, [armorAsset])
  return useMemo(() => {
    if (!appearance || !armorAsset || sample?.assetId !== armorAsset) return appearance
    return { ...appearance, outfitPrimary: sample.colors.primary, outfitSecondary: sample.colors.secondary }
  }, [appearance, armorAsset, sample])
}
