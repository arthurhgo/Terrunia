import type { CSSProperties } from 'react'
import type { CharacterAppearance } from '../../domain/character/appearance'
import type { GameSave } from '../../domain/game/types'
import type { ActorFacing } from '../terran/pixelActorArt'
import { AssetImage } from '../components/AssetImage'
import { CharacterSprite } from './CharacterSprite'
import { getEquipmentAnchor, getVisualEquipment, type VisualItem } from './equipmentVisuals'
import './equipmentComposite.css'

const placedStyle = (item: VisualItem, facing: ActorFacing): CSSProperties => {
  const anchor = getEquipmentAnchor(item, facing)
  return {
    left: `${anchor.x / 32 * 100}%`, top: `${anchor.y / 32 * 100}%`,
    width: `${anchor.size / 32 * 100}%`, height: `${anchor.size / 32 * 100}%`,
    transform: `translate(-${anchor.handleX * 100}%, -${anchor.handleY * 100}%) rotate(${anchor.angle}deg)`,
    transformOrigin: `${anchor.handleX * 100}% ${anchor.handleY * 100}%`,
  }
}

/** Shared React composite used in login/access/Nexo, conversation and battle.
 * Equipment is rendered from real IDs; anchor coordinates are the same as the
 * world canvas renderer, so changing direction cannot detach the weapon.
 */
export function CharacterComposite({ appearance, portraitAssetId, visuals, facing = 'down', className = '', alt = 'Terrírian' }: {
  appearance?: CharacterAppearance
  portraitAssetId?: string
  visuals: readonly VisualItem[]
  facing?: ActorFacing
  className?: string
  alt?: string
}) {
  const layer = (depth: 'front' | 'back') => visuals.filter((item) => getEquipmentAnchor(item, facing).layer === depth)
    .map((item) => <AssetImage key={item.slot} assetId={item.assetId}
      className={`equipped-character__layer equipped-character__layer--${item.slot} equipped-character__layer--${depth}`}
      style={placedStyle(item, facing)} alt="" aria-hidden="true"
      data-slot={item.slot} data-item-id={item.itemId} data-forged={item.forged} />)
  return <div className={`equipped-character character-composite ${className}`.trim()} data-facing={facing}
    data-equipped-count={visuals.length} data-weapon-id={visuals.find((item) => item.slot === 'weapon')?.itemId ?? ''}>
    {layer('back')}
    <CharacterSprite appearance={appearance} portraitAssetId={portraitAssetId}
      facing={facing} className="equipped-character__body" alt={alt} />
    {layer('front')}
  </div>
}

export function EquippedCharacter({ save, facing = 'down', className = '', alt }: {
  save: GameSave; facing?: ActorFacing; className?: string; alt?: string
}) {
  return <CharacterComposite appearance={save.character.appearance} portraitAssetId={save.character.portraitAssetId}
    facing={facing} visuals={getVisualEquipment(save)} className={className} alt={alt ?? save.character.name} />
}
