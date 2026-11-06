/** BALANCE_DRAFT: forge costs and bonuses are editable content, not equipment replacements. */
export type ForgeRecipe = {
  id: string; name: string; description: string; gold: number
  inputs: { itemId: string; quantity: number }[]
  outputItemId?: string
  upgradeId?: string
}
export const forgeUpgradeDefinitions = [
  { id: 'forge_tempered_weapon', name: 'Têmpera do Vínculo', attackPower: 1, maxHp: 0,
    description: 'Reforça permanentemente a arma e revela o ramo da Têmpera na Skill Tree.', requiredUpgradeId: null },
  { id: 'forge_mycelial_finish', name: 'Acabamento Micelial', attackPower: 1, maxHp: 4,
    description: 'Integra fibra tratada à arma e revela uma nova sinergia na Skill Tree.', requiredUpgradeId: 'forge_tempered_weapon' },
] as const

/** BALANCE_DRAFT: premium Gold-only improvements enhance permanent equipment,
 * not a new item. One service per slot, with bounded non-stacking gains.
 */
export const goldForgeOffers = [
  { id: 'forge_gold_weapon', slot: 'weapon', name: 'Têmpera Magistral da Arma', gold: 450,
    attackPower: 2, maxHp: 0, maxMp: 0, mitigation: 0 },
  { id: 'forge_gold_shield', slot: 'shield', name: 'Bastião do Protetor', gold: 520,
    attackPower: 0, maxHp: 0, maxMp: 0, mitigation: 2 },
  { id: 'forge_gold_armor', slot: 'armor', name: 'Reforço Magistral da Armadura', gold: 620,
    attackPower: 0, maxHp: 0, maxMp: 0, mitigation: 2 },
  { id: 'forge_gold_necklace', slot: 'necklace', name: 'Gravação do Colar', gold: 480,
    attackPower: 0, maxHp: 6, maxMp: 0, mitigation: 0 },
  { id: 'forge_gold_bracelet', slot: 'bracelet', name: 'Gravação da Pulseira', gold: 480,
    attackPower: 0, maxHp: 0, maxMp: 4, mitigation: 0 },
] as const

export const goldForgeUpgradeDefinitions = goldForgeOffers.map((offer) => ({
  ...offer, description: `Aprimoramento permanente de ${offer.name}, sem trocar o Vínculo.`,
  requiredUpgradeId: null,
}))

export const forgeRecipes: readonly ForgeRecipe[] = [
  { id: 'forge_alloy', name: 'Liga Rúnica', description: 'Fundir lascas da Ruína e cerne orgânico em uma liga de têmpera.', gold: 20,
    inputs: [{ itemId: 'drop_ruin_shard', quantity: 2 }, { itemId: 'drop_blackroot_core', quantity: 1 }], outputItemId: 'material_runic_alloy' },
  { id: 'forge_weapon_core', name: 'Núcleo de Arma', description: 'Produzir o componente que reforça o corpo da arma vinculada.', gold: 25,
    inputs: [{ itemId: 'material_runic_alloy', quantity: 1 }, { itemId: 'drop_mycelial_fiber', quantity: 1 }], outputItemId: 'material_weapon_core' },
  { id: 'forge_resin', name: 'Resina Micelial Tratada', description: 'Preparar fibras e gel para um acabamento resistente.', gold: 15,
    inputs: [{ itemId: 'drop_mycelial_fiber', quantity: 2 }, { itemId: 'drop_fungal_gel', quantity: 1 }], outputItemId: 'material_mycelial_resin' },
  { id: 'forge_temper', name: 'Aplicar Têmpera à Arma', description: '+1 Ataque permanente e novo ramo na Skill Tree.', gold: 40,
    inputs: [{ itemId: 'material_weapon_core', quantity: 1 }], upgradeId: 'forge_tempered_weapon' },
  { id: 'forge_finish', name: 'Aplicar Acabamento Micelial', description: '+1 Ataque, +4 Vida máxima e ramo de sinergia. Exige Têmpera.', gold: 60,
    inputs: [{ itemId: 'material_mycelial_resin', quantity: 1 }], upgradeId: 'forge_mycelial_finish' },
]
