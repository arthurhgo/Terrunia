import { forgeRecipes, forgeUpgradeDefinitions } from '../../content/forge'
import type { ContentCatalog } from '../../content/catalog'
import type { GameSave } from '../game/types'
import { deriveCharacterStats } from '../character/derivedStats'
import { fail, ok, type Result } from '../shared/types'

export const FORGE_LOCATION_ID = 'location_terran_forge' as const
export const getForgeMaterialCount = (save: GameSave, itemId: string) => save.inventory
  .filter((item) => item.definitionId === itemId && !item.locked && !item.favorite)
  .reduce((sum, item) => sum + item.quantity, 0)

export function checkForgeRecipe(save: GameSave, recipeId: string, catalog: ContentCatalog): Result<true> {
  if (save.battle || save.world.currentLocationId !== FORGE_LOCATION_ID) return fail('FORGE_LOCATION', 'Visite Durnan na Casa do Ferreiro para forjar.')
  const recipe = forgeRecipes.find((entry) => entry.id === recipeId)
  if (!recipe) return fail('FORGE_RECIPE', 'Receita desconhecida.')
  if (recipe.outputItemId && !catalog.items[recipe.outputItemId]) return fail('FORGE_OUTPUT', 'O componente desta receita não foi cadastrado.')
  if (recipe.upgradeId) {
    const weaponId = save.character.bondedEquipment.weapon
    const weapon = weaponId ? save.boundItems[weaponId] : undefined
    if (!weapon) return fail('FORGE_WEAPON', 'Vincule sua arma antes de aprimorá-la.')
    const upgrade = forgeUpgradeDefinitions.find((entry) => entry.id === recipe.upgradeId)
    if (!upgrade) return fail('FORGE_UPGRADE', 'Têmpera desconhecida.')
    if (weapon.forging?.upgradeIds.includes(upgrade.id)) return fail('FORGE_ALREADY_APPLIED', 'Esta melhoria já integra a sua arma.')
    if (upgrade.requiredUpgradeId && !weapon.forging?.upgradeIds.includes(upgrade.requiredUpgradeId)) return fail('FORGE_PREREQUISITE', 'Aplique a Têmpera do Vínculo antes do acabamento.')
  }
  if (save.wallet.gold < recipe.gold) return fail('FORGE_GOLD', 'Ouro insuficiente para esta produção.')
  for (const input of recipe.inputs) {
    if (catalog.items[input.itemId]?.questLocked) return fail('FORGE_PROTECTED', 'A forja não consome itens de missão.')
    if (getForgeMaterialCount(save, input.itemId) < input.quantity) return fail('FORGE_MATERIALS', `Faltam materiais: ${catalog.items[input.itemId]?.name ?? input.itemId}.`)
  }
  return ok(true)
}

export function executeForgeRecipe(save: GameSave, recipeId: string, catalog: ContentCatalog, now: string): Result<GameSave> {
  const allowed = checkForgeRecipe(save, recipeId, catalog)
  if (!allowed.ok) return allowed
  const recipe = forgeRecipes.find((entry) => entry.id === recipeId)!
  const next = structuredClone(save)
  for (const input of recipe.inputs) {
    let remaining = input.quantity
    for (const item of next.inventory) {
      if (item.definitionId !== input.itemId || item.locked || item.favorite || remaining === 0) continue
      const used = Math.min(item.quantity, remaining)
      item.quantity -= used; remaining -= used
    }
  }
  next.inventory = next.inventory.filter((item) => item.quantity > 0)
  next.wallet.gold -= recipe.gold
  if (recipe.outputItemId) {
    next.inventory.push({ instanceId: `forge_${next.saveId}_${next.revision + 1}`, definitionId: recipe.outputItemId,
      quantity: 1, rarity: catalog.items[recipe.outputItemId].rarity, locked: false, favorite: false, acquiredAt: now })
  }
  if (recipe.upgradeId) {
    const weapon = next.boundItems[next.character.bondedEquipment.weapon!]
    weapon.forging ??= { upgradeIds: [] }
    weapon.forging.upgradeIds.push(recipe.upgradeId)
    weapon.memories.push({ id: `memory_${weapon.id}_${recipe.upgradeId}`, type: 'bond', sourceId: recipe.upgradeId,
      title: recipe.name, description: recipe.description, createdAt: now })
    weapon.updatedAt = now
    if (!next.world.worldFlags.includes(recipe.upgradeId)) next.world.worldFlags.push(recipe.upgradeId)
  }
  next.updatedAt = now; next.revision += 1
  next.eventLog.push(`ForgeCrafted:${recipe.id}`)
  // A forge upgrade changes maxima; it does not silently heal the player.
  const stats = deriveCharacterStats(next, catalog)
  next.vitals.hp = Math.min(next.vitals.hp, stats.life.value)
  next.vitals.mp = Math.min(next.vitals.mp, stats.mana.value)
  return ok(next)
}
