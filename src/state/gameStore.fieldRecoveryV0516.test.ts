import { afterEach, describe, expect, it } from 'vitest'
import { content } from '../content/catalog'
import { bindPrologueWeapon, createNewSave } from '../domain/game/createSave'
import { deriveCharacterStats } from '../domain/character/derivedStats'
import { createBattle } from '../domain/combat/engine'
import { useGameStore } from './gameStore'

const now = '2026-11-12T13:00:00.000Z'
const checkpoints = [
  { nodeId: 'astravel_luminous_02', recovery: { hp: 8, mp: 2 } },
  { nodeId: 'astravel_moth_03', recovery: { hp: 10, mp: 3 } },
  { nodeId: 'astravel_spore_bank_04', recovery: { hp: 8, mp: 2 } },
] as const

afterEach(() => {
  useGameStore.getState().resetSession()
})

describe('v0.5.16 — recuperação pós-vitória sem recompensas duplicadas', () => {
  for (const stage of checkpoints) {
    it(stage.nodeId + ': cura somente quando o jogador reivindica a vitória, uma vez', () => {
      const original = createNewSave('recovery-' + stage.nodeId, 'Testador', 'character.terririan.default', content, now)
      const linked = bindPrologueWeapon(original, content, now, 'test-starter-weapon-' + stage.nodeId)
      expect(linked.ok).toBe(true)
      if (!linked.ok) return
      const save = linked.value
      const trail = content.trails.trail_astravel_entry
      const target = trail.nodes.find(node => node.id === stage.nodeId)!
      expect(target.type).toBe('battle')
      for (const node of trail.nodes) {
        if (node.index < target.index) save.world.trailNodeStates[node.id] = 'completed'
        if (node.id === target.id) save.world.trailNodeStates[node.id] = 'current'
      }
      save.world.currentLocationId = stage.nodeId
      save.quests.vs_astravel_first_contact.status = 'active'
      const encounter = content.encounters[target.encounterId!]
      expect(encounter.rewards.fieldRecovery).toEqual(stage.recovery)
      const stats = deriveCharacterStats(save, content)
      const initialHp = Math.max(1, stats.life.value - 12)
      const initialMp = Math.max(0, stats.mana.value - 6)
      save.vitals.hp = initialHp
      save.vitals.mp = initialMp
      const battle = createBattle(save, encounter, content, 'recovery-battle-' + stage.nodeId, { manualInitiative: true })
      battle.phase = 'Victory'
      battle.claimed = false
      for (const combatant of Object.values(battle.combatants)) if (combatant.side === 'enemy') {
        combatant.alive = false
        combatant.hp = 0
      }
      save.battle = battle
      useGameStore.setState({ save, ownerId: save.ownerId, status: 'ready' })
      const goldBefore = save.wallet.gold
      const xpBefore = save.character.xp
      const beforeClaim = structuredClone(useGameStore.getState().save!)
      expect(beforeClaim.vitals).toEqual({ hp: initialHp, mp: initialMp })
      useGameStore.getState().claimBattleRewards()
      const afterClaim = useGameStore.getState().save!
      expect(afterClaim.battle?.claimed).toBe(true)
      expect(afterClaim.vitals.hp).toBe(Math.min(stats.life.value, initialHp + stage.recovery.hp))
      expect(afterClaim.vitals.mp).toBe(Math.min(stats.mana.value, initialMp + stage.recovery.mp))
      expect(afterClaim.eventLog.filter(event => event === 'FieldRecovery:' + stage.nodeId)).toHaveLength(1)
      expect(afterClaim.wallet.gold).toBe(goldBefore + encounter.rewards.gold)
      expect(afterClaim.character.xp).toBe(xpBefore + encounter.rewards.characterXp)
      const claimedSnapshot = structuredClone(afterClaim)
      useGameStore.getState().claimBattleRewards()
      expect(useGameStore.getState().save).toEqual(claimedSnapshot)
    })
  }
})
