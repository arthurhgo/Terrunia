import {useMemo,useState} from 'react'
import type {DragEvent} from 'react'
import type {GameSave} from '../../domain/game/types'
import {content} from '../../content/catalog'
import {weaponPartDefinitionsV05171,weaponPartByIdV05171,MODULAR_SLOTS_V05171,
 type ModularSlotV05171,type WeaponPartDefinitionV05171} from '../../content/weaponPartsV05171'
import {getAssemblyPartsV05171,previewAssemblyV05171,deriveAssemblyBonusesV05171}
 from '../../domain/bond/weaponAssemblyV05171'
import {useGameStore} from '../../state/gameStore'
import {AssetImage} from '../components/AssetImage'
import './weaponAssemblyWorkbenchV05171.css'
const slotNames:Record<ModularSlotV05171,string>={
 body:'Corpo',handle:'Empunhadura',coreHousing:'Recipiente do Núcleo',focusMount:'Encaixe de Joia'
}
const statNames:Record<string,string>={
 attack:'Ataque',guard:'ESC',arcane:'ARC',initiative:'Iniciativa',
 parry:'Aparar',dodge:'Esquiva',block:'Bloqueio',shieldStrike:'Impacto do Escudo'
}
export function WeaponAssemblyWorkbenchV05171({save}:{save:GameSave}){
 const [bondSlot,setBondSlot]=useState<'weapon'|'shield'>('weapon')
 const [selected,setSelected]=useState<string|null>(null)
 const [filter,setFilter]=useState<ModularSlotV05171|'all'>('all')
 const commit=useGameStore(s=>s.assembleBoundModule)
 const inspect=useGameStore(s=>s.inspectModularBench)
 const boundId=save.character.bondedEquipment[bondSlot]
 const bound=boundId?save.boundItems[boundId]:null
 const base=bound?content.boundItemBases[bound.baseItemId]:undefined
 const family=bondSlot==='shield'?'shield':base?.archetype
 const owned=useMemo(()=>weaponPartDefinitionsV05171.filter(part=>
  part.family===family&&(filter==='all'||part.slot===filter)&&
  save.inventory.some(entry=>entry.definitionId===part.id&&entry.quantity>0)),
 [family,filter,save.inventory])
 const chosen=selected?weaponPartByIdV05171[selected]:undefined
 const preview=boundId&&chosen?previewAssemblyV05171(save,boundId,chosen.id,content):null
 const active=getAssemblyPartsV05171(bound)
 const current=deriveAssemblyBonusesV05171(bound)
 const projected=preview?.ok?preview.value.after:current
 const rows=(Object.keys(current) as (keyof typeof current)[]).filter(key=>projected[key]!==0||current[key]!==0)
 function pick(part:WeaponPartDefinitionV05171){setSelected(part.id)}
 function drop(event:DragEvent<HTMLButtonElement>,slot:ModularSlotV05171){
  event.preventDefault()
  const id=event.dataTransfer.getData('text/plain')
  const part=weaponPartByIdV05171[id]
  if(part?.slot===slot&&part.family===family)pick(part)
 }
 return <section className="assembly-v05171" aria-label="Mesa modular de Durnan">
  <header className="assembly-v05171__header">
   <div><h3>Mesa de Montagem · Vínculo Permanente</h3>
    <p>Quatro partes estruturais. Essências e joias mágicas obedecem aos Graus II e III.</p></div>
   <div role="group" aria-label="Selecionar Vínculo">
    <button type="button" aria-pressed={bondSlot==='weapon'} onClick={()=>{setBondSlot('weapon');setSelected(null)}}>Arma</button>
    <button type="button" aria-pressed={bondSlot==='shield'} onClick={()=>{setBondSlot('shield');setSelected(null)}}>Escudo / Protetor</button>
   </div>
  </header>
  {!boundId||!bound||!base?<p role="note">Este Vínculo ainda não foi adquirido. Nenhuma arma será substituída.</p>:
  <div className="assembly-v05171__layout">
   <aside aria-label="Recipientes de componentes" className="assembly-v05171__tray">
    <label>Recipiente
     <select aria-label="Filtrar peças por encaixe" value={filter} onChange={e=>setFilter(e.target.value as typeof filter)}>
      <option value="all">Todas as partes</option>
      {MODULAR_SLOTS_V05171.map(slot=><option key={slot} value={slot}>{slotNames[slot]}</option>)}
     </select>
    </label>
    <div className="assembly-v05171__stock">
     {owned.map(part=><button key={part.id} type="button"
      draggable onDragStart={e=>e.dataTransfer.setData('text/plain',part.id)}
      aria-pressed={selected===part.id} aria-label={'Selecionar '+part.name}
      onClick={()=>pick(part)}>
      <AssetImage assetId={part.assetId} alt=""/>
      <span><strong>{part.name}</strong><small>{slotNames[part.slot]} · T{part.tier} · {statNames[part.bonus]}</small></span>
     </button>)}
     {!owned.length&&<small>Nenhuma parte encontrada nesta categoria. Adquira partes com Torvan ou nas trilhas e ondas.</small>}
    </div>
   </aside>
   <div className="assembly-v05171__table" aria-label="Vínculo composto em quatro partes">
    <h4>{base.name} · Grau {bound.grade}</h4>
    <button type="button" onClick={()=>inspect('slots')}>INSPECIONAR ENCAIXES</button>
    <div className="assembly-v05171__layers" role="img" aria-label={'Montagem de '+base.name}>
     {active.map(({slot,definition})=>definition?
      <AssetImage key={slot} assetId={definition.assetId} alt="" />:null)}
    </div>
    <div className="assembly-v05171__sockets">
     {active.map(({slot,definition})=><button type="button" key={slot}
      className="assembly-v05171__socket" onDragOver={e=>e.preventDefault()}
      onDrop={e=>drop(e,slot)} aria-label={'Encaixe '+slotNames[slot]+': '+(definition?.name??'vazio')}
      onClick={()=>setFilter(slot)}>
      {definition?<AssetImage assetId={definition.assetId} alt=""/>:<span aria-hidden="true">+</span>}
      <span>{slotNames[slot]}</span><small>{definition?.name??'Vazio · clique ou arraste'}</small>
     </button>)}
    </div>
   </div>
   <aside className="assembly-v05171__preview" aria-label="Comparação de atributos da montagem">
    <h4>Resultado projetado</h4>
    <button type="button" disabled={!bound.assembly?.revision} onClick={()=>inspect('stats')}>VER ALTERAÇÕES NO STATUS</button>
    <p>{base.name} · ID original preservado</p>
    <div className="assembly-v05171__stats">
     {rows.length?rows.map(key=><span key={key}>{statNames[key]}: {current[key]} → {projected[key]}
      {projected[key]!==current[key]?' (+'+(projected[key]-current[key])+')':''}</span>):
      <span>Sem bônus estruturais instalados.</span>}
    </div>
    <p><strong>Peça selecionada:</strong> {chosen?.name??'Nenhuma'}</p>
    {preview?.ok&&<p>{preview.value.price} Ouro de forja · T{preview.value.part.tier} · {statNames[preview.value.part.bonus]}</p>}
    {preview&&!preview.ok&&<p role="note" className="assembly-v05171__warning">{preview.message}</p>}
    <button type="button" disabled={!preview?.ok} onClick={()=>{
      if(boundId&&chosen)commit(boundId,chosen.id)
      setSelected(null)
    }}>CONFIRMAR MONTAGEM</button>
    <button type="button" onClick={()=>{setSelected(null);setFilter('all')}}>CANCELAR RASCUNHO</button>
    <small>Partes substituídas são preservadas como histórico do Vínculo, sem reembolso automático. Os bônus só entram no próximo combate após confirmar.</small>
   </aside>
  </div>}
 </section>
}
