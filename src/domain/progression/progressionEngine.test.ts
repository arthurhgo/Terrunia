import { describe, expect, it } from 'vitest'
import { content } from '../../content/catalog'
import { deriveCharacterStats } from '../character/derivedStats'
import { createNewSave } from '../game/createSave'
import { acceptQuest, applyQuestEvent, offerQuest, turnInQuest } from '../quests/questEngine'
import { resolveQuestDefinition } from '../quests/questSelectors'
import { discoverClan, joinClan, unlockClass } from './progressionEngine'

const completeSocialQuest = (save: ReturnType<typeof createNewSave>, questId: string, now: string) => {
  const offered = offerQuest(save, questId, content, now)
  if (!offered.ok) throw new Error(offered.message)
  const accepted = acceptQuest(offered.value, questId, content, now)
  if (!accepted.ok) throw new Error(accepted.message)
  const ready = applyQuestEvent(accepted.value, { type: 'interact', targetId: questId }, content, now)
  const completed = turnInQuest(ready, questId, content.quests[questId].turnInNpcId, content, now)
  if (!completed.ok) throw new Error(completed.message)
  return completed.value
}

describe('progressão de Clã e Classe', () => {
  it('não permite filiação antes das provas e exige confirmação explícita', () => {
    const save = createNewSave('social-user', 'Nara', 'character.terririan.default', content)
    expect(joinClan(save, 'dunavar', content, '2026-08-12T15:00:00.000Z')).toMatchObject({ ok: false, code: 'CLAN_NOT_ELIGIBLE' })
    const known = discoverClan(save, 'dunavar', content, '2026-08-12T15:00:10.000Z')
    if (!known.ok) throw new Error(known.message)
    let progressed = known.value
    for (const questId of content.clans.dunavar.recruitmentQuestIds) {
      progressed = completeSocialQuest(progressed, questId, '2026-08-12T15:00:20.000Z')
    }
    expect(progressed.character.clan.eligibleClanIds).toContain('dunavar')
    expect(progressed.character.clan.clanId).toBeNull()
    const joined = joinClan(progressed, 'dunavar', content, '2026-08-12T15:01:00.000Z')
    expect(joined.ok && joined.value.character.clan.clanId).toBe('dunavar')
    expect(joined.ok && joined.value.eventLog).toContain('ClanJoined:dunavar')
    if (!joined.ok) return
    const stats = deriveCharacterStats(joined.value, content)
    expect(stats.defense.contributions).toContainEqual({ label: 'Clã', value: 1 })
    expect(joinClan(joined.value, 'rustal', content, '2026-08-12T15:01:10.000Z')).toMatchObject({ ok: false, code: 'CLAN_ALREADY_JOINED' })
  })

  it('libera somente Classes do Clã após prova e confirmação', () => {
    const save = createNewSave('social-user', 'Nara', 'character.terririan.default', content)
    save.character.clan.clanId = 'dunavar'
    save.character.classProgression.eligibleClassIds.push('sentinela_da_luz', 'forjador_arcano')
    expect(unlockClass(save, 'forjador_arcano', content, '2026-08-12T15:02:00.000Z')).toMatchObject({ ok: false, code: 'CLASS_WRONG_CLAN' })
    expect(unlockClass(save, 'sentinela_da_luz', content, '2026-08-12T15:02:30.000Z')).toMatchObject({ ok: false, code: 'CLASS_TRIAL_INCOMPLETE' })
    save.quests.class_sentinela_trial.status = 'completed'
    const unlocked = unlockClass(save, 'sentinela_da_luz', content, '2026-08-12T15:03:00.000Z')
    expect(unlocked.ok && unlocked.value.character.classProgression.classId).toBe('sentinela_da_luz')
    if (!unlocked.ok) return
    expect(unlocked.value.quests.main_lore_identity_01.status).toBe('available')
    const narrative = resolveQuestDefinition(unlocked.value, content.quests.main_lore_identity_01)
    expect(narrative.summary).toContain('Sentinela da Luz')
    expect(narrative.summary).toContain("Dûn'Avar")
  })
})
