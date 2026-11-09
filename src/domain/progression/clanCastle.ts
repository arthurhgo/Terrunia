import type { GameSave } from '../game/types'
import { fail,ok,type Result } from '../shared/types'
import { getClanCastleId } from '../../content/clanCastlesV05142'
const hall = 'location_terran_clan_hall'
/** No entrance before NPC recruitment; same-player clan exclusive access. */
export function enterClanCastle(save:GameSave,now:string):Result<GameSave>{
  if(save.battle||save.world.currentLocationId!==hall)
    return fail('CASTLE_PORTAL_LOCATION','O miniportal só pode ser usado no Salão dos Clãs.')
  const clanId=save.character.clan.clanId
  const destination=clanId?getClanCastleId(clanId):null
  if(!destination)return fail('CASTLE_NOT_RECRUITED','Entregue o Emblema de Clã ao líder para abrir o miniportal.')
  const next=structuredClone(save)
  next.world.currentLocationId=destination
  if(!next.world.unlockedLocationIds.includes(destination))next.world.unlockedLocationIds.push(destination)
  next.updatedAt=now;next.revision+=1;next.eventLog.push(`ClanCastleEntered:${clanId}`)
  return ok(next)
}
export function leaveClanCastle(save:GameSave,now:string):Result<GameSave>{
  const clanId=save.character.clan.clanId
  if(!clanId||save.world.currentLocationId!==getClanCastleId(clanId)||save.battle)
    return fail('CASTLE_NOT_INSIDE','Retorno disponível apenas dentro do próprio castelo.')
  const next=structuredClone(save)
  next.world.currentLocationId=hall
  next.updatedAt=now;next.revision+=1;next.eventLog.push(`ClanCastleExited:${clanId}`)
  return ok(next)
}
