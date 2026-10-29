import { describe, expect, it } from 'vitest'
import { content } from '../../content/catalog'
import { findDungeonPath, getDungeonPoint, isDungeonWalkable } from './dungeonNavigation'

const dungeon = content.dungeons.dungeon_fungal_chambers

describe('grade pixelada das Câmaras Fúngicas', () => {
  it('liga quatro salas por passagens transitáveis sem atravessar paredes', () => {
    for (const room of dungeon.rooms) expect(isDungeonWalkable(getDungeonPoint(room), dungeon)).toBe(true)
    for (let index = 1; index < dungeon.rooms.length; index += 1) {
      const path = findDungeonPath(getDungeonPoint(dungeon.rooms[index - 1]), getDungeonPoint(dungeon.rooms[index]), dungeon)
      expect(path.length).toBeGreaterThan(0)
      expect(path.every((point) => isDungeonWalkable(point, dungeon))).toBe(true)
    }
  })

  it('mantém as paredes como colisão independente da arte e aceita cliques no mesmo tile', () => {
    expect(isDungeonWalkable({ x: 3, y: 3 }, dungeon)).toBe(false)
    const start = getDungeonPoint(dungeon.rooms[0])
    expect(findDungeonPath(start, { x: start.x + 1, y: start.y + 1 }, dungeon)).toHaveLength(1)
    expect(findDungeonPath(start, { x: -50, y: -50 }, dungeon).length).toBeGreaterThan(0)
  })
})
