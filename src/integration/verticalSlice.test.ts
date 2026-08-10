import { describe, expect, it } from 'vitest'
import { getLatestLocalSave } from '../persistence/localSaveRepository'
import { flushPersistence, useGameStore } from '../state/gameStore'

describe('vertical slice integrada', () => {
  it('criação → vínculo → quest → batalha → drop → ponto → node → reload', async () => {
    const ownerId = 'integration-user'
    await useGameStore.getState().boot(ownerId)
    useGameStore.getState().createGame('Aron', 'character.terririan.default')
    useGameStore.getState().bindPrologueWeapon()
    useGameStore.getState().discoverEldamar()
    useGameStore.getState().acceptQuest('vs_astravel_first_contact')
    useGameStore.getState().enterAstravel()
    useGameStore.getState().startBattle()

    const targetId = 'combatant_enemy_fungorro_crawler'
    useGameStore.getState().submitBattleCommand({ type: 'attack', targetId })
    useGameStore.getState().submitBattleCommand({ type: 'attack', targetId })
    expect(useGameStore.getState().save?.battle?.phase).toBe('Victory')

    useGameStore.getState().claimBattleRewards()
    const dropId = useGameStore.getState().save?.inventory[0]?.instanceId
    expect(dropId).toBeTruthy()
    useGameStore.getState().returnToTerran()
    useGameStore.getState().convertItems([dropId!])
    expect(useGameStore.getState().save?.essence.essencePoints).toBe(1)
    useGameStore.getState().unlockNode('weapon_bond_core')

    const current = useGameStore.getState().save!
    const weaponId = current.character.bondedEquipment.weapon!
    expect(current.boundItems[weaponId].skillTree.unlockedNodeIds).toContain('weapon_bond_core')
    expect(current.essence.essencePoints).toBe(0)

    await flushPersistence()
    const reloaded = await getLatestLocalSave(ownerId)
    expect(reloaded?.boundItems[weaponId].skillTree.unlockedNodeIds).toContain('weapon_bond_core')
    expect(reloaded?.inventory).toHaveLength(0)
  })
})
