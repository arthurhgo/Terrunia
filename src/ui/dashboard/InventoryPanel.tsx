import { Check, Coins, Filter, FlaskConical, Gem, Heart, PackageOpen, Shield, Star } from 'lucide-react'
import { useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import './inventoryHover.css'
import { content } from '../../content/catalog'
import type { GameSave } from '../../domain/game/types'
import { useGameStore } from '../../state/gameStore'
import { ArcanePanel } from '../components/ArcanePanel'
import { AssetImage } from '../components/AssetImage'
import { GameButton } from '../components/GameButton'
import { Modal } from '../components/Modal'
import { getEquippedBasicArmor } from '../../domain/inventory/basicArmor'
import { ARMOR_REFINEMENT } from '../../content/rosettaTutorial'

type Action = 'convert' | 'sell' | null

export function InventoryPanel({ save, tradeMode = 'browse' }: { save: GameSave; tradeMode?: 'browse' | 'convert' | 'sell' }) {
  const convert = useGameStore((state) => state.convertItems)
  const sell = useGameStore((state) => state.sellItems)
  const toggleFavorite = useGameStore((state) => state.toggleFavorite)
  const equipArmor = useGameStore((state) => state.equipArmor)
  const [selected, setSelected] = useState<string | null>(null)
  const [hovered, setHovered] = useState<{ instanceId: string; x: number; y: number } | null>(null)
  const [action, setAction] = useState<Action>(null)
  const [filter, setFilter] = useState<'all' | 'equipment' | 'convertible' | 'sellable'>('all')
  const equippedArmor = getEquippedBasicArmor(save, content)
  const selectedArmorInstance = selected ? save.inventory.find((item) => selected === item.instanceId) : null
  const selectedArmorDefinition = selectedArmorInstance && content.items[selectedArmorInstance.definitionId]
  const selectedArmor = selectedArmorInstance && selectedArmorDefinition?.basicArmor
    ? { instance: selectedArmorInstance, definition: selectedArmorDefinition, armor: selectedArmorDefinition.basicArmor } : null

  const visibleItems = save.inventory.filter((instance) => {
    const definition = content.items[instance.definitionId]
    if (filter === 'equipment') return Boolean(definition?.basicArmor)
    if (filter === 'convertible') return definition?.convertToEssence
    if (filter === 'sellable') return definition?.sellable
    return true
  })
  const selectedItems = save.inventory.filter((instance) => selected === instance.instanceId)
  const selectedItem = selectedItems.length === 1 ? selectedItems[0] : null
  const selectedDefinition = selectedItem && content.items[selectedItem.definitionId]
  const neededForQuests = selectedItem ? Object.values(content.quests).filter((quest) =>
    ['active', 'ready_to_turn_in'].includes(save.quests[quest.id]?.status ?? '') &&
    quest.turnInItems?.some((need) => need.itemId === selectedItem.definitionId)) : []
  const canConvert = selectedItems.length > 0 && selectedItems.every((instance) => {
    const definition = content.items[instance.definitionId]
    return definition?.convertToEssence && !definition.questLocked && !instance.locked && !instance.favorite && instance.instanceId !== save.character.basicArmorInstanceId
  })
  const canSell = selectedItems.length > 0 && selectedItems.every((instance) => {
    const definition = content.items[instance.definitionId]
    return definition?.sellable && !definition.questLocked && !instance.locked && !instance.favorite && instance.instanceId !== save.character.basicArmorInstanceId
  })
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
        className="inventory-panel"
        action={
          <label className="compact-select">
            <Filter size={14} />
            <select aria-label="Filtrar itens da mochila" value={filter} onChange={(event) => { setFilter(event.target.value as typeof filter); setSelected(null) }}>
              <option value="all">Todos</option>
              <option value="equipment">Equipamentos simples</option>
              <option value="convertible">Conversíveis</option>
              <option value="sellable">Vendáveis</option>
            </select>
          </label>
        }
      >
        {equippedArmor && <div className="inventory-worn" aria-label="Proteção simples equipada"><Shield size={14} /><span>{equippedArmor.definition.name}{equippedArmor.instance.refinementLevel ? ' +1' : ''}</span><small>Equipada</small></div>}
        <div className="inventory-grid">
          {visibleItems.map((instance) => {
            const definition = content.items[instance.definitionId]
            if (!definition) return null
            const isSelected = selected === instance.instanceId
            return (
              <button
                type="button"
                key={instance.instanceId}
                className={`inventory-slot rarity-${instance.rarity} ${isSelected ? 'selected' : ''} ${equippedArmor?.instance.instanceId === instance.instanceId ? 'is-equipped' : ''}`}
                onClick={() => toggleSelection(instance.instanceId)}
                onMouseEnter={(event) => showTooltip(instance.instanceId, event.currentTarget)}
                onMouseLeave={() => setHovered(null)}
                onFocus={(event) => showTooltip(instance.instanceId, event.currentTarget)}
                onBlur={() => setHovered(null)}
                aria-pressed={isSelected}
                title={definition.basicArmor ? `${definition.name}${instance.refinementLevel ? ' +1' : ''} — Defesa +${definition.basicArmor.mitigation + (instance.refinementLevel ?? 0) * ARMOR_REFINEMENT.mitigationPerLevel} · Iniciativa +${definition.basicArmor.initiative}` : definition.canInfuseBoundItem
                  ? `${definition.name} — reservado para Infusão em item vinculado`
                  : definition.gemComponentId
                    ? `${definition.name} — reservada para Lapidação em item vinculado`
                    : `${definition.name} — ${definition.essenceValue} Essência ou ${definition.sellValue} Ouro`}
              >
                <AssetImage assetId={definition.iconAssetId} alt="" aria-hidden="true" />
                <span>{definition.name}</span>
                {instance.quantity > 1 && <strong>{instance.quantity}</strong>}
                {instance.favorite && <Star size={12} className="favorite-mark" fill="currentColor" />}
                {equippedArmor?.instance.instanceId === instance.instanceId && <Check size={13} className="equipped-mark" aria-label="Equipada" />}
                {Boolean(instance.refinementLevel) && <b className="refinement-mark">+{instance.refinementLevel}</b>}
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
              <small>Rosetta entrega suas primeiras túnicas na Praça do Portal.</small>
            </div>
          )}
        </div>

        {tradeMode === 'browse' && selectedArmor && <section className="inventory-equipment-detail" aria-label={`Equipamento: ${selectedArmor.definition.name}`}>
          <AssetImage assetId={selectedArmor.definition.iconAssetId} />
          <div><strong>{selectedArmor.definition.name}{selectedArmor.instance.refinementLevel ? ' +1' : ''}</strong><p>Tier {selectedArmor.armor.tier} · {selectedArmor.definition.description}</p>
            <small>Defesa +{selectedArmor.armor.mitigation + (selectedArmor.instance.refinementLevel ?? 0) * ARMOR_REFINEMENT.mitigationPerLevel} · Iniciativa +{selectedArmor.armor.initiative}</small></div>
          <small>{equippedArmor?.instance.instanceId === selectedArmor.instance.instanceId
            ? 'Proteção em uso: retire antes de vender ou converter.'
            : 'Peça reserva: Lorian converte em Essência e Feril paga Ouro no Mercado.'}</small>
          {save.character.bondedEquipment.armor ? <p>Você já usa uma Armadura vinculada.</p> : <button type="button" disabled={Boolean(save.battle) || selectedArmor.instance.locked}
            onClick={() => equipArmor(equippedArmor?.instance.instanceId === selectedArmor.instance.instanceId ? null : selectedArmor.instance.instanceId)}>
            {equippedArmor?.instance.instanceId === selectedArmor.instance.instanceId ? 'Retirar proteção' : `Equipar ${selectedArmor.definition.name}`}</button>}
        </section>}


        {tradeMode === 'browse' && selectedItem && !selectedArmor && selectedDefinition && <section className="inventory-item-purpose" aria-label="Utilidade do item">
          <strong>{selectedDefinition.name} · Para que serve?</strong>
          {selectedDefinition.questLocked && <p>Item protegido de missão: não pode ser vendido nem convertido.</p>}
          {selectedDefinition.canInfuseBoundItem && <p>Material para Infusão de um Vínculo permanente.</p>}
          {selectedDefinition.gemComponentId && <p>Joia para Lapidação de um Vínculo permanente.</p>}
          {neededForQuests.map((quest) => <p key={quest.id}>Necessário em: {quest.title}</p>)}
          {(selectedDefinition.convertToEssence || selectedDefinition.sellable) && <p>
            {selectedDefinition.convertToEssence ? `Lorian: +${selectedDefinition.essenceValue * selectedItem.quantity} Essência` : ''}
            {selectedDefinition.convertToEssence && selectedDefinition.sellable ? ' · ' : ''}
            {selectedDefinition.sellable ? `Feril: +${selectedDefinition.sellValue * selectedItem.quantity} Ouro` : ''}
          </p>}
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
            <span>Defesa <b>+${armor.mitigation + (item.refinementLevel ?? 0) * ARMOR_REFINEMENT.mitigationPerLevel}</b></span>
            <span>Iniciativa <b>{armor.initiative > 0 ? '+' : ''}{armor.initiative}</b></span>
            <span>Refinamento <b>+{item.refinementLevel ?? 0}/{armor.maxRefinement}</b></span>
          </div>}
          <p>{definition.description}</p>
          <small>{item.instanceId === save.character.basicArmorInstanceId ? 'EQUIPADO' :
            definition.basicArmor && save.character.bondedEquipment.armor ? 'BLOQUEADO: ARMADURA VINCULADA' :
              definition.basicArmor ? 'CLIQUE NO ITEM PARA EQUIPAR' : 'ITEM DA MOCHILA'}</small>
          <small>{definition.sellable ? `${definition.sellValue * item.quantity} Ouro` : 'Não vendável'} ·
            {definition.convertToEssence ? ` ${definition.essenceValue * item.quantity} Essência` : ' Não conversível'}</small>
        </aside>, document.body)
      })()}
    </>
  )
}
