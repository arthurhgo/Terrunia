import { describe, expect, it } from 'vitest'
import { content } from '../../content/catalog'
import { createNewSave } from '../game/createSave'
import { migrateAndValidateSave } from '../../persistence/saveSchema'
import { canStartPortalHunt, PORTAL_HUNT_IDS } from './portalHunts'

const fresh = () => createNewSave('owner', 'Arlen', 'character.terririan.default', content,
  '2026-10-29T22:00:00Z', { saveId: 'save-portal', characterId: 'character-portal' })

describe('Caçadas individuais do Portal (CONTENT_DRAFT)', () => {
  it('registra as três caçadas com adversários e materiais reais', () => {
    expect(PORTAL_HUNT_IDS).toHaveLength(3)
    for (const id of PORTAL_HUNT_IDS) {
      const encounter = content.encounters[id]
      expect(encounter).toBeDefined()
      for (const enemyId of encounter.enemyDefinitionIds) expect(content.enemies[enemyId]).toBeDefined()
      for (const lootId of encounter.rewards.lootDefinitionIds) expect(content.items[lootId]).toBeDefined()
      expect(encounter.rewards.worldFlags).toBeUndefined()
      expect(encounter.rewards.boundMemory).toBeUndefined()
    }
  })
  it('só inicia no Portal depois do primeiro encontro; não interfere na campanha', () => {
    const save = fresh()
    save.world.currentLocationId = 'location_terran_portal_plaza'
    expect(canStartPortalHunt(save, PORTAL_HUNT_IDS[0], content).ok).toBe(false)
    save.world.trailNodeStates.astravel_fungorro_01 = 'completed'
    expect(canStartPortalHunt(save, PORTAL_HUNT_IDS[0], content).ok).toBe(true)
    expect(canStartPortalHunt(save, 'encounter_colossus_mycelium_01', content).ok).toBe(false)
    save.world.currentLocationId = 'location_terran_daeryn_house'
    expect(canStartPortalHunt(save, PORTAL_HUNT_IDS[0], content).ok).toBe(false)
  })
  it('mantém recorde de ondas por save e migra versões atuais sem zerar progresso', () => {
    const a = fresh(), b = fresh()
    a.world.portalWaveBest = 15
    expect(b.world.portalWaveBest).toBe(0)
    const loaded = migrateAndValidateSave(a)
    expect(loaded.world.portalWaveBest).toBe(15)
    expect(loaded.world.trailNodeStates.astravel_entry).toBe(a.world.trailNodeStates.astravel_entry)
  })
})
