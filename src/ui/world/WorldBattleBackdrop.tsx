import { useEffect, useMemo, useRef } from 'react'
import { resolveAsset } from '../../assets/assetRegistry'
import { content } from '../../content/catalog'
import type { GameSave } from '../../domain/game/types'
import { dungeonRoomFlag, FUNGAL_DUNGEON_ID } from '../../domain/exploration/dungeonEngine'
import { drawAstravel } from '../expedition/astravelArt'
import { ASTRAVEL_HEIGHT, findAstravelPath, getAstravelPoint, getAstravelCamera } from '../expedition/astravelNavigation'
import { drawFungalDungeon } from '../expedition/fungalDungeonArt'
import { findDungeonPath } from '../expedition/dungeonNavigation'
import type { WorldPoint } from '../terran/pixelCityArt'

const trail = content.trails.trail_astravel_entry
const dungeon = content.dungeons.dungeon_fungal_chambers

function astravelBattlePoint(currentLocationId: string): WorldPoint {
  const node = trail.nodes.find((candidate) => candidate.id === currentLocationId) ?? trail.nodes[0]
  const origin = getAstravelPoint(node)
  const target = { x: Math.max(28, origin.x - 42), y: Math.min(ASTRAVEL_HEIGHT - 24, origin.y + 21) }
  return findAstravelPath(origin, target, trail).at(-1) ?? origin
}

function dungeonBattlePoint(): WorldPoint {
  const room = dungeon.rooms.find((candidate) => candidate.kind === 'boss') ?? dungeon.rooms[0]
  const target = { x: room.landmark.x - 44, y: room.landmark.y + 21 }
  return findDungeonPath(room.landmark, target, dungeon).at(-1) ?? room.landmark
}

/** Keeps the physical instance visible under the turn-based battle interface. */
export function WorldBattleBackdrop({ save }: { save: GameSave }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const currentLocationId = save.world.currentLocationId
  const dungeonOrigin = currentLocationId === FUNGAL_DUNGEON_ID
  const reducedMotion = save.settings.reducedMotion
  const portraitVariant = save.character.portraitAssetId.includes('sigil') ? 'sigil' : 'terririan'
  const trailNodeStates = save.world.trailNodeStates
  const discoveredRooms = useMemo(() => new Set(dungeon.rooms
    .filter((room) => save.world.worldFlags.includes(dungeonRoomFlag(room.id)))
    .map((room) => room.id)), [save.world.worldFlags])
  const playerPoint = useMemo(
    () => dungeonOrigin ? dungeonBattlePoint() : astravelBattlePoint(currentLocationId),
    [currentLocationId, dungeonOrigin],
  )

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return
    const sheet = new Image()
    sheet.src = resolveAsset('character.terririan.map').path
    sheet.onerror = () => {
      sheet.onerror = null
      sheet.src = resolveAsset('character.terririan.map').fallback
    }
    let raf = 0
    let frame = 0
    const draw = () => {
      if (!reducedMotion) frame += 1
      if (dungeonOrigin) {
        drawFungalDungeon(ctx, dungeon, playerPoint, sheet, frame, false, 'right',
          portraitVariant, { discovered: discoveredRooms, defeated: false })
      } else {
        drawAstravel(ctx, trail, trailNodeStates, playerPoint, sheet, frame, false, 'right', portraitVariant, getAstravelCamera(playerPoint))
      }
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)
    return () => cancelAnimationFrame(raf)
  }, [discoveredRooms, dungeonOrigin, playerPoint, portraitVariant, reducedMotion, trailNodeStates])

  return <canvas ref={canvasRef} width={384} height={256} className="battle-world-canvas" aria-hidden="true" />
}
