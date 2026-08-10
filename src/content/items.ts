import type { BoundItemBaseDefinition, ItemDefinition } from './types'

export const itemDefinitions = [
  {
    id: 'drop_fungal_nucleus',
    name: 'Núcleo Fúngico',
    description: 'Matéria orgânica impregnada pela energia de Astravél. Loot é potencial: converta ou venda.',
    category: 'drop',
    rarity: 'common',
    convertToEssence: true,
    essenceValue: 100,
    sellable: true,
    sellValue: 32,
    questLocked: false,
    canInfuseBoundItem: false,
    affinityTags: ['fungal', 'biological'],
    iconAssetId: 'item.fungal-nucleus',
    status: 'BALANCE_DRAFT',
  },
  {
    id: 'quest_astravel_record',
    name: 'Registro de Astravél',
    description: 'Anotação necessária para a investigação de Eldamar.',
    category: 'quest',
    rarity: 'unique',
    convertToEssence: false,
    essenceValue: 0,
    sellable: false,
    sellValue: 0,
    questLocked: true,
    canInfuseBoundItem: false,
    affinityTags: ['lore'],
    iconAssetId: 'item.quest-record',
    status: 'CONTENT_DRAFT',
  },
] satisfies ItemDefinition[]

export const boundItemBaseDefinitions: BoundItemBaseDefinition[] = [
  {
    id: 'bound_weapon_prologue_base',
    name: 'Arma Básica Vinculada',
    slot: 'weapon',
    archetype: 'blade',
    basePower: 3,
    treeId: 'tree_weapon_foundation',
    assetIdByGrade: {
      1: 'equipment.weapon.prologue.g1',
    },
    status: 'CONTENT_DRAFT',
  },
]
