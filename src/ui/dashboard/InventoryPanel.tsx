import { Coins, Filter, FlaskConical, Gem, Heart, PackageOpen, Star } from 'lucide-react'
import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import './inventoryHover.css'
import { content } from '../../content/catalog'
import type { GameSave } from '../../domain/game/types'
import { useGameStore } from '../../state/gameStore'
import { getBackpackCapacity } from '../../domain/inventory/backpacks'
import { ArcanePanel } from '../components/ArcanePanel'
import { AssetImage } from '../components/AssetImage'
import { GameButton } from '../components/GameButton'
import { Modal } from '../components/Modal'
import { ARMOR_REFINEMENT } from '../../content/rosettaTutorial'
import { getItemDestinations, getPendingItemDeliveries } from '../../domain/inventory/itemPurpose'

type Action = 'convert' | 'sell' | null

export function InventoryPanel({ save, tradeMode = 'browse', compact = false }: { save: GameSave; tradeMode?: 'browse' | 'convert' | 'sell'; compact?: boolean }) {
  const convert = useGameStore((state) => state.convertItems)
  const sell = useGameStore((state) => state.sellItems)
  const toggleFavorite = useGameStore((state) => state.toggleFavorite)
  const equipArmor = useGameStore((state) => state.equipArmor)
  const equipComplementary = useGameStore((state) => state.equipComplementary)
  const [selected, setSelected] = useState<string | null>(null)
  const [hovered, setHovered] = useState<{ instanceId: string; x: number; y: number } | null>(null)
  const [action, setAction] = useState<Action>(null)
  const [filter, setFilter] = useState<'all' | 'equipment' | 'convertible' | 'sellable'>('all')
  const [page, setPage] = useState(0)
  const selectedArmorInstance = selected ? save.inventory.find((item) => selected === item.instanceId) : null
  const selectedArmorDefinition = selectedArmorInstance && content.items[selectedArmorInstance.definitionId]
  const selectedComplementary = selectedArmorInstance && selectedArmorDefinition?.complementarySlot
    ? { instance: selectedArmorInstance, definition: selectedArmorDefinition, slot: selectedArmorDefinition.complementarySlot } : null
  const selectedArmor = selectedArmorInstance && selectedArmorDefinition?.basicArmor
    ? { instance: selectedArmorInstance, definition: selectedArmorDefinition, armor: selectedArmorDefinition.basicArmor } : null

  const visibleItems = save.inventory.filter((instance) => {
    // Equipped starter protection stays in the save but is shown in its worn slot, not twice.
    if (instance.instanceId === save.character.basicArmorInstanceId) return false
    const definition = content.items[instance.definitionId]
    if (filter === 'equipment') return Boolean(definition?.basicArmor || definition?.complementarySlot)
    if (filter === 'convertible') return definition?.convertToEssence
    if (filter === 'sellable') return definition?.sellable
    return true
  })
  const pageCount = Math.max(1, Math.ceil(visibleItems.length / 12))
  const safePage = Math.min(page, pageCount - 1)
  const pagedItems = compact ? visibleItems.slice(safePage * 12, (safePage + 1) * 12) : visibleItems
  const selectedItems = save.inventory.filter((instance) => selected === instance.instanceId)
  const canConvert = selectedItems.length > 0 && selectedItems.every((instance) => {
    const definition = content.items[instance.definitionId]
    return definition?.convertToEssence && !definition.questLocked && !instance.locked && !instance.favorite && instance.instanceId !== save.character.basicArmorInstanceId
  })
  const canSell = selectedItems.length > 0 && selectedItems.every((instance) => {
    const definition = content.items[instance.definitionId]
    return definition?.sellable && !definition.questLocked && !instance.locked && !instance.favorite && instance.instanceId !== save.character.basicArmorInstanceId
  })
  const selectedDeliveryNeeds = selectedItems.flatMap((instance) => getPendingItemDeliveries(instance.definitionId, save, content))
  const selectedForBoundProgression = selectedItems.some(
    (instance) => {
      const definition = content.items[instance.definitionId]
      return Boolean(definition?.canInfuseBoundItem || definition?.gemComponentId)
    },
  )
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
    setSelected((current) => current === instanceId ? null : instanceId)
  }
  const showTooltip = (instanceId: string, element: HTMLElement) => {
    const rect = element.getBoundingClientRect()
    const width = 265
    setHovered({
      instanceId,
      x: rect.right + 10 + width < window.innerWidth ? rect.right + 10 : Math.max(8, rect.left - width - 10),
      y: Math.max(8, Math.min(rect.top, window.innerHeight - 230)),
    })
  }

  const confirm = () => {
    if (!selected) return
    if (action === 'convert') convert([selected])
    if (action === 'sell') sell([selected])
    setSelected(null)
    setAction(null)
  }

  return (
    <>
      <ArcanePanel
        title="Mochila"
        eyebrow="ITENS COLETADOS"
        subtitle={tradeMode === 'browse' ? undefined : 'Selecione os materiais para negociar.'}
        className={"inventory-panel" + (compact ? " inventory-panel--compact" : "")}
        action={
          <label className="compact-select">
            <Filter size={14} />
            <select aria-label="Filtrar itens da mochila" value={filter} onChange={(event) => { setFilter(event.target.value as typeof filter); setSelected(null); setPage(0) }}>
              <option value="all">Todos</option>
              <option value="equipment">Equipamentos simples</option>
              <option value="convertible">Conversíveis</option>
              <option value="sellable">Vendáveis</option>
            </select>
          </label>
        }
      >
        <div className="inventory-grid">
          {pagedItems.map((instance) => {
            const definition = content.items[instance.definitionId]
            if (!definition) return null
            const isSelected = selected === instance.instanceId
            return (
              <button
                type="button"
                key={instance.instanceId}
                className={`inventory-slot rarity-${instance.rarity} ${isSelected ? 'selected' : ''}`}
                onClick={() => toggleSelection(instance.instanceId)}
                onMouseEnter={(event) => showTooltip(instance.instanceId, event.currentTarget)}
                onMouseLeave={() => setHovered(null)}
                onFocus={(event) => showTooltip(instance.instanceId, event.currentTarget)}
                onBlur={() => setHovered(null)}
                aria-pressed={isSelected}
              >
                <AssetImage assetId={definition.iconAssetId} alt="" aria-hidden="true" />
                <span>{definition.name}</span>
                {instance.quantity > 1 && <strong>{instance.quantity}</strong>}
                {instance.favorite && <Star size={12} className="favorite-mark" fill="currentColor" />}
                {Boolean(instance.refinementLevel) && <b className="refinement-mark">+{instance.refinementLevel}</b>}
              </button>
            )
          })}
          {Array.from({ length: Math.max(0, 12 - pagedItems.length) }, (_, index) => (
            <span key={`empty-${index}`} className="inventory-slot inventory-slot--empty" />
          ))}
          {visibleItems.length === 0 && (
            <div className="inventory-empty">
              <PackageOpen size={26} />
              <span>Inventário vazio</span>
              <small>Itens adquiridos em missões e explorações aparecem aqui.</small>
            </div>
          )}
        </div>

        {compact && <small className="inventory-panel__capacity" aria-label="Capacidade da mochila">
          Mochila: {save.inventory.length}/{getBackpackCapacity(save)} espaços
        </small>}
        {compact && <nav className="inventory-panel__pagination" aria-label="Páginas da mochila">
          <button type="button" onClick={() => { setPage(Math.max(0, safePage - 1)); setSelected(null) }} disabled={safePage === 0} aria-label="Página anterior da mochila">‹</button>
          <span>{safePage + 1}/{pageCount} · {visibleItems.length} itens</span>
          <button type="button" onClick={() => { setPage(Math.min(pageCount - 1, safePage + 1)); setSelected(null) }} disabled={safePage === pageCount - 1} aria-label="Próxima página da mochila">›</button>
        </nav>}

        {tradeMode === 'browse' && selectedArmor && <section className="inventory-equipment-detail" aria-label={`Equipamento: ${selectedArmor.definition.name}`}>
          <AssetImage assetId={selectedArmor.definition.iconAssetId} />
          <div><strong>{selectedArmor.definition.name}{selectedArmor.instance.refinementLevel ? ' +1' : ''}</strong>{!compact && <p>Tier {selectedArmor.armor.tier} · {selectedArmor.definition.description}</p>}
            <small>Defesa +{selectedArmor.armor.mitigation + (selectedArmor.instance.refinementLevel ?? 0) * ARMOR_REFINEMENT.mitigationPerLevel} · Iniciativa +{selectedArmor.armor.initiative}</small></div>
          {save.character.bondedEquipment.armor ? <p>Você já usa uma Armadura vinculada.</p> : <button type="button" disabled={Boolean(save.battle) || selectedArmor.instance.locked}
            onClick={() => { setSelected(null); setHovered(null); equipArmor(selectedArmor.instance.instanceId) }}>
            {`Equipar ${selectedArmor.definition.name}`}</button>}
        </section>}


        {tradeMode === 'browse' && selectedComplementary && <section className="inventory-equipment-detail"
          aria-label={`Equipamento: ${selectedComplementary.definition.name}`}>
          <AssetImage assetId={selectedComplementary.definition.iconAssetId} />
          <div><strong>{selectedComplementary.definition.name}</strong>
            <small>Peça complementar, sem bônus de atributos.</small></div>
          <button type="button" disabled={Boolean(save.battle) || selectedComplementary.instance.locked}
            onClick={() => { equipComplementary(selectedComplementary.slot, selectedComplementary.instance.instanceId); setSelected(null); setHovered(null) }}>
            Equipar {selectedComplementary.definition.name}
          </button>
        </section>}

        {tradeMode !== 'browse' && <div className="inventory-actions">
          <span>{selectedForBoundProgression ? <><Gem size={14} /> Componente reservado para o Vínculo</> : selected ? '1 item selecionado' : 'Selecione um item'}</span>
          <div>
            {tradeMode === 'convert' && <GameButton variant="secondary" disabled={!canConvert} onClick={() => setAction('convert')}>
              <FlaskConical size={16} /> Trocar por Essência
            </GameButton>}
            {tradeMode === 'sell' && <GameButton variant="ghost" disabled={!canSell} onClick={() => setAction('sell')}>
              <Coins size={16} /> Trocar por Ouro
            </GameButton>}
          </div>
        </div>}
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
        {selectedDeliveryNeeds.length > 0 && <p className="modal-warning" role="alert">
          Atenção: este material é necessário para entrega em {selectedDeliveryNeeds.map((need) => `${need.title} (×${need.quantity})`).join(' · ')}.
          A venda ou conversão pode impedir a conclusão até você obtê-lo novamente. Favorite para protegê-lo.
        </p>}
        <p className="modal-warning">Esta ação remove o drop do inventário. Itens de missão e favoritos são protegidos pelo domínio.</p>
      </Modal>
      {hovered && (() => {
        const item = save.inventory.find((instance) => instance.instanceId === hovered.instanceId)
        const definition = item && content.items[item.definitionId]
        if (!item || !definition) return null
        const armor = definition.basicArmor
        return createPortal(<aside className="inventory-hover-card" role="tooltip" aria-label={`Status de ${definition.name}`}
          style={{ left: hovered.x, top: hovered.y }}>
          <span className="inventory-hover-card__eyebrow">STATUS DO ITEM</span>
          <strong>{definition.name}{item.refinementLevel ? ` +${item.refinementLevel}` : ''}</strong>
          <small>{armor ? `Tier ${armor.tier} · Proteção simples` : `${definition.category} · ${definition.rarity}`}</small>
          {armor && <div className="inventory-hover-card__stats">
            <span>Defesa <b>+{armor.mitigation + (item.refinementLevel ?? 0) * ARMOR_REFINEMENT.mitigationPerLevel}</b></span>
            <span>Iniciativa <b>{armor.initiative > 0 ? '+' : ''}{armor.initiative}</b></span>
            <span>Refinamento <b>+{item.refinementLevel ?? 0}/{armor.maxRefinement}</b></span>
          </div>}
          <p>{definition.description}</p>
          {getPendingItemDeliveries(definition.id, save, content).map((need) =>
            <small key={need.questId}>Missão ativa: {need.title} · Entrega de {need.quantity} unidade(s)</small>)}
          {getItemDestinations(definition.id, content).map((use) => <small key={use}>• {use}</small>)}
          <small>{item.instanceId === save.character.basicArmorInstanceId ? 'EQUIPADO' :
            definition.basicArmor && save.character.bondedEquipment.armor ? 'BLOQUEADO: ARMADURA VINCULADA' :
              definition.basicArmor ? 'CLIQUE NO ITEM PARA EQUIPAR' : 'ITEM DA MOCHILA'}</small>
        </aside>, document.body)
      })()}
    </>
  )
}
