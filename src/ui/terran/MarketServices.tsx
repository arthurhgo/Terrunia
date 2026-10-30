import { getTerranDialogue } from '../../domain/terran/cityDialogue'
import { DialogueWindow } from './DialogueWindow'
import { getPresencePortrait } from '../../content/npcVisuals'
import { Coins, FlaskConical, Gem, Hammer, ShoppingBasket, Sparkles } from 'lucide-react'
import type { TerranNpcPresence } from '../../content/types'
import { content } from '../../content/catalog'
import { getGradeThreeGemCandidates, getGradeTwoInfusionCandidates } from '../../domain/bond/boundItems'
import { MARKET_SERVICES, MARKET_STOCK, type MarketNpcId } from '../../domain/terran/market'
import { BOUND_SLOT_LABELS, BOUND_SLOTS } from '../../domain/shared/types'
import type { GameSave } from '../../domain/game/types'
import { useGameStore } from '../../state/gameStore'
import { InventoryPanel } from '../dashboard/InventoryPanel'
import { AssetImage } from '../components/AssetImage'

function Merchant({ save, npcId }: { save: GameSave; npcId: MarketNpcId }) {
  const buy = useGameStore((state) => state.buyFromMarket)
  const stock = MARKET_STOCK.filter((offer) => offer.npcId === npcId)
  return <section className="terran-shop" aria-label="Comprar itens no Mercado">
    <h3><ShoppingBasket size={18} /> Itens à venda</h3>
    <p>Componentes e suprimentos para sua próxima expedição. Os ritos continuam exigindo Ressonância e compatibilidade.</p>
    <p className="terran-shop__wallet"><Coins size={16} /> {save.wallet.gold} Ouro</p>
    <div className="terran-shop__stock">
      {stock.map(({ itemId, price }) => {
        const item = content.items[itemId]
        if (!item) return null
        return <article key={itemId}>
          <AssetImage assetId={item.iconAssetId} />
          <div><strong>{item.name}</strong><small>{item.description}</small></div>
          <button type="button" aria-label={`Comprar ${item.name} por ${price} ouro`}
            disabled={save.wallet.gold < price} onClick={() => buy(npcId, itemId)}>
            {price} <Coins size={13} />
          </button>
        </article>
      })}
    </div>
  </section>
}

function Upgrade({ save, grade }: { save: GameSave; grade: 2 | 3 }) {
  const evolveTwo = useGameStore((state) => state.performGradeTwoRite)
  const evolveThree = useGameStore((state) => state.performGradeThreeRite)
  const fragments = getGradeTwoInfusionCandidates(save, content)
  return <section className="market-upgrade" aria-label={grade === 2 ? 'Melhorias por Infusão' : 'Melhorias por Lapidação'}>
    <h3><Hammer size={18} /> {grade === 2 ? 'Infusão · Grau II' : 'Lapidação · Grau III'}</h3>
    <p>O Vínculo precisa atingir sua Ressonância máxima. O rito consome um componente compatível, preservando a identidade do equipamento.</p>
    {BOUND_SLOTS.map((slot) => {
      const itemId = save.character.bondedEquipment[slot]
      const item = itemId ? save.boundItems[itemId] : null
      if (!item) return null
      const definition = content.boundItemBases[item.baseItemId]
      const fragment = grade === 2 ? fragments[0] : undefined
      const gemCandidate = grade === 3 ? getGradeThreeGemCandidates(save, item.id, content)[0] : undefined
      const componentId = grade === 2 ? fragment?.instanceId : gemCandidate?.inventoryInstanceId
      const componentDefinition = fragment
        ? content.items[fragment.definitionId]
        : gemCandidate ? content.items[gemCandidate.itemDefinitionId] : null
      const ready = item.grade === grade - 1 && item.resonance >= item.resonanceThreshold && Boolean(componentId)
      return <article className="market-upgrade__item" key={slot}>
        <strong>{BOUND_SLOT_LABELS[slot]} · {definition?.name ?? 'Vínculo'} · G{item.grade}</strong>
        <small>Ressonância {item.resonance}/{item.resonanceThreshold} · {componentDefinition ? `Material: ${componentDefinition.name}` : 'Material compatível ausente'}</small>
        <button className="terran-service-action" type="button" disabled={!ready} onClick={() => {
          if (!componentId) return
          if (grade === 2) evolveTwo(item.id, componentId)
          else evolveThree(item.id, componentId)
        }}><Sparkles size={16} /> {ready ? `Aplicar melhoria G${grade}` : 'Requisitos pendentes'}</button>
      </article>
    })}
    {BOUND_SLOTS.every((slot) => !save.character.bondedEquipment[slot]) && <p>Nenhum Vínculo equipado.</p>}
  </section>
}

/** Physical market NPC interactions: each resident operates one distinct service. */
export function MarketNpcPanel({
  save, presence, onClose, onQuest,
}: { save: GameSave; presence: TerranNpcPresence; onClose: () => void; onQuest?: () => void }) {
  const service = MARKET_SERVICES[presence.id as MarketNpcId]
  if (!service) return null
  return <DialogueWindow save={save} title={presence.label} portraitAssetId={getPresencePortrait(presence)} lines={[...getTerranDialogue(save, presence)]} onClose={onClose}><div className="terran-drawer__section market-npc" aria-label={`Serviços de ${presence.label}`}>
    <button type="button" onClick={onClose}>← Voltar ao Mercado</button>
    <header className="market-npc__header"><h3>{presence.label}</h3><small>{presence.roleLabel}</small></header>
    {onQuest && <button type="button" className="terran-service-action" onClick={onQuest}>Consultar missão deste NPC</button>}
    {(service === 'merchant' || service === 'supplies') && <Merchant save={save} npcId={presence.id as MarketNpcId} />}
    {service === 'infusion' && <Upgrade save={save} grade={2} />}
    {service === 'lapidation' && <Upgrade save={save} grade={3} />}
    {service === 'gold' && <><p><Coins size={15} /> Entregue drops a Feril para receber Ouro. Itens favoritos, protegidos e de missão não são aceitos.</p><InventoryPanel save={save} tradeMode="sell" /></>}
    {service === 'essence' && <><p><FlaskConical size={15} /> Lorian converte drops em Essência para o progresso do personagem.</p><InventoryPanel save={save} tradeMode="convert" /></>}
    {(service === 'infusion' || service === 'lapidation') && <p><Gem size={14} /> Para adquirir materiais, procure Valmira. Componentes e Ressonância são necessários para os ritos.</p>}
  </div></DialogueWindow>
}
