import type { ItemDefinition } from './types'
import type { ComplementarySlot } from '../domain/shared/types'

/** OWNER_DECISION: effects, obtainment and prices are not yet approved. */
const entries: Array<{ id: string; name: string; slot: ComplementarySlot }> = [
  { id: 'equipment_simple_helmet', name: 'Capacete Simples', slot: 'helmet' },
  { id: 'equipment_simple_pants', name: 'Calça Simples', slot: 'pants' },
  { id: 'equipment_simple_boots', name: 'Botas Simples', slot: 'boots' },
  { id: 'equipment_accessory_a', name: 'Acessório Comum I', slot: 'accessoryA' },
  { id: 'equipment_accessory_b', name: 'Acessório Comum II', slot: 'accessoryB' },
]
export const complementaryItemDefinitions: ItemDefinition[] = entries.map(({ id, name, slot }) => ({
  id, name, description: 'Equipamento complementar sem propriedades definidas.',
  complementarySlot: slot, category: 'equipment', rarity: 'common',
  convertToEssence: false, essenceValue: 0, sellable: false, sellValue: 0,
  questLocked: false, canInfuseBoundItem: false, combatEffects: [],
  affinityTags: ['complementary'], iconAssetId: 'item.complementary.' + slot, status: 'OWNER_DECISION',
}))
