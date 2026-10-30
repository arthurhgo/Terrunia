/**
 * VISUAL_DRAFT: preview-only attachment profiles, independent from combat
 * rules. Every new weapon sprite can supply its own size and grip coordinates.
 * x/y are the hand anchor within the character portrait; handleX/handleY
 * locate the sprite's handle at that anchor. Values are percentages.
 */
export type WeaponGripProfile = {
  x: number
  y: number
  size: number
  handleX: number
  handleY: number
  rotation: number
}

const defaultGrip: WeaponGripProfile = {
  x: 63, y: 61, size: 42, handleX: 30, handleY: 75, rotation: 0,
}

export const weaponGripProfiles: Record<string, WeaponGripProfile> = {
  bound_weapon_long_sword: { x: 63, y: 62, size: 46, handleX: 28, handleY: 79, rotation: -9 },
  bound_weapon_war_axe: { x: 64, y: 60, size: 44, handleX: 31, handleY: 73, rotation: -13 },
  bound_weapon_long_bow: { x: 67, y: 60, size: 50, handleX: 38, handleY: 61, rotation: -6 },
  bound_weapon_dagger: { x: 61, y: 65, size: 30, handleX: 34, handleY: 76, rotation: -17 },
  bound_weapon_arcane_scepter: { x: 64, y: 61, size: 37, handleX: 31, handleY: 80, rotation: -6 },
  bound_weapon_spellbook: { x: 67, y: 59, size: 39, handleX: 50, handleY: 53, rotation: 8 },
  bound_weapon_conjuration_staff: { x: 63, y: 61, size: 51, handleX: 29, handleY: 78, rotation: -5 },
}

export function getWeaponGripProfile(id: string): WeaponGripProfile {
  return weaponGripProfiles[id] ?? defaultGrip
}
