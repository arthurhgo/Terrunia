import { describe, expect, it } from 'vitest'
import { content } from '../../content/catalog'
import { createNewSave } from '../game/createSave'
import { discoverDungeonRoom, dungeonRoomFlag, enterDungeon, exitDungeon } from './dungeonEngine'

const dungeon = content.dungeons.dungeon_fungal_chambers
const now = '2026-10-28T20:00:00Z'

const ready = () => {
  const save = createNewSave('dungeon-owner', 'Aren', 'character.terririan.default', content, now)
  save.world.currentLocationId = 'astravel_ruin_threshold_05'
  save.world.trailNodeStates.astravel_boss_preview = 'bossCurrent'
  return save
}

describe('dungeon de Astravél (domínio puro)', () => {
  it('recusa entrar antes de investigar o limiar ou de outra região', () => {
    const save = ready()
    save.world.trailNodeStates.astravel_boss_preview = 'boss'
    expect(enterDungeon(save, dungeon, now).ok).toBe(false)
    save.world.trailNodeStates.astravel_boss_preview = 'bossCurrent'
    save.world.currentLocationId = 'location_terran_portal_plaza'
    expect(enterDungeon(save, dungeon, now).ok).toBe(false)
  })

  it('registra a entrada e cada descoberta uma única vez, sem conceder itens', () => {
    const save = ready()
    const entering = enterDungeon(save, dungeon, now)
    expect(entering.ok).toBe(true)
    if (!entering.ok) return
    expect(entering.save.world.currentLocationId).toBe(dungeon.id)
    expect(entering.save.world.worldFlags).toContain(dungeonRoomFlag('fungal_vestibule'))
    expect(entering.save.inventory).toEqual(save.inventory)
    expect(discoverDungeonRoom(entering.save, dungeon, 'fungal_core', now).ok).toBe(false)

    let explored = entering.save
    for (const room of dungeon.rooms.slice(1)) {
      const result = discoverDungeonRoom(explored, dungeon, room.id, now)
      expect(result.ok).toBe(true)
      if (result.ok) explored = result.save
    }
    expect(explored.world.worldFlags.filter((flag) => flag.startsWith('dungeon-room-discovered:'))).toHaveLength(4)
    const again = discoverDungeonRoom(explored, dungeon, 'fungal_core', now)
    expect(again.ok && again.save).toBe(explored)
    expect(explored.revision).toBe(entering.save.revision + 3)

    const leaving = exitDungeon(explored, dungeon, now)
    expect(leaving.ok).toBe(true)
    if (!leaving.ok) return
    const reentering = enterDungeon(leaving.save, dungeon, now)
    expect(reentering.ok).toBe(true)
    if (reentering.ok) expect(reentering.save.world.worldFlags.filter((flag) => flag === dungeonRoomFlag('fungal_vestibule'))).toHaveLength(1)
  })
})
