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
    id: 'equipment.weapon.prologue.g1',
    path: '/assets/equipment/weapon/weapon_prologue_g1.png',
    fallback: '/assets/placeholders/weapon.svg',
    alt: 'Arma básica vinculada, Grau I',
  },
  {
    id: 'item.fungal-nucleus',
    path: '/assets/items/item_fungal_nucleus.png',
    fallback: '/assets/placeholders/item.svg',
    alt: 'Núcleo Fúngico',
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
