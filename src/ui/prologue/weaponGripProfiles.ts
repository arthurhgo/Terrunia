/**
 * VISUAL_DRAFT. Coordinates are relative to the 104px Terrírian portrait.
 * x/y point to the character's right hand. handleX/handleY specify the
 * selected weapon sprite's grip point (as a percentage of the sprite).
 * size is the fraction of the ACTOR, not of the surrounding panel.
 *
 * This registry affects only the visual preview: gameplay requirements,
 * bound item stats, saves and combat are intentionally untouched.
 */
export type WeaponGripProfile = {
  x: number
  y: number
  size: number
  handleX: number
  handleY: number
  rotation: number
}

/** Safe fallback for manually replaced weapon sprites. */
const defaultGrip: WeaponGripProfile = {
  x: 62, y: 65, size: 30, handleX: 30, handleY: 78, rotation: 12,
}

/** Small sprites anchored near the hand, blades tilted AWAY from the face. */
export const weaponGripProfiles: Record<string, WeaponGripProfile> = {
  bound_weapon_long_sword: { x: 61, y: 66, size: 27, handleX: 25, handleY: 82, rotation: 25 },
  bound_weapon_war_axe: { x: 62, y: 65, size: 32, handleX: 32, handleY: 77, rotation: 17 },
  bound_weapon_long_bow: { x: 64, y: 62, size: 35, handleX: 36, handleY: 57, rotation: 12 },
  bound_weapon_dagger: { x: 60, y: 65, size: 24, handleX: 33, handleY: 80, rotation: 18 },
  bound_weapon_arcane_scepter: { x: 61, y: 65, size: 28, handleX: 28, handleY: 80, rotation: 14 },
  bound_weapon_spellbook: { x: 65, y: 62, size: 29, handleX: 49, handleY: 54, rotation: 8 },
  bound_weapon_conjuration_staff: { x: 62, y: 65, size: 39, handleX: 29, handleY: 80, rotation: 12 },
}

export function getWeaponGripProfile(id: string): WeaponGripProfile {
  return weaponGripProfiles[id] ?? defaultGrip
}
