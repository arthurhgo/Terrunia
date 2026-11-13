import {useState} from 'react'
import type {GameSave} from '../../domain/game/types'
import {weaponPartDefinitionsV05171} from '../../content/weaponPartsV05171'
import {useGameStore} from '../../state/gameStore'
import {AssetImage} from '../components/AssetImage'
import './weaponAssemblyWorkbenchV05171.css'

export function ModularPartShopV05171({save}:{save:GameSave}){
 const [style,setStyle]=useState('all')
 const [tier,setTier]=useState(1)
 const buy=useGameStore(s=>s.buyModularPart)
 const filtered=weaponPartDefinitionsV05171.filter(part=>part.tier===tier&&
  (style==='all'||part.recommendedStyle===style))
 return <section className="assembly-v05171 assembly-v05171__market" aria-label="Componentes de arma de Torvan">
  <h3>Torvan · Peças para o Vínculo</h3>
  <p>Armas completas não são vendidas. Selecione partes para a sua arma permanente e leve a Durnan.</p>
  <div className="assembly-v05171__filters">
   <label>Estilo recomendado <select value={style} onChange={e=>setStyle(e.target.value)} aria-label="Filtrar componentes por estilo">
    <option value="all">Todos os estilos</option><option value="mago">Magia</option>
    <option value="guerreiro">Guerreiro</option><option value="arqueiro">Arco</option><option value="defesa">Defesa</option>
   </select></label>
   <label>Tier <select value={tier} onChange={e=>setTier(Number(e.target.value))} aria-label="Filtrar Tier">
    {[1,2,3,4,5].map(n=><option value={n} key={n}>T{n}</option>)}
   </select></label>
  </div>
  <div className="assembly-v05171__market-stock">{filtered.map(part=>{
   const blocked=save.character.level<1+(part.tier-1)*3||save.wallet.gold<part.price
   const count=save.inventory.filter(x=>x.definitionId===part.id).reduce((sum,x)=>sum+x.quantity,0)
   return <article key={part.id}>
    <AssetImage assetId={part.assetId} alt=""/>
    <strong>{part.name}</strong>
    <small>{part.recommendedStyle.toLocaleUpperCase('pt-BR')} · T{part.tier} · {count} na mochila</small>
    <button type="button" disabled={blocked} onClick={()=>buy(part.id,1)}
      aria-label={'Comprar componente '+part.name+' por '+part.price+' ouro'}>
      {part.price} Ouro
    </button>
   </article>
  })}</div>
 </section>
}
