import { content } from '../../content/catalog'
import type { GameSave } from '../game/types'
import { deriveCharacterStats } from '../character/derivedStats'
import { fail, ok, type Result } from '../shared/types'

/** Field-use potion, restricted to the safe exploration state.
 * No damage, status attack or projectile effect may run without a combat turn.
 */
export function applyFieldConsumable(save: GameSave, instanceId: string, now: string): Result<GameSave> {
  if (save.battle) return fail('IN_BATTLE', 'Em combate, use poções pela barra de ações.')
  if (!content.trails.trail_astravel_entry.nodes.some((n) => n.id === save.world.currentLocationId)) {
    return fail('NOT_IN_EXPEDITION', 'Uso de campo disponível durante a exploração de Astravél.')
  }
  const inventory = save.inventory.find((instance) => instance.instanceId === instanceId)
  const item = inventory && content.items[inventory.definitionId]
  if (!inventory || !item || item.category !== 'consumable' || inventory.quantity < 1
    || item.combatKind || item.questLocked) return fail('INVALID_POTION', 'Este item não é uma poção de exploração.')
  const restorative = item.combatEffects.filter((effect) => effect.type === 'restoreHp' || effect.type === 'restoreMp')
  if (!restorative.length || item.combatEffects.some((effect) => effect.type !== 'restoreHp' && effect.type !== 'restoreMp')) {
    return fail('NOT_RESTORATIVE', 'Este item precisa ser usado em combate.')
  }
  const stats = deriveCharacterStats(save, content)
  const hpGain = restorative.reduce((total, effect) => total + (effect.type === 'restoreHp' ? effect.value : 0), 0)
  const mpGain = restorative.reduce((total, effect) => total + (effect.type === 'restoreMp' ? effect.value : 0), 0)
  const healed = Math.min(hpGain, Math.max(0, stats.life.value - save.vitals.hp))
  const restoredMana = Math.min(mpGain, Math.max(0, stats.mana.value - save.vitals.mp))
  if (healed + restoredMana <= 0) return fail('ALREADY_FULL', 'Vida e Mana já estão completas.')
  const next = structuredClone(save)
  next.vitals.hp = Math.min(stats.life.value, next.vitals.hp + hpGain)
  next.vitals.mp = Math.min(stats.mana.value, next.vitals.mp + mpGain)
  const owned = next.inventory.find((instance) => instance.instanceId === instanceId)!
  owned.quantity -= 1
  if (owned.quantity === 0) next.inventory = next.inventory.filter((instance) => instance.instanceId !== instanceId)
  next.eventLog.push(`FieldPotion:${item.id}:HP+${healed}:MP+${restoredMana}`)
  next.updatedAt = now
  next.revision += 1
  return ok(next)
}
