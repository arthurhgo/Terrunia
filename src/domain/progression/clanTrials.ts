import { CLAN_TRIALS, CLAN_TRIAL_WAVE_COUNT, clanTrialEncounterId } from '../../content/clanTrials'
import type { ContentCatalog } from '../../content/catalog'
import type { GameSave } from '../game/types'
import { fail,ok,type Result } from '../shared/types'

export function startClanTrialWave(save:GameSave,questId:string,catalog:ContentCatalog,now:string):Result<GameSave>{
  const clan=CLAN_TRIALS.find(c=>c.q.some(id=>id===questId))
  if(!clan)return fail('UNKNOWN_TRIAL','Prova de Clã desconhecida.')
  if(save.battle||save.vitals.hp<=0)return fail('BATTLE_PENDING','Termine o encontro ou descanse na Base.')
  if(save.world.currentLocationId!=='location_terran_clan_hall')return fail('CLAN_HALL_REQUIRED','As provas começam no Salão dos Clãs.')
  if(save.character.level<4||save.character.clan.clanId||save.character.clan.candidateClanId!==clan.id)
    return fail('CLAN_CANDIDACY_REQUIRED','Escolha a candidatura no Salão dos Clãs.')
  if(save.quests[questId]?.status!=='active')return fail('CLAN_QUEST_INACTIVE','Aceite a prova com o recrutador primeiro.')
  if(save.clanTrialRun&&save.clanTrialRun.questId!==questId)return fail('CLAN_TRIAL_IN_PROGRESS','Conclua a prova atual.')
  if(save.clanTrialRun?.activeEncounterId||save.clanTrialRun?.phase==='won')
    return fail('CLAN_TRIAL_BLOCKED','Prova já iniciada ou concluída.')
  const next=structuredClone(save)
  const run=next.clanTrialRun??{
    runId:`clan_${next.saveId}_${questId}_${now}`,clanId:clan.id,questId,waveIndex:1,
    completedWaveIds:[],activeEncounterId:null,phase:'active' as const,createdAt:now,
  }
  const encounterId=clanTrialEncounterId(questId,run.waveIndex)
  if(!catalog.encounters[encounterId])return fail('CLAN_ENCOUNTER_MISSING','Onda sem encontro cadastrado.')
  run.activeEncounterId=encounterId;next.clanTrialRun=run
  next.revision++;next.updatedAt=now;next.eventLog.push(`ClanTrialWaveStarted:${run.runId}:${run.waveIndex}`)
  return ok(next)
}

export function claimClanTrialWave(save:GameSave,questId:string,runId:string,encounterId:string,now:string):Result<GameSave>{
  const run=save.clanTrialRun
  if(!run||run.runId!==runId||run.questId!==questId||run.phase!=='active'||run.activeEncounterId!==encounterId||
    clanTrialEncounterId(questId,run.waveIndex)!==encounterId||run.completedWaveIds.includes(encounterId))
    return fail('CLAN_WAVE_DUPLICATE','Esta onda não pertence à tentativa atual.')
  const next=structuredClone(save),progress=next.clanTrialRun!
  progress.completedWaveIds.push(encounterId);progress.activeEncounterId=null
  if(progress.waveIndex===CLAN_TRIAL_WAVE_COUNT)progress.phase='won'
  else progress.waveIndex+=1
  next.revision++;next.updatedAt=now;next.eventLog.push(`ClanTrialWaveWon:${runId}:${encounterId}`)
  return ok(next)
}
