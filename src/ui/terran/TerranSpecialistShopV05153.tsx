import { useState } from 'react'
import { Search, Coins, ShieldCheck } from 'lucide-react'
import type { GameSave, InventoryItemInstance } from '../../domain/game/types'
import { equipmentOffersV0515, gearSetById, formatGearStats, type GearOffer } from '../../content/equipmentV0515'
import { GEAR_STAT_LABELS } from '../../content/equipmentProfilesV05152'
import { TERRAN_GEAR_MERCHANTS, isTerranMerchantOffer, type TerranGearMerchantId } from '../../content/terranGearMerchantsV05153'
import { checkGearAccess, getWornGear } from '../../domain/inventory/equipmentV0515'
import { previewCommercialEquip } from '../../domain/character/commercialGearPreviewV05152'
import { content } from '../../content/catalog'
import { useGameStore } from '../../state/gameStore'
import { AssetImage } from '../components/AssetImage'
import './terranSpecialistShopV05153.css'

type Stat = keyof typeof GEAR_STAT_LABELS
const statOptions = Object.entries(GEAR_STAT_LABELS) as [Stat,string][]

const itemPreview=(offer:GearOffer):InventoryItemInstance=>({
  instanceId:'preview_'+offer.id,definitionId:offer.id,quantity:1,
  rarity:'common',locked:false,favorite:false,acquiredAt:'2026-01-01T00:00:00.000Z',
  refinementLevel:0,
})

/** Only the authorized merchant's own items appear. No Clan/Class stock or kit grid. */
export function TerranSpecialistShopV05153({save,merchantId}:{save:GameSave;merchantId:TerranGearMerchantId}){
  const [query,setQuery]=useState('')
  const [slot,setSlot]=useState('all')
  const [stat,setStat]=useState<Stat|'all'>('all')
  const [sort,setSort]=useState('catalog')
  const [hovered,setHovered]=useState<string|null>(null)
  const buy=useGameStore(state=>state.buyGear)
  const buyAndEquip=useGameStore(state=>state.buyAndEquipGear)
  const merchant=TERRAN_GEAR_MERCHANTS[merchantId]
  const stock=equipmentOffersV0515.filter(offer=>isTerranMerchantOffer(merchantId,offer))
  const visible=stock.filter(offer=>
    (slot==='all'||offer.slot===slot) &&
    (stat==='all'||offer.stat===stat||offer.secondaryStat===stat) &&
    (query.trim()==='' ||
      (offer.name+' '+(gearSetById[offer.setId]?.roleLabel??'')+' '+
        formatGearStats(offer,1)).toLocaleLowerCase('pt-BR').includes(query.toLocaleLowerCase('pt-BR').trim()))
  ).sort((a,b)=>sort==='price-asc'?a.price-b.price || a.name.localeCompare(b.name,'pt-BR'):
    sort==='price-desc'?b.price-a.price || a.name.localeCompare(b.name,'pt-BR'):
    sort==='name'?a.name.localeCompare(b.name,'pt-BR'):0)
  const worn=getWornGear(save)
  const inspect=hovered?stock.find(offer=>offer.id===hovered):undefined
  const comparison=inspect?previewCommercialEquip(save,itemPreview(inspect),content):null

  return <section className={'terran-specialist terran-specialist--'+merchant.tone}
    aria-label={'Loja do '+merchant.label}>
    <header>
      <h3>{merchant.label}</h3>
      <p>{merchant.description} Sem exigência de Clã ou Classe. Tier I · Grau 1.</p>
      <small>Escolha uma peça avulsa; não é necessário comprar um conjunto.</small>
    </header>
    <div className="terran-specialist__filters">
      <label><Search size={13} /> Buscar
        <input type="search" aria-label="Buscar equipamentos pelo nome ou atributos"
          placeholder="Buscar item ou função" value={query} onChange={e=>setQuery(e.target.value)}/>
      </label>
      <label>Peça
        <select aria-label="Filtrar slot de equipamento" value={slot}
          onChange={e=>setSlot(e.target.value)}>
          <option value="all">Todas as peças</option>
          {merchant.slots.map(key=><option key={key} value={key}>{({
            weapon:'Arma',armor:'Armadura',shield:'Protetor',helmet:'Capacete',
            pants:'Calças',boots:'Botas',necklace:'Colar',bracelet:'Pulseira',
            accessoryA:'Acessório I',accessoryB:'Acessório II',
          } as Record<string,string>)[key]}</option>)}
        </select>
      </label>
      <label>Atributo
        <select aria-label="Filtrar bônus de equipamento" value={stat} onChange={e=>setStat(e.target.value as Stat|'all')}>
          <option value="all">Todos os bônus</option>
          {statOptions.map(([id,label])=><option key={id} value={id}>{label}</option>)}
        </select>
      </label>
      <label>Ordenar
        <select aria-label="Ordenar equipamentos" value={sort} onChange={e=>setSort(e.target.value)}>
          <option value="catalog">Ordem original</option>
          <option value="price-asc">Menor preço</option>
          <option value="price-desc">Maior preço</option>
          <option value="name">Nome A–Z</option>
        </select>
      </label>
    </div>
    <div className="terran-specialist__count" aria-live="polite">
      {visible.length} {visible.length===1?'item':'itens'} · {stock.length} disponíveis no catálogo
    </div>
    <div className="terran-specialist__offers" aria-label="Equipamentos individuais à venda">
      {visible.map(offer=>{
        const access=checkGearAccess(save,offer,merchantId)
        const equipped=worn.some(item=>item.definitionId===offer.id)
        const owned=save.inventory.some(item=>item.definitionId===offer.id)
        const profile=gearSetById[offer.setId]?.roleLabel
        const canWear=offer.slot!=='weapon'||Boolean(save.character.bondedEquipment.weapon)
        const canBuy=access.ok&&save.wallet.gold>=offer.price
        return <article key={offer.id} className="terran-specialist__offer"
          onMouseEnter={()=>setHovered(offer.id)}
          onMouseLeave={()=>setHovered(current=>current===offer.id?null:current)}
          onFocus={()=>setHovered(offer.id)}
          onBlur={e=>{if(!e.currentTarget.contains(e.relatedTarget))setHovered(null)}}>
          <div className="terran-specialist__icon" style={{borderColor:offer.palette.trim}}>
            <AssetImage assetId={offer.assetId} alt={offer.name}/>
          </div>
          <div className="terran-specialist__copy">
            <strong>{offer.name}</strong>
            <small>Tier {offer.tier} · Grau 1 · {profile??'Equipamento comum'}</small>
            <span>{formatGearStats(offer,1)}</span>
            <small className="terran-specialist__state">{equipped?'Equipado':owned?'Na mochila':!access.ok?access.message:'Comum · Sem Clã ou Classe'}</small>
          </div>
          <div className="terran-specialist__actions">
            <button type="button" disabled={!canBuy}
              aria-label={'Comprar '+offer.name+' por '+offer.price+' ouro'}
              title={!access.ok?access.message:!canBuy?'Ouro insuficiente':'Comprar e guardar na Mochila'}
              onClick={()=>buy(merchantId,[offer.id])}>
              {offer.price} <Coins size={13} aria-hidden="true"/>
            </button>
            <button type="button" className="terran-specialist__equip-now"
              disabled={!canBuy||!canWear}
              title={!canWear?'Adquira primeiro o Vínculo permanente deste slot.':!access.ok?access.message:'Comprar e equipar imediatamente'}
              aria-label={'Comprar e equipar '+offer.name+' por '+offer.price+' ouro'}
              onClick={()=>buyAndEquip(merchantId,offer.id)}>
              <ShieldCheck size={12} aria-hidden="true"/> Comprar e Equipar
            </button>
          </div>
        </article>
      })}
      {visible.length===0&&<p>Nenhuma peça encontrada. Ajuste a busca ou os filtros.</p>}
    </div>
    {comparison&&<aside className="terran-specialist__compare" role="tooltip" aria-label={'Atributos: '+comparison.offer.name}>
      <strong><ShieldCheck size={13}/> Comparar · {comparison.offer.name}</strong>
      <small>{comparison.stats.map(entry=>entry.label+' +'+entry.value).join(' · ')}</small>
      {comparison.deltas.length>0
        ? <small>{comparison.deltas.map(delta=>delta.label+' '+delta.before+' → '+delta.after).join(' · ')}</small>
        : <small>{comparison.blockReason??'A peça não altera atributos nesta configuração.'}</small>}
      <small>G2: {formatGearStats(comparison.offer,2)} · G3: {formatGearStats(comparison.offer,3)}</small>
      <small>Seu equipamento vinculado permanece permanente.</small>
    </aside>}
  </section>
}
