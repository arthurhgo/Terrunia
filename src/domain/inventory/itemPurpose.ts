import type { ContentCatalog } from '../../content/catalog'
import type { GameSave } from '../game/types'

/** Exposes existing destinations, without changing whether an item may be traded or consumed. */
export function getItemDestinations(itemId: string, catalog: ContentCatalog): string[] {
  const item = catalog.items[itemId]
  if (!item) return []
  const uses: string[] = []
  if (item.basicArmor) uses.push('Proteção simples: equipar ou reforçar antes do Vínculo da Armadura')
  if (item.combatEffects.length) uses.push('Consumível com efeito em combate')
  if (item.canInfuseBoundItem) uses.push('Componente de evolução de Vínculo')
  if (item.gemComponentId) uses.push('Joia para Vínculo')
  if (item.convertToEssence) uses.push(`Converter: +${item.essenceValue} Essência Bruta por unidade`)
  if (item.sellable) uses.push(`Vender: +${item.sellValue} Ouro por unidade`)
  if (item.questLocked) uses.push('Item protegido: não vender nem converter')
  return uses
}

/** Active deliveries alone are shown; locked quests cannot leak undiscovered story content. */
export function getPendingItemDeliveries(itemId: string, save: Pick<GameSave, 'quests'>, catalog: ContentCatalog) {
  return Object.values(save.quests).flatMap((progress) => {
    if (progress.status !== 'active' && progress.status !== 'ready_to_turn_in') return []
    const quest = catalog.quests[progress.questId]
    if (!quest) return []
    return (quest.turnInItems ?? []).filter((line) => line.itemId === itemId)
      .map((line) => ({ questId: quest.id, title: quest.title, quantity: line.quantity }))
  })
}
