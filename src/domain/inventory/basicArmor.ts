import type { ContentCatalog } from '../../content/catalog'
import { ARMOR_REFINEMENT } from '../../content/rosettaTutorial'
import type { GameSave } from '../game/types'
import { refreshTutorialQuestProgress } from '../quests/tutorialProgress'
import { fail, ok, type Result } from '../shared/types'

export function getEquippedBasicArmor(save: GameSave, catalog: ContentCatalog) {
  if (save.character.bondedEquipment.armor) return null
  const instance = save.inventory.find((item) => item.instanceId === save.character.basicArmorInstanceId)
  const definition = instance && catalog.items[instance.definitionId]
  return instance && definition?.basicArmor ? { instance, definition, armor: definition.basicArmor } : null
}

export function equipBasicArmor(save: GameSave, instanceId: string | null, catalog: ContentCatalog, now: string): Result<GameSave> {
  if (save.battle) return fail('EQUIP_IN_BATTLE', 'Troque sua proteção fora de combate.')
  if (save.character.bondedEquipment.armor) return fail('ARMOR_ALREADY_BOUND', 'Sua Armadura já possui um Vínculo permanente. As peças de treino não o substituem.')
  if (instanceId === save.character.basicArmorInstanceId) return ok(save)
  if (instanceId !== null) {
    const item = save.inventory.find((entry) => entry.instanceId === instanceId)
    if (!item || item.quantity !== 1 || !catalog.items[item.definitionId]?.basicArmor) return fail('EQUIP_ITEM', 'Escolha uma proteção simples da sua mochila.')
    if (item.locked) return fail('EQUIP_LOCKED', 'Desbloqueie esta peça antes de equipar.')
  }
  const next = structuredClone(save)
  next.character.basicArmorInstanceId = instanceId
  next.updatedAt = now; next.revision += 1
  next.eventLog.push(instanceId ? `BasicArmorEquipped:${next.inventory.find((item) => item.instanceId === instanceId)!.definitionId}` : 'BasicArmorUnequipped')
  return ok(refreshTutorialQuestProgress(next, catalog, now))
}

export function checkBasicArmorRefinement(save: GameSave, instanceId: string, catalog: ContentCatalog): Result<true> {
  if (save.battle || save.world.currentLocationId !== 'location_terran_forge') return fail('REFINE_LOCATION', 'Visite Durnan na Casa do Ferreiro para aprimorar esta peça.')
  const item = save.inventory.find((entry) => entry.instanceId === instanceId)
  const armor = item && catalog.items[item.definitionId]?.basicArmor
  if (!item || !armor || item.quantity !== 1) return fail('REFINE_ITEM', 'Escolha uma proteção simples da mochila.')
  if (item.locked || item.favorite) return fail('REFINE_PROTECTED', 'Desproteja a peça antes de aprimorar.')
  if ((item.refinementLevel ?? 0) >= armor.maxRefinement) return fail('REFINE_MAX', 'Esta proteção já está em +1.')
  if (save.wallet.gold < ARMOR_REFINEMENT.gold) return fail('REFINE_GOLD', 'São necessários 8 Ouro para o reforço.')
  const thread = save.inventory.filter((entry) => entry.definitionId === ARMOR_REFINEMENT.itemId && !entry.locked && !entry.favorite)
    .reduce((sum, entry) => sum + entry.quantity, 0)
  if (thread < ARMOR_REFINEMENT.quantity) return fail('REFINE_MATERIAL', 'Falta Linha de Linho. Rosetta entrega a primeira; Neris vende mais no Mercado.')
  return ok(true)
}

export function refineBasicArmor(save: GameSave, instanceId: string, catalog: ContentCatalog, now: string): Result<GameSave> {
  const allowed = checkBasicArmorRefinement(save, instanceId, catalog)
  if (!allowed.ok) return allowed
  const next = structuredClone(save)
  const item = next.inventory.find((entry) => entry.instanceId === instanceId)!
  item.refinementLevel = (item.refinementLevel ?? 0) + 1
  let remaining = ARMOR_REFINEMENT.quantity as number
  for (const input of next.inventory) {
    if (input.definitionId !== ARMOR_REFINEMENT.itemId || input.locked || input.favorite || !remaining) continue
    const used = Math.min(input.quantity, remaining)
    input.quantity -= used; remaining -= used
  }
  next.inventory = next.inventory.filter((entry) => entry.quantity > 0)
  next.wallet.gold -= ARMOR_REFINEMENT.gold
  next.updatedAt = now; next.revision += 1
  next.eventLog.push(`BasicArmorRefined:${item.definitionId}:${item.refinementLevel}`)
  return ok(refreshTutorialQuestProgress(next, catalog, now))
}
