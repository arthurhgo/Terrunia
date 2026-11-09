import { describe, expect, it } from 'vitest'
import { content } from '../../content/catalog'
import { deriveCharacterStats } from '../character/derivedStats'
import { createNewSave } from '../game/createSave'
import { resolveQuestDefinition } from '../quests/questSelectors'
import { joinClan, unlockClass } from './progressionEngine'

describe('progressão de Clã e Classe', () => {
  it('exige Rosetta no nível 4, três provas e confirmação de um único Clã', () => {
    const save = createNewSave('social-user', 'Nara', 'character.terririan.default', content)
    expect(joinClan(save, 'dunavar', content, '2026-08-12T15:00:00.000Z'))
      .toMatchObject({ok:false,code:'CLAN_GUIDANCE_REQUIRED'})
    const now='2026-11-09T16:00:00Z'
    save.character.level=4
    save.quests.main_rosetta_clan_guidance_v05141.status='completed'
    save.world.currentLocationId='location_terran_clan_hall'
    save.character.clan.candidateClanId='dunavar'
    save.character.clan.knownClanIds.push('dunavar')
    const unfinished=joinClan(save,'dunavar',content,now)
    expect(unfinished).toMatchObject({ok:false,code:'CLAN_NOT_ELIGIBLE'})
    for(const questId of content.clans.dunavar.recruitmentQuestIds)
      save.quests[questId].status='completed'
    save.character.clan.eligibleClanIds.push('dunavar')
    const joined=joinClan(save,'dunavar',content,now)
    expect(joined.ok).toBe(true)
    if(!joined.ok)return
    expect(joined.value.character.clan.clanId).toBe('dunavar')
    expect(joined.value.character.clan.selectedClanSkillId).toBeNull()
    const stats=deriveCharacterStats(joined.value,content)
    expect(stats.defense.contributions).toContainEqual({label:'Clã',value:1})
    expect(joinClan(joined.value,'dunavar',content,now)).toMatchObject({ok:true})
    expect(joinClan(joined.value,'rustal',content,now)).toMatchObject({ok:false,code:'CLAN_ALREADY_JOINED'})
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
