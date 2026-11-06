import type { ContentCatalog } from '../../content/catalog'
import type { GameSave } from '../game/types'
import { deriveCharacterStats } from '../character/derivedStats'
import { fail, ok, type Result } from '../shared/types'

/** BALANCE_DRAFT v0.5.7: only restorative consumables may be used in Astravél, outside battle.
 * All effects must be restoration; no offensive item, rune, status or quest material can slip through.
 */
export const isFieldConsumable = (save: GameSave, itemId: string, catalog: ContentCatalog): boolean => {
  const instance = save.inventory.find((entry) => entry.instanceId === itemId)
  const definition = instance ? catalog.items[instance.definitionId] : undefined
  if (!instance || !definition || instance.quantity < 1 || instance.locked || definition.questLocked) return false
  return definition.category === 'consumable' && definition.combatEffects.length > 0 &&
    definition.combatEffects.every((effect) => effect.type === 'restoreHp' || effect.type === 'restoreMp')
}

export const useFieldConsumable = (
  save: GameSave,
  itemId: string,
  catalog: ContentCatalog,
  now: string,
): Result<GameSave> => {
  if (save.battle) return fail('FIELD_IN_BATTLE', 'No combate, use o menu de ações por turno.')
  const inAstravel = catalog.trails.trail_astravel_entry.nodes.some(
    (node) => node.id === save.world.currentLocationId,
  )
  if (!inAstravel) return fail('FIELD_NOT_IN_ASTRAVEL', 'O uso de suprimentos de campo está disponível em Astravél.')
  if (!isFieldConsumable(save, itemId, catalog)) {
    return fail('FIELD_ITEM_UNAVAILABLE', 'Este item não pode ser usado fora de combate.')
  }
  const item = save.inventory.find((entry) => entry.instanceId === itemId)!
  const definition = catalog.items[item.definitionId]
  const stats = deriveCharacterStats(save, catalog)
  const maxHp = stats.life.value
  const maxMp = stats.mana.value
  let hp = save.vitals.hp
  let mp = save.vitals.mp
  for (const effect of definition.combatEffects) {
    if (effect.type === 'restoreHp' && hp < maxHp) hp = Math.min(maxHp, hp + effect.value)
    if (effect.type === 'restoreMp' && mp < maxMp) mp = Math.min(maxMp, mp + effect.value)
  }
  if (hp === save.vitals.hp && mp === save.vitals.mp) {
    return fail('FIELD_RESOURCES_FULL', 'Vida e Mana já estão completas.')
  }
  const next = structuredClone(save)
  next.vitals.hp = hp
  next.vitals.mp = mp
  const consumed = next.inventory.find((entry) => entry.instanceId === itemId)!
  if (consumed.quantity > 1) consumed.quantity -= 1
  else next.inventory.splice(next.inventory.indexOf(consumed), 1)
  next.revision += 1
  next.updatedAt = now
  next.eventLog.push(`FieldConsumableUsed:${definition.id}`)
  return ok(next)
}
