import { Check, Coins, Filter, FlaskConical, Gem, Heart, PackageOpen, Shield, Star } from 'lucide-react'
import { useMemo, useState } from 'react'
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
  const [selected, setSelected] = useState<string[]>([])
  const [action, setAction] = useState<Action>(null)
  const [filter, setFilter] = useState<'all' | 'equipment' | 'convertible' | 'sellable'>('all')
  const equippedArmor = getEquippedBasicArmor(save, content)
  const selectedArmorInstance = selected.length === 1 ? save.inventory.find((item) => selected[0] === item.instanceId) : null
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
  const selectedItems = save.inventory.filter((instance) => selected.includes(instance.instanceId))
  const canConvert = selectedItems.length > 0 && selectedItems.every((instance) => {
    const definition = content.items[instance.definitionId]
    return definition?.convertToEssence && !definition.questLocked && !instance.locked && !instance.favorite
  })
  const canSell = selectedItems.length > 0 && selectedItems.every((instance) => {
    const definition = content.items[instance.definitionId]
    return definition?.sellable && !definition.questLocked && !instance.locked && !instance.favorite
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
        title="Mochila"
        eyebrow="ITENS COLETADOS"
        subtitle={tradeMode === 'browse' ? undefined : 'Selecione os materiais para negociar.'}
        className="inventory-panel"
        action={
          <label className="compact-select">
            <Filter size={14} />
            <select aria-label="Filtrar itens da mochila" value={filter} onChange={(event) => setFilter(event.target.value as typeof filter)}>
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
            const isSelected = selected.includes(instance.instanceId)
            return (
              <button
                type="button"
                key={instance.instanceId}
                className={`inventory-slot rarity-${instance.rarity} ${isSelected ? 'selected' : ''} ${equippedArmor?.instance.instanceId === instance.instanceId ? 'is-equipped' : ''}`}
                onClick={() => toggleSelection(instance.instanceId)}
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
          <div><strong>{selectedArmor.definition.name}{selectedArmor.instance.refinementLevel ? ' +1' : ''}</strong><p>{selectedArmor.definition.description}</p>
            <small>Defesa +{selectedArmor.armor.mitigation + (selectedArmor.instance.refinementLevel ?? 0) * ARMOR_REFINEMENT.mitigationPerLevel} · Iniciativa +{selectedArmor.armor.initiative}</small></div>
          {save.character.bondedEquipment.armor ? <p>Você já usa uma Armadura vinculada.</p> : <button type="button" disabled={Boolean(save.battle) || selectedArmor.instance.locked}
            onClick={() => equipArmor(equippedArmor?.instance.instanceId === selectedArmor.instance.instanceId ? null : selectedArmor.instance.instanceId)}>
            {equippedArmor?.instance.instanceId === selectedArmor.instance.instanceId ? 'Retirar proteção' : `Equipar ${selectedArmor.definition.name}`}</button>}
        </section>}

        {tradeMode !== 'browse' && <div className="inventory-actions">
          <span>{selectedForBoundProgression ? <><Gem size={14} /> Componente reservado para o Vínculo</> : selected.length ? `${selected.length} selecionado(s)` : 'Selecione um drop'}</span>
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
    </>
  )
}
