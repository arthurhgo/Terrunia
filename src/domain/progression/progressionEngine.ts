import type { ContentCatalog } from '../../content/catalog'
import type { GameSave } from '../game/types'
import { fail, ok, type Result } from '../shared/types'
import { refreshQuestAvailability } from '../quests/questEngine'

const stamp = (save: GameSave, now: string, event: string) => {
  save.updatedAt = now
  save.revision += 1
  save.eventLog.push(event)
}

export const discoverClan = (
  save: GameSave,
  clanId: string,
  catalog: ContentCatalog,
  now: string,
): Result<GameSave> => {
  const clan = catalog.clans[clanId]
  if (!clan) return fail('UNKNOWN_CLAN', 'Clã desconhecido.')
  if (save.character.clan.knownClanIds.includes(clanId)) return ok(save)
  const next = structuredClone(save)
  next.character.clan.knownClanIds.push(clanId)
  const relationship = next.relationships[clan.recruiterNpcId]
  if (relationship) relationship.discovered = true
  stamp(next, now, `ClanDiscovered:${clanId}`)
  return ok(refreshQuestAvailability(next, catalog, now))
}

export const canJoinClan = (save: GameSave, clanId: string, catalog: ContentCatalog): Result<true> => {
  if (!catalog.clans[clanId]) return fail('UNKNOWN_CLAN', 'Clã desconhecido.')
  if (save.character.clan.clanId) return fail('CLAN_ALREADY_JOINED', 'Seu Terrírian já possui um Vínculo de Clã.')
  if (!save.character.clan.eligibleClanIds.includes(clanId)) {
    return fail('CLAN_NOT_ELIGIBLE', 'Conclua as três provas e receba o convite antes do rito.')
  }
  if (!catalog.clans[clanId].recruitmentQuestIds.every((questId) => save.quests[questId]?.status === 'completed')) {
    return fail('CLAN_TRIALS_INCOMPLETE', 'As três provas precisam ser entregues antes do rito.')
  }
  return ok(true)
}

export const joinClan = (
  save: GameSave,
  clanId: string,
  catalog: ContentCatalog,
  now: string,
): Result<GameSave> => {
  const allowed = canJoinClan(save, clanId, catalog)
  if (!allowed.ok) return allowed
  const next = structuredClone(save)
  next.character.clan.clanId = clanId
  next.character.clan.eligibleClanIds = [clanId]
  next.character.clan.rank = 1
  next.character.clan.joinedAt = now
  for (const [questId, progress] of Object.entries(next.quests)) {
    const definition = catalog.quests[questId]
    const recruitmentClanId = definition?.prerequisites?.find((entry) => entry.type === 'clanKnown')
    if (
      definition?.category === 'clan' &&
      recruitmentClanId?.type === 'clanKnown' &&
      recruitmentClanId.clanId !== clanId &&
      progress.status !== 'completed'
    ) {
      progress.status = 'locked'
      progress.tracked = false
    }
  }
  stamp(next, now, `ClanJoined:${clanId}`)
  return ok(refreshQuestAvailability(next, catalog, now))
}

export const canUnlockClass = (save: GameSave, classId: string, catalog: ContentCatalog): Result<true> => {
  const classDefinition = catalog.classes[classId]
  if (!classDefinition) return fail('UNKNOWN_CLASS', 'Classe desconhecida.')
  if (!save.character.clan.clanId) return fail('CLAN_REQUIRED', 'Um Vínculo de Clã é necessário antes da Classe.')
  if (save.character.clan.clanId !== classDefinition.clanId) {
    return fail('CLASS_WRONG_CLAN', 'Esta Classe pertence a outro Clã.')
  }
  if (save.character.classProgression.classId) return fail('CLASS_ALREADY_UNLOCKED', 'Seu Terrírian já possui uma Classe.')
  if (!save.character.classProgression.eligibleClassIds.includes(classId)) {
    return fail('CLASS_NOT_ELIGIBLE', 'Conclua e entregue a prova desta Classe antes de assumi-la.')
  }
  if (save.quests[classDefinition.trialQuestId]?.status !== 'completed') {
    return fail('CLASS_TRIAL_INCOMPLETE', 'A prova desta Classe precisa ser entregue antes da confirmação.')
  }
  return ok(true)
}

export const unlockClass = (
  save: GameSave,
  classId: string,
  catalog: ContentCatalog,
  now: string,
): Result<GameSave> => {
  const allowed = canUnlockClass(save, classId, catalog)
  if (!allowed.ok) return allowed
  const next = structuredClone(save)
  next.character.classProgression.classId = classId
  next.character.classProgression.masteryLevel = 1
  for (const definition of Object.values(catalog.quests)) {
    const progress = next.quests[definition.id]
    if (definition.category === 'class' && definition.id !== catalog.classes[classId].trialQuestId && progress?.status !== 'completed') {
      progress.status = 'locked'
      progress.tracked = false
    }
  }
  stamp(next, now, `ClassUnlocked:${classId}`)
  return ok(refreshQuestAvailability(next, catalog, now))
}
