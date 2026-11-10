import type { GameSave } from '../../domain/game/types'
import { gearOfferById, getGearGrade, gearSpriteId } from '../../content/equipmentV0515'
import { getWornGear } from '../../domain/inventory/equipmentV0515'
import { useGameStore } from '../../state/gameStore'
import { AssetImage } from '../components/AssetImage'

export function GearForgeV0515({save}:{save:GameSave}){
 const refine=useGameStore(state=>state.refineGear)
 const equipped=getWornGear(save)
 const options=[...save.inventory,...equipped].filter(item=>gearOfferById[item.definitionId])
 if(!options.length)return null
 return <section className="forge-starter" aria-label="Aprimorar equipamentos v0.5.15">
  <h3>Forja de Equipamentos · Grau 1 a 3</h3>
  <p>Grau 1: cintilante. Grau 2: brilho metálico. Grau 3: nova tonalidade e reflexos. O Tier não muda. Os Vínculos G1–G7 são independentes.</p>
  {options.map(item=>{
   const offer=gearOfferById[item.definitionId],grade=getGearGrade(item.refinementLevel)
   const price=grade===1?offer.forgeG2:grade===2?offer.forgeG3:0
   const eligible=grade<3&&!item.locked&&!item.favorite&&save.wallet.gold>=price&&!save.battle
   return <article key={item.instanceId} className="forge-recipe">
    <AssetImage assetId={gearSpriteId(offer,grade)} alt=""/>
    <div><h3>{offer.name} · T{offer.tier} G{grade}</h3>
     <small>{offer.stat} +{offer.values[grade-1]}{grade<3?' → +'+offer.values[Math.min(2,grade)]:''}</small>
     <small>{item.locked||item.favorite?'Peça protegida. Desproteja para forjar.':
      grade===3?'Grau máximo alcançado':price+' Ouro · materiais adicionais: OWNER_DECISION'}</small></div>
    <button type="button" disabled={!eligible}
     onClick={()=>refine(item.instanceId)} aria-label={'Forjar '+offer.name+' até Grau '+(grade+1)}>
      {grade===3?'G3 máximo': 'Forjar G'+(grade+1)+' · '+price+' Ouro'}
    </button>
   </article>
  })}
 </section>
}
