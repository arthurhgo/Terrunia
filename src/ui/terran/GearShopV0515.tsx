import { useState } from 'react'
import type { GameSave } from '../../domain/game/types'
import { castleMerchantByPresenceId } from '../../content/castleMerchantsV05151'
import { equipmentSetsV0515, gearOfferById } from '../../content/equipmentV0515'
import { classDefinitions } from '../../content/progression'
import { checkGearAccess, getSetPrice } from '../../domain/inventory/equipmentV0515'
import { useGameStore } from '../../state/gameStore'
import { AssetImage } from '../components/AssetImage'
import './gearShopV0515.css'

const STAT_LABELS = { maxHp: 'Vida', maxMp: 'Mana', attackPower: 'Ataque', mitigation: 'Proteção', initiative: 'Iniciativa' }

/** v0.5.15.1: One real merchant = one authorized inventory, no shop-wide castle bypass. */
export function GearShopV0515({ save, merchantId }: { save: GameSave; merchantId: string }) {
  const buy = useGameStore((state) => state.buyGear)
  const buySet = useGameStore((state) => state.buyGearSet)
  const [tier, setTier] = useState(1)
  const [classFilter, setClassFilter] = useState('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const merchant = castleMerchantByPresenceId[merchantId]
  const isNeris = merchantId === 'presence_neris'
  if (!isNeris && !merchant) return <p>Mercador desconhecido.</p>

  const sets = equipmentSetsV0515.filter((set) =>
    (isNeris
      ? set.channel === 'PUBLIC_TERRAN' && set.tier === 1 && !set.clanId && !set.classId
      : set.channel === merchant.channel && set.castleId === merchant.castleId &&
        set.clanId === merchant.clanId && set.classId === merchant.classId &&
        set.tier === tier) &&
    (classFilter === 'all' || (isNeris && set.recommendedClassId === classFilter))
  )
  const selected = sets.find((set) => set.id === selectedId) ?? sets[0]
  const cost = selected ? getSetPrice(selected.id) : 0
  const permission = selected ? checkGearAccess(save, gearOfferById[selected.itemIds[0]], merchantId) : null

  return <section className="gear-shop-v0515"
    aria-label={isNeris ? 'Mercador de equipamentos comuns de Terran' : 'Mercador exclusivo do Castelo'}>
    <header>
      <h3>{isNeris ? 'Neris · Equipamentos comuns' : merchant.name}</h3>
      <p>{isNeris
        ? 'Somente equipamentos comuns Tier I, Grau 1. Nenhum requisito de Clã ou Classe. As coleções são apenas estilos sugeridos.'
        : merchant.channel === 'CLAN_EXCLUSIVE'
          ? 'Arsenal exclusivo do Clã. A compra exige filiação e nível compatíveis.'
          : 'Arsenal exclusivo da Classe. A compra exige filiação, Classe desbloqueada e nível compatível.'}
        {' '}Grau de Forja 2–3 é aprimorado exclusivamente com Durnan.</p>
      <strong>Ouro: {save.wallet.gold.toLocaleString('pt-BR')}</strong>
    </header>
    <div className="gear-shop-v0515__filters">
      {!isNeris && <label>Tier <select aria-label="Filtrar tier de equipamento" value={tier}
        onChange={(event) => { setTier(Number(event.target.value)); setSelectedId(null) }}>
        {[1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>Tier {n} · Nível {1 + (n - 1) * 3}</option>)}
      </select></label>}
      {isNeris && <label>Estilo <select aria-label="Filtrar estilo comercial" value={classFilter}
        onChange={(event) => { setClassFilter(event.target.value); setSelectedId(null) }}>
        <option value="all">Todos os estilos (sem requisitos)</option>
        {classDefinitions.map((cls) => <option key={cls.id} value={cls.id}>{cls.name}</option>)}
      </select></label>}
    </div>
    <div className="gear-shop-v0515__sets" role="group" aria-label="Conjuntos disponíveis">
      {sets.map((set) => <button key={set.id} type="button" aria-pressed={selected?.id === set.id}
        className={selected?.id === set.id ? 'is-selected' : ''} onClick={() => setSelectedId(set.id)}>
        <span className="gear-shop-v0515__swatch"
          style={{ background: set.palette.base, borderColor: set.palette.trim }} />
        <span><strong>{set.name}</strong><small>Tier {set.tier} · Grau 1 · 10 peças</small></span>
      </button>)}
    </div>
    {selected ? <div className="gear-shop-v0515__selected">
      <div className="gear-shop-v0515__heading">
        <div><h4>{selected.name}</h4><small>Tier {selected.tier} · Nível {selected.level} · Dez peças combináveis</small>
          {permission && !permission.ok && <p role="status">{permission.message}</p>}
        </div>
        <button type="button" disabled={!permission?.ok || save.wallet.gold < cost}
          onClick={() => buySet(merchantId, selected.id)}>Comprar conjunto · {cost} Ouro</button>
      </div>
      <div className="gear-shop-v0515__items">
        {selected.itemIds.map((id) => {
          const offer = gearOfferById[id]
          const access = checkGearAccess(save, offer, merchantId)
          return <article key={id} style={{ borderLeftColor: offer.palette.trim }}>
            <AssetImage assetId={offer.assetId} alt="" aria-hidden="true" />
            <div><strong>{offer.name}</strong>
              <small>{STAT_LABELS[offer.stat]} +{offer.values[0]} · Grau 1</small>
              <small>Forja G2 +{offer.values[1]} · G3 +{offer.values[2]}</small>
              {!access.ok && <small>{access.message}</small>}
            </div>
            <button type="button" disabled={!access.ok || save.wallet.gold < offer.price}
              aria-label={'Comprar ' + offer.name + ' por ' + offer.price + ' ouro'}
              title={!access.ok ? access.message : 'Comprar peça avulsa'}
              onClick={() => buy(merchantId, [id])}>{offer.price} Ouro</button>
          </article>
        })}
      </div>
    </div> : <p>Nenhum equipamento disponível para esta seleção.</p>}
    <p className="gear-shop-v0515__note">As cinco peças vinculadas permanecem permanentes. O equipamento de comércio acrescenta revestimentos e atributos, sem remover memórias, Ressonância ou Runas.</p>
  </section>
}
