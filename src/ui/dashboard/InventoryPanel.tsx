import { Coins, Filter, FlaskConical, Heart, PackageOpen, Star } from 'lucide-react'
import { useMemo, useState } from 'react'
import { content } from '../../content/catalog'
import type { GameSave } from '../../domain/game/types'
import { useGameStore } from '../../state/gameStore'
import { ArcanePanel } from '../components/ArcanePanel'
import { AssetImage } from '../components/AssetImage'
import { GameButton } from '../components/GameButton'
import { Modal } from '../components/Modal'

type Action = 'convert' | 'sell' | null

export function InventoryPanel({ save }: { save: GameSave }) {
  const convert = useGameStore((state) => state.convertItems)
  const sell = useGameStore((state) => state.sellItems)
  const toggleFavorite = useGameStore((state) => state.toggleFavorite)
  const [selected, setSelected] = useState<string[]>([])
  const [action, setAction] = useState<Action>(null)
  const [filter, setFilter] = useState<'all' | 'convertible' | 'sellable'>('all')

  const visibleItems = save.inventory.filter((instance) => {
    const definition = content.items[instance.definitionId]
    if (filter === 'convertible') return definition?.convertToEssence
    if (filter === 'sellable') return definition?.sellable
    return true
  })
  const selectedItems = save.inventory.filter((instance) => selected.includes(instance.instanceId))
  const totals = useMemo(
    () =>
      selectedItems.reduce(
        (sum, instance) => {
          const definition = content.items[instance.definitionId]
          sum.essence += (definition?.essenceValue ?? 0) * instance.quantity
          sum.gold += (definition?.sellValue ?? 0) * instance.quantity
          return sum
        },
        { essence: 0, gold: 0 },
      ),
    [selectedItems],
  )

  const toggleSelection = (instanceId: string) => {
    setSelected((current) =>
      current.includes(instanceId)
        ? current.filter((id) => id !== instanceId)
        : [...current, instanceId],
    )
  }

  const confirm = () => {
    if (action === 'convert') convert(selected)
    if (action === 'sell') sell(selected)
    setSelected([])
    setAction(null)
  }

  return (
    <>
      <ArcanePanel
        title="Inventário"
        eyebrow="LOOT É POTENCIAL"
        subtitle="Drops não substituem seus vínculos. Escolha o destino de cada recurso."
        className="inventory-panel"
        action={
          <label className="compact-select">
            <Filter size={14} />
            <select value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)}>
              <option value="all">Todos</option>
              <option value="convertible">Conversíveis</option>
              <option value="sellable">Vendáveis</option>
            </select>
          </label>
        }
      >
        <div className="inventory-grid">
          {visibleItems.map((instance) => {
            const definition = content.items[instance.definitionId]
            if (!definition) return null
            const isSelected = selected.includes(instance.instanceId)
            return (
              <button
                type="button"
                key={instance.instanceId}
                className={`inventory-slot rarity-${instance.rarity} ${isSelected ? 'selected' : ''}`}
                onClick={() => toggleSelection(instance.instanceId)}
                aria-pressed={isSelected}
                title={`${definition.name} — ${definition.essenceValue} Essência ou ${definition.sellValue} Ouro`}
              >
                <AssetImage assetId={definition.iconAssetId} />
                <span>{definition.name}</span>
                {instance.quantity > 1 && <strong>{instance.quantity}</strong>}
                {instance.favorite && <Star size={12} className="favorite-mark" fill="currentColor" />}
              </button>
            )
          })}
          {Array.from({ length: Math.max(0, 12 - visibleItems.length) }, (_, index) => (
            <span key={`empty-${index}`} className="inventory-slot inventory-slot--empty" />
          ))}
          {save.inventory.length === 0 && (
            <div className="inventory-empty">
              <PackageOpen size={26} />
              <span>Inventário vazio</span>
              <small>Explore Astravél para obter o primeiro drop.</small>
            </div>
          )}
        </div>

        <div className="inventory-actions">
          <span>{selected.length ? `${selected.length} selecionado(s)` : 'Selecione um drop'}</span>
          <div>
            <GameButton variant="secondary" disabled={!selected.length} onClick={() => setAction('convert')}>
              <FlaskConical size={16} /> Converter em Essência
            </GameButton>
            <GameButton variant="ghost" disabled={!selected.length} onClick={() => setAction('sell')}>
              <Coins size={16} /> Vender
            </GameButton>
          </div>
        </div>
      </ArcanePanel>

      <Modal
        open={action !== null}
        onClose={() => setAction(null)}
        eyebrow="CONFIRMAR DESTINO DO LOOT"
        title={action === 'convert' ? 'Converter em Essência' : 'Vender por Ouro'}
        footer={
          <>
            <GameButton variant="ghost" onClick={() => setAction(null)}>Cancelar</GameButton>
            <GameButton variant="primary" onClick={confirm}>
              {action === 'convert' ? <FlaskConical size={16} /> : <Coins size={16} />}
              Confirmar {action === 'convert' ? `+${totals.essence}` : `+${totals.gold}`}
            </GameButton>
          </>
        }
      >
        <div className="loot-preview-list">
          {selectedItems.map((instance) => {
            const definition = content.items[instance.definitionId]
            return (
              <div key={instance.instanceId}>
                <AssetImage assetId={definition.iconAssetId} />
                <span><strong>{definition.name}</strong><small>{definition.rarity} · {definition.status}</small></span>
                <button
                  type="button"
                  className="icon-button"
                  onClick={() => toggleFavorite(instance.instanceId)}
                  aria-label="Proteger como favorito"
                  title="Favoritar bloqueia conversão e venda"
                >
                  {instance.favorite ? <Heart size={16} fill="currentColor" /> : <Heart size={16} />}
                </button>
              </div>
            )
          })}
        </div>
        <div className="loot-choice">
          <div><FlaskConical size={20} /><span>Progressão<strong>{totals.essence} Essência</strong></span></div>
          <i>OU</i>
          <div><Coins size={20} /><span>Economia<strong>{totals.gold} Ouro</strong></span></div>
        </div>
        <p className="modal-warning">Esta ação remove o drop do inventário. Itens de missão e favoritos são protegidos pelo domínio.</p>
      </Modal>
    </>
  )
}
