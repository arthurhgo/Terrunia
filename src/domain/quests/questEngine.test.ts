import { describe, expect, it } from 'vitest'
import { content, type ContentCatalog } from '../../content/catalog'
import { createNewSave } from '../game/createSave'
import { acceptQuest, applyQuestEvent } from './questEngine'

describe('quest engine', () => {
  it('aplica Essência bruta pela barra e preserva o excedente', () => {
    const rewardQuest = {
      id: 'test_essence_reward',
      title: 'Teste de Essência',
      summary: 'Fixture de regra.',
      giverNpcId: 'npc_eldamar',
      objectives: [{ id: 'talk', type: 'talk' as const, targetId: 'npc_eldamar', required: 1 }],
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

    const accepted = acceptQuest(save, rewardQuest.id, catalog, '2026-08-10T12:01:00.000Z')
    expect(accepted.ok).toBe(true)
    if (!accepted.ok) return

    const completed = applyQuestEvent(
      accepted.value,
      { type: 'talk', targetId: 'npc_eldamar' },
      catalog,
      '2026-08-10T12:02:00.000Z',
    )

    expect(completed.quests[rewardQuest.id].status).toBe('completed')
    expect(completed.essence.essencePoints).toBe(1)
    expect(completed.essence.current).toBe(15)
    expect(completed.essence.lifetimeEssence).toBe(25)
  })
})
