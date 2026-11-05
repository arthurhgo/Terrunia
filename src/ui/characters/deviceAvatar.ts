import { normalizeAppearance, type CharacterAppearance } from '../../domain/character/appearance'
import type { GameSave } from '../../domain/game/types'
import { getVisualEquipment, type VisualItem } from './equipmentVisuals'

const KEY = 'terrunia.last-cosmetic-avatar.v1'
export type DeviceAvatar = { appearance: CharacterAppearance; portraitAssetId: string; visuals: VisualItem[] }

/** Only appearance and wearable asset IDs are remembered on this device.
 * Never persist account ID, character name, quests, credentials or any save payload.
 * On a shared device this is the most recently displayed *cosmetic* avatar,
 * not proof of the signed-out user's account identity.
 */
export function rememberCosmeticAvatar(save: GameSave): void {
  if (typeof localStorage === 'undefined' || !save.character.appearance) return
  try {
    const snapshot: DeviceAvatar = {
      appearance: normalizeAppearance(save.character.appearance),
      portraitAssetId: save.character.portraitAssetId,
      visuals: getVisualEquipment(save),
    }
    localStorage.setItem(KEY, JSON.stringify(snapshot))
  } catch { /* Private-browsing storage may be unavailable. */ }
}

export function readCosmeticAvatar(): DeviceAvatar | null {
  if (typeof localStorage === 'undefined') return null
  try {
    const text = localStorage.getItem(KEY)
    if (!text) return null
    const parsed: unknown = JSON.parse(text)
    if (!parsed || typeof parsed !== 'object') return null
    const value = parsed as Partial<DeviceAvatar>
    if (!value.appearance || typeof value.appearance !== 'object' || !Array.isArray(value.visuals)) return null
    const appearance = value.appearance as CharacterAppearance
    if (typeof appearance.hairStyle !== 'string' || typeof appearance.skinTone !== 'string') return null
    const visuals = value.visuals.filter((item): item is VisualItem =>
      Boolean(item && typeof item.assetId === 'string' && typeof item.itemId === 'string'
        && ['weapon','shield','armor','necklace','bracelet'].includes(item.slot))).slice(0,5)
    return { appearance: normalizeAppearance(appearance), portraitAssetId: typeof value.portraitAssetId === 'string' ?
      value.portraitAssetId : 'character.terririan.default', visuals }
  } catch { return null }
}
