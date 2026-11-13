import type { ContentCatalog } from '../../content/catalog'
import { BALANCE } from '../../content/balance'
import { FUNGAL_BOSS_ENCOUNTER_ID, FUNGAL_BOSS_RULES } from '../../content/fungalChambers'
import { GRANITE_GOLEM_BALANCE, GRANITE_GOLEM_ENCOUNTER_ID, GRANITE_GOLEM_ENEMY_ID } from '../../content/clanProgressionV05142'
import { DEFENSE_RULES_V0517, COMMON_DEFENSE_SKILL_IDS_V0517, getWeaponAttackNamesV0517 } from '../../content/combatStylesV0517'
import {CLASS_DISCIPLINE_SKILLS_V0517} from '../../content/classDisciplinesV0517'
import {getModularDefenseBonusesV05171,getAttackDeliveryV05171,calculateDefenseReactionV05171} from './defensiveResolutionV05171'
import {rollModularLootV05171} from './modularLootV05171'
import { deriveOffhandCombatV0517, getDamageTypeV0517, applyLayeredProtectionV0517, getInitiativeModifiersV0517, getEffectiveInitiativeV0517 } from './layeredDefenseV0517'
import {applyAffinityV0517,getScheduledEnemySkillV0517} from './combatTacticsV0517'
import { nextCombatRandomSeed, rollSeededCombatDie } from './rng'
import type {
  CombatEffectDefinition,
  CombatSkillDefinition,
  EncounterDefinition,
  ItemDefinition,
} from '../../content/types'
import type { GameSave, InventoryItemInstance } from '../game/types'
import { fail, ok, type Result } from '../shared/types'
import { createRandomId } from '../shared/randomId'
import { collectActiveEffects } from '../skillTree/skillTree'
import { deriveCharacterStats } from '../character/derivedStats'
import { getBoundItemSkillIds } from '../bond/equipmentLoadout'
import type {
  BattleCommand,
  BattleLogEntry,
  BattlePhase,
  BattleState,
  Combatant,
  CombatRoll,
  CombatDie,
} from './types'

const addPhase = (state: BattleState, phase: BattlePhase) => {
  state.phase = phase
  state.phaseHistory.push(phase)
}

const addLog = (
  state: BattleState,
  message: string,
  tone: BattleLogEntry['tone'] = 'neutral',
  roll?: CombatRoll,
) => {
  state.log.push({
    id: `${state.id}_log_${state.log.length + 1}`,
    round: state.round,
    message,
    tone,
    ...(roll ? { roll } : {}),
  })
}

/** Deterministic, actual dice samples; never derive a fake face from log IDs. */
/** Seed is derived from a random battle UUID, then stored in the save.
 * All action previews consume the stored PRNG state without rerolling on render.
 */
export const seedFromBattleId = (id: string): number => {
  let hash = 2166136261
  for (let i = 0; i < id.length; i++) hash = Math.imul(hash ^ id.charCodeAt(i), 16777619)
  return (hash >>> 0) % 2147483646 + 1
}

const rollCombatDie = (state: BattleState, sides: CombatDie) => {
  const { face, nextSeed } = rollSeededCombatDie(state.rngSeed, sides)
  state.rngSeed = nextSeed
  return face
}

const rollChance = (state: BattleState, chance: number) => {
  state.rngSeed = nextCombatRandomSeed(state.rngSeed)
  return (state.rngSeed - 1) / 2147483646 < chance
}

const getStatusModifier = (
  combatant: Combatant,
  catalog: ContentCatalog,
  key: 'attackModifier' | 'mitigationModifier',
) =>
  combatant.statusEffects.reduce(
    (total, active) => total + (catalog.statusEffects[active.definitionId]?.[key] ?? 0),
    0,
  )

export const getEffectiveAttackPower = (combatant: Combatant, catalog: ContentCatalog) =>
  Math.max(0, combatant.attackPower + getStatusModifier(combatant, catalog, 'attackModifier'))

export const getEffectiveMitigation = (combatant: Combatant, catalog: ContentCatalog) =>
  Math.max(0, combatant.mitigation + getStatusModifier(combatant, catalog, 'mitigationModifier'))

export const calculateDamage = (attackPower: number, mitigation: number) =>
  Math.max(1, Math.floor(attackPower) - Math.max(0, Math.floor(mitigation)))

/** One persisted seeded roll drives BOTH real damage and its visual presentation.
 * A natural maximum on the primary damage die is a critical hit in ALL encounters.
 * The weapon's additional die modifies damage but never rolls a separate critical.
 */
export const calculateRolledDamage = (
  baseAttack: number,
  mitigation: number,
  face: number,
  sides: CombatDie,
  skillBonus = 0,
  guardMitigation = 0,
) => {
  const dieAdjustment = BALANCE.combatDieCentered ? face - Math.floor((sides + 1) / 2) : face
  const rawPower = baseAttack + skillBonus + dieAdjustment
  const critical = face === sides
  const amplify = (damage: number) => critical ? Math.ceil(damage * BALANCE.combatCriticalMultiplier) : damage
  const withoutGuard = amplify(calculateDamage(rawPower, mitigation))
  const finalDamage = amplify(calculateDamage(rawPower, mitigation + guardMitigation))
  return { baseAttack, skillBonus, dieAdjustment, mitigation, guardMitigation,
    guardPrevented: Math.max(0, withoutGuard - finalDamage), finalDamage, critical }
}

export const selectDamageDie = (actor: Combatant, skill?: CombatSkillDefinition): CombatDie => {
  const base = actor.attackDie ?? 4
  const index = BALANCE.attributeDieOrder.indexOf(base)
  const steps = Math.max(0, Math.floor(skill?.damageDieSteps ?? 0))
  return BALANCE.attributeDieOrder[Math.min(BALANCE.attributeDieOrder.length - 1, Math.max(0, index) + steps)]
}

const derivePlayerCombatant = (save: GameSave, catalog: ContentCatalog): Combatant => {
  const character = save.character
  const unlockedSkillIds = collectActiveEffects(save, catalog)
    .filter((effect): effect is Extract<typeof effect, { type: 'unlockSkill' }> => effect.type === 'unlockSkill')
    .map((effect) => effect.skillId)
  const equipmentSkillIds = getBoundItemSkillIds(save, catalog, 'weapon')
  // Clan skills are earned on affiliation, never granted to raw Terrírians.
  // BALANCE_DRAFT: the four Clans have distinct first disciplines in v0.5.10.
  const clanSkills: Record<string, string> = {
    dunavar: 'skill_clan_dunavar_guard',
    rustal: 'skill_clan_rustal_glyph',
    cebios_esti: 'skill_clan_cebios_orb',
    estres_do_et: 'skill_clan_estres_flux',
  }
  // Undefined is legacy: retain the historical skill; null is new player pending selection.
  const clanSkillId = save.character.clan.clanId
    ? (save.character.clan.selectedClanSkillId === null ? undefined :
       save.character.clan.selectedClanSkillId ?? clanSkills[save.character.clan.clanId]) : undefined
  const stats = deriveCharacterStats(save, catalog)
  const weaponBase = catalog.boundItemBases[save.boundItems[character.bondedEquipment.weapon ?? '']?.baseItemId ?? '']
  const offhand = deriveOffhandCombatV0517(save, catalog)
  const shieldInstance=character.bondedEquipment.shield ? save.boundItems[character.bondedEquipment.shield] : null
  const shieldDefinition=shieldInstance?catalog.boundItemBases[shieldInstance.baseItemId]:undefined
  // Do not count a bound shield's mitigation AGAIN as body armor: ESC/ARC are separate.
  const bodyMitigation=Math.max(0,stats.defense.value-(shieldDefinition?.statBonuses.mitigation??0))
  const classDefinition=character.classProgression.classId ? catalog.classes[character.classProgression.classId] : undefined
  const validClass=classDefinition && character.classProgression.masteryLevel>=1 && classDefinition.clanId===character.clan.clanId && save.quests[classDefinition.trialQuestId]?.status==='completed'
  const classSkillId=validClass ? CLASS_DISCIPLINE_SKILLS_V0517[character.classProgression.classId!] : undefined
  const modularDefense=getModularDefenseBonusesV05171(save)
  const maxHp = stats.life.value
  const maxMp = stats.mana.value

  return {
    id: 'combatant_player',
    definitionId: character.id,
    name: character.name,
    side: 'player',
    hp: Math.min(maxHp, Math.max(0, save.vitals.hp)),
    maxHp,
    mp: Math.min(maxMp, Math.max(0, save.vitals.mp)),
    maxMp,
    attackPower: stats.primaryAttack.value,
    mitigation: bodyMitigation,
    initiative: stats.initiative.value,
    initiativeDie: character.attributes.agility.die,
    alive: true,
    defending: false,
    weaponArchetype: weaponBase?.archetype ?? 'blade',
    offhandKind: offhand.kind,
    combatProfile: offhand.style,
    physicalGuard: offhand.physicalGuard,
    arcaneGuard: offhand.arcaneGuard,
    maxArcaneGuard: offhand.arcaneGuard + (offhand.clanDunavar ? 4 : offhand.style==='arcaneCaster' ? 3 : 0),
    hasBoundShield: offhand.kind === 'shield',
    defenseDice: {block:character.attributes.vigor.die,parry:character.attributes.agility.die,dodge:character.attributes.agility.die,counter:character.attributes.strength.die},
    defenseModuleBonuses:{block:modularDefense.block,parry:modularDefense.parry,dodge:modularDefense.dodge,counter:modularDefense.counter},
    shieldBashBonus:modularDefense.shieldBash,
    skillIds: [...new Set([
      ...COMMON_DEFENSE_SKILL_IDS_V0517,
      ...(offhand.kind==='shield'?['skill_shield_bash_v05171']:[]),
      ...equipmentSkillIds, ...unlockedSkillIds,
      ...(offhand.style==='arcaneCaster'?['skill_caster_arcane_guard_v0517','skill_scepter_accelerate_v0517']:[]),
      ...(offhand.kind==='quiver'&&offhand.style==='archer'?['skill_quiver_focus_v0517']:[]),
      ...(offhand.clanDunavar?['skill_clan_dunavar_arcane_shield_v0517']:[]),
      ...(clanSkillId ? [clanSkillId] : []),
      ...(classSkillId ? [classSkillId] : []),
    ])],
    attackDie: character.attributes[catalog.boundItemBases[save.boundItems[character.bondedEquipment.weapon ?? '']?.baseItemId ?? '']?.scalingAttribute ?? 'strength'].die,
    ...(catalog.boundItemBases[save.boundItems[character.bondedEquipment.weapon ?? '']?.baseItemId ?? '']?.bonusAttackDie
      ? { weaponBonusDie: catalog.boundItemBases[save.boundItems[character.bondedEquipment.weapon ?? '']?.baseItemId ?? ''].bonusAttackDie }
      : {}),
    statusEffects: [],
  }
}

const deriveEnemyCombatant = (
  definitionId: string,
  index: number,
  catalog: ContentCatalog,
): Combatant => {
  const enemy = catalog.enemies[definitionId]
  if (!enemy) throw new Error(`Inimigo não cadastrado: ${definitionId}`)
  return {
    id: `combatant_${enemy.id}_${index + 1}`,
    definitionId: enemy.id,
    name: enemy.name,
    side: 'enemy',
    hp: enemy.maxHp,
    maxHp: enemy.maxHp,
    mp: 0,
    maxMp: 0,
    attackPower: enemy.attackPower,
    mitigation: enemy.mitigation,
    initiative: Math.max(1, enemy.level + 3),
    initiativeDie: enemy.initiativeDie??4, // BALANCE_DRAFT, source-driven
    alive: true,
    defending: false,
    skillIds: enemy.skillIds,
    // BALANCE_DRAFT: enemies without explicit dice currently use d4, not a new damage rule.
    attackDie: enemy.attackDie??4,
    statusEffects: [],
    // Firestore rejects undefined; enemies without a special skill omit this field.
    ...(enemy.aiSkillEveryRounds !== undefined
      ? { aiSkillEveryRounds: enemy.aiSkillEveryRounds }
      : {}),
  }
}

export const isProtectedBoss = (state: BattleState, target: Combatant): boolean =>
  Boolean(state.bossMechanics && target.id === state.bossMechanics.bossId &&
    Object.values(state.combatants).some((actor) =>
      actor.alive && actor.side === 'enemy' && actor.id !== target.id))

const validTarget = (actor: Combatant, target: Combatant, targetType: 'enemy' | 'self', state?: BattleState) =>
  target.alive && (targetType === 'self' ? target.id === actor.id :
    target.side !== actor.side && (!state || !isProtectedBoss(state, target)))

const applyStatus = (
  state: BattleState,
  actor: Combatant,
  target: Combatant,
  effect: Extract<CombatEffectDefinition, { type: 'applyStatus' }>,
  catalog: ContentCatalog,
) => {
  const definition = catalog.statusEffects[effect.statusId]
  if (!definition || !rollChance(state, effect.chance)) return
  const current = target.statusEffects.find((status) => status.definitionId === definition.id)
  if (current) {
    current.remainingTurns = Math.max(current.remainingTurns, effect.durationTurns)
    current.sourceId = actor.id
  } else {
    target.statusEffects.push({
      definitionId: definition.id,
      sourceId: actor.id,
      remainingTurns: effect.durationTurns,
    })
  }
  addLog(state, `${target.name} recebe ${definition.name} por ${effect.durationTurns} turnos.`, 'system')
}

const applyCombatEffects = (
  state: BattleState,
  actor: Combatant,
  target: Combatant,
  effects: CombatEffectDefinition[],
  catalog: ContentCatalog,
  action = 'Ataque básico',
  skill?: CombatSkillDefinition,
) => {
  // A protected construct is immune to every offensive effect, including AoE and splash.
  if (actor.side !== target.side && isProtectedBoss(state, target)) return { damage: 0, face: 1, sides: selectDamageDie(actor, skill), critical: false }
  // A telegraphed boulder prevents Stagger only after a successful rolled defense.
  let guardedBoulder = false
  let dealt = 0
  let usedFace = 1
  let usedSides = selectDamageDie(actor, skill)
  let usedCritical = false
  for (const effect of effects) {
    if (effect.type === 'damage') {
      const mode = target.defending ? target.activeDefense : undefined
      const stance = mode && actor.side !== target.side ? DEFENSE_RULES_V0517[mode] : null
      const incoming=getAttackDeliveryV05171(actor,skill)
      const applicable=Boolean(mode && stance && (mode==='dodge' ||
        mode==='block'&&['melee','projectile'].includes(incoming) ||
        (mode==='parry'||mode==='counter')&&incoming==='melee'))
      const defenseSides = mode ? target.defenseDice?.[mode] ?? 4 : 4
      const defenseFace = applicable ? rollCombatDie(state, defenseSides) : 0
      const outcome=mode&&stance?calculateDefenseReactionV05171(target,mode,defenseFace,incoming):undefined
      const success=outcome?.success??false
      if(stance) addLog(state,applicable
        ? target.name+' tenta '+stance.name+': d'+defenseSides+'='+defenseFace+
          (outcome?.shield?' +1 Escudo':'')+(outcome?.duelist?' +1 Duelista':'')+
          (outcome?.archer?' +1 Arqueiro':'')+(outcome?.module?' +'+outcome.module+' Módulo':'')+
          ' contra '+stance.dc+' — '+(success?'SUCESSO':'FALHA')+'.'
        : target.name+' não pode usar '+stance.name+' contra '+incoming+'.',
        'defense')
      guardedBoulder = Boolean(target.defending && (!stance||(applicable&&success)) && skill?.id === 'skill_granite_slam')
      const guardMitigation = stance
        ? success ? stance.reduction + (mode === 'block' && target.hasBoundShield ? 1 : 0) +
          (mode==='block'?(target.defenseModuleBonuses?.block??0):0) : 0
        : target.defending && !mode ? BALANCE.defendMitigation : 0
      const appliedGuardMitigation = guardMitigation +
        (guardedBoulder ? GRANITE_GOLEM_BALANCE.throwBonusGuardMitigation : 0)
      const sides = selectDamageDie(actor, skill)
      const face = rollCombatDie(state, sides)
      const bonusFace = actor.weaponBonusDie ? rollCombatDie(state, actor.weaponBonusDie) : 0
      usedFace = face
      usedSides = sides
      const aspect=getDamageTypeV0517(actor,skill)
      // ARM only protects from physical blows. Magic first faces a depletable ARC ward.
      const armor=aspect==='physical' ? getEffectiveMitigation(target,catalog):0
      const basePower=getEffectiveAttackPower(actor,catalog)+bonusFace
      const skillPower=effect.powerBonus+(skill?.id==='skill_shield_bash_v05171'?(actor.shieldBashBonus??0)+1:0)
      const breakdown=calculateRolledDamage(basePower,armor,face,sides,skillPower,appliedGuardMitigation)
      const unarmored=aspect==='physical'
        ? calculateRolledDamage(basePower,0,face,sides,skillPower,appliedGuardMitigation).finalDamage
        : breakdown.finalDamage
      const armorAbsorbed=Math.max(0,unarmored-breakdown.finalDamage)
      if(success&&(mode==='parry'||mode==='dodge'&&incoming!=='area')){
        breakdown.guardPrevented+=breakdown.finalDamage
        breakdown.finalDamage=0
      }
      const affinity=applyAffinityV0517(target,breakdown.finalDamage,aspect,catalog)
      const layer=applyLayeredProtectionV0517(target,affinity.damage,aspect,catalog)
      breakdown.finalDamage=layer.hpDamage
      const detailed={...breakdown,damageAspect:aspect,
        shieldAbsorbed:layer.shieldAbsorbed,arcaneAbsorbed:layer.arcaneAbsorbed,armorAbsorbed,
        affinityDelta:affinity.delta,resistancePercent:Math.round(affinity.resistance*100)}
      // No second critical roll: face === sides is the ONLY critical trigger.
      const damage=detailed.finalDamage
      usedCritical = breakdown.critical
      dealt += damage
      target.hp = Math.max(0, target.hp - damage)
      target.alive = target.hp > 0
      target.defending = false
      delete target.activeDefense
      if (success && applicable && mode === 'counter' && target.alive && actor.alive && !isProtectedBoss(state,actor)) {
        const replySides=target.attackDie??4,replyFace=rollCombatDie(state,replySides)
        const retaliation = Math.min(actor.hp,Math.max(1,Math.floor(getEffectiveAttackPower(target,catalog)*0.25)+
          Math.floor(replyFace/2)))
        actor.hp = Math.max(0,actor.hp-retaliation)
        actor.alive = actor.hp>0
        addLog(state,target.name+' responde com Contragolpe: d'+replySides+'='+replyFace+' · '+retaliation+' de dano em '+actor.name+'.','damage')
      }
      const guardNote = guardMitigation
        ? ` · Reação evitou ${breakdown.guardPrevented}.` : ''
      const affinityNote=affinity.resistance ? ` · Afinidade ${Math.round(affinity.resistance*100)}%.` : ''
      const layerNote = ` · ESC ${layer.shieldAbsorbed} · ARM ${armorAbsorbed} · ARC ${layer.arcaneAbsorbed} · HP -${damage}.${affinityNote}`
      const critNote = breakdown.critical ? ' ACERTO CRÍTICO!' : ''
      addLog(state,
        `${actor.name} causa ${damage} de dano em ${target.name}.${critNote} d${sides}=${face}${actor.weaponBonusDie ? ` + d${actor.weaponBonusDie} da arma=${bonusFace}` : ''}, ATQ ${breakdown.baseAttack} + skill ${breakdown.skillBonus} - DEF ${breakdown.mitigation} - guarda ${appliedGuardMitigation}.${guardNote}${layerNote}`,
        'damage', { actorId: actor.id, targetId: target.id, sides, face, action, critical: breakdown.critical, damageBreakdown: detailed,
          ...(actor.weaponBonusDie ? { weaponBonusRoll: { sides: actor.weaponBonusDie, face: bonusFace } } : {}) },
      )
    }
    if (effect.type === 'restoreHp') {
      const restored = Math.min(effect.value, target.maxHp - target.hp)
      target.hp += restored
      addLog(state, `${target.name} recupera ${restored} de Vida.`, 'reward')
    }
    if (effect.type === 'drainArcaneGuard') {
      const drained=Math.min(target.arcaneGuard??0,Math.max(0,effect.value))
      target.arcaneGuard=Math.max(0,(target.arcaneGuard??0)-drained)
      addLog(state,`${actor.name} rompe ${drained} de ARC de ${target.name}.`,'defense')
    }
    if (effect.type === 'cleanseBeneficial') {
      const before=target.statusEffects.length
      target.statusEffects=target.statusEffects.filter(status=>catalog.statusEffects[status.definitionId]?.tone!=='beneficial')
      addLog(state,`${actor.name} dissipa ${before-target.statusEffects.length} efeito(s) benéfico(s) de ${target.name}.`,'defense')
    }
    if (effect.type === 'restoreArcaneGuard') {
      const capacity=Math.max(target.maxArcaneGuard??0,effect.value)
      target.maxArcaneGuard=capacity
      const added=Math.min(effect.value,capacity-(target.arcaneGuard??0))
      target.arcaneGuard=(target.arcaneGuard??0)+Math.max(0,added)
      addLog(state,`${target.name} conjura Proteção Arcana +${Math.max(0,added)} (ARC ${target.arcaneGuard}/${capacity}).`,'defense')
    }
    if (effect.type === 'restoreMp') {
      const restored = Math.min(effect.value, target.maxMp - target.mp)
      target.mp += restored
      addLog(state, `${target.name} recupera ${restored} de Mana.`, 'reward')
    }
    if (effect.type === 'cleanseHarmful') {
      const oldLength = target.statusEffects.length
      target.statusEffects = target.statusEffects.filter((status) => catalog.statusEffects[status.definitionId]?.tone !== 'harmful')
      addLog(state, `${target.name} remove ${oldLength - target.statusEffects.length} efeito(s) prejudicial(is).`, 'reward')
    }
    if (effect.type === 'applyStatus' && target.alive) {
      if (guardedBoulder && effect.statusId === 'status_granite_shaken') {
        addLog(state, 'Defesa perfeita! O abalo do granito foi evitado.', 'defense')
      } else applyStatus(state, actor, target, effect, catalog)
    }
  }
  return { damage: dealt, face: usedFace, sides: usedSides, critical: usedCritical }
}

const resolveAttack = (
  state: BattleState,
  actor: Combatant,
  target: Combatant,
  catalog: ContentCatalog,
) => {
  addPhase(state, 'SelectingTarget')
  addPhase(state, 'ResolvingAction')
  applyCombatEffects(state, actor, target, [{ type: 'damage', powerBonus: 0 }], catalog, getWeaponAttackNamesV0517(actor.weaponArchetype).single)
  addPhase(state, 'ResolvingReactions')
  addPhase(state, 'ApplyingStatuses')
  addPhase(state, 'CheckEndConditions')
}

const resolveSkill = (
  state: BattleState,
  actor: Combatant,
  target: Combatant,
  skill: CombatSkillDefinition,
  catalog: ContentCatalog,
) => {
  addPhase(state, 'SelectingTarget')
  addPhase(state, 'ResolvingAction')
  actor.mp -= skill.mpCost
  if (skill.cooldownTurns) {
    actor.skillCooldowns ??= {}
    // Tick once after this action; the next N of the actor's turns are blocked.
    actor.skillCooldowns[skill.id] = Math.floor(skill.cooldownTurns) + 1
  }
  addLog(state, `${actor.name} usa ${skill.name}.`, 'system')
  if (skill.defenseStance) {
    target.defending = true
    target.activeDefense = skill.defenseStance
    addLog(state, `${target.name} prepara ${skill.name}; o próximo golpe exigirá uma rolagem de reação.`, 'defense')
    addPhase(state, 'ResolvingReactions')
    addPhase(state, 'ApplyingStatuses')
    addPhase(state, 'CheckEndConditions')
    return
  }
  if (skill.id === 'skill_basic_area_attack') {
    resolveAreaAttack(state,actor,target,catalog)
    return
  }
  const protectedBossId=state.bossMechanics && isProtectedBoss(state,state.combatants[state.bossMechanics.bossId])
    ? state.bossMechanics.bossId : undefined
  const primary = applyCombatEffects(state, actor, target, skill.effects, catalog, skill.name, skill)
  for(const effect of skill.effects) if(effect.type==='adjacentSplash'&&primary.damage>0)
    applySplash(state,actor,target,Math.floor(primary.damage*effect.fraction),skill.name,primary.sides,primary.face,effect.maxTargets,protectedBossId,primary.critical,getDamageTypeV0517(actor,skill),catalog)
  if (skill.id === 'skill_resonant_strike' && primary.damage > 0) {
    // BALANCE_DRAFT OD-06: 5% final primary damage to each other unprotected enemy.
    // Snapshot the shield from action start; AoE never hits the boss accidentally.
    const bossProtected = state.bossMechanics &&
      Object.values(state.combatants).some((entry) => entry.side === 'enemy' &&
        entry.id !== state.bossMechanics!.bossId && (entry.alive || entry.id === target.id))
    const splash = Math.max(1, Math.ceil(primary.damage * 0.05))
    for (const other of Object.values(state.combatants)) {
      if (other.id === target.id ||
          (bossProtected && other.id === state.bossMechanics?.bossId) ||
          !validTarget(actor, other, 'enemy', state)) continue
      const affinity=applyAffinityV0517(other,splash,'arcane',catalog)
      const protection=applyLayeredProtectionV0517(other,affinity.damage,'arcane',catalog)
      const damage = Math.min(other.hp, protection.hpDamage)
      other.hp = Math.max(0, other.hp - damage)
      other.alive = other.hp > 0
      addLog(state, `${actor.name} causa ${damage} de dano em ${other.name} por Pulso Ressonante.`, 'damage',
        { actorId: actor.id, targetId: other.id, sides: primary.sides, face: primary.face, action: 'Pulso Ressonante', critical: primary.critical })
    }
  }
  addPhase(state, 'ResolvingReactions')
  addPhase(state, 'ApplyingStatuses')
  addPhase(state, 'CheckEndConditions')
}

/** Encounter declaration defines stable lateral formation; initiative never reorders neighbors. */
const adjacentEnemies = (state:BattleState,target:Combatant):Combatant[] => {
  const actors=Object.values(state.combatants).filter(c=>c.side==='enemy')
  const index=actors.findIndex(c=>c.id===target.id)
  return [actors[index-1],actors[index+1]].filter(
    (other):other is Combatant=>Boolean(other?.alive))
}
const applySplash=(state:BattleState,actor:Combatant,target:Combatant,damage:number,
  action:string,sides:CombatDie,face:number,maxTargets:number,protectedBossId:string|undefined,critical:boolean,
  aspect:import('./layeredDefenseV0517').DamageTypeV0517,catalog:ContentCatalog) => {
  for(const other of adjacentEnemies(state,target).filter(c=>c.id!==protectedBossId && validTarget(actor,c,'enemy',state)).slice(0,maxTargets)){
    const armor=aspect==='physical'?getEffectiveMitigation(other,catalog):0
    const afterArmor=Math.max(0,damage-armor)
    const affinity=applyAffinityV0517(other,afterArmor,aspect,catalog)
    const protection=applyLayeredProtectionV0517(other,affinity.damage,aspect,catalog)
    const dealt=Math.min(other.hp,protection.hpDamage)
    if(!dealt&&!protection.shieldAbsorbed&&!protection.arcaneAbsorbed)continue
    other.hp=Math.max(0,other.hp-dealt);other.alive=other.hp>0
    addLog(state,`${actor.name} causa ${dealt} de dano em ${other.name} por ${action}. ESC ${protection.shieldAbsorbed} · ARM ${armor} · ARC ${protection.arcaneAbsorbed} · afinidade ${Math.round(affinity.resistance*100)}%.`,'damage',
      {actorId:actor.id,targetId:other.id,sides,face,action,critical})
  }
}
const resolveAreaAttack=(state:BattleState,actor:Combatant,target:Combatant,catalog:ContentCatalog) => {
  addPhase(state,'SelectingTarget');addPhase(state,'ResolvingAction')
  const sides=selectDamageDie(actor),face=rollCombatDie(state,sides)
  const bonusFace=actor.weaponBonusDie?rollCombatDie(state,actor.weaponBonusDie):0
  const guard=target.defending?BALANCE.defendMitigation:0
  const aspect=getDamageTypeV0517(actor)
  const armor=aspect==='physical'?getEffectiveMitigation(target,catalog):0
  const rolled=calculateRolledDamage(getEffectiveAttackPower(actor,catalog)+bonusFace,
    armor,face,sides,0,guard)
  // BALANCE_DRAFT: 60% normal center, 30% of inflicted center for each flank.
  const protectedBossId=state.bossMechanics && isProtectedBoss(state,state.combatants[state.bossMechanics.bossId])
    ? state.bossMechanics.bossId : undefined
  const areaPower=Math.max(1,Math.floor(rolled.finalDamage*0.6))
  const affinity=applyAffinityV0517(target,areaPower,aspect,catalog)
  const protection=applyLayeredProtectionV0517(target,affinity.damage,aspect,catalog)
  const centerDamage=Math.min(target.hp,protection.hpDamage)
  target.hp=Math.max(0,target.hp-centerDamage);target.alive=target.hp>0;target.defending=false
  delete target.activeDefense
  addLog(state,`${actor.name} causa ${centerDamage} de dano em ${target.name} com ${getWeaponAttackNamesV0517(actor.weaponArchetype).area}. ESC ${protection.shieldAbsorbed} · ARC ${protection.arcaneAbsorbed}.${rolled.critical ? ' ACERTO CRÍTICO!' : ''}`,'damage',
    {actorId:actor.id,targetId:target.id,sides,face,action:getWeaponAttackNamesV0517(actor.weaponArchetype).area,critical:rolled.critical,
      damageBreakdown:{...rolled,finalDamage:centerDamage,damageAspect:aspect,shieldAbsorbed:protection.shieldAbsorbed,arcaneAbsorbed:protection.arcaneAbsorbed,armorAbsorbed:Math.min(armor,Math.max(0,rolled.baseAttack+rolled.dieAdjustment)),affinityDelta:affinity.delta,resistancePercent:Math.round(affinity.resistance*100)},
      ...(actor.weaponBonusDie?{weaponBonusRoll:{sides:actor.weaponBonusDie,face:bonusFace}}:{})})
  applySplash(state,actor,target,Math.floor(centerDamage*0.3),'Splash de Área',sides,face,2,protectedBossId,rolled.critical,aspect,catalog)
  addPhase(state,'ResolvingReactions');addPhase(state,'ApplyingStatuses');addPhase(state,'CheckEndConditions')
}

const resolveItem = (
  state: BattleState,
  actor: Combatant,
  target: Combatant,
  item: ItemDefinition,
  catalog: ContentCatalog,
) => {
  addPhase(state, 'SelectingTarget')
  addPhase(state, 'ResolvingAction')
  addLog(state, `${actor.name} usa ${item.name}.`, 'system')
  applyCombatEffects(state, actor, target, item.combatEffects, catalog, item.name)
  addPhase(state, 'ResolvingReactions')
  addPhase(state, 'ApplyingStatuses')
  addPhase(state, 'CheckEndConditions')
}

const applyPotionTurn = (state: BattleState, actor: Combatant) => {
  if (actor.side !== 'player') return
  actor.potionCooldown = Math.max(0, (actor.potionCooldown ?? 0) - 1)
  const ticks = actor.potionHealingTicks ?? 0
  if (ticks <= 0) return
  // Exactly 10% of max HP in total (rounded up once), split across two turns.
  const amount = Math.ceil((actor.potionHealingRemaining ?? 0) / ticks)
  const healed = Math.min(Math.max(0, actor.maxHp - actor.hp), amount)
  actor.hp += healed
  actor.potionHealingRemaining = Math.max(0, (actor.potionHealingRemaining ?? 0) - amount)
  actor.potionHealingTicks = ticks - 1
  addLog(state, `Poção Restauradora recupera ${healed} de Vida em ${actor.name}.`, 'reward')
}

const applyStartStatuses = (
  state: BattleState,
  actor: Combatant,
  catalog: ContentCatalog,
) => {
  addPhase(state, 'ApplyingStatuses')
  for (const active of actor.statusEffects) {
    const definition = catalog.statusEffects[active.definitionId]
    if (!definition || definition.startTurnDamage <= 0) continue
    actor.hp = Math.max(0, actor.hp - definition.startTurnDamage)
    actor.alive = actor.hp > 0
    addLog(
      state,
      `${definition.name} causa ${definition.startTurnDamage} de dano em ${actor.name}.`,
      'damage',
    )
  }
}

const tickSkillCooldowns = (actor: Combatant) => {
  if (!actor.skillCooldowns) return
  for (const id of Object.keys(actor.skillCooldowns)) {
    actor.skillCooldowns[id] = Math.max(0, actor.skillCooldowns[id] - 1)
    if (!actor.skillCooldowns[id]) delete actor.skillCooldowns[id]
  }
}

const tickStatuses = (actor: Combatant) => {
  actor.statusEffects = actor.statusEffects
    .map((active) => ({ ...active, remainingTurns: active.remainingTurns - 1 }))
    .filter((active) => active.remainingTurns > 0)
}

const applyBossRound = (state: BattleState, catalog: ContentCatalog) => {
  const rules = state.bossMechanics
  if (!rules || !state.combatants[rules.bossId]?.alive) return
  const guards = Object.values(state.combatants).filter((actor) => actor.side === 'enemy' && actor.id !== rules.bossId)
  if (state.round % rules.healEveryRounds === 0) {
    for (const guard of guards.filter((actor) => actor.alive)) {
      const healed = Math.min(guard.maxHp - guard.hp, Math.ceil(guard.maxHp * rules.healFraction))
      guard.hp += healed
      addLog(state, `A Sentinela recupera ${healed} de Vida de ${guard.name}.`, 'reward')
    }
  }
  if (state.round % rules.summonEveryRounds === 0 &&
      guards.filter((actor) => actor.alive).length < rules.maxAlive) {
    const dead = guards.find((actor) => !actor.alive)
    if (dead) {
      // Reuse the original guard slot and turn ID; cannot exceed three active fungi.
      const revived = deriveEnemyCombatant(dead.definitionId,
        state.initiativeOrder.indexOf(dead.id), catalog)
      state.combatants[dead.id] = { ...revived, id: dead.id, initiative: dead.initiative }
      addLog(state, `A Sentinela ressuscita ${dead.name} no quinto ciclo da Ruína.`, 'system')
    }
  }
}

const checkBattleEnd = (state: BattleState) => {
  const player = Object.values(state.combatants).find((combatant) => combatant.side === 'player')
  if (!player?.alive) {
    addLog(state, `${player?.name ?? 'O Terrírian'} não consegue prosseguir.`, 'system')
    addPhase(state, 'Defeat')
    return true
  }
  const livingEnemies = Object.values(state.combatants).filter(
    (combatant) => combatant.side === 'enemy' && combatant.alive,
  )
  if (livingEnemies.length === 0) {
    addLog(state, 'A presença Fungorra recua. As recompensas foram preservadas.', 'reward')
    addPhase(state, 'Victory')
    return true
  }
  return false
}

const resolveEnemyAction = (
  state: BattleState,
  actor: Combatant,
  catalog: ContentCatalog,
) => {
  const player = Object.values(state.combatants).find(
    (combatant) => combatant.side === 'player' && combatant.alive,
  )
  if (!player) return
  if (state.bossMechanics && actor.id === state.bossMechanics.bossId) {
    // BALANCE_DRAFT OD-04: +1 attack/mitigation for two turns, each 3 rounds.
    if (state.round % state.bossMechanics.buffEveryRounds === 0) {
      for (const guard of Object.values(state.combatants).filter((entry) => entry.side === 'enemy' && entry.id !== actor.id && entry.alive))
        applyStatus(state, actor, guard, { type: 'applyStatus',
          statusId: 'status_corrupted_mycotic_boost',
          durationTurns: state.bossMechanics.buffDurationTurns, chance: 1 }, catalog)
      addLog(state, 'O Núcleo da Ruína fortalece seus fungos.', 'system')
    }
    const strike = catalog.combatSkills.skill_sentinel_arcane_pulse
    if (strike) resolveSkill(state, actor, player, strike, catalog)
    else resolveAttack(state, actor, player, catalog)
    return
  }
  // Wind-up replaces this turn's attack. Regardless of initiative order, the player
  // receives one full opportunity to defend before the boulder is thrown.
  if (actor.definitionId === GRANITE_GOLEM_ENEMY_ID &&
      state.round % GRANITE_GOLEM_BALANCE.throwIntervalRounds === GRANITE_GOLEM_BALANCE.windupRoundRemainder) {
    addLog(state, 'O Golem ergue uma rocha! Na próxima rodada ele vai arremessá-la. Use a habilidade BLOQUEIO ou APARAR e uma poção se necessário.', 'system')
    return
  }
  const skill=getScheduledEnemySkillV0517(state,actor,player,catalog)
  if (skill && actor.mp >= skill.mpCost && !(actor.skillCooldowns?.[skill.id] ?? 0) && validTarget(actor, player, skill.target)) {
    resolveSkill(state, actor, player, skill, catalog)
  } else {
    resolveAttack(state, actor, player, catalog)
  }
}

const advanceUntilPlayer = (state: BattleState, catalog: ContentCatalog) => {
  const current = state.combatants[state.actorId]
  if (current) { tickStatuses(current); tickSkillCooldowns(current) }
  addPhase(state, 'TurnEnd')

  for (let attempts = 0; attempts < state.initiativeOrder.length * 2; attempts += 1) {
    const previousCursor = state.actorCursor
    state.actorCursor = (state.actorCursor + 1) % state.initiativeOrder.length
    if (state.actorCursor <= previousCursor) {
      state.round += 1
      applyBossRound(state, catalog)
      // Reorder only when a status changes initiative. Legacy battles and the
      // Golem's telegraph must NEVER acquire an extra enemy turn here.
      const actors=Object.values(state.combatants)
      const modified=actors.some(a=>{const m=getInitiativeModifiersV0517(a,catalog);return m.flat!==0 || m.steps!==(a.initiativeAppliedDieSteps??0)})
      if(modified||state.initiativeStatusOrderModified){
        for(const actor of actors)actor.initiativeRolledBase??=actor.initiative
        state.initiativeOrder=actors
          .sort((a,b)=>getEffectiveInitiativeV0517(b,catalog)-getEffectiveInitiativeV0517(a,catalog)||a.id.localeCompare(b.id))
          .map(a=>a.id)
        for(const next of actors)next.initiative=getEffectiveInitiativeV0517(next,catalog)
        state.initiativeStatusOrderModified=modified
        addLog(state,'Iniciativa reordenada pelos efeitos de status ativos.', 'system')
      }
      state.actorCursor=0
    }
    state.actorId = state.initiativeOrder[state.actorCursor]
    const actor = state.combatants[state.actorId]
    if (!actor?.alive) continue

    addPhase(state, 'TurnStart')
    addLog(state, `Turno de ${actor.name} · Iniciativa ${actor.initiative}.`, 'system')
    applyPotionTurn(state, actor)
    applyStartStatuses(state, actor, catalog)
    addPhase(state, 'CheckEndConditions')
    if (checkBattleEnd(state)) return

    if (actor.side === 'player') {
      addPhase(state, 'AwaitingAction')
      return
    }

    resolveEnemyAction(state, actor, catalog)
    if (checkBattleEnd(state)) return
    tickStatuses(actor)
    tickSkillCooldowns(actor)
    addPhase(state, 'TurnEnd')
  }
}

/**
 * Manual initiative is a real deterministic battle action. Each actor rolls its
 * initiative die; base initiative + face determines turn order. No save is mutated
 * before this command is committed. Old already-started battles remain valid.
 */
const resolveInitiative = (state: BattleState, catalog: ContentCatalog): void => {
  // Presentation rolls the player's die first; initiative totals still determine turn order.
  const actors = Object.values(state.combatants).sort((a, b) => Number(b.side === 'player') - Number(a.side === 'player'))
  for (const actor of actors) {
    const modifiers = getInitiativeModifiersV0517(actor, catalog)
    const sides = modifiers.die
    const face = rollCombatDie(state, sides)
    actor.initiativeAppliedDieSteps = modifiers.steps
    actor.initiativeRolledBase = actor.initiative + face
    actor.initiative = actor.initiativeRolledBase + modifiers.flat
    addLog(state, `${actor.name} rola iniciativa: d${sides} = ${face} + base ${actor.initiativeRolledBase-face} + status ${modifiers.flat} (total ${actor.initiative}).`, 'system',
      { actorId: actor.id, sides, face, action: 'Iniciativa' })
  }
  state.initiativeOrder = actors.sort((a, b) => b.initiative - a.initiative || a.id.localeCompare(b.id)).map((actor) => actor.id)
  state.actorCursor = 0
  state.actorId = state.initiativeOrder[0]
  const actor = state.combatants[state.actorId]
  addPhase(state, 'TurnStart')
  addLog(state, `Turno de ${actor.name} · Iniciativa ${actor.initiative}.`, 'system')
  applyPotionTurn(state, actor)
  applyStartStatuses(state, actor, catalog)
  if (checkBattleEnd(state)) return
  if (actor.side === 'player') addPhase(state, 'AwaitingAction')
  else {
    resolveEnemyAction(state, actor, catalog)
    if (!checkBattleEnd(state)) advanceUntilPlayer(state, catalog)
  }
}

export const createBattle = (
  save: GameSave,
  encounter: EncounterDefinition,
  catalog: ContentCatalog,
  id: string = createRandomId(),
  options: { manualInitiative?: boolean } = {},
): BattleState => {
  const player = derivePlayerCombatant(save, catalog)
  const enemies = encounter.enemyDefinitionIds.map((definitionId, index) =>
    deriveEnemyCombatant(definitionId, index, catalog),
  )
  if (encounter.id === GRANITE_GOLEM_ENCOUNTER_ID) {
    const golem = enemies.find((enemy) => enemy.definitionId === GRANITE_GOLEM_ENEMY_ID)
    if (golem) {
      // +10% over this player's maximum HP and base ATK, snapshotted at encounter entry.
      // DEF stays at player parity: scaling it by rounding would unfairly punish weak builds.
      golem.maxHp = Math.ceil(player.maxHp * GRANITE_GOLEM_BALANCE.playerStatMultiplier)
      golem.hp = golem.maxHp
      golem.attackPower = Math.ceil(player.attackPower * GRANITE_GOLEM_BALANCE.playerStatMultiplier)
      golem.mitigation = player.mitigation
      golem.initiative = Math.ceil(Math.max(1, player.initiative) * GRANITE_GOLEM_BALANCE.playerStatMultiplier)
    }
  }
  const combatants = [player, ...enemies]
  const initiativeOrder = [...combatants]
    .sort((a, b) => b.initiative - a.initiative || a.id.localeCompare(b.id))
    .map((combatant) => combatant.id)
  const actorId = initiativeOrder[0]

  const state: BattleState = {
    id,
    encounterId: encounter.id,
    trailNodeId: encounter.trailNodeId,
    phase: 'Initializing',
    phaseHistory: ['Initializing'],
    round: 1,
    actorId,
    actorCursor: 0,
    initiativeOrder,
    combatants: Object.fromEntries(combatants.map((combatant) => [combatant.id, combatant])),
    log: [],
    rewards: structuredClone(encounter.rewards),
    claimed: false,
    canFlee: encounter.canFlee,
    consumedItemInstanceIds: [],
    rngSeed: seedFromBattleId(id),
    ...(encounter.id === FUNGAL_BOSS_ENCOUNTER_ID
      ? { bossMechanics: {
          bossId: enemies.find((enemy) => enemy.definitionId === FUNGAL_BOSS_RULES.bossDefinitionId)!.id,
          guardDefinitionIds: [...FUNGAL_BOSS_RULES.guardianDefinitionIds],
          maxAlive: FUNGAL_BOSS_RULES.maxAliveGuards,
          summonEveryRounds: FUNGAL_BOSS_RULES.summonIntervalRounds,
          healEveryRounds: FUNGAL_BOSS_RULES.healIntervalRounds,
          healFraction: FUNGAL_BOSS_RULES.healFraction,
          buffEveryRounds: FUNGAL_BOSS_RULES.buffIntervalRounds,
          buffDurationTurns: FUNGAL_BOSS_RULES.buffDurationTurns,
        } }
      : {}),
  }

  if(encounter.id!=='encounter_astravel_wave'){
    const loot=rollModularLootV05171(save,state.id,state.rngSeed,encounter.trailNodeId,undefined,catalog)
    if(loot){
      state.modularLootRollV05171=loot
      state.rewards.lootDefinitionIds.push(...loot.itemIds)
    }
  }
  addLog(state, `${encounter.name} bloqueia o avanço em Astravél.`, 'system')
  if (encounter.id === GRANITE_GOLEM_ENCOUNTER_ID)
    addLog(state, `Golem adaptado ao seu poder: +10% de Vida e Ataque, Defesa equivalente. Uma rocha é arremessada a cada três rodadas, com preparação antecipada.`, 'system')
  if (options.manualInitiative) {
    addPhase(state, 'AwaitingInitiative')
    addLog(state, 'Turno 1 · Prepare a rolagem de iniciativa.', 'system')
    return state
  }
  const actor = state.combatants[state.actorId]
  addPhase(state, 'TurnStart')
  addLog(state, `Turno de ${actor.name} · Iniciativa ${actor.initiative}.`, 'system')
  applyStartStatuses(state, actor, catalog)
  if (actor.side === 'player') {
    addPhase(state, 'AwaitingAction')
  } else {
    resolveEnemyAction(state, actor, catalog)
    if (!checkBattleEnd(state)) advanceUntilPlayer(state, catalog)
  }
  return state
}

const findInventoryItem = (
  inventory: InventoryItemInstance[],
  itemInstanceId: string,
  catalog: ContentCatalog,
) => {
  const instance = inventory.find((item) => item.instanceId === itemInstanceId)
  const definition = instance ? catalog.items[instance.definitionId] : undefined
  return { instance, definition }
}

export const submitBattleCommand = (
  battle: BattleState,
  command: BattleCommand,
  catalog: ContentCatalog,
  inventory: InventoryItemInstance[] = [],
): Result<BattleState> => {
  if (command.type === 'rollInitiative') {
    if (battle.phase !== 'AwaitingInitiative') return fail('INITIATIVE_ALREADY_ROLLED', 'A iniciativa já foi determinada.')
    const next = structuredClone(battle)
    resolveInitiative(next, catalog)
    return ok(next)
  }
  if ((command as {type:string}).type === 'doubleAttack') return fail('REMOVED_ACTION_V0517', 'Ataque Duplo foi removido na v0.5.17.')
  if (battle.phase !== 'AwaitingAction') {
    return fail('INVALID_BATTLE_PHASE', 'A batalha não está aguardando uma ação do jogador.')
  }

  const currentPlayer = battle.combatants[battle.actorId]
  if (!currentPlayer || currentPlayer.side !== 'player' || !currentPlayer.alive) {
    return fail('INVALID_ACTOR', 'O ator atual não pode executar comandos do jogador.')
  }

  if (command.type === 'flee') {
    return fail(
      battle.canFlee ? 'FLEE_NOT_IMPLEMENTED' : 'FLEE_LOCKED',
      battle.canFlee
        ? 'A resolução de fuga permanece indisponível neste build.'
        : 'Fuga indisponível neste encontro.',
    )
  }

  let target: Combatant | undefined
  let skill: CombatSkillDefinition | undefined
  let item: ItemDefinition | undefined

  if (command.type === 'attack' || command.type === 'areaAttack') {
    target = battle.combatants[command.targetId ?? Object.values(battle.combatants).find(c=>c.side==='enemy'&&c.alive&&!isProtectedBoss(battle,c))?.id ?? '']
    if (!target || !validTarget(currentPlayer, target, 'enemy', battle)) {
      return fail('INVALID_TARGET', 'Escolha um alvo inimigo válido.')
    }
  }

  if (command.type === 'skill') {
    skill = catalog.combatSkills[command.skillId]
    target = battle.combatants[command.targetId]
    if (!skill || !currentPlayer.skillIds.includes(command.skillId)) {
      return fail('SKILL_LOCKED', 'Esta habilidade ainda não foi desbloqueada pelo Vínculo.')
    }
    if ((currentPlayer.skillCooldowns?.[skill.id] ?? 0) > 0) {
      return fail('SKILL_COOLDOWN', `A habilidade volta em ${currentPlayer.skillCooldowns?.[skill.id]} turno(s).`)
    }
    if (currentPlayer.mp < skill.mpCost) {
      return fail('INSUFFICIENT_MP', 'Mana insuficiente para esta habilidade.')
    }
    if (!target || !validTarget(currentPlayer, target, skill.target, battle)) {
      return fail('INVALID_TARGET', 'Escolha um alvo válido para a habilidade.')
    }
  }

  if (command.type === 'item') {
    const lookup = findInventoryItem(inventory, command.itemInstanceId, catalog)
    target = battle.combatants[command.targetId]
    item = lookup.definition
    if (
      !lookup.instance ||
      !item ||
      item.category !== 'consumable' ||
      item.combatEffects.length === 0 ||
      lookup.instance.quantity < 1
    ) {
      return fail('ITEM_UNAVAILABLE', 'Este consumível não está disponível para uso em combate.')
    }
    if (!target || !validTarget(currentPlayer, target, item.combatTarget ?? 'self', battle)) {
      return fail('INVALID_TARGET', 'Este consumível não pode ser usado no alvo escolhido.')
    }
  }

  const state = structuredClone(battle)
  const player = state.combatants[state.actorId]
  const resolvedTarget = target ? state.combatants[target.id] : undefined

  if (command.type === 'item' && item && resolvedTarget &&
    item.combatTarget !== 'enemy' &&
    (item.combatUseMode === 'freeHealingPotion' ||
      (item.category === 'consumable' && item.combatEffects.every(effect =>
        effect.type === 'restoreHp' || effect.type === 'restoreMp' ||
        effect.type === 'cleanseHarmful')))) {
    const specialPotion = item.combatUseMode === 'freeHealingPotion'
    // Keep the legacy two-turn use cooldown IN BATTLE only. The heal itself is
    // immediate; Victory preparation bypasses this battle-local cooldown.
    if (specialPotion && (currentPlayer.potionCooldown ?? 0) > 0)
      return fail('POTION_COOLDOWN', 'Poção em recarga: aguarde dois turnos.')
    const healing = specialPotion
      ? [{type:'restoreHp' as const,value:Math.ceil(player.maxHp*0.1)}]
      : item.combatEffects
    const useful = healing.some(effect =>
      (effect.type === 'restoreHp' && player.hp < player.maxHp) ||
      (effect.type === 'restoreMp' && player.mp < player.maxMp) ||
      (effect.type === 'cleanseHarmful' && player.statusEffects.some(status =>
        catalog.statusEffects[status.definitionId]?.tone === 'harmful')))
    if (!useful) return fail('ITEM_NOT_NEEDED','O consumível não terá efeito útil agora.')
    applyCombatEffects(state,player,resolvedTarget,healing,catalog,item.name)
    if (specialPotion) {
      player.potionCooldown=2
      player.potionHealingTicks=0
      player.potionHealingRemaining=0
    }
    addLog(state,`${player.name} usa ${item.name} instantaneamente, sem gastar a ação.`,'reward')
    state.consumedItemInstanceIds.push(command.itemInstanceId)
    return ok(state) // Never advances the turn or initiates an enemy reaction.
  }

  if (command.type === 'defend') {
    addPhase(state, 'ResolvingAction')
    player.defending = true
    addLog(state, `${player.name} assume uma postura defensiva.`, 'defense')
    addPhase(state, 'ResolvingReactions')
    addPhase(state, 'ApplyingStatuses')
    addPhase(state, 'CheckEndConditions')
  }
  if (command.type === 'areaAttack' && resolvedTarget) {
    resolveAreaAttack(state,player,resolvedTarget,catalog)
  }
  if (command.type === 'attack' && resolvedTarget) {
    resolveAttack(state, player, resolvedTarget, catalog)
  }
  if (command.type === 'skill' && resolvedTarget && skill) {
    resolveSkill(state, player, resolvedTarget, skill, catalog)
  }
  if (command.type === 'item' && resolvedTarget && item) {
    resolveItem(state, player, resolvedTarget, item, catalog)
    state.consumedItemInstanceIds.push(command.itemInstanceId)
  }

  if (checkBattleEnd(state)) return ok(state)
  advanceUntilPlayer(state, catalog)
  return ok(state)
}
