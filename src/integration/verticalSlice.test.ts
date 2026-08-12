import { describe, expect, it } from 'vitest'
import { getLatestLocalSave } from '../persistence/localSaveRepository'
import { flushPersistence, useGameStore } from '../state/gameStore'

describe('vertical slice integrada', () => {
  it('impede acesso à instância fora da Praça do Portal', async () => {
    const ownerId = 'integration-portal-gate-user'
    await useGameStore.getState().boot(ownerId)
    useGameStore.getState().createGame('Iria', 'character.terririan.default')
    useGameStore.getState().bindPrologueWeapon()
    useGameStore.getState().travelInTerran('location_terran_eldamar_house')
    useGameStore.getState().discoverEldamar()
    useGameStore.getState().offerQuest('vs_astravel_first_contact')
    useGameStore.getState().acceptQuest('vs_astravel_first_contact')

    useGameStore.getState().enterAstravel()
    expect(useGameStore.getState().save?.world.currentLocationId).toBe(
      'location_terran_eldamar_house',
    )
    expect(useGameStore.getState().notification).toMatchObject({
      title: 'Ação indisponível',
      message: 'A instância deve ser acessada pela Praça do Portal.',
    })

    useGameStore.getState().travelInTerran('location_terran_portal_plaza')
    useGameStore.getState().enterAstravel()
    expect(useGameStore.getState().save?.world.currentLocationId).toBe('astravel_entry')
  })

  it('criação → vínculo → quest → batalha → drop → ponto → node → reload', async () => {
    const ownerId = 'integration-user'
    await useGameStore.getState().boot(ownerId)
    useGameStore.getState().createGame('Aron', 'character.terririan.default')
    useGameStore.getState().bindPrologueWeapon()
    useGameStore.getState().travelInTerran('location_terran_eldamar_house')
    useGameStore.getState().discoverEldamar()
    useGameStore.getState().offerQuest('vs_astravel_first_contact')
    useGameStore.getState().acceptQuest('vs_astravel_first_contact')
    useGameStore.getState().travelInTerran('location_terran_portal_plaza')
    useGameStore.getState().enterAstravel()
    useGameStore.getState().startBattle()

    const targetId = 'combatant_enemy_fungorro_crawler_1'
    useGameStore.getState().submitBattleCommand({ type: 'attack', targetId })
    useGameStore.getState().submitBattleCommand({ type: 'attack', targetId })
    expect(useGameStore.getState().save?.battle?.phase).toBe('Victory')

    useGameStore.getState().claimBattleRewards()
    const dropId = useGameStore.getState().save?.inventory[0]?.instanceId
    expect(dropId).toBeTruthy()
    useGameStore.getState().returnToTerran()
    useGameStore.getState().travelInTerran('location_terran_bond_workshop')
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

  it('continua pela trilha → acampamento → combate com 3 alvos → limiar', async () => {
    const ownerId = 'integration-tactical-user'
    await useGameStore.getState().boot(ownerId)
    useGameStore.getState().createGame('Lysa', 'character.terririan.default')
    useGameStore.getState().bindPrologueWeapon()
    useGameStore.getState().travelInTerran('location_terran_eldamar_house')
    useGameStore.getState().discoverEldamar()
    useGameStore.getState().offerQuest('vs_astravel_first_contact')
    useGameStore.getState().acceptQuest('vs_astravel_first_contact')
    useGameStore.getState().travelInTerran('location_terran_portal_plaza')
    useGameStore.getState().enterAstravel()
    useGameStore.getState().startBattle()

    const firstTarget = 'combatant_enemy_fungorro_crawler_1'
    useGameStore.getState().submitBattleCommand({ type: 'attack', targetId: firstTarget })
    useGameStore.getState().submitBattleCommand({ type: 'attack', targetId: firstTarget })
    useGameStore.getState().claimBattleRewards()
    const firstDrop = useGameStore.getState().save?.inventory[0]?.instanceId
    useGameStore.getState().returnToTerran()
    useGameStore.getState().travelInTerran('location_terran_bond_workshop')
    useGameStore.getState().convertItems([firstDrop!])
    useGameStore.getState().unlockNode('weapon_bond_core')

    useGameStore.getState().travelInTerran('location_terran_portal_plaza')
    useGameStore.getState().resolveCurrentTrailNode()
    expect(useGameStore.getState().save?.inventory[0]?.definitionId).toBe(
      'consumable_minor_tonic',
    )
    useGameStore.getState().startBattle()
    expect(
      Object.values(useGameStore.getState().save!.battle!.combatants).filter(
        (combatant) => combatant.side === 'enemy',
      ),
    ).toHaveLength(3)

    useGameStore.getState().submitBattleCommand({
      type: 'skill',
      skillId: 'skill_resonant_strike',
      targetId: 'combatant_enemy_fungorro_crawler_1',
    })
    const tonicId = useGameStore.getState().save?.inventory[0]?.instanceId
    useGameStore.getState().submitBattleCommand({
      type: 'item',
      itemInstanceId: tonicId!,
      targetId: 'combatant_player',
    })
    useGameStore.getState().submitBattleCommand({
      type: 'skill',
      skillId: 'skill_resonant_strike',
      targetId: 'combatant_enemy_spore_sower_2',
    })
    useGameStore.getState().submitBattleCommand({
      type: 'skill',
      skillId: 'skill_resonant_strike',
      targetId: 'combatant_enemy_fungorro_crawler_3',
    })
    expect(useGameStore.getState().save?.battle?.phase).toBe('Victory')
    expect(useGameStore.getState().save?.inventory).toHaveLength(0)

    useGameStore.getState().claimBattleRewards()
    useGameStore.getState().returnToTerran()
    expect(useGameStore.getState().save?.world.trailNodeStates.astravel_ruin_threshold_05).toBe(
      'current',
    )
    useGameStore.getState().resolveCurrentTrailNode()
    expect(useGameStore.getState().save?.world.trailNodeStates.astravel_boss_preview).toBe(
      'bossCurrent',
    )
    expect(useGameStore.getState().save?.world.worldFlags).toContain(
      'fungal_chambers_threshold_discovered',
    )

    useGameStore.getState().startBattle('astravel_boss_preview')
    expect(useGameStore.getState().save?.battle?.encounterId).toBe(
      'encounter_colossus_mycelium_01',
    )
    const bossTarget = 'combatant_enemy_colossus_mycelium_1'
    for (let index = 0; index < 3; index += 1) {
      useGameStore.getState().submitBattleCommand({
        type: 'skill',
        skillId: 'skill_resonant_strike',
        targetId: bossTarget,
      })
    }
    useGameStore.getState().submitBattleCommand({ type: 'attack', targetId: bossTarget })
    expect(useGameStore.getState().save?.battle?.phase).toBe('Victory')
    useGameStore.getState().claimBattleRewards()
    expect(useGameStore.getState().save?.world.worldFlags).toContain(
      'colossus_mycelium_defeated',
    )
    const weaponId = useGameStore.getState().save!.character.bondedEquipment.weapon!
    expect(useGameStore.getState().save?.boundItems[weaponId].memories).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ sourceId: 'enemy_colossus_mycelium' }),
      ]),
    )
    const fragmentId = useGameStore.getState().save?.inventory.find(
      (instance) => instance.definitionId === 'fragment_mycelial_essence',
    )?.instanceId
    const gemId = useGameStore.getState().save?.inventory.find(
      (instance) => instance.definitionId === 'item_gem_esmeralda_crescimento',
    )?.instanceId
    expect(fragmentId).toBeTruthy()
    expect(gemId).toBeTruthy()
    useGameStore.getState().returnToTerran()
    useGameStore.getState().travelInTerran('location_terran_bond_workshop')
    expect(useGameStore.getState().save?.boundItems[weaponId].resonance).toBeGreaterThanOrEqual(
      useGameStore.getState().save!.boundItems[weaponId].resonanceThreshold,
    )
    useGameStore.getState().performGradeTwoRite(weaponId, fragmentId!)
    expect(useGameStore.getState().notification).toMatchObject({
      title: 'Vínculo elevado ao Grau II',
    })
    expect(useGameStore.getState().save?.boundItems[weaponId]).toMatchObject({
      grade: 2,
      components: { essences: ['essence_mycelial'] },
    })
    useGameStore.getState().performGradeThreeRite(weaponId, gemId!)
    expect(useGameStore.getState().notification).toMatchObject({
      title: 'Vínculo elevado ao Grau III',
    })
    expect(useGameStore.getState().save?.boundItems[weaponId]).toMatchObject({
      grade: 3,
      components: {
        essences: ['essence_mycelial'],
        gems: ['esmeralda_crescimento'],
      },
    })
    expect(useGameStore.getState().save?.world.trailNodeStates.astravel_boss_preview).toBe(
      'completed',
    )

    await flushPersistence()
    const reloaded = await getLatestLocalSave(ownerId)
    expect(reloaded?.world.worldFlags).toContain('fungal_chambers_threshold_discovered')
    expect(reloaded?.inventory[0]?.definitionId).toBe('drop_spore_cluster')
    expect(reloaded?.boundItems[weaponId]).toMatchObject({
      grade: 3,
      components: {
        essences: ['essence_mycelial'],
        gems: ['esmeralda_crescimento'],
      },
    })
  })
})
