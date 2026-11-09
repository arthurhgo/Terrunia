import { describe, expect, it } from 'vitest'
import { content } from '../../content/catalog'
import { createNewSave } from '../game/createSave'
import { acceptQuest, applyQuestEvent, offerQuest, refreshQuestAvailability, turnInQuest } from '../quests/questEngine'
import { canCompleteQuestObjectActivity } from '../terran/questActivities'
import { canJoinClan, joinClan } from './progressionEngine'
import { createBattle } from '../combat/engine'
import { createWaveBattle } from '../combat/waves'
import { useGameStore } from '../../state/gameStore'
import { getDeliverableCount, refreshDeliveryQuestProgress } from '../quests/questInventory'
import { enterClanCastle, leaveClanCastle } from './clanCastle'
import { CLAN_CASTLE_DEFINITIONS, getClanCastleId } from '../../content/clanCastlesV05142'
import { roomFurniture } from '../../ui/terran/roomContent'
import { getRoomPlan, isRoomWalkable } from '../../ui/terran/roomGeometry'
import { clanTableQuestId, clanGolemQuestId, GRANITE_GOLEM_ENCOUNTER_ID,
  GRANITE_GOLEM_ENEMY_ID, GRANITE_HEART_INSTANCE_ID, CLAN_EMBLEM_ITEM_ID,
  MAIN_CLAN_AFFILIATION_QUEST, CLAN_AFFILIATION_RITE_ID, CLAN_RECRUITMENT_WAVE
} from '../../content/clanProgressionV05142'
import { ROSETTA_CLAN_QUEST } from './clanOrientation'
import { getNpcActionableQuests } from '../quests/questSelectors'
import type { GameSave } from '../game/types'

const now = '2026-11-09T18:00:00Z'
const hall = 'location_terran_clan_hall'
const fresh = () => createNewSave('clan-user', 'Nara', 'character.terririan.default', content, now)

function candidateReady(clanId = 'rustal'): GameSave {
  const save = fresh()
  save.character.level = 4
  save.quests[ROSETTA_CLAN_QUEST].status = 'completed'
  save.world.currentLocationId = hall
  save.character.clan.candidateClanId = clanId
  save.quests[clanTableQuestId(clanId)].status = 'completed'
  save.world.portalWaveBest = CLAN_RECRUITMENT_WAVE
  return refreshQuestAvailability(save, content, now)
}

describe('v0.5.14.2 — recrutamento por onda 14, Emblema e Castelo', () => {
  it('Rosetta só conclui Os Quatro Caminhos após visita ao Salão', () => {
    let save = fresh()
    save.character.level = 4
    save.world.currentLocationId = 'location_terran_portal_plaza'
    save = refreshQuestAvailability(save, content, now)
    const offered = offerQuest(save, ROSETTA_CLAN_QUEST, content, now)
    expect(offered.ok).toBe(true)
    if (!offered.ok) return
    const accepted = acceptQuest(offered.value, ROSETTA_CLAN_QUEST, content, now)
    expect(accepted.ok).toBe(true)
    if (!accepted.ok) return
    expect(turnInQuest(accepted.value, ROSETTA_CLAN_QUEST, 'npc_rosetta', content, now).ok).toBe(false)
    save = structuredClone(accepted.value)
    save.world.currentLocationId = hall
    save = applyQuestEvent(save, { type: 'visit', targetId: hall }, content, now)
    const delivered = turnInQuest(save, ROSETTA_CLAN_QUEST, 'npc_rosetta', content, now)
    expect(delivered.ok).toBe(true)
    if (delivered.ok) expect(delivered.value.quests[MAIN_CLAN_AFFILIATION_QUEST].status).toBe('available')
  })

  it('o líder registra candidatura única e a Mesa exige interação com objeto', () => {
    let save = fresh()
    save.character.level = 4
    save.quests[ROSETTA_CLAN_QUEST].status = 'completed'
    save.world.currentLocationId = hall
    save = refreshQuestAvailability(save, content, now)
    const id = clanTableQuestId('rustal')
    const offered = offerQuest(save, id, content, now)
    expect(offered.ok).toBe(true)
    if (!offered.ok) return
    const accepted = acceptQuest(offered.value, id, content, now)
    expect(accepted.ok).toBe(true)
    if (!accepted.ok) return
    expect(accepted.value.character.clan.candidateClanId).toBe('rustal')
    expect(offerQuest(accepted.value, clanTableQuestId('dunavar'), content, now).ok).toBe(false)
    expect(canCompleteQuestObjectActivity(accepted.value, id, 'clan_initiation_table',
      ['echo_character', 'echo_clan', 'echo_class'])).toBe(true)
    expect(canCompleteQuestObjectActivity(accepted.value, id, 'clan_initiation_table',
      ['echo_clan', 'echo_character', 'echo_class'])).toBe(false)
    const solved = applyQuestEvent(accepted.value, { type: 'interact', targetId: 'clan_initiation_table' }, content, now)
    expect(turnInQuest(solved, id, 'npc_mireya_dunavar', content, now).ok).toBe(false)
    const delivered = turnInQuest(solved, id, 'npc_master_rustal', content, now)
    expect(delivered.ok).toBe(true)
    if (!delivered.ok) return
    expect(delivered.value.quests.clan_rustal_01.status).toBe('locked')
    expect(getNpcActionableQuests(delivered.value, 'npc_master_rustal', content).some(q => q.id === 'clan_rustal_01')).toBe(false)
    expect(canJoinClan(delivered.value, 'rustal', content).ok).toBe(false)
  })

  it('não usa nível do personagem: somente a onda 14 vencida libera o Golem', () => {
    let save = candidateReady()
    save.world.portalWaveBest = 13
    save.character.level = 20
    save.quests[clanGolemQuestId('rustal')].status = 'locked'
    save = refreshQuestAvailability(save, content, now)
    expect(save.quests[clanGolemQuestId('rustal')].status).toBe('locked')
    save.character.level = 4
    save.world.portalWaveBest = 14
    save = refreshQuestAvailability(save, content, now)
    expect(save.quests[clanGolemQuestId('rustal')].status).toBe('available')
    expect(save.quests[clanGolemQuestId('dunavar')].status).toBe('locked')
    const offered = offerQuest(save, clanGolemQuestId('rustal'), content, now)
    expect(offered.ok).toBe(true)
    expect(getClanCastleId('rustal')).toBeDefined()
  })

  it('a vitória no Modo Ondas registra 14 somente após recolher recompensas', () => {
    const save = candidateReady()
    save.world.currentLocationId = 'location_terran_portal_plaza'
    save.world.portalWaveBest = 13
    save.battle = createWaveBattle(save, content, 14)
    expect(save.world.portalWaveBest).toBe(13)
    save.battle.phase = 'Victory'
    for (const enemy of Object.values(save.battle.combatants).filter(c => c.side === 'enemy')) {
      enemy.hp = 0
      enemy.alive = false
    }
    useGameStore.setState({ save, ownerId: save.ownerId, status: 'ready', syncMode: 'local', syncStatus: 'saved' })
    useGameStore.getState().claimBattleRewards()
    const next = useGameStore.getState().save!
    expect(next.world.portalWaveBest).toBe(14)
    expect(next.quests[clanGolemQuestId('rustal')].status).toBe('available')
    const revision = next.revision
    useGameStore.getState().claimBattleRewards()
    expect(useGameStore.getState().save!.revision).toBe(revision)
    useGameStore.getState().resetSession()
  })

  it('líder transporta o candidato, boss garante Emblema, entrega recruta sem duplicação', () => {
    let save = candidateReady()
    const id = clanGolemQuestId('rustal')
    const offered = offerQuest(save, id, content, now)
    expect(offered.ok).toBe(true)
    if (!offered.ok) return
    const accepted = acceptQuest(offered.value, id, content, now)
    expect(accepted.ok).toBe(true)
    if (!accepted.ok) return
    save = accepted.value
    const encounter = content.encounters[GRANITE_GOLEM_ENCOUNTER_ID]
    expect(encounter.enemyDefinitionIds).toEqual([GRANITE_GOLEM_ENEMY_ID])
    expect(encounter.rewards.lootDefinitionIds.filter(i => i === CLAN_EMBLEM_ITEM_ID)).toHaveLength(1)
    expect(content.items[CLAN_EMBLEM_ITEM_ID]).toMatchObject({
      category: 'quest', questLocked: true, sellable: false, convertToEssence: false,
    })
    expect(canJoinClan(save, 'rustal', content).ok).toBe(false)
    useGameStore.setState({ save, ownerId: save.ownerId, status: 'ready', syncMode: 'local', syncStatus: 'saved' })
    useGameStore.getState().startClanGolemBattle(id)
    const started = useGameStore.getState().save!
    expect(started.battle?.phase).toBe('AwaitingInitiative')
    expect(started.battle?.clanBossQuestId).toBe(id)
    expect(started.world.currentLocationId).toBe(GRANITE_HEART_INSTANCE_ID)
    expect(Object.values(started.battle!.combatants).find(c => c.definitionId === GRANITE_GOLEM_ENEMY_ID)?.maxHp)
      .toBe(Math.ceil(started.battle!.combatants.combatant_player.maxHp * 1.1))
    const battle = structuredClone(started.battle!)
    battle.phase = 'Victory'
    for (const enemy of Object.values(battle.combatants).filter(c => c.side === 'enemy')) {
      enemy.hp = 0
      enemy.alive = false
    }
    useGameStore.setState({ save: { ...started, battle } })
    useGameStore.getState().claimBattleRewards()
    const looted = useGameStore.getState().save!
    expect(looted.quests[id].status).toBe('ready_to_turn_in')
    expect(getDeliverableCount(looted, CLAN_EMBLEM_ITEM_ID, content)).toBe(1)
    expect(looted.character.clan.clanId).toBeNull()
    useGameStore.getState().finishBattleIntoExpedition()
    expect(useGameStore.getState().save?.world.currentLocationId).toBe(hall)
    const wrong = turnInQuest(useGameStore.getState().save!, id, 'npc_mireya_dunavar', content, now)
    expect(wrong.ok).toBe(false)
    useGameStore.getState().turnInQuest(id, 'npc_master_rustal')
    const recruited = useGameStore.getState().save!
    expect(recruited.quests[id].status).toBe('completed')
    expect(recruited.character.clan.clanId).toBe('rustal')
    expect(recruited.character.clan.rank).toBe(1)
    expect(getDeliverableCount(recruited, CLAN_EMBLEM_ITEM_ID, content)).toBe(0)
    expect(joinClan(recruited, 'dunavar', content, now)).toMatchObject({ ok: false, code: 'CLAN_ALREADY_JOINED' })
    const revision = recruited.revision
    useGameStore.getState().turnInQuest(id, 'npc_master_rustal')
    expect(useGameStore.getState().save?.revision).toBe(revision)
    useGameStore.getState().resetSession()
  })

  it('o miniportal abre só depois de recrutado e leva ao castelo do Clã correto', () => {
    const save = candidateReady()
    expect(enterClanCastle(save, now).ok).toBe(false)
    save.quests[clanGolemQuestId('rustal')].status = 'completed'
    const joined = joinClan(save, 'rustal', content, now)
    expect(joined.ok).toBe(true)
    if (!joined.ok) return
    const enter = enterClanCastle(joined.value, now)
    expect(enter.ok).toBe(true)
    if (!enter.ok) return
    expect(enter.value.world.currentLocationId).toBe(getClanCastleId('rustal'))
    expect(enterClanCastle(enter.value, now).ok).toBe(false)
    const leave = leaveClanCastle(enter.value, now)
    expect(leave.ok).toBe(true)
    if (leave.ok) expect(leave.value.world.currentLocationId).toBe(hall)
    const palettes = Object.values(CLAN_CASTLE_DEFINITIONS)
    expect(new Set(palettes.map(x => x.primary)).size).toBe(4)
    expect(new Set(palettes.map(x => x.interiorId)).size).toBe(4)
    for (const castle of palettes) {
      expect(roomFurniture[castle.interiorId].some(obj => obj.behavior === 'portal')).toBe(true)
      expect(getRoomPlan(castle.interiorId).tile).toBe(castle.tile)
      expect(isRoomWalkable(castle.interiorId, getRoomPlan(castle.interiorId).spawn)).toBe(true)
    }
  })

  it('a missão Aceitar um Clã fecha após rito; sem conceder pontos de Essência diretamente', () => {
    const save = candidateReady('dunavar')
    const offer = offerQuest(save, MAIN_CLAN_AFFILIATION_QUEST, content, now)
    expect(offer.ok).toBe(true)
    if (!offer.ok) return
    const accepted = acceptQuest(offer.value, MAIN_CLAN_AFFILIATION_QUEST, content, now)
    expect(accepted.ok).toBe(true)
    if (!accepted.ok) return
    accepted.value.quests[clanGolemQuestId('dunavar')].status = 'completed'
    const joined = joinClan(accepted.value, 'dunavar', content, now)
    expect(joined.ok).toBe(true)
    if (!joined.ok) return
    const ready = applyQuestEvent(joined.value, { type: 'completeRite', targetId: CLAN_AFFILIATION_RITE_ID }, content, now)
    const closed = turnInQuest(ready, MAIN_CLAN_AFFILIATION_QUEST, 'npc_curador_nexo', content, now)
    expect(closed.ok).toBe(true)
    if (closed.ok) expect(closed.value.quests[MAIN_CLAN_AFFILIATION_QUEST].status).toBe('completed')
  })

  it('Golem usa máquina de estados e conteúdo parametrizável', () => {
    const save = candidateReady()
    const encounter = content.encounters[GRANITE_GOLEM_ENCOUNTER_ID]
    const battle = createBattle(save, encounter, content, undefined, { manualInitiative: true })
    expect(battle.phase).toBe('AwaitingInitiative')
    expect(battle.rewards.lootDefinitionIds).toContain(CLAN_EMBLEM_ITEM_ID)
    const noEmblem = structuredClone(save)
    noEmblem.quests[clanGolemQuestId('rustal')].status = 'active'
    const kill = applyQuestEvent(noEmblem, { type: 'kill', targetId: GRANITE_GOLEM_ENEMY_ID }, content, now)
    expect(refreshDeliveryQuestProgress(kill, content, now).quests[clanGolemQuestId('rustal')].status).toBe('active')
  })
})
