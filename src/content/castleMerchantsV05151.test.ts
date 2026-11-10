import { describe, expect, it } from 'vitest'
import { content } from './catalog'
import { createNewSave } from '../domain/game/createSave'
import { getInteriorResidents } from '../ui/terran/interiorLayout'
import { castleGearMerchantsV05151, castleMerchantsForInterior } from './castleMerchantsV05151'
import { getClanCastleId } from './clanCastlesV05142'
import { classDefinitions, clanDefinitions } from './progression'
import { enterClanCastle } from '../domain/progression/clanCastle'

describe('v0.5.15.1 castelos e mercadores',()=>{
  it('places one real Clan merchant in each of four separate castles',()=>{
    const save=createNewSave('owner','Teste','character.terririan.default',content)
    for(const clan of clanDefinitions){
      const id=getClanCastleId(clan.id)!
      const residents=getInteriorResidents(save,id)
      const merchants=castleMerchantsForInterior(id)
      expect(residents).toHaveLength(1)
      expect(merchants).toHaveLength(1)
      expect(residents.map(r=>r.presence.id)).toEqual(merchants.map(m=>m.id))
      expect(new Set(residents.map(r=>r.position.x+':'+r.position.y)).size).toBe(1)
      expect(merchants[0].clanId).toBe(clan.id)
    }
    expect(castleGearMerchantsV05151).toHaveLength(clanDefinitions.length)
    expect(classDefinitions).toHaveLength(12)
    expect(new Set(castleGearMerchantsV05151.map(m=>m.id)).size).toBe(4)
  })
  it('portal routes only after proper clan recruitment, never to the wrong castle',()=>{
    const save=createNewSave('owner','Teste','character.terririan.default',content)
    save.world.currentLocationId='location_terran_clan_hall'
    expect(enterClanCastle(save,save.updatedAt)).toMatchObject({ok:false,code:'CASTLE_NOT_RECRUITED'})
    save.character.clan.clanId='rustal'
    const entered=enterClanCastle(save,save.updatedAt)
    expect(entered.ok).toBe(true)
    if(entered.ok){
      expect(entered.value.world.currentLocationId).toBe('interior_clan_rustal_castle')
      expect(entered.value.world.currentLocationId).not.toBe('interior_clan_dunavar_castle')
    }
  })
})
