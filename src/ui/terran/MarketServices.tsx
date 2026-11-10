import { TerranSpecialistShopV05153 } from './TerranSpecialistShopV05153'
import { isTerranGearMerchant } from '../../content/terranGearMerchantsV05153'
import { useState } from 'react'
import { getEquippedBasicArmor } from '../../domain/inventory/basicArmor'
import { ARMOR_REFINEMENT } from '../../content/rosettaTutorial'
import { getTerranDialogue } from '../../domain/terran/cityDialogue'
import { DialogueWindow } from './DialogueWindow'
import { getPresencePortrait } from '../../content/npcVisuals'
import { Backpack, Coins, FlaskConical, Gem, Hammer, Sparkles } from 'lucide-react'
import type { TerranNpcPresence } from '../../content/types'
import { content } from '../../content/catalog'
import { getGradeThreeGemCandidates, getGradeTwoInfusionCandidates } from '../../domain/bond/boundItems'
import { MARKET_SERVICES, MARKET_STOCK, type MarketNpcId } from '../../domain/terran/market'
import { BOUND_SLOT_LABELS, BOUND_SLOTS } from '../../domain/shared/types'
import type { GameSave } from '../../domain/game/types'
import { useGameStore } from '../../state/gameStore'
import { InventoryPanel } from '../dashboard/InventoryPanel'
import { AssetImage } from '../components/AssetImage'
import { BACKPACK_UPGRADES, backpackFlag, getBackpackCapacity } from '../../domain/inventory/backpacks'

function Merchant({ save, npcId }: { save: GameSave; npcId: MarketNpcId }) {
  const buy = useGameStore((state) => state.buyFromMarket)
  const buyAndEquipArmor = useGameStore((state) => state.buyAndEquipMarketArmor)
  const [quantities,setQuantities]=useState<Record<string,number>>({})
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)
  const equippedArmor = getEquippedBasicArmor(save, content)
  const currentMitigation = equippedArmor ? equippedArmor.armor.mitigation + (equippedArmor.instance.refinementLevel ?? 0) * ARMOR_REFINEMENT.mitigationPerLevel : 0
  const currentInitiative = equippedArmor?.armor.initiative ?? 0
  const needsTonic=save.quests.rosetta_tutorial_supply?.status==='active' &&
    !save.eventLog.some(event=>event.startsWith('MarketPurchase:') && event.split(':')[2]==='consumable_minor_tonic')
  const needsLeather=save.quests.rosetta_tutorial_armor?.status==='active' &&
    !save.eventLog.some(event=>event.startsWith('MarketPurchase:') && event.split(':')[2]==='equipment_light_leather_vest')
  const questId=needsTonic?'consumable_minor_tonic':needsLeather?'equipment_light_leather_vest':null
  const stock=MARKET_STOCK.filter(offer=>offer.npcId===npcId)
    .sort((a,b)=>Number(b.itemId===questId)-Number(a.itemId===questId))
  return <section className="terran-shop" aria-label="Comprar itens no Mercado">
    <h3><Backpack size={18} /> Mochila do vendedor · itens à venda</h3>
    <p className="terran-shop__wallet"><Coins size={16} /> {save.wallet.gold} Ouro</p>
    {isTerranGearMerchant(npcId)&&<TerranSpecialistShopV05153 save={save} merchantId={npcId}/>}
    {npcId==='presence_neris'&&<p className="terran-shop__instruction">Poções, Mana, antídotos e consumíveis. Os equipamentos comuns são vendidos por Armeiro, Armadureiro e Artesão de Acessórios.</p>}
    <div className="terran-shop__stock">
      {stock.map((offer) => {
        const { itemId, price } = offer
        const item = content.items[itemId]
        const quantity = item?.category==='consumable' ? (quantities[itemId]??1):1
        const total = price*quantity
        const owned = save.inventory.filter(entry=>entry.definitionId===itemId)
          .reduce((n,entry)=>n+entry.quantity,0)
        const equipped = save.equippedBasicArmor?.definitionId===itemId
        if (!item) return null
        const gate = 'requiresQuestId' in offer && typeof offer.requiresQuestId === 'string' ? content.quests[offer.requiresQuestId] : null
        const locked = Boolean(gate && save.quests[gate.id]?.status !== 'completed')
        const armor = item.basicArmor
        const gainDefense = armor ? armor.mitigation - currentMitigation : 0
        const gainInitiative = armor ? armor.initiative - currentInitiative : 0
        return <article key={itemId} className="terran-shop__offer" data-market-category={item.category}
          data-quest-item={itemId===questId?'true':undefined}
          onMouseEnter={() => setHoveredItem(itemId)}
          onMouseLeave={() => setHoveredItem(null)} onFocus={() => setHoveredItem(itemId)} onBlur={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget)) setHoveredItem(null)
          }}>
          <AssetImage assetId={item.iconAssetId} />
          <div><strong>{item.name}{item.basicArmor ? ` · Tier ${item.basicArmor.tier}` : ''}</strong><small>{item.description}</small>
            {itemId===questId && <small className="terran-shop__mission-item">✦ Item da missão de Rosetta</small>}
            {equipped && <small className="terran-shop__owned">Equipado</small>}
            {!equipped&&owned>0&&<small className="terran-shop__owned">Na mochila ×{owned}</small>}
            {locked && gate && <small>Bloqueado: conclua “{gate.title}”.</small>}
            {armor && <small>Defesa +{armor.mitigation} · Iniciativa {armor.initiative >= 0 ? '+' : ''}{armor.initiative}</small>}
            {item.category==='consumable' && <small className="terran-shop__stats">{item.combatEffects.map(effect=>
              effect.type==='restoreHp'?'Vida +'+effect.value:effect.type==='restoreMp'?'Mana +'+effect.value:
              effect.type==='cleanseHarmful'?'Remove efeitos negativos':
              effect.type==='damage'?'Arremessável · Dano':effect.type==='applyStatus'?'Aplica efeito':'Suporte'
            ).join(' · ')}{item.combatUseMode==='freeHealingPotion'?' · Cura instantânea sem ação':''}</small>}
            </div>
          <div className="terran-shop__actions">
            {item.category==='consumable'&&<label className="terran-shop__quantity">
              Quantidade
              <input aria-label={'Quantidade de '+item.name} type="number" min={1} max={99} step={1}
                value={quantity} onChange={event=>{
                  const next=Math.floor(Number(event.target.value))
                  setQuantities(current=>({...current,[itemId]:Number.isFinite(next)?
                    Math.max(1,Math.min(99,next)):1}))
                }}/>
            </label>}
            <button type="button" aria-label={locked ? `Bloqueado: ${item.name}` :
              `Comprar ${item.name} por ${total} ouro`}
              disabled={locked || save.wallet.gold < total} onClick={() => buy(npcId, itemId, quantity)}>
              {total} <Coins size={13} />
            </button>
            {Boolean(armor)&&!save.character.bondedEquipment.armor&&
              <button type="button" className="terran-shop__equip-now"
                aria-label={'Comprar e equipar '+item.name+' por '+price+' ouro'}
                disabled={locked || save.wallet.gold < price}
                onClick={()=>buyAndEquipArmor(npcId,itemId)}>Comprar e Equipar</button>}
          </div>
          {hoveredItem === itemId && <aside className="terran-shop__tooltip" role="tooltip" aria-label={`Comparação: ${item.name}`}>
            <strong>{item.name}</strong>
            <small>PREÇO · {price} OURO</small>
            <p>{item.description}</p>
            {armor ? <>
              <span>Atual: {equippedArmor?.definition.name ?? (save.character.bondedEquipment.armor ? 'Armadura vinculada' : 'Sem proteção simples')}</span>
              <span>Defesa {armor.mitigation} ({gainDefense >= 0 ? '+' : ''}{gainDefense} em relação à proteção simples atual)</span>
              <span>Iniciativa {armor.initiative} ({gainInitiative >= 0 ? '+' : ''}{gainInitiative})</span>
              {save.character.bondedEquipment.armor && <small>Vínculo permanente: esta peça não o substitui.</small>}
            </> : <small>{item.category} · {item.rarity} · {item.sellable ? `Revenda ${item.sellValue ?? 0} Ouro` : 'Sem revenda'}</small>}
            {locked && <small>Requer missão de progressão.</small>}
          </aside>}
        </article>
      })}
    </div>
    {npcId === 'presence_edran' && <section className="terran-shop__backpacks" aria-label="Mochilas de expansão">
      <h3><Backpack size={18} /> Mochilas · {save.inventory.length}/{getBackpackCapacity(save)} espaços</h3>
      <p>Uma melhoria permanente de capacidade, separada dos cinco Vínculos.</p>
      <div className="terran-shop__stock">{BACKPACK_UPGRADES.map((upgrade) => {
        const owned = save.world.worldFlags.includes(backpackFlag(upgrade.id))
        const previous = !upgrade.previousId || save.world.worldFlags.includes(backpackFlag(upgrade.previousId))
        return <article key={upgrade.id}>
          <Backpack size={28} aria-hidden="true"/>
          <div><strong>{upgrade.name}</strong><small>{upgrade.capacity} espaços de inventário {owned ? '· adquirida' : !previous ? '· requer mochila anterior' : ''}</small></div>
          <button type="button" aria-label={'Comprar ' + upgrade.name + ' por ' + upgrade.price + ' ouro'}
            disabled={owned || !previous || save.wallet.gold < upgrade.price}
            onClick={() => buy(npcId, upgrade.id)}>{owned ? 'Adquirida' : upgrade.price}<Coins size={13}/></button>
        </article>
      })}</div>
    </section>}
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
      const requirements = [
        item.grade !== grade - 1 ? 'Requer Grau ' + (grade - 1) + ' (atual G' + item.grade + ')' : '',
        item.resonance < item.resonanceThreshold ? 'Faltam ' + (item.resonanceThreshold - item.resonance) + ' pontos de Ressonância' : '',
        !componentId ? 'Obtenha um componente compatível com Valmira' : '',
      ].filter(Boolean)
      const ready = requirements.length === 0
      return <article className="market-upgrade__item" key={slot}>
        <strong>{BOUND_SLOT_LABELS[slot]} · {definition?.name ?? 'Vínculo'} · G{item.grade}</strong>
        <small>Ressonância {item.resonance}/{item.resonanceThreshold} · {componentDefinition ? `Material: ${componentDefinition.name}` : 'Material compatível ausente'}</small>
        <small role="status">{ready ? 'Requisitos completos · rito disponível' : 'Próximo passo: ' + requirements.join(' · ')}</small>
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
    {onQuest && <button type="button" className="terran-service-action" onClick={onQuest}>Consultar missão deste NPC</button>}
    {(service === 'merchant' || service === 'supplies') && <Merchant save={save} npcId={presence.id as MarketNpcId} />}
    {service === 'infusion' && <Upgrade save={save} grade={2} />}
    {service === 'lapidation' && <Upgrade save={save} grade={3} />}
    {service === 'gold' && <><p><Coins size={15} /> Entregue drops a Feril para receber Ouro. Itens favoritos, protegidos e de missão não são aceitos.</p><InventoryPanel save={save} tradeMode="sell" /></>}
    {service === 'essence' && <><p><FlaskConical size={15} /> Lorian converte drops em Essência para o progresso do personagem.</p><InventoryPanel save={save} tradeMode="convert" /></>}
    {(service === 'infusion' || service === 'lapidation') && <p><Gem size={14} /> Para adquirir materiais, procure Valmira. Componentes e Ressonância são necessários para os ritos.</p>}
  </div></DialogueWindow>
}
