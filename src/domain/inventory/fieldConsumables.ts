import type { ContentCatalog } from '../../content/catalog'
import type { GameSave } from '../game/types'
import { deriveCharacterStats } from '../character/derivedStats'
import { fail, ok, type Result } from '../shared/types'

/** Consumables are usable while exploring, but never during combat through this path.
 * No turn is advanced; no XP, Essence Points or lore effects are granted.
 */
export const applyFieldConsumable = (
  save: GameSave, instanceId: string, catalog: ContentCatalog, now: string,
): Result<GameSave> => {
  if (save.battle) return fail('FIELD_ITEM_IN_COMBAT', 'Use o menu de itens do combate durante uma batalha.')
  const instance = save.inventory.find((item) => item.instanceId === instanceId)
  const item = instance && catalog.items[instance.definitionId]
  if (!instance || !item || instance.quantity <= 0 || item.category !== 'consumable'
    || item.combatKind || item.questLocked) return fail('INVALID_FIELD_ITEM', 'O item não pode ser utilizado em exploração.')
  const restorative = item.combatEffects.filter((effect) => effect.type === 'restoreHp' || effect.type === 'restoreMp')
  if (!restorative.length || item.combatEffects.some((effect) => effect.type === 'damage' || effect.type === 'applyStatus')) {
    return fail('FIELD_EFFECT_UNSUPPORTED', 'Somente poções restauradoras podem ser usadas fora do combate.')
  }
  const stats = deriveCharacterStats(save, catalog)
  const maxHp = stats.life.value
  const maxMp = stats.mana.value
  const missingHp = Math.max(0, maxHp - save.vitals.hp)
  const missingMp = Math.max(0, maxMp - save.vitals.mp)
  const restoresHp = restorative.some((effect) => effect.type === 'restoreHp' && missingHp > 0)
  const restoresMp = restorative.some((effect) => effect.type === 'restoreMp' && missingMp > 0)
  if (!restoresHp && !restoresMp) return fail('FIELD_RECOVERY_FULL', 'Vida e Mana já estão completas para esta poção.')
  const next = structuredClone(save)
  for (const effect of restorative) {
    if (effect.type === 'restoreHp') next.vitals.hp = Math.min(maxHp, next.vitals.hp + effect.value)
    else next.vitals.mp = Math.min(maxMp, next.vitals.mp + effect.value)
  }
  const toConsume = next.inventory.find((candidate) => candidate.instanceId === instanceId)!
  toConsume.quantity -= 1
  if (toConsume.quantity === 0) next.inventory = next.inventory.filter((candidate) => candidate.instanceId !== instanceId)
  next.updatedAt = now
  next.revision += 1
  next.eventLog.push(`FieldConsumableUsed:${item.id}`)
  return ok(next)
}
