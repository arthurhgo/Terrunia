import { describe,expect,it } from 'vitest'
import { content } from '../../content/catalog'
import { createNewSave } from '../game/createSave'
import { acceptQuest,applyQuestEvent,offerQuest,refreshQuestAvailability,turnInQuest } from '../quests/questEngine'
import { chooseClanCandidate,chooseInitialClanSpell,getClanRecommendations,ROSETTA_CLAN_QUEST } from './clanOrientation'
import { startClanTrialWave,claimClanTrialWave } from './clanTrials'
import { joinClan } from './progressionEngine'
import { CLAN_TRIALS,CLAN_TRIAL_WAVE_COUNT } from '../../content/clanTrials'
const now='2026-11-09T17:00:00Z'

describe('v0.5.14.1: ingresso, ondas e magia exclusiva',()=>{
  it('Rosetta só oferece Os Quatro Caminhos no nível quatro',()=>{
    let s=createNewSave('clan-user','Nara','character.terririan.default',content,now)
    expect(s.quests[ROSETTA_CLAN_QUEST].status).toBe('locked')
    s.character.level=3
    expect(refreshQuestAvailability(s,content,now).quests[ROSETTA_CLAN_QUEST].status).toBe('locked')
    s.character.level=4
    s.world.currentLocationId='location_terran_portal_plaza' // Rosetta must actually be present.
    s=refreshQuestAvailability(s,content,now)
    expect(s.quests[ROSETTA_CLAN_QUEST].status).toBe('available')
    const offered=offerQuest(s,ROSETTA_CLAN_QUEST,content,now)
    expect(offered.ok).toBe(true)
    if(!offered.ok)return
    expect(acceptQuest(offered.value,ROSETTA_CLAN_QUEST,content,now).ok).toBe(true)
    const wrongLevel=structuredClone(offered.value)
    wrongLevel.character.level=3
    expect(acceptQuest(wrongLevel,ROSETTA_CLAN_QUEST,content,now))
      .toMatchObject({ok:false,code:'ROSETTA_CLAN_LEVEL_GATE'})
  })
  it('requer candidatura e conclui a prova por 3 vitórias únicas, nunca por diálogo',()=>{
    let s=createNewSave('clan-user','Nara','character.terririan.default',content,now)
    s.character.level=4;s.quests[ROSETTA_CLAN_QUEST].status='completed'
    s.world.currentLocationId='location_terran_clan_hall'
    expect(startClanTrialWave(s,'clan_dunavar_01',content,now)).toMatchObject({ok:false,code:'CLAN_CANDIDACY_REQUIRED'})
    const candidate=chooseClanCandidate(s,'dunavar',content,now)
    expect(candidate.ok).toBe(true)
    if(!candidate.ok)return
    s=refreshQuestAvailability(candidate.value,content,now)
    expect(chooseClanCandidate(s,'rustal',content,now)).toMatchObject({ok:false,code:'CLAN_CANDIDACY_LOCKED'})
    const offered=offerQuest(s,'clan_dunavar_01',content,now)
    expect(offered.ok).toBe(true)
    if(!offered.ok)return
    const accepted=acceptQuest(offered.value,'clan_dunavar_01',content,now)
    expect(accepted.ok).toBe(true)
    if(!accepted.ok)return
    s=accepted.value
    for(let wave=1;wave<=CLAN_TRIAL_WAVE_COUNT;wave++){
      const started=startClanTrialWave(s,'clan_dunavar_01',content,now)
      expect(started.ok).toBe(true)
      if(!started.ok)return
      const run=started.value.clanTrialRun!
      expect(run.waveIndex).toBe(wave)
      expect(run.activeEncounterId).toBe(`encounter_clan_dunavar_01_wave_${wave}`)
      const cleared=claimClanTrialWave(started.value,'clan_dunavar_01',run.runId,run.activeEncounterId!,now)
      expect(cleared.ok).toBe(true)
      if(!cleared.ok)return
      expect(claimClanTrialWave(started.value,'clan_dunavar_01',run.runId,run.activeEncounterId!,now).ok).toBe(true)
      expect(claimClanTrialWave(cleared.value,'clan_dunavar_01',run.runId,run.activeEncounterId!,now))
        .toMatchObject({ok:false,code:'CLAN_WAVE_DUPLICATE'})
      s=cleared.value
    }
    expect(s.clanTrialRun?.phase).toBe('won')
    const event=applyQuestEvent(s,{type:'completeRite',targetId:'clan_dunavar_01'},content,now)
    expect(event.quests.clan_dunavar_01.status).toBe('ready_to_turn_in')
    const delivered=turnInQuest(event,'clan_dunavar_01','npc_mireya_dunavar',content,now)
    expect(delivered.ok).toBe(true)
    expect(CLAN_TRIALS).toHaveLength(4)
    expect(content.encounters.encounter_clan_dunavar_01_wave_1.enemyDefinitionIds).toHaveLength(2)
  })
  it('filiação única preserva opções de magia e proíbe aprender uma de outro Clã',()=>{
    let s=createNewSave('clan-user','Nara','character.terririan.default',content,now)
    s.character.level=4
    s.quests[ROSETTA_CLAN_QUEST].status='completed'
    s.character.clan.candidateClanId='dunavar'
    for(const id of content.clans.dunavar.recruitmentQuestIds)s.quests[id].status='completed'
    s.character.clan.eligibleClanIds.push('dunavar')
    expect(joinClan(s,'rustal',content,now)).toMatchObject({ok:false})
    const joined=joinClan(s,'dunavar',content,now)
    expect(joined.ok).toBe(true)
    if(!joined.ok)return
    expect(joined.value.character.clan.selectedClanSkillId).toBeNull()
    expect(joinClan(joined.value,'rustal',content,now)).toMatchObject({ok:false,code:'CLAN_ALREADY_JOINED'})
    expect(chooseInitialClanSpell(joined.value,'skill_clan_rustal_glyph',content,now))
      .toMatchObject({ok:false,code:'SKILL_WRONG_CLAN'})
    const spell=chooseInitialClanSpell(joined.value,'skill_clan_dunavar_aegis',content,now)
    expect(spell.ok).toBe(true)
    if(!spell.ok)return
    expect(spell.value.character.clan.selectedClanSkillId).toBe('skill_clan_dunavar_aegis')
    expect(chooseInitialClanSpell(spell.value,'skill_clan_dunavar_guard',content,now))
      .toMatchObject({ok:false,code:'CLAN_SPELL_ALREADY_CHOSEN'})
  })
  it('recomenda os quatro Clãs em ordem explicável sem impor afinidade de arma',()=>{
    const s=createNewSave('clan-user','Nara','character.terririan.default',content,now)
    const result=getClanRecommendations(s,content)
    expect(result).toHaveLength(4)
    expect(result.every(item=>item.philosophy.length>0)).toBe(true)
    expect(result.map(c=>c.score)).toEqual([...result.map(c=>c.score)].sort((a,b)=>b-a))
  })
})
