import {useState} from 'react'
import type {GameSave} from '../../domain/game/types'
import {MODULAR_FAMILIES,MODULAR_SLOTS,modularPartsV05171,type ModularFamily} from '../../content/modularWeaponsV05171'
import {useGameStore} from '../../state/gameStore'
import {AssetImage} from '../components/AssetImage'
import './modularV05171.css'

export function ModularPartsShopV05171({save}:{save:GameSave}){
 const buy=useGameStore(state=>state.purchaseModularPart)
 const boundId=save.character.bondedEquipment.weapon
 const bond=boundId?save.boundItems[boundId]:undefined
 const [family,setFamily]=useState<ModularFamily| 'all'>('all')
 const [tier,setTier]=useState(1)
 const [slot,setSlot]=useState<string>('all')
 const [search,setSearch]=useState('')
 const choices=modularPartsV05171.filter(p=>p.tier===tier&&(family==='all'||family===p.family)
  &&(slot==='all'||slot===p.partSlot)&&p.name.toLocaleLowerCase('pt-BR').includes(search.toLocaleLowerCase('pt-BR')))
 return <section className="modular-shop" aria-label="Peças estruturais de arma · Torvan">
  <header><h3>Torvan · Componentes de Vínculo</h3>
   <p>Não vendemos armas completas. Compre quatro peças, monte com Durnan e mantenha sua arma vinculada para sempre.</p>
   <small>{bond?'Seu Vínculo: '+bond.baseItemId:'Sua arma permanente ainda não foi vinculada'} · {save.wallet.gold} Ouro</small></header>
  <div className="modular-controls">
   <label>Família <select value={family} onChange={e=>setFamily(e.target.value as typeof family)}><option value="all">Todas</option>{MODULAR_FAMILIES.map(x=><option value={x} key={x}>{x}</option>)}</select></label>
   <label>Qualidade <select value={tier} onChange={e=>setTier(Number(e.target.value))}>{[1,2,3].map(x=><option value={x} key={x}>Tier {x}</option>)}</select></label>
   <label>Parte <select value={slot} onChange={e=>setSlot(e.target.value)}><option value="all">Todas</option>{MODULAR_SLOTS.map(x=><option value={x} key={x}>{x}</option>)}</select></label>
   <label>Buscar <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Material ou peça"/></label>
  </div>
  <div className="modular-shop__grid">{choices.map(p=>{
   const owned=save.inventory.filter(i=>i.definitionId===p.id).reduce((n,i)=>n+i.quantity,0)
   const affordable=save.character.level>=p.level&&save.wallet.gold>=p.price
   return <article key={p.id} className="modular-shop__item">
    <AssetImage assetId={p.assetId} alt={p.name}/>
    <div><strong>{p.name}</strong><small>{p.style} · T{p.tier} · Nível {p.level}</small>
     <small>Na Mochila: {owned}</small>
     <small>{Object.entries(p.bonuses).filter(([,n])=>n>0).map(([k,n])=>k+' +'+n).join(' · ')||'Estrutura simples'}</small></div>
    <button type="button" disabled={!affordable} onClick={()=>buy(p.id)}>
     Comprar · {p.price} Ouro
    </button>
   </article>
  })}</div>
  <p>Peças de Tier IV–V são encontradas na exploração. Joias mágicas dependem do Grau III do Vínculo.</p>
 </section>
}
