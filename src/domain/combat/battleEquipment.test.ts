import { describe, expect, it } from 'vitest'
import { content } from '../../content/catalog'
import { equipmentOffersV0515 } from '../../content/equipmentV0515'
import { createBoundItem } from '../bond/boundItems'
import { deriveCharacterStats } from '../character/derivedStats'
import { bindPrologueWeapon, createNewSave } from '../game/createSave'
import { getBattleGearSummary } from './battleEquipment'

const now = '2026-11-03T18:00:00Z'
const makeSave = () => {
  const original = createNewSave('gear-owner', 'Thaur', 'character.terririan.default', content, now)
  const bound = bindPrologueWeapon(original, content, now, 'weapon-hud')
  if (!bound.ok) throw new Error(bound.message)
  return bound.value
}

describe('HUD de equipamentos da batalha', () => {
  it('expõe sempre cinco slots e deixa os não equipados sem bônus', () => {
    const save = makeSave()
    const original = structuredClone(save)
    const { slots, totals } = getBattleGearSummary(save, content)
    expect(slots.map((s) => s.slot)).toEqual(['weapon', 'shield', 'armor', 'necklace', 'bracelet'])
    const weapon = slots[0]
    const weaponBase = content.boundItemBases[save.boundItems['weapon-hud'].baseItemId]
    expect(weapon).toMatchObject({
      state: 'bound', name: weaponBase.name, assetId: weaponBase.assetIdByGrade[1],
      tierLabel: 'Vínculo · Grau 1', resonance: { value: 0 },
    })
    expect(weapon.stats).toContainEqual({
      key: 'attack', label: 'Poder base da arma', value: weaponBase.basePower,
    })
    expect(slots.slice(1).every((s) => s.state === 'empty' && s.stats.length === 0 && s.assetId === null)).toBe(true)
    expect(totals.attack).toBe(weaponBase.basePower)
    expect(totals.defense).toBe(0)
    expect(save).toEqual(original)
  })

  it('mostra armadura simples equipada, tier e refino sem fingir ser um Vínculo', () => {
    const save = makeSave()
    save.equippedBasicArmor = {
      instanceId: 'refined-tunic', definitionId: 'equipment_worn_linen_tunic',
      quantity: 1, rarity: 'common', locked: false, favorite: false,
      acquiredAt: now, refinementLevel: 1,
    }
    save.character.basicArmorInstanceId = 'refined-tunic'
    const { slots, totals } = getBattleGearSummary(save, content)
    const armor = slots[2]
    expect(armor).toMatchObject({
      state: 'simple', name: 'Túnica de Linho Gasta +1',
      tierLabel: 'Proteção simples · Tier 1 · Refinamento +1',
      assetId: 'item.worn-linen-tunic', resonance: null,
    })
    expect(armor.stats).toContainEqual({ key: 'defense', label: 'Defesa', value: 2 })
    expect(totals.defense).toBe(2)
    const derived = deriveCharacterStats(save, content)
    expect(derived.defense.contributions.find((c) => c.label === 'Túnica de Linho Gasta')?.value).toBe(2)
    expect(slots.filter((s) => s.state === 'bound')).toHaveLength(1)
  })

  it('soma apenas bônus diretos de escudo, colar e forja do equipamento presente', () => {
    const save = makeSave()
    const shieldBase = content.boundItemBases.bound_shield_arcane
    const shield = createBoundItem(save.character.id, shieldBase, now, 'shield-hud')
    save.boundItems[shield.id] = shield
    save.character.bondedEquipment.shield = shield.id
    const necklaceBase = content.boundItemBases.bound_necklace_moon
    const necklace = createBoundItem(save.character.id, necklaceBase, now, 'necklace-hud')
    save.boundItems[necklace.id] = necklace
    save.character.bondedEquipment.necklace = necklace.id
    save.boundItems['weapon-hud'].forging = { upgradeIds: ['forge_tempered_weapon', 'forge_mycelial_finish'] }
    const { slots, totals } = getBattleGearSummary(save, content)
    expect(slots.find((s) => s.slot === 'shield')?.stats).toEqual(expect.arrayContaining([
      { key: 'defense', label: 'Defesa', value: 1 },
      { key: 'mana', label: 'Mana máxima', value: 2 },
    ]))
    expect(slots.find((s) => s.slot === 'necklace')?.stats).toEqual(expect.arrayContaining([
      { key: 'mana', label: 'Mana máxima', value: 3 },
      { key: 'initiative', label: 'Iniciativa', value: 1 },
    ]))
    expect(totals).toMatchObject({
      defense: 1, mana: 5, initiative: 1, life: 4,
      attack: content.boundItemBases[save.boundItems['weapon-hud'].baseItemId].basePower + 2,
    })
    const derived = deriveCharacterStats(save, content)
    expect(derived.life.contributions.find((c) => c.label === 'Forja de Durnan')?.value).toBe(totals.life)
    expect(derived.mana.contributions.find((c) => c.label === 'Equipamentos')?.value).toBe(totals.mana)
    expect(derived.defense.contributions.find((c) => c.label === 'Equipamentos')?.value).toBe(totals.defense)
    expect(derived.initiative.contributions.find((c) => c.label === 'Equipamentos')?.value).toBe(totals.initiative)
  })

  it('não mostra armadura temporária quando o Vínculo permanente ocupa o slot', () => {
    const save = makeSave()
    save.equippedBasicArmor = {
      instanceId: 'old', definitionId: 'equipment_apprentice_tunic',
      quantity: 1, rarity: 'common', locked: false, favorite: false, acquiredAt: now,
    }
    save.character.basicArmorInstanceId = 'old'
    const base = content.boundItemBases.bound_armor_leather
    const item = createBoundItem(save.character.id, base, now, 'armor-hud')
    save.boundItems[item.id] = item
    save.character.bondedEquipment.armor = item.id
    const summary = getBattleGearSummary(save, content)
    expect(summary.slots[2]).toMatchObject({
      state: 'bound', name: 'Armadura de Couro', tierLabel: 'Vínculo · Grau 1',
    })
    expect(summary.slots[2].stats).toEqual(expect.arrayContaining([
      { key: 'defense', label: 'Defesa', value: 2 },
      { key: 'initiative', label: 'Iniciativa', value: 1 },
    ]))
  })
  it('shows two real bonuses of Neris commercial shells, without mislabeling them as Bound grade',()=>{
    const save=makeSave()
    const profile=equipmentOffersV0515.find(offer=>offer.channel==='PUBLIC_TERRAN' &&
      offer.tier===1 && offer.slot==='weapon' && offer.recommendedClassId==='batedor_da_vigilia')!
    save.equippedGearStyles={weapon:{
      instanceId:'merchant-weapon',definitionId:profile.id,quantity:1,rarity:'common',
      locked:false,favorite:false,acquiredAt:now,refinementLevel:0,
    }}
    const summary=getBattleGearSummary(save,content)
    expect(summary.slots[0].tierLabel).toContain('Vínculo · Grau 1')
    expect(summary.slots[0].tierLabel).toContain('Revestimento T1 G1')
    expect(summary.slots[0].stats).toEqual(expect.arrayContaining([
      {key:'physicalAttack',label:'Ataque físico · revestimento',value:profile.values[0]},
      {key:'initiative',label:'Iniciativa · revestimento',value:profile.secondaryValues[0]},
    ]))
    expect(summary.totals.physicalAttack).toBe(profile.values[0])
    expect(summary.totals.initiative).toBe(profile.secondaryValues[0])
    expect(summary.totals.attack).toBe(content.boundItemBases.bound_weapon_prologue_base.basePower)
  })
  it('renders commercial protector and necklace before their permanent Bonds, with real direct bonuses',()=>{
    const save=makeSave()
    const shield=equipmentOffersV0515.find(o=>o.channel==='PUBLIC_TERRAN'&&o.tier===1&&o.slot==='shield')!
    const necklace=equipmentOffersV0515.find(o=>o.channel==='PUBLIC_TERRAN'&&o.tier===1&&o.slot==='necklace')!
    save.equippedGearStyles={
      shield:{instanceId:'shell-shield',definitionId:shield.id,quantity:1,rarity:'common',
        locked:false,favorite:false,acquiredAt:now,refinementLevel:0},
      necklace:{instanceId:'shell-necklace',definitionId:necklace.id,quantity:1,rarity:'common',
        locked:false,favorite:false,acquiredAt:now,refinementLevel:0},
    }
    const {slots,totals}=getBattleGearSummary(save,content)
    expect(slots[1]).toMatchObject({state:'simple',name:shield.name,resonance:null})
    expect(slots[3]).toMatchObject({state:'simple',name:necklace.name,resonance:null})
    expect(slots[1].stats).toHaveLength(2)
    expect(slots[3].stats).toHaveLength(2)
    expect(Object.values(totals).some(value=>value>0)).toBe(true)
    expect(save.character.bondedEquipment.shield).toBeNull()
    expect(save.character.bondedEquipment.necklace).toBeNull()
  })
  it('sums the two bonuses of complementary equipment even though only five Bound cards exist',()=>{
    const save=makeSave()
    const profile=equipmentOffersV0515.find(offer=>offer.channel==='PUBLIC_TERRAN' &&
      offer.tier===1 && offer.slot==='boots' && offer.recommendedClassId==='astrologo_celestial')!
    save.equippedComplementary={boots:{
      instanceId:'merchant-boots',definitionId:profile.id,quantity:1,rarity:'common',
      locked:false,favorite:false,acquiredAt:now,refinementLevel:0,
    }}
    const summary=getBattleGearSummary(save,content)
    expect(summary.slots).toHaveLength(5)
    expect(summary.totals.initiative).toBe(profile.values[0])
    expect(summary.totals.mana).toBe(profile.secondaryValues[0])
    const derived=deriveCharacterStats(save,content)
    expect(derived.initiative.contributions.find(c=>c.label==='Equipamentos')?.value).toBe(profile.values[0])
    expect(derived.mana.contributions.find(c=>c.label==='Equipamentos')?.value).toBe(profile.secondaryValues[0])
  })

})
