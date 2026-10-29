import type { ContentCatalog } from '../../content/catalog'
import type { GameSave } from '../game/types'

export type WorldSceneKind = 'terran' | 'expedition' | 'dungeon' | 'combat'

export type WorldScene = {
  kind: WorldSceneKind
  key: string
}

/**
 * Selects the single immersive viewport shown to the player.
 *
 * Combat has priority over the physical location because a battle is a temporary
 * state inside the current expedition room/node, not a second world location.
 */
export const getWorldScene = (save: GameSave, catalog: ContentCatalog): WorldScene => {
  if (save.battle) {
    return { kind: 'combat', key: `combat:${save.battle.id}` }
  }

  if (save.world.currentLocationId === catalog.dungeons.dungeon_fungal_chambers.id) {
    return { kind: 'dungeon', key: `dungeon:${save.world.currentLocationId}` }
  }

  const isExpedition = catalog.trails.trail_astravel_entry.nodes.some(
    (node) => node.id === save.world.currentLocationId,
  )
  if (isExpedition) {
    return { kind: 'expedition', key: `expedition:${save.world.currentLocationId}` }
  }

  return { kind: 'terran', key: `terran:${save.world.currentLocationId}` }
}
