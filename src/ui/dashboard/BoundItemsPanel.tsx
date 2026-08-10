import { Braces, Gem, Link2, Shield, ShieldHalf, Sparkles, Sword, Watch } from 'lucide-react'
import { Link } from 'react-router-dom'
import { content } from '../../content/catalog'
import { getBoundSlotCapacity } from '../../domain/bond/boundItems'
import type { GameSave } from '../../domain/game/types'
import { BOUND_SLOTS, BOUND_SLOT_LABELS, type BoundSlot } from '../../domain/shared/types'
import { ArcanePanel } from '../components/ArcanePanel'
import { AssetImage } from '../components/AssetImage'
import { ProgressBar } from '../components/ProgressBar'

const slotIcons = {
  weapon: Sword,
  shield: Shield,
  armor: ShieldHalf,
  necklace: Gem,
  bracelet: Watch,
}

function BoundItemCard({ slot, save }: { slot: BoundSlot; save: GameSave }) {
  const itemId = save.character.bondedEquipment[slot]
  const item = itemId ? save.boundItems[itemId] : null
  const definition = item ? content.boundItemBases[item.baseItemId] : null
  const Icon = slotIcons[slot]
  const capacity = getBoundSlotCapacity(item?.grade ?? 1)

  return (
    <article className={`bound-card ${item ? 'bound-card--active' : 'bound-card--empty'}`}>
      <header>
        <Icon size={16} aria-hidden="true" />
        <span>{BOUND_SLOT_LABELS[slot]}</span>
        {item ? <strong>G{item.grade}</strong> : <small>Vazio</small>}
      </header>
      <div className="bound-card__visual">
        {item && definition ? (
          <AssetImage assetId={definition.assetIdByGrade[item.grade] ?? definition.assetIdByGrade[1] ?? ''} />
        ) : (
          <div className="slot-silhouette"><Icon size={42} /><span>Placeholder</span></div>
        )}
      </div>
      <div className="component-slots" aria-label="Slots estruturais">
        <span className={capacity.essences >= 1 ? 'open essence' : ''} title="Essência I">E</span>
        <span className={capacity.gems >= 1 ? 'open gem' : ''} title="Joia I">J</span>
        <span className={capacity.runes >= 1 ? 'open rune' : ''} title="Runa">R</span>
        <span className={capacity.essences >= 2 ? 'open essence' : ''} title="Essência II">E</span>
        <span className={capacity.gems >= 2 ? 'open gem' : ''} title="Joia II">J</span>
        <span className={capacity.superiorRunes >= 1 ? 'open superior' : ''} title="Runa Superior">S</span>
      </div>
      {item ? (
        <>
          <ProgressBar value={item.resonance} max={item.resonanceThreshold} label="Ressonância" tone="resonance" compact />
          <Link to={`/bound-items/${slot}`} className="bound-card__link">Detalhes / Evoluir</Link>
        </>
      ) : (
        <p className="bound-card__empty-copy">Será obtido e vinculado durante o prólogo.</p>
      )}
    </article>
  )
}

export function BoundItemsPanel({ save }: { save: GameSave }) {
  const activeItems = BOUND_SLOTS.filter((slot) => save.character.bondedEquipment[slot]).length
  return (
    <ArcanePanel
      title="Itens Vinculados"
      eyebrow="NO QUE ESTOU ME TORNANDO"
      subtitle="Equipamentos são permanentes. O loot alimenta sua evolução."
      className="bound-items-panel"
      action={<span className="panel-metric"><Link2 size={15} /> {activeItems}/5 vínculos</span>}
    >
      <div className="bound-items-grid">
        {BOUND_SLOTS.map((slot) => <BoundItemCard key={slot} slot={slot} save={save} />)}
      </div>
      <div className="resonance-summary">
        <span className="resonance-summary__icon"><Braces size={24} /></span>
        <div>
          <p className="eyebrow">RESSONÂNCIA</p>
          <strong>Uso gera história. História transforma o vínculo.</strong>
          <small>Cada peça progride de forma independente através de sete Graus.</small>
        </div>
        <Sparkles size={18} />
      </div>
    </ArcanePanel>
  )
}
