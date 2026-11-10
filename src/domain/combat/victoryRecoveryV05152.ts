import type { ContentCatalog } from '../../content/catalog'
import type { GameSave } from '../game/types'
import { deriveCharacterStats } from '../character/derivedStats'
import { fail,ok,type Result } from '../shared/types'

/**
 * Victory-only preparation, independent of the AwaitingAction combat FSM.
 * Safe before or after claiming loot, while no enemies remain alive.
 * Does not advance turns, trigger enemy AI, reset waves or grant any drops.
 */
export const canUseVictoryRecovery=(save:GameSave,instanceId:string,catalog:ContentCatalog)=>{
 const instance=save.inventory.find(item=>item.instanceId===instanceId)
 const definition=instance?catalog.items[instance.definitionId]:undefined
 return Boolean(instance && instance.quantity>0 && !instance.locked && definition &&
  !definition.questLocked && definition.category==='consumable' &&
  (definition.combatUseMode==='freeHealingPotion' ||
   (definition.combatEffects.length>0 && definition.combatEffects.every(effect=>
     effect.type==='restoreHp'||effect.type==='restoreMp'||effect.type==='cleanseHarmful'))))
}

export function applyVictoryRecovery(save:GameSave,instanceId:string,catalog:ContentCatalog,
 now:string):Result<GameSave>{
 if(save.battle?.phase!=='Victory' || Object.values(save.battle.combatants).some(c=>c.side==='enemy'&&c.alive))
  return fail('VICTORY_PREP_LOCKED','Use suprimentos de preparação somente após derrotar todos os inimigos.')
 if(!canUseVictoryRecovery(save,instanceId,catalog))
  return fail('VICTORY_ITEM_UNAVAILABLE','O item não é um consumível de recuperação disponível.')
 const entry=save.inventory.find(item=>item.instanceId===instanceId)!
 const item=catalog.items[entry.definitionId]
 const stats=deriveCharacterStats(save,catalog)
 let hp=save.vitals.hp,mp=save.vitals.mp
 let cleaned=false
 const effects=item.combatUseMode==='freeHealingPotion'
  ? [{type:'restoreHp' as const,value:Math.ceil(stats.life.value*.1)}]
  : item.combatEffects
 for(const effect of effects){
  if(effect.type==='restoreHp')hp=Math.min(stats.life.value,hp+effect.value)
  if(effect.type==='restoreMp')mp=Math.min(stats.mana.value,mp+effect.value)
  if(effect.type==='cleanseHarmful')
   cleaned=save.battle.combatants.combatant_player.statusEffects.some(status=>
    catalog.statusEffects[status.definitionId]?.tone==='harmful')
 }
 if(hp===save.vitals.hp&&mp===save.vitals.mp&&!cleaned)
  return fail('VICTORY_RECOVERY_FULL','Vida/Mana já estão completas e não há efeito prejudicial.')
 const next=structuredClone(save)
 const previous=next.inventory.find(x=>x.instanceId===instanceId)!
 if(previous.quantity>1)previous.quantity-=1
 else next.inventory.splice(next.inventory.indexOf(previous),1)
 next.vitals.hp=hp
 next.vitals.mp=mp
 const player=next.battle!.combatants.combatant_player
 player.hp=hp
 player.mp=mp
 if(cleaned)player.statusEffects=player.statusEffects.filter(status=>
  catalog.statusEffects[status.definitionId]?.tone!=='harmful')
 next.battle!.log.push({
  id:'victory-recovery-'+next.battle!.id+'-'+next.revision,
  round:next.battle!.round,
  message:`${item.name}: +${hp-save.vitals.hp} Vida, +${mp-save.vitals.mp} Mana. Preparação sem custo de turno.`,
  tone:'reward',
 })
 next.revision+=1
 next.updatedAt=now
 next.eventLog.push('VictoryRecovery:v05152:'+item.id+':'+instanceId)
 return ok(next)
}
