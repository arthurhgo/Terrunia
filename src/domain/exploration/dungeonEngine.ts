import type { DungeonDefinition } from '../../content/types'
import type { GameSave } from '../game/types'

export const FUNGAL_DUNGEON_ID = 'dungeon_fungal_chambers'
export const dungeonRoomFlag = (roomId: string) => `dungeon-room-discovered:${roomId}`

type DungeonResult = { ok: true; save: GameSave } | { ok: false; message: string }

const advance = (save: GameSave, now: string, event: string) => {
  save.revision += 1
  save.updatedAt = now
  save.eventLog.push(event)
  return save
}

/** A dungeon is entered from an already unlocked ruin; no duplicate loot or quest events. */
export function enterDungeon(save: GameSave, dungeon: DungeonDefinition, now: string): DungeonResult {
  if (save.battle) return { ok: false, message: 'Termine o combate antes de entrar na ruína.' }
  if (![dungeon.entryTrailNodeId, dungeon.bossTrailNodeId].includes(save.world.currentLocationId)) {
    return { ok: false, message: 'A ruína só é acessível pelo limiar de Astravél.' }
  }
  if (!['bossCurrent', 'completed'].includes(save.world.trailNodeStates[dungeon.bossTrailNodeId] ?? '')) {
    return { ok: false, message: 'Investigue o limiar para abrir as Câmaras Fúngicas.' }
  }
  const next = structuredClone(save)
  next.world.currentLocationId = dungeon.id
  if (!next.world.unlockedLocationIds.includes(dungeon.id)) next.world.unlockedLocationIds.push(dungeon.id)
  if (!next.world.worldFlags.includes('dungeon_fungal_entered')) next.world.worldFlags.push('dungeon_fungal_entered')
  const firstRoomId = dungeon.rooms[0].id
  if (!next.world.worldFlags.includes(dungeonRoomFlag(firstRoomId))) {
    next.world.worldFlags.push(dungeonRoomFlag(firstRoomId))
    next.eventLog.push(`DungeonRoomDiscovered:${firstRoomId}`)
  }
  return { ok: true, save: advance(next, now, `DungeonEntered:${dungeon.id}`) }
}

export function discoverDungeonRoom(save: GameSave, dungeon: DungeonDefinition, roomId: string, now: string): DungeonResult {
  if (save.world.currentLocationId !== dungeon.id || save.battle) {
    return { ok: false, message: 'A sala só pode ser descoberta dentro da ruína.' }
  }
  const index = dungeon.rooms.findIndex((room) => room.id === roomId)
  if (index < 0) return { ok: false, message: 'Sala não reconhecida.' }
  if (index > 0 && !save.world.worldFlags.includes(dungeonRoomFlag(dungeon.rooms[index - 1].id))) {
    return { ok: false, message: 'Explore a sala anterior antes de avançar.' }
  }
  if (save.world.worldFlags.includes(dungeonRoomFlag(roomId))) return { ok: true, save }
  const next = structuredClone(save)
  next.world.worldFlags.push(dungeonRoomFlag(roomId))
  return { ok: true, save: advance(next, now, `DungeonRoomDiscovered:${roomId}`) }
}

export function exitDungeon(save: GameSave, dungeon: DungeonDefinition, now: string): DungeonResult {
  if (save.world.currentLocationId !== dungeon.id || save.battle) {
    return { ok: false, message: 'Não é possível sair da ruína durante o combate.' }
  }
  const next = structuredClone(save)
  next.world.currentLocationId = dungeon.entryTrailNodeId
  return { ok: true, save: advance(next, now, `DungeonExited:${dungeon.id}`) }
}
