import { Sparkles } from 'lucide-react'
import type { GameSave } from '../../domain/game/types'
import { CharacterComposite } from '../characters/EquippedCharacter'
import { getVisualEquipment, type VisualItem } from '../characters/equipmentVisuals'

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
  const visuals: VisualItem[] = weapon
    ? [{ slot: 'weapon', assetId: weapon.assetId, itemId: weapon.id, itemName: weapon.name, forged: false }]
    : getVisualEquipment(save)
  return <section className="prologue-hero-preview" aria-label="Prévia do personagem com arma selecionada">
    <div className={`prologue-hero-preview__stage ${weapon ? 'is-armed' : 'is-unarmed'}`}>
      <div className="prologue-hero-preview__actor" data-weapon-id={weapon?.id}>
        <span className="prologue-hero-preview__circle" aria-hidden="true" />
        <CharacterComposite portraitAssetId={save.character.portraitAssetId} appearance={save.character.appearance}
          visuals={visuals} facing="right" className="prologue-hero-preview__character"
          alt={`Terrírian ${save.character.name} com a arma na mão`} />
      </div>
    </div>
    <div className="prologue-hero-preview__caption">
      <Sparkles size={13} aria-hidden="true" />
      <span>{weapon ? `Prévia equipada: ${weapon.name}` : 'Sem arma vinculada'}</span>
    </div>
  </section>
}
