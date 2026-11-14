import { gearOfferById, getGearGrade, gearSpriteId, type GearPalette } from '../../content/equipmentV0515'
import type { ComplementarySlot } from '../../domain/shared/types'
import { content } from '../../content/catalog'
import type { GameSave } from '../../domain/game/types'
import type { ActorFacing } from '../terran/pixelActorArt'
import { getWeaponGripProfile } from '../prologue/weaponGripProfiles'

export const VISUAL_EQUIPMENT_ORDER = ['armor', 'necklace', 'bracelet', 'shield', 'weapon'] as const
export type CharacterVisualSlot = (typeof VISUAL_EQUIPMENT_ORDER)[number] | ComplementarySlot
export type VisualItem = {
  slot: CharacterVisualSlot
  assetId: string
  itemId: string
  itemName: string
  forged: boolean
  /** Rarity is read from the actual item definition; never inferred from grade. */
  rarity?: string
  sheathed?: boolean
  visualTier?: number
  forgeGrade?: number
  palette?: GearPalette
}
/** One source of truth for exactly what the owner has equipped. Never creates an item. */
export function getVisualEquipment(save: GameSave, sheathed = false): VisualItem[] {
  const items: VisualItem[] = []
  for (const slot of VISUAL_EQUIPMENT_ORDER) {
    const wornShell = save.equippedGearStyles?.[slot]
    const gearShell = wornShell ? gearOfferById[wornShell.definitionId] : undefined
    if (slot!=='weapon'&&gearShell && (save.character.bondedEquipment[slot] || slot === 'shield' || slot === 'necklace' || slot === 'bracelet')) {
      items.push({slot,assetId:gearSpriteId(gearShell,getGearGrade(wornShell?.refinementLevel)),itemId:gearShell.id,itemName:gearShell.name,
        forged:getGearGrade(wornShell?.refinementLevel)>1,forgeGrade:getGearGrade(wornShell?.refinementLevel),
        visualTier:gearShell.tier,palette:gearShell.palette,sheathed:false})
      continue
    }
    const instanceId = save.character.bondedEquipment[slot]
    const instance = instanceId ? save.boundItems[instanceId] : null
    const base = instance?.slot === slot ? content.boundItemBases[instance.baseItemId] : null
    if (base && instance) {
      const assetId = base.assetIdByGrade[instance.grade] ?? base.assetIdByGrade[1]
      if (assetId) items.push({ slot, assetId, itemId: base.id, itemName: base.name, forged: Boolean(instance.forging?.upgradeIds.length), sheathed: slot === 'weapon' && sheathed, visualTier: instance.grade })
    } else if (slot === 'armor' && save.equippedBasicArmor) {
      const definition = content.items[save.equippedBasicArmor.definitionId]
      if (definition?.basicArmor && definition.iconAssetId) {
        const catalog = gearOfferById[definition.id]
        items.push({slot,assetId:catalog?gearSpriteId(catalog,getGearGrade(save.equippedBasicArmor.refinementLevel)):definition.iconAssetId,itemId:definition.id,itemName:definition.name,
          forged:Boolean(save.equippedBasicArmor.refinementLevel),rarity:definition.rarity,
          visualTier:definition.basicArmor.tier,...(catalog?{palette:catalog.palette,forgeGrade:getGearGrade(save.equippedBasicArmor.refinementLevel)}:{})})
      }
    }
  }
  const complementarySlots: ComplementarySlot[]=['pants','boots','helmet','accessoryA','accessoryB']
  for (const slot of complementarySlots) {
    const worn=save.equippedComplementary?.[slot]
    const definition=worn&&content.items[worn.definitionId]
    const gear=worn&&gearOfferById[worn.definitionId]
    if (worn && definition && gear) items.push({slot,assetId:gearSpriteId(gear,getGearGrade(worn.refinementLevel)),itemId:gear.id,itemName:gear.name,
      forged:getGearGrade(worn.refinementLevel)>1,forgeGrade:getGearGrade(worn.refinementLevel),
      visualTier:gear.tier,palette:gear.palette,rarity:definition.rarity})
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
  if (item.slot === 'weapon' && item.sheathed) {
    // Facing up exposes the actor's BACK: render the sheathed weapon on top of
    // the torso (strap/shoulder), not behind the entire character silhouette.
    return back ? point(17, 19, 22, .5, .55, -38, 'front')
      : point(18, 15, 22, .5, .7, -42, 'back')
  }
  if (item.slot === 'weapon') {
    const grip = getWeaponGripProfile(item.itemId)
    const handX = left ? 6 : 26
    const handY = back ? 25 : 26
    // VISUAL_DRAFT: calibrated one-hand silhouette on the 32px actor. Stats unchanged.
    const size = Math.min(18, Math.max(10, Math.round(32 * grip.size / 60)))
    const handleX = grip.handleX / 100
    const handleY = grip.handleY / 100
    const angle = left ? -grip.rotation : back ? grip.rotation - 30 : grip.rotation
    if (back) return point(17, 19, Math.max(16, size), .5, .55, -38, 'front')
    return point(handX, handY, size, left ? 1 - handleX : handleX, handleY, angle, 'front')
  }
  if (item.slot === 'shield') return left
    ? point(26, 24, 14, .5, .7, -8, 'front')
    : point(6, 24, 14, .5, .7, 8, back ? 'back' : 'front')
  if (item.slot === 'helmet') return point(16, 13, 16)
  if (item.slot === 'pants') return point(16, 26, 13)
  if (item.slot === 'boots') return point(16, 30, 13)
  if (item.slot === 'accessoryA') return point(11, 22, 6)
  if (item.slot === 'accessoryB') return point(21, 22, 6)
  if (item.slot === 'armor') return point(16, 21, 17, .5, .42, 0)
  if (item.slot === 'necklace') return point(16, 18, 7, .5, .5)
  return point(left ? 7 : 25, 25, 6, .5, .5)
}

/** Existing item sprites are placeholders for future dedicated wearable layers.
 * No new gameplay definition is created by drawing these slots.
 */
export const equipmentVisualIds = (save: GameSave) =>
  getVisualEquipment(save).map(({ slot, itemId, assetId }) => `${slot}:${itemId}:${assetId}`).join('|')
