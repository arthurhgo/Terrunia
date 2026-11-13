import {useMemo,useState,type DragEvent} from 'react'
import type {GameSave} from '../../domain/game/types'
import {MODULAR_SLOTS,modularPartById,modularPartsV05171,type ModularSlot} from '../../content/modularWeaponsV05171'
import {buildAssemblyPreviewV05171,getCurrentBoundAssemblyV05171} from '../../domain/terran/modularAssemblyV05171'
import {content} from '../../content/catalog'
import {useGameStore} from '../../state/gameStore'
import {AssetImage} from '../components/AssetImage'
import './modularV05171.css'

const NAMES:Record<ModularSlot,string>={
 body:'1 · Corpo',handle:'2 · Empunhadura',coreHousing:'3 · Núcleo estrutural',focusMount:'4 · Encaixe da joia'
}
const STATS=[['primaryAttack','Dano'],['defense','Defesa'],['life','Vida máxima'],['mana','Mana máxima'],['initiative','Iniciativa']] as const
export function WeaponAssemblyWorkbenchV05171({save}:{save:GameSave}){
 const forge=useGameStore(state=>state.assembleBoundPart)
 const [slot,setSlot]=useState<'weapon'|'shield'>('weapon')
 const [focus,setFocus]=useState<ModularSlot>('body')
 const [selected,setSelected]=useState<string|null>(null)
 const bound=getCurrentBoundAssemblyV05171(save,slot)
 const currentFamily=bound?content.boundItemBases[bound.baseItemId]?.archetype:undefined
 const family=slot==='shield'?'shield':currentFamily
 const available=modularPartsV05171.filter(p=>p.family===family&&p.partSlot===focus&&
  save.inventory.some(i=>i.definitionId===p.id&&i.quantity>0&&!i.locked&&!i.favorite))
 const permitted=selected?available.some(p=>p.id===selected):false
 const preview=useMemo(()=>permitted&&selected?buildAssemblyPreviewV05171(save,slot,selected,content,save.updatedAt):null,
  [save,slot,selected,permitted])
 const selectedPart=selected?modularPartById[selected]:undefined
 const onDrop=(event:DragEvent<HTMLElement>,target:ModularSlot)=>{
  event.preventDefault()
  const id=event.dataTransfer.getData('application/x-terrunia-part')
  const part=modularPartById[id]
  if(part?.partSlot===target&&part.family===family){setFocus(target);setSelected(id)}
 }
 return <section className="modular-bench" aria-label="Minigame da mesa de montagem de Durnan">
  <h3>Casa do Ferreiro · Montagem de Vínculos</h3>
  <p>Quatro recipientes estruturais, como peças de montagem. Teste a prévia sem custo, confirme para instalar no Vínculo original.</p>
  <div role="group" className="modular-bench__switch" aria-label="Vínculo de montagem">
   {(['weapon','shield'] as const).map(s=><button type="button" key={s} aria-pressed={slot===s}
    onClick={()=>{setSlot(s);setSelected(null);setFocus('body')}}>{s==='weapon'?'Arma':'Escudo / Protetor'}</button>)}
  </div>
  {!bound?<p>Obtenha o Vínculo permanente deste slot para abrir a bancada.</p>:
   <div className="modular-bench__layout">
    <div className="modular-bench__trays">
     <h4>Recipientes de componentes</h4>
     <small>Selecione ou arraste uma peça para o encaixe.</small>
     {MODULAR_SLOTS.map(s=><section key={s} aria-label={NAMES[s]}>
      <button type="button" aria-pressed={focus===s} onClick={()=>{setFocus(s);setSelected(null)}}>{NAMES[s]}</button>
      {focus===s&&<div className="modular-bench__parts">
       {available.map(part=><button type="button" key={part.id} draggable
        aria-pressed={selected===part.id}
        onDragStart={e=>e.dataTransfer.setData('application/x-terrunia-part',part.id)}
        onClick={()=>setSelected(part.id)}>
        <AssetImage assetId={part.assetId} alt=""/><span>{part.name}</span>
       </button>)}
       {!available.length&&<small>Sem peças disponíveis. Visite Torvan ou explore as trilhas e ondas.</small>}
      </div>}
     </section>)}
    </div>
    <div className="modular-bench__weapon">
      <h4>Seu Vínculo · Grau {bound.grade}</h4>
      <div className="modular-bench__sprite" aria-label="Prévia da composição da arma">
       <AssetImage assetId={content.boundItemBases[bound.baseItemId].assetIdByGrade[bound.grade]??'item.weapon-core'} alt="Arma permanente"/>
       {MODULAR_SLOTS.map(s=>{
        const id=selectedPart?.partSlot===s?selectedPart.id:bound.assembly?.parts[s]
        const part=id?modularPartById[id]:undefined
        return part?<AssetImage key={s} className={'modular-bench__layer modular-bench__layer--'+s}
          assetId={part.assetId} alt={part.name}/>:null
       })}
      </div>
      <div className="modular-bench__sockets">{MODULAR_SLOTS.map(s=>{
       const partId=bound.assembly?.parts[s],part=partId?modularPartById[partId]:undefined
       return <button key={s} type="button" className={focus===s?'is-selected':''}
        aria-label={NAMES[s]+' · '+(part?.name??'Estrutura inicial')}
        onDragOver={e=>e.preventDefault()} onDrop={e=>onDrop(e,s)}
        onClick={()=>{setFocus(s);setSelected(null)}}>
        <b>{NAMES[s]}</b><small>{part?.name??'Estrutura original'}</small>
       </button>
      })}</div>
      <small>O núcleo físico não é uma Essência; o encaixe físico não é uma Joia. Essência: Grau II; Joia: Grau III.</small>
    </div>
    <div className="modular-bench__stats">
     <h4>Prévia dos atributos reais</h4>
     {preview?.ok?STATS.map(([key,label])=>{
      const before=preview.value.before[key].value,after=preview.value.after[key].value
      return <div key={key} className="modular-bench__delta"><span>{label}</span><strong>{before} → {after}</strong>
       <small>{after-before>=0?'+':''}{after-before}</small></div>
     }):<p>{preview&&!preview.ok?preview.message:'Selecione uma peça para comparar dano e proteção.'}</p>}
     <strong>Forja: {preview?.ok?preview.value.price:0} Ouro</strong>
     <button type="button" disabled={!preview?.ok||!selected}
      onClick={()=>{if(selected){forge(slot,selected,save.revision);setSelected(null)}}}>Confirmar montagem</button>
     <button type="button" onClick={()=>setSelected(null)}>Cancelar prévia</button>
    </div>
   </div>}
 </section>
}
