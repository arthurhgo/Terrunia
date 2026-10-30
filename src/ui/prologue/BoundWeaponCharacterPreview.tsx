import { Sparkles } from 'lucide-react'
import type { CSSProperties } from 'react'
import type { GameSave } from '../../domain/game/types'
import { AssetImage } from '../components/AssetImage'
import { getWeaponGripProfile } from './weaponGripProfiles'

type Props = {
  save: GameSave
  weapon: { id: string; name: string; assetId: string } | null
}

/**
 * Visual paper doll: the selected weapon is attached to the Terrírian's hand,
 * scaled relative to the character, and has NO independent animation.
 * Asset and hand positions are data-driven; no game state changes until binding.
 */
export function BoundWeaponCharacterPreview({ save, weapon }: Props) {
  const grip = weapon ? getWeaponGripProfile(weapon.id) : null
  const gripStyle = grip ? {
    '--grip-x': `${grip.x}%`,
    '--grip-y': `${grip.y}%`,
    '--weapon-size': `${grip.size}%`,
    '--handle-x': `${grip.handleX}%`,
    '--handle-y': `${grip.handleY}%`,
    '--weapon-rotation': `${grip.rotation}deg`,
  } as CSSProperties : undefined

  return <section className="prologue-hero-preview" aria-label="Prévia do personagem com arma selecionada">
    <div className={`prologue-hero-preview__stage ${weapon ? 'is-armed' : 'is-unarmed'}`}>
      <div className="prologue-hero-preview__actor" data-weapon-id={weapon?.id}>
        <span className="prologue-hero-preview__circle" aria-hidden="true" />
        <AssetImage assetId={save.character.portraitAssetId} className="prologue-hero-preview__character"
          alt={`Terrírian ${save.character.name}`} />
        {weapon && <AssetImage key={weapon.assetId} assetId={weapon.assetId}
          style={gripStyle} className="prologue-hero-preview__equipped-weapon"
          alt={`${weapon.name} equipada na mão do personagem (prévia)`} />}
      </div>
    </div>
    <div className="prologue-hero-preview__caption">
      <Sparkles size={13} aria-hidden="true" />
      <span>{weapon ? `Prévia equipada: ${weapon.name}` : 'Sem arma vinculada'}</span>
    </div>
  </section>
}
