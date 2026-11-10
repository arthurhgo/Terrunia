import type { ContentCatalog } from '../../content/catalog'
import type { CombatSkillDefinition } from '../../content/types'
import type { Combatant } from './types'
import { BALANCE } from '../../content/balance'
import { DOUBLE_ATTACK_V05152 } from '../../content/combatActionRulesV05152'
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
    if(skill.id==='attack_double_v05152')return {
      minimum:2*Math.max(1,Math.floor(minimum*DOUBLE_ATTACK_V05152.fractionPerHit)),
      maximum:2*Math.max(1,Math.floor(maximum*DOUBLE_ATTACK_V05152.fractionPerHit)),
    }
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
  return { die, weaponBonusDie: actor.weaponBonusDie, ranges, effects, targetName: target.name }
}
