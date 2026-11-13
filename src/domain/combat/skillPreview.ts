import type { ContentCatalog } from '../../content/catalog'
import type { CombatSkillDefinition } from '../../content/types'
import type { Combatant } from './types'
import { BALANCE } from '../../content/balance'
import { DEFENSE_RULES_V0517 } from '../../content/combatStylesV0517'
import { calculateRolledDamage, getEffectiveAttackPower, getEffectiveMitigation, selectDamageDie } from './engine'

/** UI-only deterministic damage preview; shares the combat motor math and never consumes RNG. */
export function previewCombatSkill(actor: Combatant, target: Combatant, skill: CombatSkillDefinition, catalog: ContentCatalog) {
  const damageEffects = skill.effects.filter((effect) => effect.type === 'damage')
  const die = damageEffects.length ? selectDamageDie(actor, skill) : null
  const ranges = damageEffects.map((effect) => {
    const defense = getEffectiveMitigation(target, catalog)
    const attack = getEffectiveAttackPower(actor, catalog)
    const guard = target.defending ? BALANCE.defendMitigation : 0
    const minimum = calculateRolledDamage(attack + (actor.weaponBonusDie ? 1 : 0), defense, 1, die!, effect.powerBonus, guard).finalDamage
    const maximum = calculateRolledDamage(attack + (actor.weaponBonusDie ?? 0), defense, die!, die!, effect.powerBonus, guard).finalDamage
    return skill.id === 'skill_basic_area_attack'
      ? { minimum: Math.max(1, Math.floor(minimum * 0.6)), maximum: Math.max(1, Math.floor(maximum * 0.6)) }
      : { minimum, maximum }
  })
  const effects = skill.effects.flatMap((effect) => {
    if (effect.type === 'applyStatus') {
      const name = catalog.statusEffects[effect.statusId]?.name ?? effect.statusId
      return [`${name} · ${effect.durationTurns} turno(s)${effect.chance < 1 ? ` · ${Math.round(effect.chance * 100)}%` : ''}`]
    }
    if (effect.type === 'restoreHp') return [`Cura: até ${effect.value} PV`]
    if (effect.type === 'restoreMp') return [`Recupera: até ${effect.value} MP`]
    if (effect.type === 'cleanseHarmful') return ['Remove efeitos negativos']
    if (effect.type === 'adjacentSplash') return [`Splash: ${Math.round(effect.fraction*100)}% do dano principal em ${effect.maxTargets} vizinho(s)`]
    return []
  })
  const reaction = skill.defenseStance ? (() => {
    const mode = skill.defenseStance!
    const rule = DEFENSE_RULES_V0517[mode]
    const sides = actor.defenseDice?.[mode] ?? 4
    const shieldBonus = rule.usesShield && actor.hasBoundShield ? 1 : 0
    const needed = Math.max(1,rule.dc - shieldBonus)
    const chance = Math.round(100*Math.max(0,sides - needed + 1)/sides)
    return {sides,threshold:rule.dc,shieldBonus,chance}
  })() : null
  if (reaction) effects.push('Teste de reação: d'+reaction.sides+(reaction.shieldBonus?' +1 escudo':'')+' contra '+reaction.threshold+' ('+reaction.chance+'% de sucesso)')
  return { die, weaponBonusDie: actor.weaponBonusDie, ranges, effects, reaction, targetName: target.name }
}
