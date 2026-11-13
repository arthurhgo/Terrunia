import {describe,it,expect} from 'vitest'
import {existsSync} from 'node:fs'
import {join} from 'node:path'
import {content} from '../../content/catalog'
import {classDefinitions} from '../../content/progression'
import {classDisciplineSkillDefinitionsV0517,CLASS_DISCIPLINE_SKILLS_V0517} from '../../content/classDisciplinesV0517'
import {getWeaponAttackCardsV0517,DEFENSE_RULES_V0517,COMMON_DEFENSE_SKILL_IDS_V0517} from '../../content/combatStylesV0517'
import {OFFHAND_RITE_V0517} from '../bond/offhandRiteV0517'
import {resolveAsset} from '../../assets/assetRegistry'
import {itemDefinitions} from '../../content/items'
import {biomeMaterialDefinitions} from '../../content/biomeExpeditions'
import {complementaryItemDefinitions} from '../../content/complementaryItems'
import {extraCombatSkillsV0517,extraCombatStatusesV0517} from '../../content/combatAdvancementsV0517'

/** Release checks validate invariants, NOT fictional final balance numbers. */
describe('v0.5.17 — release gate de combate e assets',()=>{
 it('registra 7 famílias distintas, sem Ataque Duplo no menu',()=>{
  for(const family of ['blade','axe','bow','dagger','arcaneFocus','grimoire','staff']){
   const cards=getWeaponAttackCardsV0517(family)
   expect(cards).toHaveLength(2)
   expect(new Set(cards.map(x=>x.name)).size).toBe(2)
   expect(cards.some(x=>/duplo/i.test(x.name))).toBe(false)
   cards.forEach(x=>expect(resolveAsset(x.iconAssetId!).pixelArt).toBe(true))
  }
 })
 it('mecânica de reação tem chances de sucesso e falha em d4 sem imunidade implícita',()=>{
  expect(COMMON_DEFENSE_SKILL_IDS_V0517).toHaveLength(4)
  Object.values(DEFENSE_RULES_V0517).forEach(r=>{
   const probability=Math.max(0,4-r.dc+1)/4
   expect(probability).toBeGreaterThan(0)
   expect(probability).toBeLessThan(1)
  })
 })
 it('Escudaria tem três manifestações válidas para UM slot, sem recompra por drop',()=>{
  const ids=OFFHAND_RITE_V0517.offers.map(x=>x.baseId)
  expect(new Set(ids).size).toBe(3)
  for(const offer of OFFHAND_RITE_V0517.offers){
   const base=content.boundItemBases[offer.baseId]
   expect(base.slot).toBe('shield')
   expect(offer.cost).toBeGreaterThan(0)
  }
 })
 it('todas as doze classes catalogadas têm uma técnica exclusiva de conteúdo revisável',()=>{
  expect(classDefinitions).toHaveLength(12)
  expect(classDisciplineSkillDefinitionsV0517).toHaveLength(12)
  for(const cls of classDefinitions){
   const id=CLASS_DISCIPLINE_SKILLS_V0517[cls.id]
   const skill=content.combatSkills[id]
   expect(skill,id).toBeDefined()
   expect(skill.status).toBe('BALANCE_DRAFT')
   expect(skill.mpCost).toBeGreaterThanOrEqual(0)
   expect(skill.mpCost).toBeLessThanOrEqual(4)
   expect(skill.cooldownTurns).toBeLessThanOrEqual(4)
  }
 })
 it('nenhuma afinidade de inimigo supera 50% de resistência ou vulnerabilidade',()=>{
  for(const enemy of Object.values(content.enemies))
   for(const fraction of Object.values(enemy.damageResistances??{})){
    expect(fraction).toBeGreaterThanOrEqual(-0.5)
    expect(fraction).toBeLessThanOrEqual(0.5)
   }
 })
 it('sprites de Classes, Escudaria e materiais de biomas existem nos IDs registrados',()=>{
  const ids=[
   ...classDisciplineSkillDefinitionsV0517.map(x=>x.iconAssetId??'skill.'+x.id),
   ...extraCombatSkillsV0517.map(x=>x.iconAssetId??'skill.'+x.id),
   ...extraCombatStatusesV0517.map(x=>'status.'+x.id),
   ...biomeMaterialDefinitions.map(x=>x.iconAssetId),
   ...complementaryItemDefinitions.map(x=>x.iconAssetId),
   'item.clan-granite-emblem','equipment.offhand.quiver_v0517',
  ]
  expect(new Set(ids).size).toBe(ids.length)
  for(const id of ids){
   const asset=resolveAsset(id)
   expect(asset.path,id).toMatch(/\.(svg|png)$/)
   const file=join(process.cwd(),'public',asset.path.slice(1))
   expect(existsSync(file),id).toBe(true)
  }
  for(const item of itemDefinitions)expect(resolveAsset(item.iconAssetId).pixelArt,item.id).toBe(true)
 })
})
