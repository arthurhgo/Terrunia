import { gearOfferById } from '../../content/equipmentV0515'
import type { ContentCatalog } from '../../content/catalog'
import { ARMOR_REFINEMENT } from '../../content/rosettaTutorial'
import type { GameSave } from '../game/types'
import { refreshTutorialQuestProgress } from '../quests/tutorialProgress'
import { fail, ok, type Result } from '../shared/types'

export function getEquippedBasicArmor(save: GameSave, catalog: ContentCatalog) {
  if (save.character.bondedEquipment.armor) return null
  const instance = save.equippedBasicArmor?.instanceId === save.character.basicArmorInstanceId ? save.equippedBasicArmor : null
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
  // Atomic transfer: one physical instance belongs either to backpack or the worn slot.
  const next = structuredClone(save)
  const incomingIndex = instanceId === null ? -1 : next.inventory.findIndex((item) => item.instanceId === instanceId)
  const incoming = incomingIndex >= 0 ? next.inventory.splice(incomingIndex, 1)[0] : null
  if (next.equippedBasicArmor) next.inventory.push(next.equippedBasicArmor)
  next.equippedBasicArmor = incoming
  next.character.basicArmorInstanceId = incoming?.instanceId ?? null
  next.updatedAt = now; next.revision += 1
  next.eventLog.push(incoming ? `BasicArmorEquipped:${incoming.definitionId}` : 'BasicArmorUnequipped')
  return ok(refreshTutorialQuestProgress(next, catalog, now))
}

export function checkBasicArmorRefinement(save: GameSave, instanceId: string, catalog: ContentCatalog): Result<true> {
  if (save.battle || save.world.currentLocationId !== 'location_terran_forge') return fail('REFINE_LOCATION', 'Visite Durnan na Casa do Ferreiro para aprimorar esta peça.')
  const item = save.equippedBasicArmor?.instanceId === instanceId ? save.equippedBasicArmor
    : save.inventory.find((entry) => entry.instanceId === instanceId)
  const armor = item && catalog.items[item.definitionId]?.basicArmor
  if (!item || !armor || item.quantity !== 1) return fail('REFINE_ITEM', 'Escolha uma proteção simples da mochila ou do slot equipado.')
  if (gearOfferById[item.definitionId]) return fail('GEAR_FORGE_V0515','Use a Forja de Equipamentos Tier G1–G3 para esta peça.')
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
  const item = next.equippedBasicArmor?.instanceId === instanceId ? next.equippedBasicArmor
    : next.inventory.find((entry) => entry.instanceId === instanceId)!
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
