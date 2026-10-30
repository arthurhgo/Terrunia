import { describe, expect, it } from 'vitest'
import { content } from '../content/catalog'
import { createBattle } from '../domain/combat/engine'
import { createNewSave, bindPrologueWeapon } from '../domain/game/createSave'
import { acceptQuest, offerQuest, refreshQuestAvailability, turnInQuest } from '../domain/quests/questEngine'
import { migrateAndValidateSave } from './saveSchema'

const trail = content.trails.trail_astravel_entry
const legacySave = () => {
  const draft = createNewSave('legacy-astravel', 'Iria', 'character.terririan.default', content)
  const bound = bindPrologueWeapon(draft, content)
  if (!bound.ok) throw new Error(bound.message)
  const save = bound.value
  save.schemaVersion = 11
  save.gameVersion = '0.8.3'
  delete save.quests.main_astravel_lost_hunters
  delete save.quests.main_astravel_corruption
  save.quests.vs_astravel_first_contact.status = 'completed'
  save.wallet.gold = 123
  save.world.trailNodeStates = {
    astravel_entry: 'completed', astravel_fungorro_01: 'completed', astravel_camp_03: 'completed',
    astravel_spore_ambush_04: 'current', astravel_ruin_threshold_05: 'locked', astravel_boss_preview: 'boss',
  }
  return save
}

describe('migração da rota de seis marcos para quinze combates', () => {
  it('preserva marcos antigos e coloca exatamente um novo combate como objetivo sem pagar recompensas', () => {
    const save = legacySave()
    const migrated = migrateAndValidateSave(save)
    expect(migrated.world.trailNodeStates.astravel_fungorro_01).toBe('completed')
    expect(migrated.world.trailNodeStates.astravel_camp_03).toBe('completed')
    expect(migrated.world.trailNodeStates.astravel_luminous_02).toBe('current')
    expect(Object.values(migrated.world.trailNodeStates).filter((status) => ['current', 'bossCurrent'].includes(status))).toHaveLength(1)
    expect(migrated.wallet).toEqual(save.wallet)
    expect(migrated.inventory).toEqual(save.inventory)
    expect(migrated.boundItems).toEqual(save.boundItems)
    expect(migrated.quests.main_astravel_lost_hunters.status).toBe('available')
  })

  it('conserva combate em andamento e seu snapshot de recompensas, inclusive após outra leitura', () => {
    const save = legacySave()
    save.battle = createBattle(save, content.encounters.encounter_spore_ambush_01, content, 'ongoing-legacy')
    const migrated = migrateAndValidateSave(save)
    expect(migrated.battle).toEqual(save.battle)
    expect(migrated.world.trailNodeStates.astravel_spore_ambush_04).toBe('current')
    expect(trail.nodes.filter((node) => node.index < 8).every((node) => migrated.world.trailNodeStates[node.id] === 'completed')).toBe(true)
    expect(migrateAndValidateSave(migrated)).toEqual(migrated)
  })

  it('mantém rota concluída, permite aceitar o relato tardio e nunca aceita missões automaticamente', () => {
    const save = legacySave()
    save.world.trailNodeStates.astravel_boss_preview = 'completed'
    const migrated = migrateAndValidateSave(save)
    expect(trail.nodes.every((node) => migrated.world.trailNodeStates[node.id] === 'completed')).toBe(true)
    expect(migrated.quests.main_astravel_lost_hunters.status).toBe('available')
    expect(migrated.wallet.gold).toBe(123)
    expect(migrated.inventory).toEqual(save.inventory)
    const offered = offerQuest(migrated, 'main_astravel_lost_hunters', content, save.updatedAt)
    if (!offered.ok) throw new Error(offered.message)
    const accepted = acceptQuest(offered.value, 'main_astravel_lost_hunters', content, save.updatedAt)
    if (!accepted.ok) throw new Error(accepted.message)
    expect(accepted.value.quests.main_astravel_lost_hunters.status).toBe('ready_to_turn_in')
    expect(accepted.value.wallet.gold).toBe(123)
    const delivered = turnInQuest(accepted.value, 'main_astravel_lost_hunters', 'npc_vorren', content, save.updatedAt)
    if (!delivered.ok) throw new Error(delivered.message)
    const refreshed = refreshQuestAvailability(delivered.value, content, save.updatedAt)
    expect(refreshed.quests.main_astravel_corruption.status).toBe('available')
  })
})
