import { describe,expect,it } from 'vitest'
import { content } from './catalog'
import { ENEMY_BUDGET_V05152 } from './enemyBalanceV05152'
import { astravelCombatNodes } from './astravel'

describe('v0.5.15.2 — 25 monsters rebudgeted without losing unique mechanics',()=>{
 it('uses exactly the existing 25 enemy IDs and no extra enemy species',()=>{
  const actual=Object.keys(content.enemies)
  const balanced=Object.keys(ENEMY_BUDGET_V05152)
  expect(balanced).toHaveLength(25)
  expect(new Set(actual)).toEqual(new Set(balanced))
  for(const [id,budget] of Object.entries(ENEMY_BUDGET_V05152)){
   expect(content.enemies[id]).toMatchObject(budget)
   expect(budget.maxHp).toBeGreaterThan(0)
   expect(budget.mitigation).toBeGreaterThanOrEqual(0)
   expect(budget.attackPower).toBeGreaterThanOrEqual(0)
  }
 })
 it('preserves early onboarding while differentiating tank, poison caster and swift hunter',()=>{
  expect(content.enemies.enemy_fungorro_crawler.maxHp).toBe(8)
  expect(content.enemies.enemy_spore_sower.skillIds).toContain('skill_spore_burst')
  expect(content.enemies.enemy_spore_sower.aiSkillEveryRounds).toBe(2)
  const tank=content.enemies.enemy_spore_bulwark
  const horror=content.enemies.enemy_fungal_horror
  const hunter=content.enemies.enemy_mycelial_stalker
  expect(tank.mitigation).toBeGreaterThan(horror.mitigation)
  expect(tank.attackPower).toBeLessThan(horror.attackPower)
  expect(hunter.attackPower).toBeGreaterThan(tank.attackPower)
 })
 it('preserves boss abilities, protected-summon rules and original rewards',()=>{
  const boss=content.enemies.enemy_ruin_corrupted_sentinel
  expect(boss.boss).toBe(true)
  expect(boss.maxHp).toBe(86)
  expect(boss.skillIds).toContain('skill_sentinel_arcane_pulse')
  const chamber=content.encounters.encounter_fungal_core_sentinel
  expect(chamber.enemyDefinitionIds).toHaveLength(4)
  expect(chamber.rewards.boundResonance).toBe(256)
  expect(chamber.rewards.worldFlags).toContain('fungal_chambers_first_clear')
  expect(content.enemies.enemy_granite_golem.skillIds).toContain('skill_granite_slam')
  expect(content.enemies.enemy_golem_areia.boss).toBe(true)
 })
 it('keeps Astravél 15 stages and progressively recommended levels without adding gates',()=>{
  expect(astravelCombatNodes).toHaveLength(15)
  const levels=astravelCombatNodes.map(node=>node.recommendedLevel!)
  expect(levels[0]).toBe(1)
  expect(levels[14]).toBe(6)
  for(let i=1;i<levels.length;i++){
   expect(levels[i]).toBeGreaterThanOrEqual(levels[i-1])
   expect(levels[i]-levels[i-1]).toBeLessThanOrEqual(1)
  }
 })
})
