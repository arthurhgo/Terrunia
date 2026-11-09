import type { ContentCatalog } from '../../content/catalog'
import { CLAN_SPELL_OPTIONS, HISTORICAL_CLAN_SPELLS } from '../../content/clanSpells'
import type { GameSave } from '../game/types'
import { fail, ok, type Result } from '../shared/types'

export const ROSETTA_CLAN_QUEST = 'main_rosetta_clan_guidance_v05141'
/** Data-driven, explainable guidance; no hidden affinity multipliers. */
export function getClanRecommendations(save:GameSave,catalog:ContentCatalog) {
  const instanceId=save.character.bondedEquipment.weapon
  const weapon=instanceId ? catalog.boundItemBases[save.boundItems[instanceId]?.baseItemId] : undefined
  const magic=weapon?.powerType==='magical'
  return Object.values(catalog.clans).map(clan=>{
    const bonus=clan.bonuses
    const reasons=[
      magic&&bonus.magicalAttack?`+${bonus.magicalAttack} ataque mágico`:'',
      !magic&&bonus.physicalAttack?`+${bonus.physicalAttack} ataque físico`:'',
      bonus.mitigation?`+${bonus.mitigation} defesa`:'',
      bonus.maxHp?`+${bonus.maxHp} Vida`:'',
      bonus.mana?`+${bonus.mana} Mana`:'',
    ].filter(Boolean)
    const score=(magic?(bonus.magicalAttack??0)*3:(bonus.physicalAttack??0)*3)+
      (bonus.mitigation??0)+(bonus.maxHp??0)/4+(bonus.mana??0)/4
    return {clanId:clan.id,name:clan.name,weaponName:weapon?.name??'Vínculo inicial',
      score,explanation:reasons.length?reasons.join(' · '):clan.philosophy,philosophy:clan.philosophy}
  }).sort((a,b)=>b.score-a.score||a.clanId.localeCompare(b.clanId))
}
export function chooseClanCandidate(save:GameSave,clanId:string,catalog:ContentCatalog,now:string):Result<GameSave>{
  if(!catalog.clans[clanId])return fail('UNKNOWN_CLAN','Clã desconhecido.')
  if(save.character.clan.clanId)return fail('CLAN_ALREADY_JOINED','O Terrírian só pode pertencer a um Clã.')
  if(save.character.level<4||save.quests[ROSETTA_CLAN_QUEST]?.status!=='completed')
    return fail('CLAN_GUIDANCE_REQUIRED','Conclua Os Quatro Caminhos com Rosetta a partir do nível 4.')
  if(save.world.currentLocationId!=='location_terran_clan_hall')return fail('CLAN_HALL_REQUIRED','Escolha o caminho no Salão dos Clãs.')
  if(save.character.clan.candidateClanId&&save.character.clan.candidateClanId!==clanId)
    return fail('CLAN_CANDIDACY_LOCKED','Candidatura atual já iniciada; troca é OWNER_DECISION.')
  if(save.character.clan.candidateClanId===clanId)return ok(save)
  const next=structuredClone(save);next.character.clan.candidateClanId=clanId
  if(!next.character.clan.knownClanIds.includes(clanId))next.character.clan.knownClanIds.push(clanId)
  next.revision++;next.updatedAt=now;next.eventLog.push(`ClanCandidacyChosen:${clanId}`)
  return ok(next)
}
export function chooseInitialClanSpell(save:GameSave,skillId:string,catalog:ContentCatalog,now:string):Result<GameSave>{
  const clanId=save.character.clan.clanId
  if(!clanId)return fail('CLAN_REQUIRED','Confirme primeiro seu único Clã.')
  if(!CLAN_SPELL_OPTIONS[clanId]?.includes(skillId))return fail('SKILL_WRONG_CLAN','Magia de outro Clã.')
  if(!catalog.combatSkills[skillId])return fail('UNKNOWN_SKILL','Magia não cadastrada.')
  // Undefined on legacy saves means the historical starting spell is already owned.
  if(save.character.clan.selectedClanSkillId!==null)
    return fail('CLAN_SPELL_ALREADY_CHOSEN','Uma primeira magia já foi escolhida.')
  const next=structuredClone(save);next.character.clan.selectedClanSkillId=skillId
  next.revision++;next.updatedAt=now;next.eventLog.push(`ClanSpellChosen:${clanId}:${skillId}`)
  return ok(next)
}
export function activeClanSpellId(save:GameSave):string|null{
  const clan=save.character.clan
  if(!clan.clanId||clan.selectedClanSkillId===null)return null
  const id=clan.selectedClanSkillId??HISTORICAL_CLAN_SPELLS[clan.clanId]
  return id&&CLAN_SPELL_OPTIONS[clan.clanId]?.includes(id)?id:null
}
