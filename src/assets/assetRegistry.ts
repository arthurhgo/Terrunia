import type { BoundSlot } from '../domain/shared/types'
import { visualEquipmentCatalog } from '../content/visualEquipment'
import { gemComponentDefinitions } from '../content/gems'
import { npcDefinitions } from '../content/npcs'

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
    id: 'character.terririan.map',
    // Defaults to the existing portrait; while not a 128×128 sheet, canvas uses the pixel-matrix actor.
    path: '/assets/characters/terririan/player_default.png',
    fallback: '/assets/placeholders/character.svg',
    alt: 'Spritesheet opcional de quatro direções do Terrírian (4 colunas × 4 linhas, quadros 32×32)',
    pixelArt: true,
  },
  ...npcDefinitions.map((npc) => ({
    id: npc.portraitAssetId,
    path: `/assets/npcs/${npc.id}_portrait.png`,
    fallback: '/assets/placeholders/npc.svg',
    alt: `Retrato pixel art de ${npc.name}`,
    pixelArt: true,
  })),
  {
    id: 'enemy.fungorro-crawler',
    path: '/assets/enemies/fungorros/enemy_fungorro_crawler_idle.png',
    fallback: '/assets/placeholders/enemy.svg',
    alt: 'Fungorro Rastejante',
    pixelArt: true,
  },
  {
    id: 'enemy.spore-sower',
    path: '/assets/enemies/fungorros/enemy_spore_sower_idle.png',
    fallback: '/assets/placeholders/enemy.svg',
    alt: 'Semeador de Esporos',
    pixelArt: true,
  },
  {
    id: 'enemy.fungal-slime',
    path: '/assets/enemies/fungorros/enemy_fungal_slime_idle.png',
    fallback: '/assets/placeholders/enemy.svg',
    alt: 'Bola de Gosma Fúngica',
    pixelArt: true,
  },
  {
    id: 'enemy.fungal-horror',
    path: '/assets/enemies/fungorros/enemy_fungal_horror_idle.png',
    fallback: '/assets/placeholders/enemy.svg',
    alt: 'Horror Esporulante',
    pixelArt: true,
  },
  {
    id: 'enemy.colossus-mycelium',
    path: '/assets/enemies/bosses/enemy_colossus_mycelium_idle.png',
    fallback: '/assets/placeholders/enemy.svg',
    alt: 'Colosso Micélio',
    pixelArt: true,
  },
  { id: 'enemy.luminous-slime', path: '/assets/enemies/portal/enemy_luminous_slime_idle.png', fallback: '/assets/placeholders/enemy.svg', alt: 'enemy.luminous-slime', pixelArt: true },
  { id: 'enemy.void-moth', path: '/assets/enemies/portal/enemy_void_moth_idle.png', fallback: '/assets/placeholders/enemy.svg', alt: 'enemy.void-moth', pixelArt: true },
  { id: 'enemy.spore-mantis', path: '/assets/enemies/portal/enemy_spore_mantis_idle.png', fallback: '/assets/placeholders/enemy.svg', alt: 'enemy.spore-mantis', pixelArt: true },
  { id: 'enemy.ruin-sentinel', path: '/assets/enemies/portal/enemy_ruin_sentinel_idle.png', fallback: '/assets/placeholders/enemy.svg', alt: 'enemy.ruin-sentinel', pixelArt: true },
  { id: 'item.resonance-flask', path: '/assets/items/item_resonance_flask.png', fallback: '/assets/placeholders/item.svg', alt: 'item.resonance-flask', pixelArt: true },
  { id: 'item.field-rune', path: '/assets/items/item_field_rune.png', fallback: '/assets/placeholders/item.svg', alt: 'item.field-rune', pixelArt: true },
  { id: 'item.vital-essence', path: '/assets/items/item_vital_essence.png', fallback: '/assets/placeholders/item.svg', alt: 'item.vital-essence', pixelArt: true },
  { id: 'item.luminous-gel', path: '/assets/items/item_luminous_gel.png', fallback: '/assets/placeholders/item.svg', alt: 'item.luminous-gel', pixelArt: true },
  { id: 'item.void-dust', path: '/assets/items/item_void_dust.png', fallback: '/assets/placeholders/item.svg', alt: 'item.void-dust', pixelArt: true },
  { id: 'item.spore-chitin', path: '/assets/items/item_spore_chitin.png', fallback: '/assets/placeholders/item.svg', alt: 'item.spore-chitin', pixelArt: true },
  { id: 'item.ruin-shard', path: '/assets/items/item_ruin_shard.png', fallback: '/assets/placeholders/item.svg', alt: 'item.ruin-shard', pixelArt: true },
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
  ...(['simple-ether', 'field-compress', 'antidote'] as const).map((item) => ({
    id: `item.${item}`,
    path: `/assets/items/item_${item.replaceAll('-', '_')}.png`,
    fallback: '/assets/placeholders/item.svg',
    alt: `Ícone de ${item}`,
    pixelArt: true,
  })),
  {
    id: 'item.mycelial-fragment',
    path: '/assets/items/item_mycelial_fragment.png',
    fallback: '/assets/placeholders/item.svg',
    alt: 'Fragmento de Essência Micelial',
    pixelArt: true,
  },
  ...gemComponentDefinitions.map((gem) => ({
    id: gem.iconAssetId,
    path: `/assets/gems/gem_${gem.iconAssetId.slice(4).replaceAll('-', '_')}.png`,
    fallback: '/assets/placeholders/item.svg',
    alt: gem.name,
    pixelArt: true,
  })),
  ...(['fungal_weak', 'mycelial'] as const).map((essence) => ({
    id: `essence.${essence.replaceAll('_', '-')}`,
    path: `/assets/essences/essence_${essence}.png`,
    fallback: '/assets/placeholders/item.svg',
    alt: `Estudo visual da Essência ${essence}`,
    pixelArt: true,
  })),
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
