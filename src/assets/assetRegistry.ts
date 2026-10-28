import type { BoundSlot } from '../domain/shared/types'
import { visualEquipmentCatalog } from '../content/visualEquipment'

export type AssetEntry = {
  id: string
  path: string
  fallback: string
  alt: string
  pixelArt?: boolean
}

const FALLBACK = '/assets/placeholders/generic.svg'

const entries: AssetEntry[] = [
  {
    id: 'character.terririan.default',
    path: '/assets/characters/terririan/player_default.png',
    fallback: '/assets/placeholders/character.svg',
    alt: 'Retrato do Terrírian',
    pixelArt: true,
  },
  {
    id: 'character.terririan.sigil',
    path: '/assets/characters/terririan/player_sigil.png',
    fallback: '/assets/placeholders/character-alt.svg',
    alt: 'Retrato alternativo do Terrírian',
    pixelArt: true,
  },
  {
    id: 'npc.eldamar.portrait',
    path: '/assets/npcs/npc_eldamar_portrait.png',
    fallback: '/assets/placeholders/npc.svg',
    alt: 'Retrato de Eldamar',
  },
  {
    id: 'enemy.fungorro-crawler',
    path: '/assets/enemies/fungorros/enemy_fungorro_crawler_idle.png',
    fallback: '/assets/placeholders/enemy.svg',
    alt: 'Fungorro Rastejante',
  },
  {
    id: 'enemy.spore-sower',
    path: '/assets/enemies/fungorros/enemy_spore_sower_idle.png',
    fallback: '/assets/placeholders/enemy.svg',
    alt: 'Semeador de Esporos',
  },
  {
    id: 'enemy.colossus-mycelium',
    path: '/assets/enemies/bosses/enemy_colossus_mycelium_idle.png',
    fallback: '/assets/placeholders/enemy.svg',
    alt: 'Colosso Micélio',
  },
  {
    id: 'equipment.weapon.prologue.g1',
    path: '/assets/equipment/weapon/weapon_prologue_g1.png',
    fallback: '/assets/placeholders/weapon.svg',
    alt: 'Arma básica vinculada, Grau I',
    pixelArt: true,
  },
  {
    id: 'equipment.weapon.prologue.g2',
    path: '/assets/equipment/weapon/weapon_prologue_g2.png',
    fallback: '/assets/placeholders/weapon.svg',
    alt: 'Arma básica vinculada, Grau II',
    pixelArt: true,
  },
  {
    id: 'equipment.weapon.prologue.g3',
    path: '/assets/equipment/weapon/weapon_prologue_g3.png',
    fallback: '/assets/placeholders/weapon.svg',
    alt: 'Arma básica vinculada, Grau III com Joia',
    pixelArt: true,
  },
  ...([4, 5, 6, 7] as const).map((grade) => ({
    id: `equipment.weapon.prologue.g${grade}`,
    path: `/assets/equipment/weapon/weapon_prologue_g${grade}.png`,
    fallback: '/assets/placeholders/weapon.svg',
    alt: `Arma básica vinculada, Grau ${grade}`,
    pixelArt: true,
  })),
  {
    id: 'item.fungal-nucleus',
    path: '/assets/items/item_fungal_nucleus.png',
    fallback: '/assets/placeholders/item.svg',
    alt: 'Núcleo Fúngico',
    pixelArt: true,
  },
  {
    id: 'item.spore-cluster',
    path: '/assets/items/item_spore_cluster.png',
    fallback: '/assets/placeholders/item.svg',
    alt: 'Aglomerado de Esporos',
    pixelArt: true,
  },
  {
    id: 'item.minor-tonic',
    path: '/assets/items/item_minor_tonic.png',
    fallback: '/assets/placeholders/item.svg',
    alt: 'Tônico de Campo',
    pixelArt: true,
  },
  {
    id: 'item.mycelial-fragment',
    path: '/assets/items/item_mycelial_fragment.png',
    fallback: '/assets/placeholders/item.svg',
    alt: 'Fragmento de Essência Micelial',
    pixelArt: true,
  },
  {
    id: 'gem.emerald-growth',
    path: '/assets/gems/gem_emerald_growth.png',
    fallback: '/assets/placeholders/item.svg',
    alt: 'Esmeralda do Crescimento',
    pixelArt: true,
  },
  {
    id: 'item.quest-record',
    path: '/assets/items/item_astravel_record.png',
    fallback: '/assets/placeholders/item.svg',
    alt: 'Registro de Astravél',
    pixelArt: true,
  },
  ...(['weapon', 'shield', 'armor', 'necklace', 'bracelet'] as const).map((slot) => ({
    id: `equipment.slot-preview.${slot}`,
    path: `/assets/equipment/slot-previews/${slot}.png`,
    fallback: '/assets/placeholders/item.svg',
    alt: `Silhueta de referência do slot ${slot}`,
    pixelArt: true,
  })),
  ...visualEquipmentCatalog.map((item) => ({
    id: item.assetId,
    path: item.assetPath,
    fallback: '/assets/placeholders/item.svg',
    alt: `Conceito pixel art: ${item.name}`,
    pixelArt: true,
  })),
]

// Only visual references. These are not bound-item definitions or inventory entries.
export const boundSlotPreviewAssetIds: Record<BoundSlot, string> = {
  weapon: 'equipment.slot-preview.weapon',
  shield: 'equipment.slot-preview.shield',
  armor: 'equipment.slot-preview.armor',
  necklace: 'equipment.slot-preview.necklace',
  bracelet: 'equipment.slot-preview.bracelet',
}

export const assetRegistry = Object.fromEntries(entries.map((entry) => [entry.id, entry])) as Record<
  string,
  AssetEntry
>

export const resolveAsset = (assetId: string): AssetEntry =>
  assetRegistry[assetId] ?? {
    id: assetId,
    path: FALLBACK,
    fallback: FALLBACK,
    alt: `Asset pendente: ${assetId}`,
  }
