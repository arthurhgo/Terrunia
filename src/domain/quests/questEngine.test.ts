import { describe, expect, it } from 'vitest'
import { content, type ContentCatalog } from '../../content/catalog'
import { createNewSave } from '../game/createSave'
import { acceptQuest, applyQuestEvent, declineQuest, offerQuest, turnInQuest } from './questEngine'

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
})
