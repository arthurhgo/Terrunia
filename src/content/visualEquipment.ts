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
  visual('necklace_moon', 'Colar Lunar', 'necklace', 'Estudo visual de talismã de prata e runa.'),
  visual('necklace_rune', 'Colar Rúnico', 'necklace', 'Estudo visual de foco encantado.'),
  visual('bracelet_leather', 'Pulseira de Couro', 'bracelet', 'Estudo visual de bracelete leve.'),
  visual('bracelet_resonance', 'Pulseira de Ressonância', 'bracelet', 'Estudo visual de bracelete com núcleo de Essência.'),
]
