import { describe, expect, it } from 'vitest'
import { content } from './catalog'
import { streetNpcDefinitions, streetNpcPlacements, streetQuestDefinitions } from './streetNpcs'
import { createNewSave } from '../domain/game/createSave'
import { acceptQuest, offerQuest, applyQuestEvent, turnInQuest } from '../domain/quests/questEngine'
import { migrateAndValidateSave } from '../persistence/saveSchema'

const instant = '2026-10-29T18:30:00Z'
const newSave = () => createNewSave('owner', 'Teste', 'character.terririan.default', content, instant)

describe('Seis moradores e contratos de rua — CONTENT_DRAFT', () => {
  it('todos têm identidade exclusiva, retrato e missão real', () => {
    expect(streetNpcDefinitions).toHaveLength(6)
    expect(streetQuestDefinitions).toHaveLength(6)
    expect(streetNpcPlacements).toHaveLength(6)
    expect(new Set(streetNpcPlacements.map((npc) => npc.id)).size).toBe(6)
    for (const npc of streetNpcDefinitions) {
      expect(npc.roles).toContain('questGiver')
      expect(npc.roles).not.toContain('clanMaster')
      expect(npc.portraitAssetId).toMatch(/^npc\.street\./)
      const quest = streetQuestDefinitions.find((quest) => quest.giverNpcId === npc.id)!
      expect(quest.turnInNpcId).toBe(npc.id)
      expect(npc.questIds).toContain(quest.id)
      expect(quest.objectives[0].type).toBe('kill')
      expect(content.enemies[quest.objectives[0].targetId]).toBeDefined()
      expect(quest.rewards.some((reward) => reward.type === 'characterXp')).toBe(true)
      expect(quest.rewards.some((reward) => reward.type === 'gold')).toBe(true)
    }
  })
  it('migração v9→v10 preserva campanha e reconstitui NPCs e missões', () => {
    const old = newSave()
    old.schemaVersion = 9
    old.wallet.gold = 101
    old.quests.vs_astravel_first_contact.status = 'completed'
    delete old.quests.side_street_arlen
    delete old.relationships.npc_street_arlen
    const updated = migrateAndValidateSave(old)
    expect(updated.schemaVersion).toBe(11)
    expect(updated.wallet.gold).toBe(101)
    expect(updated.quests.vs_astravel_first_contact.status).toBe('completed')
    expect(updated.quests.side_street_arlen.status).toBe('available')
    expect(updated.relationships.npc_street_arlen.npcId).toBe('npc_street_arlen')
    expect(updated.eventLog).toContain('SaveMigrated:9->10')
  })
  it('o contrato só avança após aceitar, vence por evento de combate e exige entrega ao NPC', () => {
    const save = newSave()
    save.quests.vs_astravel_first_contact.status = 'completed'
    save.quests.side_street_arlen.status = 'available'
    const offered = offerQuest(save, 'side_street_arlen', content, instant)
    if (!offered.ok) throw new Error(offered.message)
    const accepted = acceptQuest(offered.value, 'side_street_arlen', content, instant)
    if (!accepted.ok) throw new Error(accepted.message)
    expect(accepted.value.quests.side_street_arlen.status).toBe('active')
    const progress = applyQuestEvent(accepted.value, { type: 'kill', targetId: 'enemy_fungorro_crawler', amount: 2 }, content, instant)
    expect(progress.quests.side_street_arlen.status).toBe('ready_to_turn_in')
    expect(progress.wallet.gold).toBe(accepted.value.wallet.gold)
    const other = turnInQuest(progress, 'side_street_arlen', 'npc_street_liora', content, instant)
    expect(other.ok).toBe(false)
    const delivered = turnInQuest(progress, 'side_street_arlen', 'npc_street_arlen', content, instant)
    if (!delivered.ok) throw new Error(delivered.message)
    expect(delivered.value.quests.side_street_arlen.status).toBe('completed')
    expect(delivered.value.wallet.gold).toBe(accepted.value.wallet.gold + 18)
  })
})
