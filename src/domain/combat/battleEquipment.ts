import type { ContentCatalog } from '../../content/catalog'
import { gearOfferById, getGearGrade, getGearStatEntries, getCommercialArmorDefense, gearSpriteId, type GearOffer } from '../../content/equipmentV0515'
import type { GearStat } from '../../content/equipmentProfilesV05152'
import { forgeUpgradeDefinitions } from '../../content/forge'
import { ARMOR_REFINEMENT } from '../../content/rosettaTutorial'
import type { GameSave } from '../game/types'
import { getEquippedBasicArmor } from '../inventory/basicArmor'
import { BOUND_SLOTS, BOUND_SLOT_LABELS, type BoundSlot } from '../shared/types'

export type BattleGearStatKey = 'attack' | 'physicalAttack' | 'magicalAttack' | 'defense' | 'life' | 'mana' | 'initiative'
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

/** Battle HUD exposes the exact same commercial bonuses used by derived stats. */
const gearHudKeys: Record<GearStat,BattleGearStatKey> = {
 maxHp:'life',maxMp:'mana',mitigation:'defense',initiative:'initiative',
 attackPower:'attack',physicalAttack:'physicalAttack',magicalAttack:'magicalAttack',
}
const commercialStats=(offer:GearOffer,grade:1|2|3):BattleGearStat[] =>
 getGearStatEntries(offer,grade).map(entry=>({
  key:gearHudKeys[entry.stat],label:entry.label+' · revestimento',value:entry.value,
 }))

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
      const style=save.equippedGearStyles?.[slot]
      const styleOffer=style?gearOfferById[style.definitionId]:undefined
      const styleGrade=style?getGearGrade(style.refinementLevel):1
      if(styleOffer)stats.push(...commercialStats(styleOffer,styleGrade))
      return {
        slot, label: BOUND_SLOT_LABELS[slot], state: 'bound',
        name: bound.customName || definition.name,
        tierLabel: `Vínculo · Grau ${bound.grade}` + (styleOffer?` · Revestimento T${styleOffer.tier} G${styleGrade}`:''),
        assetId: styleOffer?gearSpriteId(styleOffer,styleGrade):definition.assetIdByGrade[bound.grade] ?? definition.assetIdByGrade[1] ?? null,
        description: definition.description + (styleOffer?' · Revestimento: '+styleOffer.name:''),
        resonance: { value: bound.resonance, required: bound.resonanceThreshold },
        stats,
      }
    }

    if (slot === 'armor' && simpleArmor) {
      const { instance, definition: item, armor } = simpleArmor
      const refinement = instance.refinementLevel ?? 0
      const stats: BattleGearStat[] = [{
        key: 'defense', label: 'Defesa',
        value: gearOfferById[instance.definitionId]
          ? getCommercialArmorDefense(gearOfferById[instance.definitionId],getGearGrade(refinement))
          : armor.mitigation + refinement * ARMOR_REFINEMENT.mitigationPerLevel,
      }]
      if (armor.initiative !== 0) stats.push({ key: 'initiative', label: 'Iniciativa', value: armor.initiative })
      const armorOffer=gearOfferById[instance.definitionId]
      const armorGrade=getGearGrade(instance.refinementLevel)
      if(armorOffer){
       // Armor Defense is already the first entry in stats; only add the other
       // stat to keep the HUD consistent with getGearBonuses and derivedStats.
       stats.push(...commercialStats(armorOffer,armorGrade).filter(stat=>stat.key!=='defense'))
      }
      return {
        slot, label: BOUND_SLOT_LABELS[slot], state: 'simple',
        name: `${item.name}${refinement ? ` +${refinement}` : ''}`,
        tierLabel: `Proteção simples · Tier ${armor.tier}${refinement ? ` · Refinamento +${refinement}` : ''}`,
        assetId: armorOffer?gearSpriteId(armorOffer,armorGrade):item.iconAssetId,
        description: item.description, resonance: null, stats,
      }
    }
    // Commercial protection/necklace/bracelet shells can be equipped before a
    // permanent Bond is earned. They are real worn gear, not empty placeholders.
    const temporaryStyle = save.equippedGearStyles?.[slot]
    const temporaryOffer = temporaryStyle ? gearOfferById(temporaryStyle.definitionId) : undefined
    if (temporaryStyle && temporaryOffer && temporaryOffer.slot === slot &&
        ['shield', 'necklace', 'bracelet'].includes(slot)) {
      const grade = getGearGrade(temporaryStyle.refinementLevel)
      return {
        slot, label: BOUND_SLOT_LABELS[slot], state: 'simple',
        name: temporaryOffer.name,
        tierLabel: `Equipamento comercial · Tier ${temporaryOffer.tier} · Grau ${grade}`,
        assetId: gearSpriteId(temporaryOffer,grade),
        description: 'Peça comercial removível. O Vínculo permanente ainda não foi adquirido.',
        resonance: null,
        stats: commercialStats(temporaryOffer,grade),
      }
    }
    return emptySlot(slot)
  })
  const totals: Record<BattleGearStatKey, number> = {
    attack: 0, physicalAttack: 0, magicalAttack: 0, defense: 0, life: 0, mana: 0, initiative: 0,
  }
  for (const slot of slots) for (const stat of slot.stats) totals[stat.key] += stat.value
  // Complementary slots are not displayed among the five permanent Bonds,
  // but their bonuses must be represented in the full equipment summary.
  for(const worn of Object.values(save.equippedComplementary??{})){
   const offer=worn?gearOfferById[worn.definitionId]:undefined
   if(!offer)continue
   for(const stat of commercialStats(offer,getGearGrade(worn.refinementLevel)))
    totals[stat.key]+=stat.value
  }
  return { slots, totals }
}
