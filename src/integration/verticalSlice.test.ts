import { describe, expect, it } from 'vitest'
import { content } from '../content/catalog'
import { deriveCharacterStats } from '../domain/character/derivedStats'
import { getLatestLocalSave } from '../persistence/localSaveRepository'
import { flushPersistence, useGameStore } from '../state/gameStore'

describe('vertical slice integrada', () => {
  it('continua a expedição após o combate e a retoma sem duplicar a entrada', async () => {
    const ownerId = 'integration-expedition-continuity'
    await useGameStore.getState().boot(ownerId)
    useGameStore.getState().createGame('Nira', 'character.terririan.default')
    useGameStore.getState().bindPrologueWeapon()
    useGameStore.getState().travelInTerran('location_terran_eldamar_house')
    useGameStore.getState().discoverEldamar()
    useGameStore.getState().offerQuest('vs_astravel_first_contact')
    useGameStore.getState().acceptQuest('vs_astravel_first_contact')
    useGameStore.getState().travelInTerran('location_terran_portal_plaza')
    useGameStore.getState().enterAstravel()
    expect(useGameStore.getState().save?.world.currentLocationId).toBe('astravel_entry')
    useGameStore.getState().travelInTerran('location_terran_portal_plaza')
    expect(useGameStore.getState().save?.world.currentLocationId).toBe('astravel_entry')
    expect(useGameStore.getState().notification?.message).toContain('Registre o retorno')
    useGameStore.getState().startBattle('astravel_fungorro_01')
    const enemy = 'combatant_enemy_fungorro_crawler_1'
    useGameStore.getState().submitBattleCommand({ type: 'attack', targetId: enemy })
    useGameStore.getState().submitBattleCommand({ type: 'attack', targetId: enemy })
    expect(useGameStore.getState().save?.battle?.phase).toBe('Victory')
    useGameStore.getState().finishBattleIntoExpedition()
    expect(useGameStore.getState().notification?.message).toContain('Receba as recompensas')
    expect(useGameStore.getState().save?.battle?.claimed).toBe(false)
    useGameStore.getState().claimBattleRewards()
    useGameStore.getState().finishBattleIntoExpedition()
    expect(useGameStore.getState().save?.battle).toBeNull()
    expect(useGameStore.getState().save?.world.currentLocationId).toBe('astravel_fungorro_01')
    expect(useGameStore.getState().save?.world.trailNodeStates.astravel_luminous_02).toBe('current')

    useGameStore.getState().returnToTerran()
    useGameStore.getState().enterAstravel()
    expect(useGameStore.getState().save?.world.currentLocationId).toBe('astravel_luminous_02')
    expect(useGameStore.getState().save?.world.trailNodeStates.astravel_entry).toBe('completed')
    expect(useGameStore.getState().save?.eventLog.filter((event) => event === 'TrailNodeCompleted:astravel_entry')).toHaveLength(1)
    expect(useGameStore.getState().save?.eventLog).toContain('ExpeditionResumed:trail_astravel_entry')
  })

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

  it('percorre 15 combates, entrega as missões nos NPCs, converte drops e mantém os Vínculos no reload', async () => {
    const ownerId = 'integration-astravel-remake'
    await useGameStore.getState().boot(ownerId)
    const store = () => useGameStore.getState()
    store().createGame('Lysa', 'character.terririan.default')
    store().adjustAttribute('strength', 1); store().adjustAttribute('strength', 1); store().adjustAttribute('vigor', 1)
    store().bindPrologueWeapon()
    const weaponId = store().save!.character.bondedEquipment.weapon!
    const visit = (id: string) => store().travelInTerran(id)
    const accept = (id: string) => { store().offerQuest(id); store().acceptQuest(id) }
    visit('location_terran_eldamar_house')
    store().discoverEldamar()
    accept('vs_astravel_first_contact')
    visit('location_terran_portal_plaza')
    store().enterAstravel()

    const battleNodes = content.trails.trail_astravel_entry.nodes.filter((node) => node.encounterId)
    for (const node of battleNodes) {
      if (node.index === 6 || node.index === 11) {
        // Gates reject combat until the corresponding quest has been accepted.
        const before = store().save!.revision
        store().startBattle(node.id)
        expect(store().save!.battle).toBeNull()
        expect(store().save!.revision).toBe(before)
        expect(store().notification?.message).toContain('aceite')
        store().returnToTerran()
        if (node.index === 6) {
          visit('location_terran_eldamar_house')
          store().turnInQuest('vs_astravel_first_contact', 'npc_eldamar')
          visit('location_terran_vorren_post')
          accept('main_astravel_lost_hunters')
        } else {
          visit('location_terran_vorren_post')
          expect(store().save!.quests.main_astravel_lost_hunters.status).toBe('ready_to_turn_in')
          store().turnInQuest('main_astravel_lost_hunters', 'npc_vorren')
          visit('location_terran_bond_workshop')
          accept('main_astravel_corruption')
        }
        visit('location_terran_portal_plaza')
        store().enterAstravel()
      }
      if (node.type === 'boss') {
        store().startBattle(node.id)
        expect(store().save!.battle).toBeNull()
        store().enterFungalChambers()
        for (const room of content.dungeons.dungeon_fungal_chambers.rooms) store().discoverFungalRoom(room.id)
      }
      store().startBattle(node.id)
      expect(store().save!.battle?.encounterId, node.label).toBe(node.encounterId)
      // Use a weapon skill when possible and basic attacks when Mana runs out.
      for (let turn = 0; turn < 50 && store().save!.battle?.phase === 'AwaitingAction'; turn++) {
        const battle = store().save!.battle!
        const player = battle.combatants.combatant_player
        const target = Object.values(battle.combatants).filter((actor) => actor.side === 'enemy' && actor.alive)
          .sort((a, b) => a.hp - b.hp)[0]
        const skills = player.skillIds.map((id) => content.combatSkills[id]).filter((entry) => entry.mpCost <= player.mp)
        const skill = skills.find((entry) => entry.id === 'skill_resonant_strike') ?? skills[0]
        store().submitBattleCommand(skill ? { type: 'skill', skillId: skill.id, targetId: target.id } : { type: 'attack', targetId: target.id })
      }
      expect(store().save!.battle?.phase, `${node.index}. ${node.label}`).toBe('Victory')
      const points = store().save!.essence.essencePoints
      store().claimBattleRewards()
      expect(store().save!.essence.essencePoints).toBe(points)
      const once = structuredClone(store().save!)
      store().claimBattleRewards()
      expect(store().save).toEqual(once)
      expect(store().save!.world.trailNodeStates[node.id]).toBe('completed')
      if (node.checkpoint) {
        expect(store().save!.vitals.hp).toBeGreaterThan(0)
        expect(store().save!.eventLog.filter((event) => event === `FieldRecovery:${node.id}`)).toHaveLength(1)
        const maximum = deriveCharacterStats(store().save!, content)
        expect(store().save!.vitals.hp).toBeLessThanOrEqual(maximum.life.value)
        expect(store().save!.vitals.mp).toBeLessThanOrEqual(maximum.mana.value)
      }
      store().finishBattleIntoExpedition()
      store().returnToTerran()
      // Rest and convert between encounters are real gameplay choices, not stat fixtures.
      store().enterBase(); store().restAtHome(); store().leaveBase()
      visit('location_terran_bond_workshop')
      const materials = store().save!.inventory.filter((item) => content.items[item.definitionId].convertToEssence)
      if (materials.length) store().convertItems(materials.map((item) => item.instanceId))
      if (node.index === 1) store().unlockNode('weapon_bond_core')
      if (store().save!.essence.essencePoints > 0 && !store().save!.boundItems[weaponId].skillTree.unlockedNodeIds.includes('weapon_resonant_edge')) store().unlockNode('weapon_resonant_edge')
      while (store().save!.character.unspentAttributePoints > 0 && store().save!.character.attributes.vigor.die < 10) store().adjustAttribute('vigor', 1)
      if (node.index !== 15) { visit('location_terran_portal_plaza'); store().enterAstravel() }
    }
    expect(store().save!.quests.main_astravel_corruption.status).toBe('ready_to_turn_in')
    store().turnInQuest('main_astravel_corruption', 'npc_lithwynn')
    const fragment = store().save!.inventory.find((item) => item.definitionId === 'fragment_mycelial_essence')!
    const gem = store().save!.inventory.find((item) => item.definitionId === 'item_gem_esmeralda_crescimento')!
    store().performGradeTwoRite(weaponId, fragment.instanceId)
    store().performGradeThreeRite(weaponId, gem.instanceId)
    expect(store().save!.boundItems[weaponId].grade).toBe(3)
    expect(store().save!.world.worldFlags).toContain('astravel_investigation_completed')
    expect(store().save!.world.completedEncounterIds).toHaveLength(15)
    await flushPersistence()
    const reloaded = await getLatestLocalSave(ownerId)
    expect(reloaded!.world.trailNodeStates.astravel_boss_preview).toBe('completed')
    expect(reloaded!.character.bondedEquipment.weapon).toBe(weaponId)
    expect(reloaded!.boundItems[weaponId].memories.some((memory) => memory.sourceId === 'enemy_colossus_mycelium')).toBe(true)
    expect(reloaded!.inventory.find((item) => item.definitionId === 'quest_hunter_insignia')).toBeDefined()
    expect(reloaded!.quests.main_astravel_corruption.status).toBe('completed')
  })
})
