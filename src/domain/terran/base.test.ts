import { describe, expect, it } from 'vitest'
import { content } from '../../content/catalog'
import { createNewSave } from '../game/createSave'
import { migrateAndValidateSave } from '../../persistence/saveSchema'
import { turnInQuest } from '../quests/questEngine'
import { BASE_LOCATION_ID, PLAYER_HOME_DOOR_OPENED_FLAG, PLAYER_HOME_KEY_USED_FLAG, PLAYER_HOME_KEY_ITEM_ID,
  enterPlayerBase, hasPlayerHomeKey, isPlayerHomeDoorOpen, unlockPlayerBaseWithDaerynKey,
  leavePlayerBase, respawnDefeatedPlayer, transferBaseChestItem } from './base'

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
  it('mantém a Base trancada e concede a chave apenas ao entregar a missão de Daeryn', () => {
    const save = fresh()
    expect(enterPlayerBase(save, now).ok).toBe(false)
    expect(unlockPlayerBaseWithDaerynKey(save, now).ok).toBe(false)
    expect(hasPlayerHomeKey(save)).toBe(false)
    save.quests.main_terran_first_home.status = 'ready_to_turn_in'
    save.quests.main_terran_first_home.objectives.prepare_room = 1
    const delivered = turnInQuest(save, 'main_terran_first_home', 'npc_daeryn', content, now)
    if (!delivered.ok) throw new Error(delivered.message)
    const rewarded = delivered.value
    expect(rewarded.quests.main_terran_first_home.status).toBe('completed')
    expect(rewarded.inventory.filter((item) => item.definitionId === PLAYER_HOME_KEY_ITEM_ID)).toHaveLength(1)
    expect(rewarded.inventory.find((item) => item.definitionId === PLAYER_HOME_KEY_ITEM_ID))
      .toMatchObject({ quantity: 1, locked: true })
    expect(isPlayerHomeDoorOpen(rewarded)).toBe(false)
    expect(enterPlayerBase(rewarded, now).ok).toBe(false)
    const duplicate = turnInQuest(rewarded, 'main_terran_first_home', 'npc_daeryn', content, now)
    expect(duplicate.ok).toBe(false)
    expect(rewarded.inventory).toHaveLength(1)

    const used = unlockPlayerBaseWithDaerynKey(rewarded, now)
    if (!used.ok) throw new Error(used.message)
    expect(used.value.world.currentLocationId).toBe(BASE_LOCATION_ID)
    expect(isPlayerHomeDoorOpen(used.value)).toBe(true)
    expect(hasPlayerHomeKey(used.value)).toBe(false)
    expect(used.value.eventLog).toContain('DaerynKeyUsedOnHomeDoor')
    expect(unlockPlayerBaseWithDaerynKey(used.value, now).ok).toBe(false)
    expect(save.world.currentLocationId).toBe('terran')
    expect(rewarded.inventory).toHaveLength(1)
    const exited = leavePlayerBase(used.value, now)
    if (!exited.ok) throw new Error(exited.message)
    expect(exited.value.world.currentLocationId).toBe('location_terran_portal_plaza')
    const reentered = enterPlayerBase(exited.value, now)
    if (!reentered.ok) throw new Error(reentered.message)
    expect(reentered.value.world.currentLocationId).toBe(BASE_LOCATION_ID)
    expect(reentered.value.inventory).toHaveLength(0)
    expect(migrateAndValidateSave(reentered.value)).toEqual(reentered.value)
  })
  it('reaparece na Praça antes da chave sem apagar história, Ouro ou mochila', () => {
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
    expect(respawn.value.world.currentLocationId).toBe('location_terran_portal_plaza')
    expect(respawn.value.eventLog).toContain('PlayerRespawnedAtPlaza')
    expect(migrateAndValidateSave(respawn.value).vitals.hp).toBe(1)
    const later = fresh()
    later.world.worldFlags.push(PLAYER_HOME_DOOR_OPENED_FLAG, PLAYER_HOME_KEY_USED_FLAG)
    later.quests.main_terran_first_home.status = 'completed'
    later.battle = { phase: 'Defeat', combatants: { combatant_player: { hp: 0 } } } as never
    const afterUnlock = respawnDefeatedPlayer(later, now)
    if (!afterUnlock.ok) throw new Error(afterUnlock.message)
    expect(afterUnlock.value.world.currentLocationId).toBe(BASE_LOCATION_ID)
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
    expect(migrated.schemaVersion).toBe(17)
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
  it('restaura chave para campanhas antigas concluídas sem item e respeita uso único', () => {
    const legacy = fresh('legacy-door')
    legacy.quests.main_terran_first_home.status = 'completed'
    legacy.world.worldFlags.push('player_home_unlocked')
    const restored = migrateAndValidateSave(legacy)
    expect(hasPlayerHomeKey(restored)).toBe(true)
    expect(restored.inventory.find((item) => item.definitionId === PLAYER_HOME_KEY_ITEM_ID)?.locked).toBe(true)
    expect(migrateAndValidateSave(restored)).toEqual(restored)
    const inside = structuredClone(legacy)
    inside.world.currentLocationId = BASE_LOCATION_ID
    const grandfathered = migrateAndValidateSave(inside)
    expect(isPlayerHomeDoorOpen(grandfathered)).toBe(false)
    expect(hasPlayerHomeKey(grandfathered)).toBe(true)
    expect(grandfathered.world.currentLocationId).toBe('location_terran_portal_plaza')
    const beforeQuest = fresh('legacy-premature')
    beforeQuest.world.currentLocationId = BASE_LOCATION_ID
    const rejected = migrateAndValidateSave(beforeQuest)
    expect(rejected.world.currentLocationId).toBe('location_terran_portal_plaza')
    expect(isPlayerHomeDoorOpen(rejected)).toBe(false)
  })

  it('não permite usar uma chave guardada, ausente ou roubada de outro save', () => {
    const save = fresh()
    save.quests.main_terran_first_home.status = 'completed'
    expect(unlockPlayerBaseWithDaerynKey(save, now).ok).toBe(false)
    save.baseStorage.push({ instanceId: 'legacy-in-chest', definitionId: PLAYER_HOME_KEY_ITEM_ID,
      quantity: 1, rarity: 'unique', locked: true, favorite: false, acquiredAt: now })
    expect(unlockPlayerBaseWithDaerynKey(save, now).ok).toBe(false)
    const migrated = migrateAndValidateSave(save)
    expect(hasPlayerHomeKey(migrated)).toBe(true)
    expect(migrated.baseStorage).toHaveLength(0)
    expect(transferBaseChestItem({ ...migrated, world: { ...migrated.world, currentLocationId: BASE_LOCATION_ID } },
      'deposit', migrated.inventory[0].instanceId, 1, content, now).ok).toBe(false)
  })

  it('revoga abertura herdada sem registro de uso, mesmo com missão concluída', () => {
    const legacy = fresh('wrongly-unlocked')
    legacy.world.currentLocationId = BASE_LOCATION_ID
    legacy.world.worldFlags.push(PLAYER_HOME_DOOR_OPENED_FLAG, 'player_home_unlocked')
    legacy.eventLog.push('LegacyHomeDoorRecognized')
    legacy.quests.main_terran_first_home.status = 'completed'
    expect(isPlayerHomeDoorOpen(legacy)).toBe(false)
    expect(enterPlayerBase(legacy, now).ok).toBe(false)
    const migrated = migrateAndValidateSave(legacy)
    expect(migrated.world.currentLocationId).toBe('location_terran_portal_plaza')
    expect(migrated.world.worldFlags).not.toContain(PLAYER_HOME_DOOR_OPENED_FLAG)
    expect(migrated.world.worldFlags).not.toContain(PLAYER_HOME_KEY_USED_FLAG)
    expect(hasPlayerHomeKey(migrated)).toBe(true)
    const used = unlockPlayerBaseWithDaerynKey(migrated, now)
    if (!used.ok) throw new Error(used.message)
    expect(used.value.world.currentLocationId).toBe(BASE_LOCATION_ID)
    expect(isPlayerHomeDoorOpen(used.value)).toBe(true)
    expect(hasPlayerHomeKey(used.value)).toBe(false)
    expect(migrateAndValidateSave(used.value)).toEqual(used.value)
  })

  it('reconstitui prova do uso da chave sem depender de flags legadas', () => {
    const save = fresh('used-key-legacy')
    save.quests.main_terran_first_home.status = 'completed'
    save.eventLog.push('DaerynKeyUsedOnHomeDoor')
    save.world.worldFlags.push(PLAYER_HOME_DOOR_OPENED_FLAG)
    const migrated = migrateAndValidateSave(save)
    expect(migrated.world.worldFlags).toContain(PLAYER_HOME_KEY_USED_FLAG)
    expect(isPlayerHomeDoorOpen(migrated)).toBe(true)
    expect(hasPlayerHomeKey(migrated)).toBe(false)
    expect(enterPlayerBase(migrated, now).ok).toBe(true)
  })

})
