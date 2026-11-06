import { content } from '../../content/catalog'
import type { GameSave } from '../../domain/game/types'
import type { ActorFacing } from '../terran/pixelActorArt'
import { getWeaponGripProfile } from '../prologue/weaponGripProfiles'

export const VISUAL_EQUIPMENT_ORDER = ['armor', 'necklace', 'bracelet', 'shield', 'weapon'] as const
export type CharacterVisualSlot = (typeof VISUAL_EQUIPMENT_ORDER)[number]
export type VisualItem = {
  slot: CharacterVisualSlot
  assetId: string
  itemId: string
  itemName: string
  forged: boolean
}
/** One source of truth for exactly what the owner has equipped. Never creates an item. */
export function getVisualEquipment(save: GameSave): VisualItem[] {
  const items: VisualItem[] = []
  for (const slot of VISUAL_EQUIPMENT_ORDER) {
    const instanceId = save.character.bondedEquipment[slot]
    const instance = instanceId ? save.boundItems[instanceId] : null
    const base = instance?.slot === slot ? content.boundItemBases[instance.baseItemId] : null
    if (base && instance) {
      const assetId = base.assetIdByGrade[instance.grade] ?? base.assetIdByGrade[1]
      if (assetId) items.push({ slot, assetId, itemId: base.id, itemName: base.name, forged: Boolean(instance.forging?.upgradeIds.length) })
    } else if (slot === 'armor' && save.equippedBasicArmor) {
      const definition = content.items[save.equippedBasicArmor.definitionId]
      if (definition?.basicArmor && definition.iconAssetId) items.push({
        slot, assetId: definition.iconAssetId, itemId: definition.id, itemName: definition.name, forged: false,
      })
    }
  }
  return items
}

export type VisualAnchor = {
  x: number; y: number; size: number
  handleX: number; handleY: number; angle: number; layer: 'front' | 'back'
}
const point = (x: number, y: number, size: number, handleX = .5, handleY = .5, angle = 0, layer: 'front' | 'back' = 'front'): VisualAnchor =>
  ({ x, y, size, handleX, handleY, angle, layer })

/** All values are native 32px actor coordinates. The weapon pivot follows the hand,
 * and the handle is pinned at this point rather than simply floating near the body.
 * Replaceable assets can override per-weapon grip via the established profile registry.
 */
export function getEquipmentAnchor(item: VisualItem, facing: ActorFacing): VisualAnchor {
  const left = facing === 'left'
  const back = facing === 'up'
  if (item.slot === 'weapon') {
    const grip = getWeaponGripProfile(item.itemId)
    const handX = left ? 6 : 26
    const handY = back ? 25 : 26
    const size = Math.min(16, Math.max(10, Math.round(32 * grip.size / 64)))
    const handleX = grip.handleX / 100
    const handleY = grip.handleY / 100
    const angle = left ? -grip.rotation : back ? grip.rotation - 30 : grip.rotation
    return point(handX, handY, size, left ? 1 - handleX : handleX, handleY, angle, back ? 'back' : 'front')
  }
  if (item.slot === 'shield') return left
    ? point(26, 24, 14, .5, .7, -8, 'front')
    : point(6, 24, 14, .5, .7, 8, back ? 'back' : 'front')
  if (item.slot === 'armor') return point(16, 21, 17, .5, .42, 0)
  if (item.slot === 'necklace') return point(16, 18, 7, .5, .5)
  return point(left ? 7 : 25, 25, 6, .5, .5)
}

/** Existing item sprites are placeholders for future dedicated wearable layers.
 * No new gameplay definition is created by drawing these slots.
 */
export const equipmentVisualIds = (save: GameSave) =>
  getVisualEquipment(save).map(({ slot, itemId, assetId }) => `${slot}:${itemId}:${assetId}`).join('|')
