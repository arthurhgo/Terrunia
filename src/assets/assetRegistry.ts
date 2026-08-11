export type AssetEntry = {
  id: string
  path: string
  fallback: string
  alt: string
}

const FALLBACK = '/assets/placeholders/generic.svg'

const entries: AssetEntry[] = [
  {
    id: 'character.terririan.default',
    path: '/assets/characters/terririan/player_default.png',
    fallback: '/assets/placeholders/character.svg',
    alt: 'Retrato do Terrírian',
  },
  {
    id: 'character.terririan.sigil',
    path: '/assets/characters/terririan/player_sigil.png',
    fallback: '/assets/placeholders/character-alt.svg',
    alt: 'Retrato alternativo do Terrírian',
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
  },
  {
    id: 'equipment.weapon.prologue.g2',
    path: '/assets/equipment/weapon/weapon_prologue_g2.png',
    fallback: '/assets/placeholders/weapon.svg',
    alt: 'Arma básica vinculada, Grau II',
  },
  {
    id: 'equipment.weapon.prologue.g3',
    path: '/assets/equipment/weapon/weapon_prologue_g3.png',
    fallback: '/assets/placeholders/weapon.svg',
    alt: 'Arma básica vinculada, Grau III com Joia',
  },
  {
    id: 'item.fungal-nucleus',
    path: '/assets/items/item_fungal_nucleus.png',
    fallback: '/assets/placeholders/item.svg',
    alt: 'Núcleo Fúngico',
  },
  {
    id: 'item.spore-cluster',
    path: '/assets/items/item_spore_cluster.png',
    fallback: '/assets/placeholders/item.svg',
    alt: 'Aglomerado de Esporos',
  },
  {
    id: 'item.minor-tonic',
    path: '/assets/items/item_minor_tonic.png',
    fallback: '/assets/placeholders/item.svg',
    alt: 'Tônico de Campo',
  },
  {
    id: 'item.mycelial-fragment',
    path: '/assets/items/item_mycelial_fragment.png',
    fallback: '/assets/placeholders/item.svg',
    alt: 'Fragmento de Essência Micelial',
  },
  {
    id: 'gem.emerald-growth',
    path: '/assets/gems/gem_emerald_growth.png',
    fallback: '/assets/placeholders/item.svg',
    alt: 'Esmeralda do Crescimento',
  },
  {
    id: 'item.quest-record',
    path: '/assets/items/item_astravel_record.png',
    fallback: '/assets/placeholders/item.svg',
    alt: 'Registro de Astravél',
  },
]

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
