import { describe, expect, it } from 'vitest'
import { content } from '../../content/catalog'
import { createNewSave } from '../game/createSave'
import { migrateAndValidateSave } from '../../persistence/saveSchema'
import { BASE_LOCATION_ID, enterPlayerBase, leavePlayerBase, respawnDefeatedPlayer, transferBaseChestItem } from './base'

const now = '2026-10-29T19:34:00.000Z'
const fresh = (owner = 'player-a') => createNewSave(owner, 'Viajante', 'character.terririan.default', content, now,
  { saveId: owner + '-save', characterId: owner + '-character' })

describe('Base individual e mundo isolado por campanha', () => {
  it('dois jogadores começam com instâncias e progresso independentes', () => {
    const a = fresh()
    const b = fresh('player-b')
    a.world.trailNodeStates.astravel_entry = 'completed'
    a.quests.vs_astravel_first_contact.status = 'completed'
    a.world.completedEncounterIds.push('encounter_fungorro_01')
    expect(b.world.trailNodeStates.astravel_entry).toBe('locked')
    expect(b.quests.vs_astravel_first_contact.status).not.toBe('completed')
    expect(b.world.completedEncounterIds).toEqual([])
    expect(a.ownerId).not.toBe(b.ownerId)
    expect(a.saveId).not.toBe(b.saveId)
  })
  it('entra e sai da Base desde o início sem ganhar conclusão de missão', () => {
    const save = fresh()
    const entered = enterPlayerBase(save, now)
    if (!entered.ok) throw new Error(entered.message)
    expect(entered.value.world.currentLocationId).toBe(BASE_LOCATION_ID)
    expect(save.world.currentLocationId).toBe('terran')
    expect(entered.value.quests).toEqual(save.quests)
    const exited = leavePlayerBase(entered.value, now)
    if (!exited.ok) throw new Error(exited.message)
    expect(exited.value.world.currentLocationId).toBe('location_terran_portal_plaza')
  })
  it('acorda na Base depois da derrota sem apagar história, Ouro ou mochila', () => {
    const save = fresh()
    save.battle = { phase: 'Defeat', combatants: { combatant_player: { hp: 0 } } } as never
    save.vitals.hp = 0
    save.wallet.gold = 99
    save.world.trailNodeStates.astravel_entry = 'completed'
    const respawn = respawnDefeatedPlayer(save, now)
    if (!respawn.ok) throw new Error(respawn.message)
    expect(respawn.value.battle).toBeNull()
    expect(respawn.value.vitals).toEqual({ hp: 1, mp: 0 })
    expect(respawn.value.wallet.gold).toBe(99)
    expect(respawn.value.world.trailNodeStates.astravel_entry).toBe('completed')
    expect(respawn.value.world.currentLocationId).toBe(BASE_LOCATION_ID)
    expect(migrateAndValidateSave(respawn.value).vitals.hp).toBe(1)
  })
  it('guarda e recupera pilhas parcialmente sem duplicar itens nem tocar nos Vínculos', () => {
    const save = fresh()
    save.world.currentLocationId = BASE_LOCATION_ID
    save.inventory.push({
      instanceId: 'drop-1', definitionId: 'drop_spore_cluster', quantity: 4, rarity: 'common',
      locked: false, favorite: false, acquiredAt: now,
    })
    const deposited = transferBaseChestItem(save, 'deposit', 'drop-1', 3, content, now)
    if (!deposited.ok) throw new Error(deposited.message)
    expect(deposited.value.inventory[0].quantity).toBe(1)
    expect(deposited.value.baseStorage[0].quantity).toBe(3)
    const withdrawn = transferBaseChestItem(deposited.value, 'withdraw', deposited.value.baseStorage[0].instanceId, 2, content, now)
    if (!withdrawn.ok) throw new Error(withdrawn.message)
    expect(withdrawn.value.inventory.reduce((n, item) => n + item.quantity, 0)).toBe(3)
    expect(withdrawn.value.baseStorage.reduce((n, item) => n + item.quantity, 0)).toBe(1)
    expect(withdrawn.value.character.bondedEquipment).toEqual(save.character.bondedEquipment)
    expect(migrateAndValidateSave(withdrawn.value).baseStorage).toHaveLength(1)
    expect(transferBaseChestItem(save, 'withdraw', 'drop-1', 1, content, now).ok).toBe(false)
  })

  it('migra campanha antiga para v11 sem apagar marcos nem o inventário', () => {
    const save = fresh()
    save.schemaVersion = 10
    save.world.trailNodeStates.astravel_entry = 'completed'
    save.quests.vs_astravel_first_contact.status = 'completed'
    save.wallet.gold = 73
    save.inventory.push({
      instanceId: 'old-drop', definitionId: 'drop_spore_cluster', quantity: 2,
      rarity: 'common', locked: false, favorite: false, acquiredAt: now,
    })
    const legacy = structuredClone(save) as unknown as Record<string, unknown>
    delete legacy.baseStorage
    const migrated = migrateAndValidateSave(legacy)
    expect(migrated.schemaVersion).toBe(12)
    expect(migrated.baseStorage).toEqual([])
    expect(migrated.world.trailNodeStates.astravel_entry).toBe('completed')
    expect(migrated.quests.vs_astravel_first_contact.status).toBe('completed')
    expect(migrated.wallet.gold).toBe(73)
    expect(migrated.inventory[0].quantity).toBe(2)
    expect(migrated.eventLog).toContain('SaveMigrated:10->11')
  })

  it('bloqueia o baú fora da Base e protege itens travados', () => {
    const save = fresh()
    expect(transferBaseChestItem(save, 'deposit', 'missing', 1, content, now).ok).toBe(false)
    save.world.currentLocationId = BASE_LOCATION_ID
    save.inventory.push({ instanceId: 'locked', definitionId: 'drop_spore_cluster', quantity: 1, rarity: 'common', locked: true, favorite: false, acquiredAt: now })
    expect(transferBaseChestItem(save, 'deposit', 'locked', 1, content, now).ok).toBe(false)
  })
})
