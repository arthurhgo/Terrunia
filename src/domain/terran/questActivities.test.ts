import { describe, expect, it } from 'vitest'
import { content } from '../../content/catalog'
import { createNewSave } from '../game/createSave'
import { useGameStore } from '../../state/gameStore'
import { canCompleteQuestObjectActivity, questObjectActivities } from './questActivities'

const now = '2026-11-04T13:00:00.000Z'
const makeSave = () => createNewSave('puzzle-owner', 'Lysa', 'character.terririan.default', content, now)

describe('objetivos realizados em objetos reais', () => {
  it('todos os objetivos main/interact de Terran têm objeto e solução no local certo', () => {
    for (const [questId, activity] of Object.entries(questObjectActivities)) {
      const definition = content.quests[questId]
      expect(definition?.category).toBe('main')
      expect(definition.terranFlow?.active).toBe(activity.locationId)
      const furniture = activity.locationId === 'location_terran_daeryn_house' ? 'daeryn_healing_shelf'
        : activity.locationId === 'location_terran_vorren_post' ? 'vorren_bestiary'
          : activity.locationId === 'location_terran_bond_workshop' ? 'bond_inscription_table' : 'clan_echo_table'
      expect(furniture).toBe(activity.objectId)
      const save = makeSave()
      save.world.currentLocationId = activity.locationId
      save.quests[questId].status = 'active'
      expect(canCompleteQuestObjectActivity(save, questId, activity.objectId, activity.solution)).toBe(true)
      expect(canCompleteQuestObjectActivity(save, questId, 'npc_daeryn', activity.solution)).toBe(false)
      expect(canCompleteQuestObjectActivity(save, questId, activity.objectId, activity.solution.slice(0, 2))).toBe(false)
      expect(canCompleteQuestObjectActivity(save, questId, activity.objectId, [...activity.solution].reverse())).toBe(false)
      const otherRoom = structuredClone(save)
      otherRoom.world.currentLocationId = 'location_terran_portal_plaza'
      expect(canCompleteQuestObjectActivity(otherRoom, questId, activity.objectId, activity.solution)).toBe(false)
      save.quests[questId].status = 'available'
      expect(canCompleteQuestObjectActivity(save, questId, activity.objectId, activity.solution)).toBe(false)
    }
    const allMain = Object.values(content.quests).filter((quest) =>
      quest.category === 'main' && quest.objectives.some((objective) => objective.type === 'interact') &&
      quest.terranFlow?.active?.startsWith('location_terran_'))
    expect(allMain.every((quest) => quest.id in questObjectActivities)).toBe(true)
  })

  it('o store rejeita o antigo botão sem puzzle e progride somente após solução validada', () => {
    const save = makeSave()
    save.world.currentLocationId = 'location_terran_daeryn_house'
    save.quests.vs_astravel_first_contact.status = 'completed'
    save.quests.main_terran_first_home.status = 'active'
    useGameStore.setState({ save, ownerId: save.ownerId, status: 'ready', syncMode: 'local', syncStatus: 'saved' })
    const initial = structuredClone(save)
    useGameStore.getState().preparePlayerHome()
    expect(useGameStore.getState().save).toEqual(initial)
    useGameStore.getState().performTerranQuestTask('main_terran_first_home')
    expect(useGameStore.getState().save).toEqual(initial)
    useGameStore.getState().performTerranQuestTask('main_terran_first_home', 'daeryn_healing_shelf', ['consumable_minor_tonic'])
    expect(useGameStore.getState().save).toEqual(initial)
    const solution = [...questObjectActivities.main_terran_first_home.solution]
    useGameStore.getState().performTerranQuestTask('main_terran_first_home', 'daeryn_healing_shelf', solution)
    const completed = useGameStore.getState().save!
    expect(completed.quests.main_terran_first_home.status).toBe('ready_to_turn_in')
    expect(completed.eventLog).toContain('QuestObjectSolved:main_terran_first_home:daeryn_healing_shelf')
    const revision = completed.revision
    useGameStore.getState().performTerranQuestTask('main_terran_first_home', 'daeryn_healing_shelf', solution)
    expect(useGameStore.getState().save?.revision).toBe(revision)
    useGameStore.getState().resetSession()
  })
})
