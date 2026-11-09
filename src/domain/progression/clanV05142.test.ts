import { describe, expect, it } from 'vitest'
import { content } from '../../content/catalog'
import { createNewSave } from '../game/createSave'
import { acceptQuest,applyQuestEvent,offerQuest,refreshQuestAvailability,turnInQuest } from '../quests/questEngine'
import { canCompleteQuestObjectActivity } from '../terran/questActivities'
import { canJoinClan,joinClan } from './progressionEngine'
import { createBattle } from '../combat/engine'
import { clanTableQuestId,clanGolemQuestId,GRANITE_GOLEM_ENCOUNTER_ID,GRANITE_GOLEM_ENEMY_ID,
  MAIN_CLAN_AFFILIATION_QUEST,CLAN_AFFILIATION_RITE_ID } from '../../content/clanProgressionV05142'
import { ROSETTA_CLAN_QUEST } from './clanOrientation'

const now='2026-11-09T18:00:00Z'
const hall='location_terran_clan_hall'

describe('v0.5.14.2 — NPC, objeto, filiação e Golem',()=>{
  const newCharacter=()=>createNewSave('clan-user','Nara','character.terririan.default',content,now)

  it('Rosetta entrega orientação só no Salão e libera Aceitar um Clã',()=>{
    let save=newCharacter()
    save.character.level=4
    save.world.currentLocationId='location_terran_portal_plaza'
    save=refreshQuestAvailability(save,content,now)
    const offer=offerQuest(save,ROSETTA_CLAN_QUEST,content,now)
    expect(offer.ok).toBe(true)
    if(!offer.ok)return
    const accept=acceptQuest(offer.value,ROSETTA_CLAN_QUEST,content,now)
    expect(accept.ok).toBe(true)
    if(!accept.ok)return
    expect(turnInQuest(accept.value,ROSETTA_CLAN_QUEST,'npc_rosetta',content,now).ok).toBe(false)
    save=structuredClone(accept.value)
    save.world.currentLocationId=hall
    const visited=applyQuestEvent(save,{type:'visit',targetId:hall},content,now)
    expect(visited.quests[ROSETTA_CLAN_QUEST].status).toBe('ready_to_turn_in')
    const delivered=turnInQuest(visited,ROSETTA_CLAN_QUEST,'npc_rosetta',content,now)
    expect(delivered.ok).toBe(true)
    if(!delivered.ok)return
    expect(delivered.value.quests[MAIN_CLAN_AFFILIATION_QUEST].status).toBe('available')
  })

  it('aceitar a missão com líder registra única candidatura; a mesa exige interação real',()=>{
    let save=newCharacter()
    save.character.level=4
    save.quests[ROSETTA_CLAN_QUEST].status='completed'
    save.world.currentLocationId=hall
    save=refreshQuestAvailability(save,content,now)
    const rustalId=clanTableQuestId('rustal')
    const duneId=clanTableQuestId('dunavar')
    const offered=offerQuest(save,rustalId,content,now)
    expect(offered.ok).toBe(true)
    if(!offered.ok)return
    const accepted=acceptQuest(offered.value,rustalId,content,now)
    expect(accepted.ok).toBe(true)
    if(!accepted.ok)return
    save=accepted.value
    expect(save.character.clan.candidateClanId).toBe('rustal')
    expect(offerQuest(save,duneId,content,now).ok).toBe(false)
    expect(canCompleteQuestObjectActivity(save,rustalId,'clan_initiation_table',
      ['echo_character','echo_clan','echo_class'])).toBe(true)
    expect(canCompleteQuestObjectActivity(save,rustalId,'clan_initiation_table',
      ['echo_clan','echo_character','echo_class'])).toBe(false)
    const completed=applyQuestEvent(save,{type:'interact',targetId:'clan_initiation_table'},content,now)
    expect(completed.quests[rustalId].status).toBe('ready_to_turn_in')
    const wrongNpc=turnInQuest(completed,rustalId,'npc_mireya_dunavar',content,now)
    expect(wrongNpc.ok).toBe(false)
    const proper=turnInQuest(completed,rustalId,'npc_master_rustal',content,now)
    expect(proper.ok).toBe(true)
    if(!proper.ok)return
    expect(proper.value.quests.clan_rustal_01.status).toBe('available')
    expect(canJoinClan(proper.value,'rustal',content).ok).toBe(false)
  })

  it('Golem é boss nível 7 com missão exclusiva ao Clã e combate real',()=>{
    let save=newCharacter()
    save.character.level=6
    save.character.clan.candidateClanId='rustal'
    save.character.clan.eligibleClanIds=['rustal']
    save.quests[ROSETTA_CLAN_QUEST].status='completed'
    for(const id of content.clans.rustal.recruitmentQuestIds)save.quests[id].status='completed'
    const joined=joinClan(save,'rustal',content,now)
    expect(joined.ok).toBe(true)
    if(!joined.ok)return
    save=refreshQuestAvailability(joined.value,content,now)
    const id=clanGolemQuestId('rustal')
    expect(save.quests[id].status).toBe('locked')
    save.character.level=7
    save.world.currentLocationId=hall
    save=refreshQuestAvailability(save,content,now)
    expect(save.quests[id].status).toBe('available')
    expect(save.quests[clanGolemQuestId('dunavar')].status).toBe('locked')
    const offer=offerQuest(save,id,content,now)
    expect(offer.ok).toBe(true)
    if(!offer.ok)return
    const accept=acceptQuest(offer.value,id,content,now)
    expect(accept.ok).toBe(true)
    if(!accept.ok)return
    const encounter=content.encounters[GRANITE_GOLEM_ENCOUNTER_ID]
    expect(encounter.enemyDefinitionIds).toEqual([GRANITE_GOLEM_ENEMY_ID])
    const battle=createBattle(accept.value,encounter,content,undefined,{manualInitiative:true})
    expect(battle.phase).toBe('AwaitingInitiative')
    expect(Object.values(battle.combatants).find(actor=>actor.definitionId===GRANITE_GOLEM_ENEMY_ID)?.maxHp).toBeGreaterThan(50)
    expect(accept.value.quests[id].status).toBe('active')
    const killed=applyQuestEvent(accept.value,{type:'kill',targetId:GRANITE_GOLEM_ENEMY_ID},content,now)
    expect(killed.quests[id].status).toBe('ready_to_turn_in')
    const done=turnInQuest(killed,id,'npc_master_rustal',content,now)
    expect(done.ok).toBe(true)
    if(done.ok)expect(done.value.quests[id].status).toBe('completed')
  })

  it('marcador da campanha Aceitar um Clã encerra após o rito, sem pontos de Essência diretos',()=>{
    let save=newCharacter()
    save.character.level=4
    save.character.clan.candidateClanId='dunavar'
    save.character.clan.eligibleClanIds=['dunavar']
    save.quests[ROSETTA_CLAN_QUEST].status='completed'
    for(const id of content.clans.dunavar.recruitmentQuestIds)save.quests[id].status='completed'
    save=refreshQuestAvailability(save,content,now)
    const offered=offerQuest(save,MAIN_CLAN_AFFILIATION_QUEST,content,now)
    expect(offered.ok).toBe(true)
    if(!offered.ok)return
    const accepted=acceptQuest(offered.value,MAIN_CLAN_AFFILIATION_QUEST,content,now)
    expect(accepted.ok).toBe(true)
    if(!accepted.ok)return
    const joined=joinClan(accepted.value,'dunavar',content,now)
    expect(joined.ok).toBe(true)
    if(!joined.ok)return
    const ready=applyQuestEvent(joined.value,{type:'completeRite',targetId:CLAN_AFFILIATION_RITE_ID},content,now)
    const delivered=turnInQuest(ready,MAIN_CLAN_AFFILIATION_QUEST,'npc_curador_nexo',content,now)
    expect(delivered.ok).toBe(true)
    if(delivered.ok)expect(delivered.value.quests[MAIN_CLAN_AFFILIATION_QUEST].status).toBe('completed')
  })
})
