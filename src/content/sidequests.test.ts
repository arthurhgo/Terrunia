import { describe, expect, it } from 'vitest'
import { content } from './catalog'
import { npcDefinitions } from './npcs'
import { sideQuestDefinitions } from './sidequests'
import { createNewSave } from '../domain/game/createSave'
import { migrateAndValidateSave } from '../persistence/saveSchema'

describe('contratos secundários dos NPCs', () => {
  it('tem um contrato por NPC com alvo real e entrega manual', () => {
    const questGivers = npcDefinitions.filter((npc) => npc.id !== 'npc_rosetta')
    expect(sideQuestDefinitions).toHaveLength(questGivers.length)
    expect(content.npcs.npc_rosetta.questIds).toHaveLength(0)
    for (const npc of questGivers) {
      const quest = content.quests[npc.questIds.find((id) => content.quests[id]?.category === 'secondary') ?? '']
      expect(quest.giverNpcId).toBe(npc.id)
      expect(quest.turnInNpcId).toBe(npc.id)
      expect(npc.questIds).toContain(quest.id)
      expect(quest.category).toBe('secondary')
      expect(quest.objectives[0].type).toBe('kill')
      expect(content.enemies[quest.objectives[0].targetId]).toBeDefined()
    }
  })
  it('só libera contratos de mestres após o Clã', () => {
    expect(content.quests.side_npc_master_sentinela.prerequisites)
      .toEqual([{ type: 'clanJoined', clanId: 'dunavar' }])
    expect(content.quests.side_npc_master_sentinela.outcomes).toBeUndefined()
  })
  it('migra save v8 sem perder Ouro ou missões principais', () => {
    const old = createNewSave('user_1', 'Teste', 'character.terririan.default', content,
      '2026-10-29T12:00:00.000Z', { saveId: 'save_1', characterId: 'char_1' })
    old.schemaVersion = 8
    old.quests.vs_astravel_first_contact.status = 'completed'
    old.wallet.gold = 77
    delete old.quests.side_npc_eldamar
    const migrated = migrateAndValidateSave(old)
    expect(migrated.schemaVersion).toBe(13)
    expect(migrated.wallet.gold).toBe(77)
    expect(migrated.quests.vs_astravel_first_contact.status).toBe('completed')
    expect(migrated.quests.side_npc_eldamar.status).toBe('available')
    expect(migrated.eventLog).toContain('SaveMigrated:8->9')
    expect(migrated.eventLog).toContain('SaveMigrated:9->10')
  })
})
