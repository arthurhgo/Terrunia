import { useState } from 'react'
import { visualEquipmentCatalog } from '../../content/visualEquipment'
import type { BoundSlot } from '../../domain/shared/types'
import { BOUND_SLOT_LABELS } from '../../domain/shared/types'
import { ArcanePanel } from '../components/ArcanePanel'
import { AssetImage } from '../components/AssetImage'

const filters: { id: BoundSlot; label: string }[] = [
  { id: 'weapon', label: 'Armas' },
  { id: 'shield', label: 'Escudos' },
  { id: 'armor', label: 'Armaduras' },
  { id: 'necklace', label: 'Colares' },
  { id: 'bracelet', label: 'Pulseiras' },
]

export function EquipmentCatalog() {
  const [slot, setSlot] = useState<BoundSlot>('weapon')
  const [selectedId, setSelectedId] = useState('weapon_long_sword')
  const visible = visualEquipmentCatalog.filter((entry) => entry.slot === slot)
  const selected = visible.find((entry) => entry.id === selectedId) ?? visible[0]

  return (
    <ArcanePanel
      title="Arsenal visual"
      eyebrow="BIBLIOTECA DE SPRITES · 16×16 PX"
      subtitle="Silhuetas de referência para os cinco Vínculos. São conceitos, não itens obtidos."
      className="equipment-catalog"
      action={<span className="pixel-draft-label">VISUAL_DRAFT</span>}
    >
      <div className="equipment-catalog__tabs" role="group" aria-label="Tipos de equipamento">
        {filters.map((filter) => (
          <button
            key={filter.id}
            type="button"
            className={slot === filter.id ? 'active' : ''}
            aria-pressed={slot === filter.id}
            onClick={() => {
              setSlot(filter.id)
              setSelectedId(visualEquipmentCatalog.find((entry) => entry.slot === filter.id)?.id ?? '')
            }}
          >
            {filter.label}
            <small>{visualEquipmentCatalog.filter((entry) => entry.slot === filter.id).length}</small>
          </button>
        ))}
      </div>
      <div className="equipment-catalog__grid" aria-label={`Modelos visuais de ${BOUND_SLOT_LABELS[slot]}`}>
        {visible.map((entry) => (
          <button
            key={entry.id}
            type="button"
            aria-pressed={selected?.id === entry.id}
            className={`equipment-catalog__tile ${selected?.id === entry.id ? 'selected' : ''}`}
            onClick={() => setSelectedId(entry.id)}
          >
            <AssetImage assetId={entry.assetId} />
            <span>{entry.name}</span>
          </button>
        ))}
      </div>
      {selected && (
        <div className="equipment-catalog__detail" aria-live="polite">
          <div className="equipment-catalog__sprite"><AssetImage assetId={selected.assetId} /></div>
          <div>
            <span className="eyebrow">{selected.source === 'manual' ? 'ARMA REFERENCIADA NO MANUAL' : 'CONCEITO VISUAL EXPLORATÓRIO'}</span>
            <strong>{selected.name}</strong>
            <p>{selected.description}</p>
            <small>Matriz 16×16 · perspectiva 3/4 superior · não disponível para equipar</small>
          </div>
        </div>
      )}
      <p className="equipment-catalog__disclaimer">O catálogo não concede equipamentos. Os cinco slots permanentes só são preenchidos pelos eventos de Vínculo do jogo.</p>
    </ArcanePanel>
  )
}
