import { describe, expect, it } from 'vitest'
import { content, type ContentCatalog } from '../../content/catalog'
import { createNewSave } from '../game/createSave'
import { migrateAndValidateSave } from '../../persistence/saveSchema'
import {
  acceptQuest,
  applyQuestEvent,
  canAcceptQuest,
  declineQuest,
  getActiveQuestCount,
  offerQuest,
  normalizeTrackedQuests,
  setQuestTracked,
  turnInQuest,
} from './questEngine'

describe('quest engine', () => {
  it('mantém a oferta fora do Journal até a aceitação explícita', () => {
    const save = createNewSave('quest-user', 'Iria', 'character.terririan.default', content)
    const offered = offerQuest(save, 'vs_astravel_first_contact', content, '2026-08-10T12:01:00.000Z')
    expect(offered.ok && offered.value.quests.vs_astravel_first_contact.status).toBe('offered')
    if (!offered.ok) return
    const declined = declineQuest(offered.value, 'vs_astravel_first_contact', '2026-08-10T12:02:00.000Z')
    expect(declined.ok && declined.value.quests.vs_astravel_first_contact.status).toBe('available')
  })

  it('só aplica recompensas ao entregar uma missão pronta ao NPC correto', () => {
    const save = createNewSave('quest-user', 'Iria', 'character.terririan.default', content)
    save.quests.vs_astravel_first_contact.status = 'ready_to_turn_in'
    const beforeXp = save.character.xp
    const completed = turnInQuest(save, 'vs_astravel_first_contact', 'npc_eldamar', content, '2026-08-10T12:03:00.000Z')
    expect(completed.ok).toBe(true)
    if (!completed.ok) return
    expect(completed.value.quests.vs_astravel_first_contact.status).toBe('completed')
    expect(completed.value.character.xp).toBe(beforeXp + 20)
  })

  it('aplica Essência bruta pela barra e preserva o excedente', () => {
    const rewardQuest = {
      id: 'test_essence_reward',
      title: 'Teste de Essência',
      summary: 'Fixture de regra.',
      giverNpcId: 'npc_eldamar',
      turnInNpcId: 'npc_eldamar',
      category: 'secondary' as const,
      objectives: [{ id: 'talk', type: 'talk' as const, targetId: 'npc_eldamar', required: 1, label: 'Fale com Eldamar' }],
      rewards: [{ type: 'rawEssence' as const, value: 25 }],
      status: 'CONTENT_DRAFT' as const,
    }
    const catalog: ContentCatalog = {
      ...content,
      quests: { ...content.quests, [rewardQuest.id]: rewardQuest },
    }
    const save = createNewSave(
      'quest-user',
      'Iria',
      'character.terririan.default',
      catalog,
      '2026-08-10T12:00:00.000Z',
      { saveId: 'save-quest', characterId: 'character-quest' },
    )
    save.essence.current = 90

    save.quests[rewardQuest.id].status = 'offered'
    const accepted = acceptQuest(save, rewardQuest.id, catalog, '2026-08-10T12:01:00.000Z')
    expect(accepted.ok).toBe(true)
    if (!accepted.ok) return

    const completed = applyQuestEvent(
      accepted.value,
      { type: 'talk', targetId: 'npc_eldamar' },
      catalog,
      '2026-08-10T12:02:00.000Z',
    )

    expect(completed.quests[rewardQuest.id].status).toBe('ready_to_turn_in')
    expect(completed.essence.essencePoints).toBe(0)
    const turnedIn = turnInQuest(completed, rewardQuest.id, 'npc_eldamar', catalog, '2026-08-10T12:03:00.000Z')
    expect(turnedIn.ok).toBe(true)
    if (!turnedIn.ok) return
    expect(turnedIn.value.essence.essencePoints).toBe(1)
    expect(turnedIn.value.essence.current).toBe(15)
  })

  it('aceita mais de três missões sem substituir nenhuma e preserva todas após reload', () => {
    let save = createNewSave('quest-user', 'Iria', 'character.terririan.default', content)
    const ids = ['clan_dunavar_01', 'clan_rustal_01', 'clan_cebios_01', 'clan_estres_01']
    for (const id of ids) {
      save.quests[id].status = 'offered'
      const result = acceptQuest(save, id, content, save.updatedAt)
      if (!result.ok) throw new Error(result.message)
      save = result.value
    }
    expect(getActiveQuestCount(save)).toBe(4)
    expect(canAcceptQuest(save).ok).toBe(true)
    const reloaded = migrateAndValidateSave(save)
    expect(ids.every((id) => reloaded.quests[id].status === 'active')).toBe(true)
  })

  it('mantém pronta para entrega ocupando slot e libera o slot após concluir', () => {
    const save = createNewSave('quest-user', 'Iria', 'character.terririan.default', content)
    save.quests.vs_astravel_first_contact.status = 'ready_to_turn_in'
    expect(getActiveQuestCount(save)).toBe(1)
    const completed = turnInQuest(save, 'vs_astravel_first_contact', 'npc_eldamar', content, '2026-08-12T15:02:00.000Z')
    expect(completed.ok && getActiveQuestCount(completed.value)).toBe(0)
  })
  it('mantém só uma missão atual e permite limpar o caminho sem perder objetivos', () => {
    const now = '2026-11-03T12:00:00Z'
    const save = createNewSave('tracker', 'Lysa', 'character.terririan.default', content, now)
    save.quests.vs_astravel_first_contact.status = 'active'
    save.quests.side_street_arlen.status = 'active'
    const main = setQuestTracked(save, 'vs_astravel_first_contact', true, now)
    expect(main.ok).toBe(true)
    if (!main.ok) return
    const side = setQuestTracked(main.value, 'side_street_arlen', true, now)
    expect(side.ok).toBe(true)
    if (!side.ok) return
    expect(Object.values(side.value.quests).filter((quest) => quest.tracked).map((quest) => quest.questId))
      .toEqual(['side_street_arlen'])
    expect(side.value.quests.vs_astravel_first_contact.status).toBe('active')
    const cleared = setQuestTracked(side.value, 'side_street_arlen', false, now)
    expect(cleared.ok).toBe(true)
    if (!cleared.ok) return
    expect(Object.values(cleared.value.quests).filter((quest) => quest.tracked)).toHaveLength(0)
    expect(cleared.value.quests.side_street_arlen.status).toBe('active')
    expect(save.quests.side_street_arlen.tracked).toBe(false)
    expect(setQuestTracked(save, 'rosetta_tutorial_armor', true, now))
      .toMatchObject({ ok: false, code: 'QUEST_NOT_JOURNALED' })
  })

  it('aceitar outra missão muda o foco, mas a conclusão paralela não rouba o rastreamento', () => {
    const now = '2026-11-03T12:00:00Z'
    const save = createNewSave('tracker', 'Lysa', 'character.terririan.default', content, now)
    save.quests.vs_astravel_first_contact.status = 'active'
    save.quests.vs_astravel_first_contact.tracked = true
    save.quests.side_street_arlen.status = 'offered'
    const accepted = acceptQuest(save, 'side_street_arlen', content, now)
    expect(accepted.ok).toBe(true)
    if (!accepted.ok) return
    expect(accepted.value.quests.side_street_arlen.tracked).toBe(true)
    expect(accepted.value.quests.vs_astravel_first_contact.tracked).toBe(false)
    const event = applyQuestEvent(accepted.value, { type: 'talk', targetId: 'npc_eldamar' }, content, now)
    // The next action is still side-street even when the Eldamar objective advances.
    expect(event.quests.side_street_arlen.tracked).toBe(true)
    expect(event.quests.vs_astravel_first_contact.tracked).toBe(false)
  })

  it('normaliza flags simultâneas de save legado de maneira estável', () => {
    const save = createNewSave('tracker', 'Lysa', 'character.terririan.default', content)
    save.quests.vs_astravel_first_contact.status = 'active'
    save.quests.side_street_arlen.status = 'ready_to_turn_in'
    save.quests.vs_astravel_first_contact.tracked = true
    save.quests.side_street_arlen.tracked = true
    save.eventLog.push('QuestTrackingChanged:side_street_arlen:true')
    const snapshot = structuredClone(save)
    const normalized = migrateAndValidateSave(save)
    expect(normalized.quests.side_street_arlen.tracked).toBe(true)
    expect(normalized.quests.vs_astravel_first_contact.tracked).toBe(false)
    expect(normalized.inventory).toEqual(snapshot.inventory)
    expect(normalized.character).toEqual(snapshot.character)
    expect(normalized.quests.vs_astravel_first_contact.objectives).toEqual(snapshot.quests.vs_astravel_first_contact.objectives)
    expect(migrateAndValidateSave(normalized)).toEqual(normalized)
    expect(normalizeTrackedQuests(normalized)).toBe(normalized)
  })

})
