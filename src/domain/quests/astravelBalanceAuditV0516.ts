import type {ContentCatalog} from '../../content/catalog'
/** QA_DRAFT. Pressure is a review hint, not damage or an automatic balance rule. */
export function getAstravelBalanceAuditV0516(c:ContentCatalog){
 const nodes=c.trails.trail_astravel_entry.nodes.filter(n=>n.index>=1&&n.index<=15).sort((a,b)=>a.index-b.index)
 const stages=nodes.map(n=>{
  const encounter=n.encounterId?c.encounters[n.encounterId]:undefined
  const enemies=(encounter?.enemyDefinitionIds??[]).map(id=>c.enemies[id]).filter(e=>Boolean(e))
  return {id:n.id,index:n.index,level:n.recommendedLevel??null,enemyCount:enemies.length,
   rawAttack:enemies.reduce((v,e)=>v+e.attackPower,0),enemyHp:enemies.reduce((v,e)=>v+e.maxHp,0),
   xp:encounter?.rewards.characterXp??0,gold:encounter?.rewards.gold??0,
   recoveryHp:encounter?.rewards.fieldRecovery?.hp??0,recoveryMp:encounter?.rewards.fieldRecovery?.mp??0,
   afterVictoryConsumables:(encounter?.rewards.lootDefinitionIds??[]).filter(id=>c.items[id]?.category==='consumable').length}
 })
 const flags=stages.flatMap((s,i)=>{
  const previous=stages[i-1]
  return previous&&s.rawAttack>previous.rawAttack&&s.rawAttack>=previous.rawAttack*1.5?[{id:s.id,reason:'PRESSURE_SPIKE'}]:[]
 })
 return {stages,flags,status:'QA_DRAFT' as const}
}
