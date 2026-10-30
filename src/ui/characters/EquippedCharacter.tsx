import type { CSSProperties } from 'react'
import type { GameSave } from '../../domain/game/types'
import { content } from '../../content/catalog'
import { getWeaponGripProfile } from '../prologue/weaponGripProfiles'
import { AssetImage } from '../components/AssetImage'

/** The same selected character image, with the actual permanent weapon anchored at the hand. */
export function EquippedCharacter({ save, className = '', alt }: { save: GameSave; className?: string; alt?: string }) {
  const itemId = save.character.bondedEquipment.weapon
  const item = itemId ? save.boundItems[itemId] : null
  const weapon = item ? content.boundItemBases[item.baseItemId] : null
  const grip = weapon ? getWeaponGripProfile(weapon.id) : null
  const style = grip ? {
    '--hand-x': `${grip.x}%`, '--hand-y': `${grip.y}%`, '--weapon-size': `${grip.size}%`,
    '--handle-x': `${grip.handleX}%`, '--handle-y': `${grip.handleY}%`, '--weapon-angle': `${grip.rotation}deg`,
  } as CSSProperties : undefined
  return <div className={`equipped-character ${className}`} style={style} data-facing="right" data-weapon-id={weapon?.id}>
    <AssetImage assetId={save.character.portraitAssetId} className="equipped-character__body" alt={alt ?? save.character.name} />
    {weapon && item && <AssetImage assetId={weapon.assetIdByGrade[item.grade] ?? weapon.assetIdByGrade[1] ?? ''}
      className="equipped-character__weapon" alt={`${weapon.name} na mão de ${save.character.name}`}
      data-forged={Boolean(item.forging?.upgradeIds.length)} />}
  </div>
}
