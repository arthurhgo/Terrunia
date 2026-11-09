import type { DungeonDefinition, TrailDefinition } from '../../content/types'
import type { GameSave, DungeonRunState } from '../game/types'
import { FUNGAL_BOSS_ENCOUNTER_ID, FUNGAL_ROOM_IDS } from '../../content/fungalChambers'
import { createRandomId } from '../shared/randomId'

export const FUNGAL_DUNGEON_ID = 'dungeon_fungal_chambers'
export const dungeonRoomFlag = (roomId: string) => `dungeon-room-discovered:${roomId}`
export const dungeonStageId = (roomId: string, stage: number) => `encounter_${roomId}_stage_${stage}`

type DungeonResult = { ok: true; save: GameSave } | { ok: false; message: string }

const advance = (save: GameSave, now: string, event: string) => {
  save.revision += 1
  save.updatedAt = now
  save.eventLog.push(event)
  return save
}

export const createDungeonRun = (now: string, runId = createRandomId()): DungeonRunState => ({
  runId, dungeonId: FUNGAL_DUNGEON_ID,
  roomIndex: 0, stageIndex: 1, mode: 'stages',
  completedStageIds: [], clearedRoomIds: [],
  activeEncounterId: null, createdAt: now,
})

export const dungeonNextEncounter = (run: DungeonRunState): string | null =>
  run.mode === 'won' ? null : run.mode === 'boss'
    ? FUNGAL_BOSS_ENCOUNTER_ID
    : dungeonStageId(FUNGAL_ROOM_IDS[run.roomIndex], run.stageIndex)

export function startDungeonEncounter(
  save: GameSave, roomId: string, now: string,
): DungeonResult {
  const run = save.dungeonRun
  if (save.world.currentLocationId !== FUNGAL_DUNGEON_ID || save.battle || !run || run.mode === 'won')
    return { ok: false, message: 'Não há um estágio disponível nesta tentativa.' }
  if (FUNGAL_ROOM_IDS[run.roomIndex] !== roomId)
    return { ok: false, message: 'Conclua os estágios anteriores antes de avançar.' }
  if (run.activeEncounterId) return { ok: false, message: 'Encontro já registrado nesta tentativa.' }
  const next = structuredClone(save)
  next.dungeonRun!.activeEncounterId = dungeonNextEncounter(run)
  return { ok: true, save: advance(next, now, `DungeonEncounterStarted:${next.dungeonRun!.activeEncounterId}`) }
}

export function claimDungeonEncounter(
  save: GameSave, encounterId: string, now: string,
): DungeonResult {
  const run = save.dungeonRun
  if (!run || run.activeEncounterId !== encounterId || dungeonNextEncounter(run) !== encounterId)
    return { ok: false, message: 'A tentativa já avançou ou o encontro não corresponde ao estágio atual.' }
  const next = structuredClone(save)
  const progress = next.dungeonRun!
  progress.activeEncounterId = null
  if (progress.mode === 'boss') {
    progress.mode = 'won'
    next.eventLog.push(`DungeonBossDefeated:${progress.runId}`)
  } else {
    progress.completedStageIds.push(encounterId)
    if (progress.stageIndex < 3) {
      progress.stageIndex = (progress.stageIndex + 1) as 1 | 2 | 3
    } else {
      progress.clearedRoomIds.push(FUNGAL_ROOM_IDS[progress.roomIndex])
      if (progress.roomIndex === FUNGAL_ROOM_IDS.length - 1) progress.mode = 'boss'
      else { progress.roomIndex += 1; progress.stageIndex = 1 }
    }
  }
  return { ok: true, save: advance(next, now, `DungeonEncounterCleared:${encounterId}`) }
}

/** Only source trail membership + explicitly unlocked boss grant access.
 * Reentering through the Portal still works after v0.5.13.1.
 */
export function enterDungeon(
  save: GameSave, dungeon: DungeonDefinition, now: string, sourceTrail?: TrailDefinition,
): DungeonResult {
  if (save.battle) return { ok: false, message: 'Termine o combate antes de entrar na ruína.' }
  const currentLocation = save.world.currentLocationId
  const directEntry = [dungeon.entryTrailNodeId, dungeon.bossTrailNodeId].includes(currentLocation)
  const sameTrail = sourceTrail?.nodes.some((node) => node.id === dungeon.entryTrailNodeId)
    && sourceTrail.nodes.some((node) => node.id === dungeon.bossTrailNodeId)
    && sourceTrail.nodes.some((node) => node.id === currentLocation)
  if (!directEntry && !sameTrail) {
    return { ok: false, message: 'A ruína só é acessível pela trilha de Astravél.' }
  }
  if (!['bossCurrent', 'completed'].includes(save.world.trailNodeStates[dungeon.bossTrailNodeId] ?? '')) {
    return { ok: false, message: 'Investigue o limiar para abrir as Câmaras Fúngicas.' }
  }
  const next = structuredClone(save)
  next.world.currentLocationId = dungeon.id
  next.dungeonRun = createDungeonRun(now)
  if (!next.world.unlockedLocationIds.includes(dungeon.id)) next.world.unlockedLocationIds.push(dungeon.id)
  if (!next.world.worldFlags.includes('dungeon_fungal_entered')) next.world.worldFlags.push('dungeon_fungal_entered')
  const firstRoomId = dungeon.rooms[0].id
  if (!next.world.worldFlags.includes(dungeonRoomFlag(firstRoomId))) {
    next.world.worldFlags.push(dungeonRoomFlag(firstRoomId))
    next.eventLog.push(`DungeonRoomDiscovered:${firstRoomId}`)
  }
  return { ok: true, save: advance(next, now, `DungeonEntered:${dungeon.id}`) }
}

/** Discovery remains non-rewarding; current room is the only room accessible this run. */
export function discoverDungeonRoom(save: GameSave, dungeon: DungeonDefinition, roomId: string, now: string): DungeonResult {
  if (save.world.currentLocationId !== dungeon.id || save.battle)
    return { ok: false, message: 'A sala só pode ser descoberta dentro da ruína.' }
  const index = dungeon.rooms.findIndex((room) => room.id === roomId)
  if (index < 0) return { ok: false, message: 'Sala não reconhecida.' }
  const run = save.dungeonRun
  if (run && index > run.roomIndex) return { ok: false, message: 'Conclua os três estágios da sala anterior.' }
  if (!run && index > 0 && !save.world.worldFlags.includes(dungeonRoomFlag(dungeon.rooms[index - 1].id)))
    return { ok: false, message: 'Explore a sala anterior antes de avançar.' }
  if (save.world.worldFlags.includes(dungeonRoomFlag(roomId))) return { ok: true, save }
  const next = structuredClone(save)
  next.world.worldFlags.push(dungeonRoomFlag(roomId))
  return { ok: true, save: advance(next, now, `DungeonRoomDiscovered:${roomId}`) }
}

export function exitDungeon(save: GameSave, dungeon: DungeonDefinition, now: string): DungeonResult {
  if (save.world.currentLocationId !== dungeon.id || save.battle)
    return { ok: false, message: 'Não é possível sair da ruína durante o combate.' }
  const next = structuredClone(save)
  next.world.currentLocationId = dungeon.entryTrailNodeId
  next.dungeonRun = null
  return { ok: true, save: advance(next, now, `DungeonExited:${dungeon.id}`) }
}
