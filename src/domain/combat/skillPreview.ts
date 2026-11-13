import type { ContentCatalog } from '../../content/catalog'
import type { CombatSkillDefinition } from '../../content/types'
import type { Combatant } from './types'
import { BALANCE } from '../../content/balance'
import { DEFENSE_RULES_V0517 } from '../../content/combatStylesV0517'
import {getDefenseChanceV05171,DEFENSE_ALLOWED_V05171} from './defensiveResolutionV05171'
import { getDamageTypeV0517 } from './layeredDefenseV0517'
import {applyAffinityV0517,getEffectiveShieldV0517} from './combatTacticsV0517'
import { calculateRolledDamage, getEffectiveAttackPower, getEffectiveMitigation, selectDamageDie } from './engine'

/** UI-only deterministic damage preview; shares the combat motor math and never consumes RNG. */
export function previewCombatSkill(actor: Combatant, target: Combatant, skill: CombatSkillDefinition, catalog: ContentCatalog) {
  const damageEffects = skill.effects.filter((effect) => effect.type === 'damage')
  const die = damageEffects.length ? selectDamageDie(actor, skill) : null
  const ranges = damageEffects.map((effect) => {
    const aspect=getDamageTypeV0517(actor,skill)
    const defense = aspect==='physical' ? getEffectiveMitigation(target, catalog) : 0
    const attack = getEffectiveAttackPower(actor, catalog)
    const guard = target.defending ? BALANCE.defendMitigation : 0
    const protection=aspect==='physical'?getEffectiveShieldV0517(target,catalog):(target.arcaneGuard??0)
    const minHit=calculateRolledDamage(attack+(actor.weaponBonusDie?1:0),defense,1,die!,effect.powerBonus,guard).finalDamage
    const maxHit=calculateRolledDamage(attack+(actor.weaponBonusDie??0),defense,die!,die!,effect.powerBonus,guard).finalDamage
    const minimum=Math.max(0,applyAffinityV0517(target,minHit,aspect,catalog).damage-protection)
    const maximum=Math.max(0,applyAffinityV0517(target,maxHit,aspect,catalog).damage-protection)
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
    if (effect.type === 'restoreArcaneGuard') return [`Barreira: restaura até ${effect.value} ARC; protege antes da Vida`]
    if (effect.type === 'drainArcaneGuard') return [`Quebra até ${effect.value} ARC do inimigo`]
    if (effect.type === 'cleanseBeneficial') return ['Dissipa efeitos benéficos do inimigo']
    if (effect.type === 'cleanseHarmful') return ['Remove efeitos negativos']
    if (effect.type === 'adjacentSplash') return [`Splash: ${Math.round(effect.fraction*100)}% do dano principal em ${effect.maxTargets} vizinho(s)`]
    return []
  })
  const reaction = skill.defenseStance ? (() => {
    const mode = skill.defenseStance!
    const rule = DEFENSE_RULES_V0517[mode]
    const sides = actor.defenseDice?.[mode] ?? 4
    const shieldBonus = rule.usesShield && actor.hasBoundShield ? 1 : 0
    const duelistBonus = (mode==='parry'||mode==='counter')&&actor.combatProfile==='duelist'?1:0
    const archerBonus=mode==='dodge'&&actor.combatProfile==='archer'?1:0
    const moduleBonus=actor.reactionBonuses?.[mode]??0
    const chance=getDefenseChanceV05171(actor,mode,'melee').successPercent
    return {sides,threshold:rule.dc,shieldBonus,duelistBonus,archerBonus,
      moduleBonus,chance,validAgainst:DEFENSE_ALLOWED_V05171[mode].join(', ')}
  })() : null
  if (reaction) effects.push('Teste de reação: d'+reaction.sides+(reaction.shieldBonus?' +1 escudo':'')+(reaction.duelistBonus?' +1 duelista':'')+(reaction.archerBonus?' +1 arqueiro':'')+(reaction.moduleBonus?' +'+reaction.moduleBonus+' módulos':'')+' contra '+reaction.threshold+' ('+reaction.chance+'% de sucesso)')
  const aspect=getDamageTypeV0517(actor,skill)
  const affinity=applyAffinityV0517(target,10,aspect,catalog)
  if(reaction)effects.push('Compatível: '+reaction.validAgainst+'; chance varia conforme o ataque recebido.')
  return { die, weaponBonusDie: actor.weaponBonusDie, ranges, effects, reaction,
    aspect,resistancePercent:Math.round(affinity.resistance*100),targetName: target.name }
}
