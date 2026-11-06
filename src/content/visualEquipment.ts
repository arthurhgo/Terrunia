import type { BoundSlot } from '../domain/shared/types'

/** VISUAL_DRAFT — reference silhouettes, not obtainable items or bound equipment. */
export type VisualEquipmentEntry = {
  id: string
  name: string
  slot: BoundSlot
  assetId: string
  assetPath: string
  description: string
  source: 'manual' | 'concept'
}

const visual = (
  id: string,
  name: string,
  slot: BoundSlot,
  description: string,
  source: VisualEquipmentEntry['source'] = 'concept',
): VisualEquipmentEntry => ({
  id,
  name,
  slot,
  assetId: `equipment.catalog.${id}`,
  assetPath: `/assets/equipment/catalog/${id}.png`,
  description,
  source,
})

export const visualEquipmentCatalog: readonly VisualEquipmentEntry[] = [
  visual('weapon_long_sword', 'Espada Longa', 'weapon', 'Lâmina equilibrada. Arquétipo descrito no Manual v2.2.', 'manual'),
  visual('weapon_war_axe', 'Machado de Guerra', 'weapon', 'Silhueta pesada de corte. Referência do manual.', 'manual'),
  visual('weapon_long_bow', 'Arco Longo', 'weapon', 'Arma de alcance e perfuração. Referência do manual.', 'manual'),
  visual('weapon_dagger', 'Adaga', 'weapon', 'Lâmina curta e leve. Referência do manual.', 'manual'),
  visual('weapon_arcane_scepter', 'Cetro Arcano', 'weapon', 'Canalizador mágico leve. Referência do manual.', 'manual'),
  visual('weapon_spellbook', 'Livro de Magias — Projéteis', 'weapon', 'Foco de projéteis arcanos. Referência do manual.', 'manual'),
  visual('weapon_conjuration_staff', 'Cajado de Conjuração', 'weapon', 'Bastão mágico pesado. Referência do manual.', 'manual'),
  visual('shield_round', 'Escudo Redondo', 'shield', 'Estudo visual de proteção física.'),
  visual('shield_arcane', 'Protetor Arcano', 'shield', 'Estudo visual de proteção mágica para builds sem escudo físico.'),
  visual('armor_leather', 'Armadura de Couro', 'armor', 'Estudo visual de peitoral leve.'),
  visual('armor_plate', 'Armadura de Placas', 'armor', 'Estudo visual de peitoral pesado.'),
  visual('armor_mystic_tunic', 'Túnica Mística', 'armor', 'Túnica com foco arcano e inscrições luminosas.'),
  visual('armor_star_mantle', 'Manto das Estrelas', 'armor', 'Manto de tecido noturno e constelações.'),
  visual('armor_enchanted_vestments', 'Vestes Encantadas', 'armor', 'Vestes cerimoniais com condutores de Essência.'),
  visual('armor_chain', 'Cota de Malha', 'armor', 'Malha metálica e fecho reforçado.'),
  visual('necklace_moon', 'Colar Lunar', 'necklace', 'Estudo visual de talismã de prata e runa.'),
  visual('necklace_rune', 'Colar Rúnico', 'necklace', 'Estudo visual de foco encantado.'),
  visual('bracelet_leather', 'Pulseira de Couro', 'bracelet', 'Estudo visual de bracelete leve.'),
  visual('bracelet_resonance', 'Pulseira de Ressonância', 'bracelet', 'Estudo visual de bracelete com núcleo de Essência.'),
]


/** VISUAL_DRAFT. Distinct real starter armor sprites require distinct material hues.
 * Pure display metadata keyed to their existing item IDs, never gameplay rarity.
 */
export const BASIC_ARMOR_MATERIAL_PALETTES: Record<string, {
  shade: string; base: string; light: string; rune: string
}> = {
  equipment_worn_linen_tunic: { shade: '#50483f', base: '#8a806f', light: '#c6b9a0', rune: '#a9a08a' },
  equipment_apprentice_tunic: { shade: '#263b50', base: '#50728d', light: '#94b2c5', rune: '#99c9d1' },
  equipment_light_leather_vest: { shade: '#463328', base: '#885d3e', light: '#b88c61', rune: '#b39b70' },
  equipment_terran_guard_armor: { shade: '#37414a', base: '#72808a', light: '#b9c8c8', rune: '#d3b977' },
  equipment_simple_leather_armor: { shade: '#4d362a', base: '#966c48', light: '#c79c70', rune: '#bb965d' },
}
