import type { BoundSlot, ComplementarySlot } from '../domain/shared/types'

/**
 * v0.5.15.2 · BALANCE_DRAFT
 * These are real currently calculated combat statistics, not speculative
 * crit/accuracy/evasion mechanics. A gear bonus does NOT change an Attribute die.
 */
export const GEAR_STAT_KEYS = [
  'maxHp', 'maxMp', 'attackPower', 'physicalAttack', 'magicalAttack',
  'mitigation', 'initiative',
] as const
export type GearStat = typeof GEAR_STAT_KEYS[number]
export type GearStatTotals = Record<GearStat, number>
export const GEAR_STAT_LABELS: Record<GearStat,string> = {
  maxHp: 'Vida', maxMp: 'Mana', attackPower: 'Ataque geral',
  physicalAttack: 'Ataque físico', magicalAttack: 'Ataque mágico',
  mitigation: 'Defesa', initiative: 'Iniciativa',
}
export const emptyGearStats = ():GearStatTotals => ({
  maxHp: 0, maxMp: 0, attackPower: 0, physicalAttack: 0,
  magicalAttack: 0, mitigation: 0, initiative: 0,
})

export type CombatProfile = {
  label: string
  description: string
  focus: GearStat
  support: GearStat
  weaponPrimary: GearStat
  weaponSecondary: GearStat
}

/** Twelve neutral combat needs, NOT Class selection or Class requirements. */
export const NERIS_COMBAT_PROFILES: Record<string, CombatProfile> = {
  sentinela_da_luz: {
    label: 'Guarda', description: 'Defesa e segurança com ataque físico controlado.',
    focus: 'mitigation', support: 'maxHp', weaponPrimary: 'physicalAttack', weaponSecondary: 'mitigation',
  },
  gladiador_da_barreira: {
    label: 'Vanguarda', description: 'Pressão física e resistência para combate direto.',
    focus: 'physicalAttack', support: 'maxHp', weaponPrimary: 'physicalAttack', weaponSecondary: 'maxHp',
  },
  batedor_da_vigilia: {
    label: 'Agilidade', description: 'Prioridade de turno e agressão física móvel.',
    focus: 'initiative', support: 'physicalAttack', weaponPrimary: 'physicalAttack', weaponSecondary: 'initiative',
  },
  forjador_arcano: {
    label: 'Versatilidade', description: 'Ataque geral com defesa para qualquer arma vinculada.',
    focus: 'attackPower', support: 'mitigation', weaponPrimary: 'attackPower', weaponSecondary: 'mitigation',
  },
  guardiao_das_inscricoes: {
    label: 'Proteção arcana', description: 'Ofensiva mágica com proteção defensiva.',
    focus: 'mitigation', support: 'maxMp', weaponPrimary: 'magicalAttack', weaponSecondary: 'mitigation',
  },
  gravador_das_sombras: {
    label: 'Magia veloz', description: 'Magia com iniciativa para agir cedo.',
    focus: 'initiative', support: 'magicalAttack', weaponPrimary: 'magicalAttack', weaponSecondary: 'initiative',
  },
  astrologo_celestial: {
    label: 'Conjurador', description: 'Ataque mágico e reserva de Mana.',
    focus: 'magicalAttack', support: 'maxMp', weaponPrimary: 'magicalAttack', weaponSecondary: 'maxMp',
  },
  profeta_do_orbe: {
    label: 'Mago resistente', description: 'Ataque mágico com Vida para sobreviver.',
    focus: 'maxMp', support: 'maxHp', weaponPrimary: 'magicalAttack', weaponSecondary: 'maxHp',
  },
  cacador_de_constelacoes: {
    label: 'Caçador', description: 'Dano físico com recurso de Mana para habilidades.',
    focus: 'physicalAttack', support: 'maxMp', weaponPrimary: 'physicalAttack', weaponSecondary: 'maxMp',
  },
  canalizador_do_caos: {
    label: 'Híbrido arcano', description: 'Ataque geral e Mana, sem especialização obrigatória.',
    focus: 'attackPower', support: 'maxMp', weaponPrimary: 'attackPower', weaponSecondary: 'maxMp',
  },
  guardador_da_ruptura: {
    label: 'Contra-ataque', description: 'Prioridade de turno e ataque aplicáveis a armas diversas.',
    focus: 'mitigation', support: 'initiative', weaponPrimary: 'attackPower', weaponSecondary: 'initiative',
  },
  mago_da_ruina: {
    label: 'Dano híbrido', description: 'Potência mágica com alternativa de ataque físico.',
    focus: 'magicalAttack', support: 'physicalAttack', weaponPrimary: 'magicalAttack', weaponSecondary: 'physicalAttack',
  },
}

export const CLAN_COMBAT_PROFILES: Record<string,CombatProfile> = {
  dunavar: NERIS_COMBAT_PROFILES.sentinela_da_luz,
  rustal: NERIS_COMBAT_PROFILES.forjador_arcano,
  cebios_esti: NERIS_COMBAT_PROFILES.astrologo_celestial,
  estres_do_et: NERIS_COMBAT_PROFILES.guardador_da_ruptura,
}

const DISTINCT_SECONDARIES: readonly GearStat[] =
  ['maxHp','maxMp','physicalAttack','magicalAttack','mitigation','initiative','attackPower']

/**
 * Each part has a distinct function within an overall profile. Weapons have
 * twelve non-duplicated pairs; armor preserves Defense as its primary stat,
 * so the existing armor/vinculo pipeline cannot silently lose mitigation.
 */
export function getGearStatPair(profile:CombatProfile,slot:BoundSlot|ComplementarySlot):
 readonly [GearStat,GearStat] {
  let primary:GearStat
  let preferred:GearStat
  switch(slot) {
   case 'weapon': primary=profile.weaponPrimary;preferred=profile.weaponSecondary;break
   case 'helmet': primary=profile.focus === 'mitigation'?'mitigation':'maxHp';preferred=profile.support;break
   case 'necklace': primary='maxMp';preferred=profile.focus;break
   case 'accessoryA': primary=profile.focus;preferred=profile.support;break
   case 'shield': primary='mitigation';preferred=profile.focus;break
   case 'armor': primary='mitigation';preferred=profile.support;break
   case 'pants': primary='maxHp';preferred=profile.focus;break
   case 'boots': primary='initiative';preferred=profile.support;break
   case 'accessoryB': primary=profile.support;preferred=profile.focus;break
   case 'bracelet': primary='maxMp';preferred=profile.support;break
   default: throw new Error('Unsupported equipment slot: '+String(slot))
  }
  return [primary,preferred!==primary?preferred:DISTINCT_SECONDARIES.find(s=>s!==primary)!]
}
