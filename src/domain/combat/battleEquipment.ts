import type { ContentCatalog } from '../../content/catalog'
import { forgeUpgradeDefinitions } from '../../content/forge'
import { ARMOR_REFINEMENT } from '../../content/rosettaTutorial'
import type { GameSave } from '../game/types'
import { getEquippedBasicArmor } from '../inventory/basicArmor'
import { BOUND_SLOTS, BOUND_SLOT_LABELS, type BoundSlot } from '../shared/types'

export type BattleGearStatKey = 'attack' | 'defense' | 'life' | 'mana' | 'initiative'
export type BattleGearStat = { key: BattleGearStatKey; label: string; value: number }
export type BattleGearSlot = {
  slot: BoundSlot
  label: string
  state: 'bound' | 'simple' | 'empty'
  name: string
  tierLabel: string
  assetId: string | null
  description: string
  resonance: { value: number; required: number } | null
  stats: BattleGearStat[]
}
export type BattleGearSummary = {
  slots: BattleGearSlot[]
  totals: Record<BattleGearStatKey, number>
}

const statMapping = {
  maxHp: { key: 'life', label: 'Vida máxima' },
  maxMp: { key: 'mana', label: 'Mana máxima' },
  mitigation: { key: 'defense', label: 'Defesa' },
  initiative: { key: 'initiative', label: 'Iniciativa' },
} as const

const emptySlot = (slot: BoundSlot): BattleGearSlot => ({
  slot, label: BOUND_SLOT_LABELS[slot],
  state: 'empty', name: 'Não equipado', tierLabel: '',
  assetId: null, description: 'Nenhum item ocupa este slot.',
  resonance: null, stats: [],
})

/** Combat HUD is read-only. Attribute, Clan and Skill Tree bonuses are deliberately
 * excluded: only directly recorded item, refinement and forging values are shown.
 * Derived combat totals remain authoritative in deriveCharacterStats.
 */
export function getBattleGearSummary(save: GameSave, catalog: ContentCatalog): BattleGearSummary {
  const simpleArmor = getEquippedBasicArmor(save, catalog)
  const slots = BOUND_SLOTS.map((slot): BattleGearSlot => {
    const boundId = save.character.bondedEquipment[slot]
    const bound = boundId ? save.boundItems[boundId] : undefined
    const definition = bound ? catalog.boundItemBases[bound.baseItemId] : undefined

    if (bound && definition?.slot === slot) {
      const stats: BattleGearStat[] = []
      if (slot === 'weapon' && definition.basePower !== 0) {
        stats.push({ key: 'attack', label: 'Poder base da arma', value: definition.basePower })
      }
      for (const [statName, property] of Object.entries(statMapping) as Array<
        [keyof typeof statMapping, (typeof statMapping)[keyof typeof statMapping]]
      >) {
        const value = definition.statBonuses[statName] ?? 0
        if (value !== 0) stats.push({ ...property, value })
      }
      for (const upgradeId of bound.forging?.upgradeIds ?? []) {
        const upgrade = forgeUpgradeDefinitions.find((entry) => entry.id === upgradeId)
        if (!upgrade) continue
        if (upgrade.attackPower) stats.push({ key: 'attack', label: `Ataque · ${upgrade.name}`, value: upgrade.attackPower })
        if (upgrade.maxHp) stats.push({ key: 'life', label: `Vida · ${upgrade.name}`, value: upgrade.maxHp })
      }
      return {
        slot, label: BOUND_SLOT_LABELS[slot], state: 'bound',
        name: bound.customName || definition.name,
        tierLabel: `Vínculo · Grau ${bound.grade}`,
        assetId: definition.assetIdByGrade[bound.grade] ?? definition.assetIdByGrade[1] ?? null,
        description: definition.description,
        resonance: { value: bound.resonance, required: bound.resonanceThreshold },
        stats,
      }
    }

    if (slot === 'armor' && simpleArmor) {
      const { instance, definition: item, armor } = simpleArmor
      const refinement = instance.refinementLevel ?? 0
      const stats: BattleGearStat[] = [{
        key: 'defense', label: 'Defesa',
        value: armor.mitigation + refinement * ARMOR_REFINEMENT.mitigationPerLevel,
      }]
      if (armor.initiative !== 0) stats.push({ key: 'initiative', label: 'Iniciativa', value: armor.initiative })
      return {
        slot, label: BOUND_SLOT_LABELS[slot], state: 'simple',
        name: `${item.name}${refinement ? ` +${refinement}` : ''}`,
        tierLabel: `Proteção simples · Tier ${armor.tier}${refinement ? ` · Refinamento +${refinement}` : ''}`,
        assetId: item.iconAssetId, description: item.description, resonance: null, stats,
      }
    }
    return emptySlot(slot)
  })
  const totals: Record<BattleGearStatKey, number> = {
    attack: 0, defense: 0, life: 0, mana: 0, initiative: 0,
  }
  for (const slot of slots) for (const stat of slot.stats) totals[stat.key] += stat.value
  return { slots, totals }
}
