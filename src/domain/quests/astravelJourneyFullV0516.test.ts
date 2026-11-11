import { describe, expect, it } from 'vitest'
import { content as catalog } from '../../content/catalog'
import { FUNGAL_BOSS_ENCOUNTER_ID, FUNGAL_ROOM_IDS } from '../../content/fungalChambers'
import type { EncounterDefinition, TrailNodeDefinition } from '../../content/types'
import { createNewSave } from '../game/createSave'
import type { GameSave } from '../game/types'
import { createBattle, isProtectedBoss, submitBattleCommand } from '../combat/engine'
import { checkTrailQuestGate, completeTrailNode } from '../exploration/trailEngine'
import { claimDungeonEncounter, enterDungeon, startDungeonEncounter } from '../exploration/dungeonEngine'
import { acceptQuest, applyQuestEvent, offerQuest, refreshQuestAvailability, turnInQuest } from './questEngine'
import { currentQuestChapterV0516, isQuestOfferUnlockedV0516 } from './questPacingV0516'
import { getExpeditionReportV0516, getQuestCadenceMetricsV0516 } from './questFlowV0516'

const trail = catalog.trails.trail_astravel_entry
const combatNodes = trail.nodes.filter(node => node.type === 'battle' || node.type === 'boss')
const now = '2026-11-11T15:00:00.000Z'
const make = () => createNewSave('full-journey-v0516', 'Exploradora', 'character.terririan.default', catalog, now)

function take<T>(result: { ok: true; value: T } | { ok: false; message: string }): T {
  if (!result.ok) throw new Error(result.message)
  return result.value
}

function offerAndAccept(save: GameSave, questId: string) {
  const offered = take(offerQuest(save, questId, catalog, now))
  return take(acceptQuest(offered, questId, catalog, now))
}

function handIn(save: GameSave, questId: string) {
  const quest = catalog.quests[questId]
  const previous = save.wallet.gold
  const delivered = take(turnInQuest(save, questId, quest.turnInNpcId, catalog, now))
  expect(delivered.quests[questId].status).toBe('completed')
  expect(delivered.eventLog.filter(event => event === 'QuestCompleted:' + questId)).toHaveLength(1)
  expect(delivered.wallet.gold).toBeGreaterThanOrEqual(previous)
  const duplicate = turnInQuest(delivered, questId, quest.turnInNpcId, catalog, now)
  expect(duplicate.ok).toBe(false)
  return delivered
}

/** Actual battle state machine, seeded through its battle UUID, is exercised.
 * The QA player gets artificially high stats ONLY to prove turn/phase/target
 * plumbing for all encounters; this cannot demonstrate balance or survivability. */
function exerciseMotor(save: GameSave, encounter: EncounterDefinition, seed: string) {
  let battle = createBattle(save, encounter, catalog, seed, { manualInitiative: true })
  const player = battle.combatants.combatant_player
  player.maxHp = 30000; player.hp = 30000
  player.attackPower = 1200; player.mitigation = 700; player.initiative = 800
  player.attackDie = 12
  battle = take(submitBattleCommand(battle, { type: 'rollInitiative' }, catalog))
  let commands = 0
  while (battle.phase !== 'Victory' && battle.phase !== 'Defeat' && commands < 90) {
    if (battle.phase !== 'AwaitingAction') throw new Error(seed + ': battle stuck at ' + battle.phase)
    const target = Object.values(battle.combatants).find(actor => actor.side === 'enemy' &&
      actor.alive && !isProtectedBoss(battle, actor))
    if (!target) throw new Error(seed + ': no valid target')
    battle = take(submitBattleCommand(battle, { type: 'attack', targetId: target.id }, catalog))
    commands++
  }
  expect(battle.phase, encounter.id).toBe('Victory')
  expect(commands, encounter.id).toBeLessThan(90)
  return battle
}

function completeFieldBattle(save: GameSave, node: TrailNodeDefinition) {
  expect(node.type).toBe('battle')
  expect(checkTrailQuestGate(save, node, catalog).ok).toBe(true)
  expect(save.world.trailNodeStates[node.id]).toBe('current')
  const encounter = catalog.encounters[node.encounterId!]
  expect(encounter).toBeDefined()
  const fight = exerciseMotor(save, encounter, 'qa-v0516-' + node.id)
  const completed = take(completeTrailNode(save, trail, node.id, now))
  let next = completed.save
  // Mirror authoritative field-claim event delivery, without granting test-
  // only rewards. Source node and the actual defeated enemy roster are real.
  next = applyQuestEvent(next, { type: 'visit', targetId: node.id }, catalog, now)
  for (const enemy of Object.values(fight.combatants).filter(actor => actor.side === 'enemy' && !actor.alive)) {
    next = applyQuestEvent(next, { type: 'kill', targetId: enemy.definitionId }, catalog, now)
  }
  next = refreshQuestAvailability(next, catalog, now)
  return next
}

describe('v0.5.16 — auditoria integral de 15 marcos (FSM + desbloqueio + 4 salas)', () => {
  it('executa os 14 confrontos de campo e as 13 batalhas das Câmaras; respeita as entregas nos marcos 5/10/15', () => {
    expect(combatNodes).toHaveLength(15)
    expect(combatNodes.map(node => node.index)).toEqual(Array.from({ length: 15 }, (_, index) => index + 1))
    let save = make()
    save.world.currentLocationId = 'location_terran_portal_plaza'
    save.world.trailNodeStates.astravel_entry = 'current'
    save = offerAndAccept(save, 'vs_astravel_first_contact')
    save = applyQuestEvent(save, { type: 'talk', targetId: 'npc_eldamar' }, catalog, now)
    const entry = take(completeTrailNode(save, trail, 'astravel_entry', now))
    save = applyQuestEvent(entry.save, { type: 'visit', targetId: 'astravel_entry' }, catalog, now)
    expect(save.world.trailNodeStates.astravel_fungorro_01).toBe('current')

    for (const node of combatNodes.slice(0, 14)) {
      if (node.index === 6) {
        expect(checkTrailQuestGate(save, node, catalog).ok).toBe(false)
        expect(save.quests.vs_astravel_first_contact.status).toBe('ready_to_turn_in')
        expect(currentQuestChapterV0516(save)).toBe('spores')
        save = handIn(save, 'vs_astravel_first_contact')
        expect(isQuestOfferUnlockedV0516(save, catalog.quests.main_astravel_lost_hunters)).toBe(true)
        save = offerAndAccept(save, 'main_astravel_lost_hunters')
      }
      if (node.index === 11) {
        expect(checkTrailQuestGate(save, node, catalog).ok).toBe(false)
        expect(save.quests.main_astravel_lost_hunters.status).toBe('ready_to_turn_in')
        expect(currentQuestChapterV0516(save)).toBe('roots')
        save = handIn(save, 'main_astravel_lost_hunters')
        expect(isQuestOfferUnlockedV0516(save, catalog.quests.main_astravel_corruption)).toBe(true)
        save = offerAndAccept(save, 'main_astravel_corruption')
      }
      save = completeFieldBattle(save, node)
      if (node.index === 1) {
        expect(save.quests.vs_astravel_first_contact.status).toBe('ready_to_turn_in')
        // It is ready after the first encounter but must not require early
        // hand-in; the player can continue uninterrupted to checkpoint 5.
      }
      if (node.index === 5) {
        expect(save.world.trailNodeStates.astravel_camp_03).toBe('completed')
        expect(save.quests.vs_astravel_first_contact.status).toBe('ready_to_turn_in')
      }
      if (node.index === 10) {
        expect(save.world.trailNodeStates.astravel_hunter_refuge_10).toBe('completed')
        expect(save.quests.main_astravel_lost_hunters.status).toBe('ready_to_turn_in')
      }
    }
    expect(save.world.trailNodeStates.astravel_boss_preview).toBe('bossCurrent')
    expect(checkTrailQuestGate(save, combatNodes[14], catalog).ok).toBe(true)
    expect(save.quests.main_astravel_corruption.status).toBe('active')

    // Existing game rule: no implicit clan auto-selection, even if the story is
    // otherwise ready. The QA fixture models an already-recruited character.
    const dungeon = catalog.dungeons.dungeon_fungal_chambers
    const noClan = enterDungeon(save, dungeon, now, trail)
    expect(noClan.ok).toBe(false)
    if (!noClan.ok) expect(noClan.message).toContain('Clã')
    const clanId = Object.keys(catalog.clans)[0]
    expect(clanId).toBeDefined()
    save.character.clan.clanId = clanId

    const joined = enterDungeon(save, dungeon, now, trail)
    expect(joined.ok).toBe(true)
    if (!joined.ok) return
    save = joined.save
    const observed: string[] = []
    for (let index = 0; index < 13; index++) {
      const room = FUNGAL_ROOM_IDS[Math.min(3, Math.floor(index / 3))]
      const prepared = startDungeonEncounter(save, room, now)
      expect(prepared.ok, 'Dungeon encounter ' + (index + 1)).toBe(true)
      if (!prepared.ok) return
      const encounterId = prepared.save.dungeonRun!.activeEncounterId!
      const encounter = catalog.encounters[encounterId]
      expect(encounter).toBeDefined()
      if (index === 12) expect(encounterId).toBe(FUNGAL_BOSS_ENCOUNTER_ID)
      const battle = exerciseMotor(prepared.save, encounter, 'qa-v0516-dungeon-' + index)
      expect(battle.phase).toBe('Victory')
      const progress = claimDungeonEncounter(prepared.save, encounterId, now)
      expect(progress.ok).toBe(true)
      if (!progress.ok) return
      save = progress.save
      observed.push(encounterId)
    }
    expect(new Set(observed).size).toBe(13)
    expect(save.dungeonRun?.mode).toBe('won')
    const final = take(completeTrailNode(save, trail, 'astravel_boss_preview', now))
    save = applyQuestEvent(final.save, { type: 'visit', targetId: 'astravel_boss_preview' }, catalog, now)
    expect(save.quests.main_astravel_corruption.status).toBe('ready_to_turn_in')
    save = handIn(save, 'main_astravel_corruption')
    expect(trail.nodes.filter(node => save.world.trailNodeStates[node.id] === 'completed')).toHaveLength(16)
    const report = getExpeditionReportV0516(save, catalog)
    expect(report.completedEncounters).toBe(15)
    expect(report.totalEncounters).toBe(15)
    expect(report.chapter).toBe('aftermath')
    expect(report.discoveries).toHaveLength(8)
    expect(getQuestCadenceMetricsV0516(save, catalog).combats).toBe(15)
    expect(save.quests.vs_astravel_first_contact.status).toBe('completed')
    expect(save.quests.main_astravel_lost_hunters.status).toBe('completed')
    expect(save.quests.main_astravel_corruption.status).toBe('completed')
  })

  it('não permite que capítulo posterior ignore entregas ou marque boss vencido antes das 12 salas', () => {
    const save = make()
    const chapter2 = combatNodes[5]
    expect(checkTrailQuestGate(save, chapter2, catalog).ok).toBe(false)
    expect(checkTrailQuestGate(save, combatNodes[10], catalog).ok).toBe(false)
    const earlyBoss = completeTrailNode(save, trail, 'astravel_boss_preview', now)
    expect(earlyBoss.ok).toBe(false)
    const before = structuredClone(save)
    const skipped = completeTrailNode(save, trail, 'astravel_camp_03', now)
    expect(skipped.ok).toBe(false)
    expect(save).toEqual(before)
  })
})
