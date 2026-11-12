import { afterEach, describe, expect, it, vi } from 'vitest'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { content } from '../../content/catalog'
import { createNewSave } from '../../domain/game/createSave'
import { useGameStore } from '../../state/gameStore'
import { NpcMissionHub } from './NpcMissionHub'

afterEach(() => { cleanup(); useGameStore.getState().resetSession() })

describe('v0.5.16 — consecutive hand-ins in one NPC dialogue', () => {
  it('keeps the window open, pays once per quest, and requires a separate click for the next delivery', () => {
    const save = createNewSave('npc-consecutive', 'Orun', 'character.terririan.default', content)
    save.quests.main_vorren_bestiary.status = 'ready_to_turn_in'
    save.quests.side_astravel_spore_shells.status = 'ready_to_turn_in'
    save.quests.side_astravel_spore_shells.objectives.spore_shells = 1
    useGameStore.setState({ save, ownerId:save.ownerId, status:'ready', syncMode:'local', syncStatus:'saved' })
    const presence = content.terranLocations.location_terran_vorren_post.npcPresences
      .find(npc => npc.npcId === 'npc_vorren')!
    const close = vi.fn()
    const mount = (current: typeof save) => <NpcMissionHub save={current} presence={presence}
      initialQuestId="main_vorren_bestiary" onClose={close}/>
    const { rerender } = render(mount(save))
    const before = save.wallet.gold
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Entregar missão' }))
    const afterFirst = useGameStore.getState().save!
    expect(afterFirst.quests.main_vorren_bestiary.status).toBe('completed')
    expect(afterFirst.quests.side_astravel_spore_shells.status).toBe('ready_to_turn_in')
    expect(afterFirst.wallet.gold).toBeGreaterThanOrEqual(before)
    expect(close).not.toHaveBeenCalled()
    rerender(mount(afterFirst))
    expect(within(screen.getByRole('dialog')).getByRole('button', { name: 'Entregar missão' })).toBeVisible()
    fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: 'Entregar missão' }))
    const afterSecond = useGameStore.getState().save!
    expect(afterSecond.quests.side_astravel_spore_shells.status).toBe('completed')
    expect(close).not.toHaveBeenCalled()
    expect(afterSecond.eventLog.filter(entry => entry === 'QuestCompleted:main_vorren_bestiary')).toHaveLength(1)
    expect(afterSecond.eventLog.filter(entry => entry === 'QuestCompleted:side_astravel_spore_shells')).toHaveLength(1)
  })
})
