import { describe, expect, it } from 'vitest'
import { content } from '../../content/catalog'
import { deriveCharacterStats } from '../character/derivedStats'
import { createBattle } from '../combat/engine'
import { createNewSave } from '../game/createSave'
import { acceptQuest, applyQuestEvent, offerQuest, refreshQuestAvailability, turnInQuest } from '../quests/questEngine'
import { migrateAndValidateSave } from '../../persistence/saveSchema'
import { buyFromSylwen, PLAYER_HOME_FLAG, PREPARE_HOME_OBJECTIVE, receiveDaerynAid, restAtHome } from './services'
import { BASE_LOCATION_ID } from './base'

const now = '2026-10-29T14:00:00.000Z'
const fresh = () => createNewSave('tester', 'Terial', 'character.terririan.default', content, now)

describe('serviços de Terran e progressão da casa', () => {
  it('encadeia as missões de Daeryn, Vorren e Lithwynn e mantém recompensas condicionadas à entrega', () => {
    let save = fresh()
    save.quests.vs_astravel_first_contact.status = 'completed'
    const chain = [
      { id: 'main_terran_first_home', npc: 'npc_daeryn', target: 'prepare_player_home', rewardFlag: 'player_home_unlocked' },
      { id: 'main_vorren_bestiary', npc: 'npc_vorren', target: 'study_vorren_bestiary', rewardFlag: 'bestiary_unlocked' },
      { id: 'main_lithwynn_signs', npc: 'npc_lithwynn', target: 'examine_lithwynn_marks', rewardFlag: '' },
    ]
    save = refreshQuestAvailability(save, content, now)
    for (const entry of chain) {
      const offered = offerQuest(save, entry.id, content, now)
      expect(offered.ok).toBe(true)
      if (!offered.ok) return
      const accepted = acceptQuest(offered.value, entry.id, content, now)
      expect(accepted.ok).toBe(true)
      if (!accepted.ok) return
      const ready = applyQuestEvent(accepted.value, { type: 'interact', targetId: entry.target }, content, now)
      expect(ready.quests[entry.id].status).toBe('ready_to_turn_in')
      if (entry.rewardFlag) expect(ready.world.worldFlags).not.toContain(entry.rewardFlag)
      const completed = turnInQuest(ready, entry.id, entry.npc, content, now)
      expect(completed.ok).toBe(true)
      if (!completed.ok) return
      save = completed.value
      if (entry.rewardFlag) expect(save.world.worldFlags).toContain(entry.rewardFlag)
      expect(save.quests[entry.id].status).toBe('completed')
    }
    expect(save.character.xp).toBe(125)
    expect(save.wallet.gold).toBe(55)
    expect(save.essence.current).toBe(40)
    expect(migrateAndValidateSave(save).quests.main_lithwynn_signs.status).toBe('completed')
  })

  it('disponibiliza a casa apenas depois da missão aceita e entregue a Daeryn', () => {
    const save = fresh()
    expect(restAtHome(save, content, now)).toMatchObject({ ok: false, code: 'REST_UNAVAILABLE' })
    save.quests.vs_astravel_first_contact.status = 'completed'
    const available = refreshQuestAvailability(save, content, now)
    expect(available.quests.main_terran_first_home.status).toBe('available')
    const offered = offerQuest(available, 'main_terran_first_home', content, now)
    expect(offered.ok).toBe(true)
    if (!offered.ok) return
    const accepted = acceptQuest(offered.value, 'main_terran_first_home', content, now)
    expect(accepted.ok).toBe(true)
    if (!accepted.ok) return
    const prepared = applyQuestEvent(accepted.value, { type: 'interact', targetId: PREPARE_HOME_OBJECTIVE }, content, now)
    expect(prepared.quests.main_terran_first_home.status).toBe('ready_to_turn_in')
    expect(prepared.world.worldFlags).not.toContain(PLAYER_HOME_FLAG)
    expect(turnInQuest(prepared, 'main_terran_first_home', 'npc_sylwen', content, now)).toMatchObject({ ok: false, code: 'WRONG_TURN_IN_NPC' })
    const completed = turnInQuest(prepared, 'main_terran_first_home', 'npc_daeryn', content, now)
    expect(completed.ok).toBe(true)
    if (!completed.ok) return
    expect(completed.value.world.worldFlags.filter((flag) => flag === PLAYER_HOME_FLAG)).toHaveLength(1)
    expect(completed.value.character.xp).toBe(30)
    expect(completed.value.wallet.gold).toBe(save.wallet.gold + 10)
    expect(turnInQuest(completed.value, 'main_terran_first_home', 'npc_daeryn', content, now)).toMatchObject({ ok: false, code: 'QUEST_NOT_READY' })
  })

  it('persiste PV/MP entre combates, restaura no alojamento e recusa descanso em instâncias', () => {
    const save = fresh()
    const stats = deriveCharacterStats(save, content)
    save.vitals = { hp: 5, mp: 2 }
    const old = { ...save, schemaVersion: 7, vitals: undefined }
    const migrated = migrateAndValidateSave(old)
    expect(migrated.vitals).toEqual({ hp: stats.life.value, mp: stats.mana.value })
    const battle = createBattle(save, content.encounters.encounter_fungorro_01, content)
    // A iniciativa pode permitir uma ação inimiga antes do primeiro comando.
    expect(battle.combatants.combatant_player.hp).toBeGreaterThan(0)
    expect(battle.combatants.combatant_player.hp).toBeLessThanOrEqual(5)
    expect(battle.combatants.combatant_player.mp).toBe(2)
    save.world.worldFlags.push(PLAYER_HOME_FLAG)
    save.world.currentLocationId = BASE_LOCATION_ID
    const healed = restAtHome(save, content, now)
    expect(healed.ok).toBe(true)
    if (!healed.ok) return
    expect(healed.value.vitals).toEqual({ hp: stats.life.value, mp: stats.mana.value })
    expect(healed.value.world.worldFlags).toContain(PLAYER_HOME_FLAG)
    save.world.currentLocationId = 'astravel_entry'
    expect(restAtHome(save, content, now)).toMatchObject({ ok: false, code: 'REST_UNAVAILABLE' })
  })

  it('cobra ouro, verifica local/quantidade e adiciona consumível sem tocar nos cinco vínculos', () => {
    const save = fresh()
    save.wallet.gold = 40
    save.world.currentLocationId = 'location_terran_daeryn_house'
    expect(buyFromSylwen(save, 'consumable_minor_tonic', 3, content, now)).toMatchObject({ ok: false, code: 'SHOP_GOLD' })
    expect(buyFromSylwen(save, 'drop_fungal_nucleus', 1, content, now)).toMatchObject({ ok: false, code: 'SHOP_ITEM' })
    expect(buyFromSylwen(save, 'consumable_minor_tonic', 0, content, now)).toMatchObject({ ok: false, code: 'SHOP_QUANTITY' })
    const purchased = buyFromSylwen(save, 'consumable_simple_ether', 2, content, now)
    expect(purchased.ok).toBe(true)
    if (!purchased.ok) return
    expect(purchased.value.wallet.gold).toBe(4)
    expect(purchased.value.inventory[0]).toMatchObject({ definitionId: 'consumable_simple_ether', quantity: 2 })
    expect(purchased.value.character.bondedEquipment).toEqual(save.character.bondedEquipment)
    expect(migrateAndValidateSave(purchased.value).inventory).toHaveLength(1)
    save.world.currentLocationId = 'location_terran_portal_plaza'
    expect(buyFromSylwen(save, 'consumable_minor_tonic', 1, content, now)).toMatchObject({ ok: false, code: 'SHOP_LOCATION' })
  })

  it('oferece socorro após derrota sem permitir cura emergencial repetível enquanto há Vida', () => {
    const save = fresh()
    save.vitals.hp = 0
    save.world.currentLocationId = 'location_terran_daeryn_house'
    const treated = receiveDaerynAid(save, content, now)
    expect(treated.ok).toBe(true)
    if (!treated.ok) return
    expect(treated.value.vitals.hp).toBeGreaterThan(0)
    expect(receiveDaerynAid(treated.value, content, now)).toMatchObject({ ok: false, code: 'AID_NOT_NEEDED' })
  })
})
