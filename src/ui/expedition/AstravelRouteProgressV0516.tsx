import { ASTRAVEL_SECTORS } from '../../content/astravel'
import { content } from '../../content/catalog'
import type { GameSave } from '../../domain/game/types'
/** Only persisted statuses, never inferred/unlocked encounters. */
export function AstravelRouteProgressV0516({save}:{save:GameSave}){
 const nodes=content.trails.trail_astravel_entry.nodes.filter(n=>n.index>=1&&n.index<=15)
 const completed=nodes.filter(n=>save.world.trailNodeStates[n.id]==='completed').length
 return <section className="astravel-route-progress-v0516" aria-label="Progresso dos 15 marcos">
  <strong>Astravél · {completed}/{nodes.length} marcos concluídos</strong>
  {ASTRAVEL_SECTORS.map(s=>{
   const part=nodes.filter(n=>n.index>=s.from&&n.index<=s.to)
   return <div key={s.id}><small>{s.name} · {part.filter(n=>save.world.trailNodeStates[n.id]==='completed').length}/5</small>
    <div className="astravel-route-progress-v0516__dots">{part.map(n=>{
     const status=save.world.trailNodeStates[n.id]
     const state=status==='completed'?'completed':status==='current'||status==='bossCurrent'?'current':'locked'
     return <span key={n.id} data-node-id={n.id} data-state={state} aria-label={'Marco '+n.index+': '+n.label+' — '+state} title={n.label}>{n.index}</span>
    })}</div>
   </div>
  })}
  <small>Somente status reais do save. A trilha e as exigências de NPC/Clã continuam obrigatórias.</small>
 </section>
}
