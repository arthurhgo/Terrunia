import { useState } from 'react'
import { Search, Coins, ShieldCheck, LayoutGrid, List } from 'lucide-react'
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
import {ModularPartsShopV05171} from './ModularPartsShopV05171'

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
  const [inspected,setInspected]=useState<string|null>(null)
  const [viewMode,setViewMode]=useState<'list'|'grid'>('list')
  const buy=useGameStore(state=>state.buyGear)
  const buyAndEquip=useGameStore(state=>state.buyAndEquipGear)
  const merchant=TERRAN_GEAR_MERCHANTS[merchantId]
  const stock=equipmentOffersV0515.filter(offer=>offer.slot!=='weapon'&&isTerranMerchantOffer(merchantId,offer))
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
  const inspectId=hovered??inspected
  const inspect=inspectId?stock.find(offer=>offer.id===inspectId):undefined
  const comparison=inspect?previewCommercialEquip(save,itemPreview(inspect),content):null

  if(merchantId==='presence_terran_weaponsmith')return <ModularPartsShopV05171 save={save}/>
  return <section className={'terran-specialist terran-specialist--'+merchant.tone}
    aria-label={'Loja do '+merchant.label}>
    <header>
      <h3>{merchant.label}</h3>
      {merchantId==='presence_terran_weaponsmith'&&<p>Armas completas foram retiradas: procure partes e materiais para montar sua arma vinculada em Durnan.</p>}
      <p>{merchant.description} Sem exigência de Clã ou Classe. Tier I · Grau 1.</p>
      <small>Escolha uma peça avulsa; não é necessário comprar um conjunto.</small>
    </header>
    <div className="terran-specialist__view" role="group" aria-label="Visualização dos equipamentos">
      <button type="button" aria-pressed={viewMode==='list'} onClick={()=>setViewMode('list')}><List size={14}/> Lista detalhada</button>
      <button type="button" aria-pressed={viewMode==='grid'} onClick={()=>setViewMode('grid')}><LayoutGrid size={14}/> Grade de sprites</button>
      <span>{save.wallet.gold} Ouro disponível</span>
    </div>
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
    <div className={'terran-specialist__offers'+(viewMode==='grid'?' terran-specialist__offers--grid':'')} aria-label="Equipamentos individuais à venda">
      {visible.map(offer=>{
        const access=checkGearAccess(save,offer,merchantId)
        const equipped=worn.some(item=>item.definitionId===offer.id)
        const owned=save.inventory.some(item=>item.definitionId===offer.id)
        const stored=save.baseStorage.some(item=>item.definitionId===offer.id)
        const profile=gearSetById[offer.setId]?.roleLabel
        const canWear=offer.slot!=='weapon'||Boolean(save.character.bondedEquipment.weapon)
        const canBuy=access.ok&&save.wallet.gold>=offer.price
        return <article key={offer.id} className="terran-specialist__offer" data-ownership={equipped?'equipped':owned?'backpack':stored?'storage':'new'}
          title={offer.name+' · '+formatGearStats(offer,1)+' · Use Detalhes para comparação completa.'}>
          <button type="button" className="terran-specialist__icon" style={{borderColor:offer.palette.trim}}
            title={'Inspecionar '+offer.name} aria-label={'Inspecionar '+offer.name}
            aria-pressed={inspected===offer.id}
            onMouseEnter={()=>setHovered(offer.id)} onMouseLeave={()=>setHovered(null)}
            onFocus={()=>setHovered(offer.id)}
            onBlur={()=>setHovered(null)}
            onClick={()=>setInspected(current=>current===offer.id?null:offer.id)}>
            <AssetImage assetId={offer.assetId} alt="" aria-hidden="true"/>
          </button>
          <div className="terran-specialist__copy"
            onMouseEnter={()=>setHovered(offer.id)} onMouseLeave={()=>setHovered(null)}>
            <strong>{offer.name}</strong>
            <small>Tier {offer.tier} · Grau 1 · {profile??'Equipamento comum'}</small>
            <span>{formatGearStats(offer,1)}</span>
            <small className="terran-specialist__state">{equipped?'Equipado':owned?'Na mochila':stored?'No baú da Base':!access.ok?access.message:'Comum · Sem Clã ou Classe'}</small>
            {(equipped||owned||stored)&&<small className="terran-specialist__duplicate">Você já possui esta peça; confirme a necessidade de outra antes da compra.</small>}
            {!canWear&&<small className="terran-specialist__blocked">Equipar requer Vínculo de Arma; é possível comprar e guardar.</small>}
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
    <aside className="terran-specialist__compare" role="region" aria-live="polite"
      aria-label={comparison ? 'Atributos: '+comparison.offer.name : 'Ajuda de comparação de equipamentos'}>
      {comparison ? <>
      <strong><ShieldCheck size={13}/> Comparar · {comparison.offer.name}</strong>
      <small>{comparison.stats.map(entry=>entry.label+' +'+entry.value).join(' · ')}</small>
      <small>Preço: {comparison.offer.price} Ouro · Saldo após compra: {save.wallet.gold-comparison.offer.price} Ouro</small>
      {!comparison.wearable&&<strong className="terran-specialist__blocked">{comparison.blockReason??'Não é possível equipar esta peça agora.'}</strong>}
      {comparison.deltas.length>0
        ? <div className="terran-specialist__deltas">{comparison.deltas.map(delta=>
            <span key={delta.key} data-trend={delta.difference>0?'positive':'negative'}>
              {delta.label}: {delta.before} → {delta.after} ({delta.difference>0?'+':''}{delta.difference})
            </span>)}</div>
        : <small>{comparison.blockReason??'Nenhum atributo derivado muda com esta peça.'}</small>}
      <small>G2: {formatGearStats(comparison.offer,2)} · G3: {formatGearStats(comparison.offer,3)}</small>
      <small>Seu equipamento vinculado permanece permanente.</small>
      </> : <small>Inspecione uma peça para comparar os efeitos reais e o Ouro necessário. O Vínculo permanente não será substituído.</small>}
    </aside>
  </section>
}
