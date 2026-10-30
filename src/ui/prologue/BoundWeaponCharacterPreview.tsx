import { Sparkles } from 'lucide-react'
import type { GameSave } from '../../domain/game/types'
import { AssetImage } from '../components/AssetImage'

type Props = {
  save: GameSave
  weapon: { name: string; assetId: string } | null
}

/**
 * Visual-only paper-doll preview. Character and held weapon are separate assets,
 * and the overlay can later be replaced with a dedicated held-weapon sprite.
 * No boundEquipment or save value changes until the confirmed binding.
 */
export function BoundWeaponCharacterPreview({ save, weapon }: Props) {
  return <section className="prologue-hero-preview" aria-label="Prévia do personagem com arma selecionada">
    <div className="prologue-hero-preview__stage">
      <span className="prologue-hero-preview__circle" aria-hidden="true" />
      <AssetImage assetId={save.character.portraitAssetId} className="prologue-hero-preview__character"
        alt={`Terrírian ${save.character.name}`} />
      {weapon && <AssetImage key={weapon.assetId} assetId={weapon.assetId}
        className="prologue-hero-preview__held-weapon" alt={`${weapon.name} na mão do personagem (prévia)`} />}
    </div>
    <div className="prologue-hero-preview__caption">
      <Sparkles size={13} aria-hidden="true" />
      <span>{weapon ? `Prévia: ${weapon.name}` : 'Sem arma vinculada'}</span>
    </div>
  </section>
}
