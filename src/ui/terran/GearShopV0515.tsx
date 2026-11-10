import { useState } from 'react'
import type { GameSave } from '../../domain/game/types'
import { equipmentSetsV0515, gearOfferById } from '../../content/equipmentV0515'
import { classDefinitions } from '../../content/progression'
import { checkGearAccess, getSetPrice } from '../../domain/inventory/equipmentV0515'
import { useGameStore } from '../../state/gameStore'
import { AssetImage } from '../components/AssetImage'
import './gearShopV0515.css'

const STAT_LABELS={maxHp:'Vida',maxMp:'Mana',attackPower:'Ataque',mitigation:'Proteção',initiative:'Iniciativa'}
type Props={save:GameSave;channel:'PUBLIC_TERRAN'|'CASTLE'}
/** All 140 sets share one reusable, filtered, individual-or-full-kit shop. */
export function GearShopV0515({save,channel}:Props){
 const buy=useGameStore(state=>state.buyGear)
 const buySet=useGameStore(state=>state.buyGearSet)
 const [tier,setTier]=useState<number>(1)
 const [classFilter,setClassFilter]=useState<string>('all')
 const [line,setLine]=useState<'all'|'clan'|'class'>('all')
 const [selectedId,setSelectedId]=useState<string|null>(null)
 const castle=channel==='CASTLE'
 const sets=equipmentSetsV0515.filter(set=>
  (castle?set.channel!=='PUBLIC_TERRAN'&&set.castleId===save.world.currentLocationId:
   set.channel==='PUBLIC_TERRAN')&&set.tier===tier&&
  (classFilter==='all'||set.classId===classFilter||set.recommendedClassId===classFilter)&&
  (!castle||line==='all'||(line==='clan'?set.channel==='CLAN_EXCLUSIVE':set.channel==='CLASS_EXCLUSIVE')))
 const selected=sets.find(set=>set.id===selectedId)??sets[0]
 const cost=selected?getSetPrice(selected.id):0
 const setPermission=selected?checkGearAccess(save,gearOfferById[selected.itemIds[0]]):null
 const classOptions=classDefinitions.filter(cls=>!castle||cls.clanId===save.character.clan.clanId)
 return <section className="gear-shop-v0515" aria-label={castle?'Arsenal exclusivo do Castelo':'Mercador de equipamentos de Terran'}>
  <header><h3>{castle?'Arsenal exclusivo do Clã':'Equipamentos · Neris'}</h3>
   <p>{castle?'Kits de Clã e Classe somente no castelo correto.':'Cinco kits comerciais por Classe; compra livre, sem exigir filiação.'}
    {' '}Todas as peças são vendidas no Grau 1; Durnan aprimora para G2–G3.</p>
   <strong>Ouro: {save.wallet.gold.toLocaleString('pt-BR')}</strong></header>
  <div className="gear-shop-v0515__filters">
   <label>Tier <select aria-label="Filtrar tier de equipamento" value={tier} onChange={e=>{setTier(Number(e.target.value));setSelectedId(null)}}>
    {[1,2,3,4,5].map(n=><option key={n} value={n}>Tier {n} · Nv {1+(n-1)*3}</option>)}</select></label>
   <label>Classe <select aria-label="Filtrar coleção de classe" value={classFilter} onChange={e=>{setClassFilter(e.target.value);setSelectedId(null)}}>
    <option value="all">Todas as Classes</option>{classOptions.map(cls=><option key={cls.id} value={cls.id}>{cls.name}</option>)}</select></label>
   {castle&&<label>Linha <select aria-label="Filtrar linha exclusiva" value={line} onChange={e=>{setLine(e.target.value as typeof line);setSelectedId(null)}}>
    <option value="all">Clã e Classe</option><option value="clan">Clã</option><option value="class">Classe</option>
   </select></label>}
  </div>
  <div className="gear-shop-v0515__sets" role="group" aria-label="Conjuntos disponíveis">
   {sets.map(set=><button key={set.id} type="button" aria-pressed={selected?.id===set.id}
    className={selected?.id===set.id?'is-selected':''} onClick={()=>setSelectedId(set.id)}>
    <span className="gear-shop-v0515__swatch" style={{background:set.palette.base,borderColor:set.palette.trim}}/>
    <span><strong>{set.name}</strong><small>{set.channel==='CLAN_EXCLUSIVE'?'Clã exclusivo':set.channel==='CLASS_EXCLUSIVE'?'Classe exclusiva':'Comercial'} · 10 peças</small></span>
   </button>)}
  </div>
  {selected?<div className="gear-shop-v0515__selected">
   <div className="gear-shop-v0515__heading"><div><h4>{selected.name}</h4>
    <small>Tier {selected.tier} · Nv {selected.level} · {selected.itemIds.length} peças · cada peça comprável separadamente</small>
    {!setPermission?.ok&&<p role="status">{setPermission?.message}</p>}</div>
    <button type="button" disabled={!setPermission?.ok||save.wallet.gold<cost}
     onClick={()=>buySet(selected.id)}>Comprar kit · {cost} Ouro</button></div>
   <div className="gear-shop-v0515__items">{selected.itemIds.map(id=>{
    const offer=gearOfferById[id]
    const eligible=checkGearAccess(save,offer)
    return <article key={id} style={{borderLeftColor:offer.palette.trim}}>
     <AssetImage assetId={offer.assetId} alt="" aria-hidden="true"/>
     <div><strong>{offer.name}</strong><small>{STAT_LABELS[offer.stat]} +{offer.values[0]} · Grau 1</small>
      <small>G2 +{offer.values[1]} · G3 +{offer.values[2]} · Forja {offer.forgeG2}/{offer.forgeG3} Ouro</small></div>
     <button type="button" disabled={!eligible.ok||save.wallet.gold<offer.price}
      aria-label={'Comprar '+offer.name+' por '+offer.price+' ouro'} title={!eligible.ok?eligible.message:'Comprar peça avulsa'}
      onClick={()=>buy([id])}>{offer.price} Ouro</button>
    </article>
   })}</div>
  </div>:<p>Nenhum conjunto disponível para estes filtros.</p>}
  <p className="gear-shop-v0515__note">Peças vinculadas: o revestimento mantém o Vínculo permanente, sua Ressonância e memórias. Combinações de partes são livres, sem bônus obrigatório de conjunto. Materiais adicionais de forja: OWNER_DECISION.</p>
 </section>
}
