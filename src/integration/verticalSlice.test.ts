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
    useGameStore.getState().submitBattleCommand({ type: 'rollInitiative' })
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
    expect(useGameStore.getState().save?.world.currentLocationId).toBe('astravel_entry')
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
    useGameStore.getState().submitBattleCommand({ type: 'rollInitiative' })

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
    // This regression runs the ENTIRE 15-encounter story, not a level-1 balance test.
    // Long 15-encounter test uses an explicit prepared-character fixture, not a
    // level-one balance assumption. New rolled damage/cooldowns make the old fixture
    // unsuitable for verifying QUEST, LOOT and SAVE integrity.
    // Production creation and XP rules are never modified by this test.
    const equippedFixture = structuredClone(store().save!)
    equippedFixture.character.unspentAttributePoints = 16
    useGameStore.setState({ save: equippedFixture })
    store().adjustAttribute('strength', 1); store().adjustAttribute('strength', 1); store().adjustAttribute('strength', 1)
    store().adjustAttribute('vigor', 1); store().adjustAttribute('vigor', 1); store().adjustAttribute('vigor', 1); store().adjustAttribute('vigor', 1)
    store().adjustAttribute('agility', 1)
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
          // The first investigation was delivered after combat 1 to earn the home key.
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
        // The 15th milestone is now a dungeon, not an unguarded encounter.
        store().startBattle(node.id)
        expect(store().save!.battle).toBeNull()
        const reachedThreshold = structuredClone(store().save!)
        reachedThreshold.character.clan.clanId = 'dunavar' // Pre-existing affiliation for late-game fixture.
        reachedThreshold.world.currentLocationId = content.dungeons.dungeon_fungal_chambers.entryTrailNodeId
        useGameStore.setState({ save: reachedThreshold })
        store().enterFungalChambers()
        expect(store().save!.dungeonRun?.stageIndex).toBe(1)
        // Quest-integrity fixture: overpowered battle-local hero preserves actual
        // state-machine, reward and save paths without introducing balance expectations.
        const empower = () => {
          const prepared = structuredClone(store().save!)
          const hero = prepared.battle!.combatants.combatant_player
          hero.attackPower = 120
          // Prepared battle fixture, without writing impossible HP into a persisted save.
          const hp = deriveCharacterStats(prepared, content).life.value
          hero.hp = hero.maxHp = hp
          prepared.vitals.hp = hp
          for (const creature of Object.values(prepared.battle!.combatants)) {
            if (creature.side === 'enemy') creature.attackPower = 0
          }
          useGameStore.setState({ save: prepared })
        }
        const fightPrepared = (label: string) => {
          empower()
          store().submitBattleCommand({ type: 'rollInitiative' })
          for (let turn = 0; turn < 70 && store().save!.battle?.phase === 'AwaitingAction'; turn++) {
            const state = store().save!.battle!
            const target = Object.values(state.combatants)
              .find((actor) => actor.side === 'enemy' && actor.alive
                && (!state.bossMechanics || actor.id !== state.bossMechanics.bossId ||
                  !Object.values(state.combatants).some((other) =>
                    other.side === 'enemy' && other.alive && other.id !== actor.id)))
            if (!target) break
            store().submitBattleCommand({ type: 'attack', targetId: target.id })
          }
          expect(store().save!.battle?.phase, label).toBe('Victory')
          store().claimBattleRewards()
          expect(store().save!.battle?.claimed).toBe(true)
          store().finishBattleIntoExpedition()
          expect(store().save!.battle).toBeNull()
        }
        for (const room of content.dungeons.dungeon_fungal_chambers.rooms) {
          for (const stage of [1, 2, 3]) {
            store().discoverFungalRoom(room.id)
            store().startDungeonStage(room.id)
            expect(store().save!.battle?.encounterId).toBe(`encounter_${room.id}_stage_${stage}`)
            fightPrepared(`${room.name} · estágio ${stage}`)
          }
        }
        expect(store().save!.dungeonRun?.completedStageIds).toHaveLength(12)
        expect(store().save!.dungeonRun?.mode).toBe('boss')
        store().startDungeonStage('fungal_core')
        expect(store().save!.battle?.encounterId).toBe('encounter_fungal_core_sentinel')
        empower()
      } else {
        store().startBattle(node.id)
        expect(store().save!.battle?.encounterId, node.label).toBe(node.encounterId)
      }
      store().submitBattleCommand({ type: 'rollInitiative' })
      // Use a weapon skill when possible and basic attacks when Mana runs out.
      for (let turn = 0; turn < 50 && store().save!.battle?.phase === 'AwaitingAction'; turn++) {
        const battle = store().save!.battle!
        const player = battle.combatants.combatant_player
        // Never spend a turn on the Sentinela while a fungus remains alive.
        const guardsAlive = battle.bossMechanics && Object.values(battle.combatants).some(actor =>
          actor.side === 'enemy' && actor.alive && actor.id !== battle.bossMechanics?.bossId)
        const target = Object.values(battle.combatants).filter(actor => actor.side === 'enemy' && actor.alive &&
          (!guardsAlive || actor.id !== battle.bossMechanics?.bossId))
          .sort((a, b) => a.hp - b.hp)[0]
        const skills = player.skillIds.map((id) => content.combatSkills[id]).filter((entry) => entry.target === 'enemy' && entry.mpCost <= player.mp && !(player.skillCooldowns?.[entry.id] ?? 0))
        const skill = skills.find((entry) => entry.id === 'skill_resonant_strike') ?? skills.find((entry) => entry.id !== 'skill_basic_area_attack')
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
      // Obtain the home key through the real Daeryn mission after the first
      // Fungorro encounter. Before that point the home stays correctly locked.
      if (node.index === 1) {
        expect(store().enterBase()).toBe(false)
        visit('location_terran_eldamar_house')
        expect(store().save!.quests.vs_astravel_first_contact.status).toBe('ready_to_turn_in')
        store().turnInQuest('vs_astravel_first_contact', 'npc_eldamar')
        visit('location_terran_daeryn_house')
        accept('main_terran_first_home')
        store().performTerranQuestTask('main_terran_first_home', 'daeryn_healing_shelf',
          ['consumable_minor_tonic', 'consumable_simple_ether', 'consumable_antidote'])
        expect(store().save!.quests.main_terran_first_home.status).toBe('ready_to_turn_in')
        store().turnInQuest('main_terran_first_home', 'npc_daeryn')
        expect(store().save!.inventory.some((item) => item.definitionId === 'quest_daeryn_home_key')).toBe(true)
        visit('location_terran_portal_plaza')
        store().acceptQuest('main_terran_open_base_door')
        expect(store().save?.quests.main_terran_open_base_door?.status).toBe('active')
        expect(store().unlockBaseWithKey()).toBe(true)
        expect(store().save?.quests.main_terran_open_base_door?.status).toBe('completed')
        expect(store().save!.inventory.some((item) => item.definitionId === 'quest_daeryn_home_key')).toBe(false)
      } else {
        expect(store().enterBase()).toBe(true)
      }
      store().restAtHome(); store().leaveBase()
      visit('location_terran_bond_workshop')
      const materials = store().save!.inventory.filter((item) => content.items[item.definitionId].convertToEssence)
      if (materials.length) store().convertItems(materials.map((item) => item.instanceId))
      if (node.index === 1) store().unlockNode('weapon_bond_core')
      if (store().save!.essence.essencePoints > 0 && !store().save!.boundItems[weaponId].skillTree.unlockedNodeIds.includes('weapon_resonant_edge')) store().unlockNode('weapon_resonant_edge')
      while (store().save!.character.unspentAttributePoints >= 2 && store().save!.character.attributes.vigor.die < 10) store().adjustAttribute('vigor', 1)
      if (node.index !== 15) { visit('location_terran_portal_plaza'); store().enterAstravel() }
    }
    expect(store().save!.quests.main_astravel_corruption.status).toBe('ready_to_turn_in')
    store().turnInQuest('main_astravel_corruption', 'npc_lithwynn')
    // Twelve additional waves can fill the original 12-slot backpack: valuable
    // bound items then go safely to the Base chest, not lost or duplicated.
    for (const id of ['fragment_mycelial_essence', 'item_gem_esmeralda_crescimento']) {
      if (store().save!.inventory.some((item) => item.definitionId === id)) continue
      const stored = store().save!.baseStorage.find((item) => item.definitionId === id)
      expect(stored, `Componente ${id} deve estar na mochila ou no baú`).toBeDefined()
      if (!stored) continue
      expect(store().enterBase()).toBe(true)
      store().transferBaseItem('withdraw', stored.instanceId, 1)
      expect(store().save!.inventory.some((item) => item.definitionId === id)).toBe(true)
      store().leaveBase()
      visit('location_terran_bond_workshop')
    }
    const fragment = store().save!.inventory.find((item) => item.definitionId === 'fragment_mycelial_essence')!
    const gem = store().save!.inventory.find((item) => item.definitionId === 'item_gem_esmeralda_crescimento')!
    store().performGradeTwoRite(weaponId, fragment.instanceId)
    store().performGradeThreeRite(weaponId, gem.instanceId)
    expect(store().save!.boundItems[weaponId].grade).toBe(3)
    expect(store().save!.world.worldFlags).toContain('astravel_investigation_completed')
    expect(store().save!.world.completedEncounterIds).toHaveLength(27)
    await flushPersistence()
    const reloaded = await getLatestLocalSave(ownerId)
    expect(reloaded!.world.trailNodeStates.astravel_boss_preview).toBe('completed')
    expect(reloaded!.character.bondedEquipment.weapon).toBe(weaponId)
    expect(reloaded!.boundItems[weaponId].memories.some((memory) => memory.sourceId === 'enemy_ruin_corrupted_sentinel')).toBe(true)
    expect(reloaded!.inventory.find((item) => item.definitionId === 'quest_hunter_insignia')).toBeDefined()
    expect(reloaded!.quests.main_astravel_corruption.status).toBe('completed')
  })
})
