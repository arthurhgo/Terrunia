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

/**
 * v0.5.15.2 BALANCE_DRAFT — curated equipment matrix.
 * For each of the 10 slots, the 12 neutral profiles expose different PAIRS
 * of actual stats, rather than just a different name or sprite.
 * Each outfit also has 10 distinct pairs. No items/IDs need deleting, so
 * pre-existing saves and all Clan/Class lineages remain valid.
 *
 * The exact matching is a small deterministic minimum-cost assignment.
 * This preserves each combat role as much as possible while eliminating
 * duplicated offerings at Neris within the same slot.
 */
export const GEAR_SLOT_ORDER = [
  'weapon','armor','shield','helmet','necklace','accessoryA',
  'pants','boots','accessoryB','bracelet',
] as const satisfies readonly (BoundSlot|ComplementarySlot)[]

const SLOT_ANCHOR: Partial<Record<BoundSlot|ComplementarySlot,GearStat>> = {
  armor:'mitigation',shield:'mitigation',helmet:'maxHp',necklace:'maxMp',
  pants:'maxHp',boots:'initiative',bracelet:'maxMp',
}
const preferredPair=(profile:CombatProfile,slot:BoundSlot|ComplementarySlot):
 readonly [GearStat,GearStat]=>{
  switch(slot){
    case 'weapon':return [profile.weaponPrimary,profile.weaponSecondary]
    case 'armor':return ['mitigation',profile.support]
    case 'shield':return ['mitigation',profile.focus]
    case 'helmet':return ['maxHp',profile.support]
    case 'necklace':return ['maxMp',profile.focus]
    case 'accessoryA':return [profile.focus,profile.support]
    case 'pants':return ['maxHp',profile.focus]
    case 'boots':return ['initiative',profile.support]
    case 'accessoryB':return [profile.support,profile.weaponPrimary]
    case 'bracelet':return ['maxMp',profile.weaponSecondary]
  }
}

/** Rectangular Hungarian assignment: min-cost matching, deterministic and data-only. */
function assignPairs(cost:number[][]):number[]{
 const n=cost.length,m=cost[0].length
 if(n>m)throw new Error('Not enough equipment combinations')
 const u=Array<number>(n+1).fill(0),v=Array<number>(m+1).fill(0)
 const owner=Array<number>(m+1).fill(0),prev=Array<number>(m+1).fill(0)
 for(let i=1;i<=n;i++){
  owner[0]=i
  let j0=0
  const min=Array<number>(m+1).fill(Infinity),used=Array<boolean>(m+1).fill(false)
  do{
   used[j0]=true
   const row=owner[j0],line=cost[row-1]
   let delta=Infinity,j1=0
   for(let j=1;j<=m;j++)if(!used[j]){
    const now=line[j-1]-u[row]-v[j]
    if(now<min[j]){min[j]=now;prev[j]=j0}
    if(min[j]<delta){delta=min[j];j1=j}
   }
   for(let j=0;j<=m;j++)if(used[j]){u[owner[j]]+=delta;v[j]-=delta}
   else min[j]-=delta
   j0=j1
  }while(owner[j0]!==0)
  do{const j1=prev[j0];owner[j0]=owner[j1];j0=j1}while(j0!==0)
 }
 const result=Array<number>(n).fill(-1)
 for(let j=1;j<=m;j++)if(owner[j]!==0)result[owner[j]-1]=j-1
 return result
}

const buildNeutralPairs=()=>{
 const roles=Object.keys(NERIS_COMBAT_PROFILES)
 const allocations:Record<string,Partial<Record<BoundSlot|ComplementarySlot,readonly [GearStat,GearStat]>>> =
  Object.fromEntries(roles.map(id=>[id,{}]))
 for(const slot of GEAR_SLOT_ORDER){
  if(slot==='weapon'){
   for(const role of roles)allocations[role].weapon=preferredPair(NERIS_COMBAT_PROFILES[role],slot)
   continue
  }
  const anchor=SLOT_ANCHOR[slot]
  const choices=(GEAR_STAT_KEYS.flatMap(a=>GEAR_STAT_KEYS.map(b=>[a,b] as const)))
   .filter(([a,b])=>a!==b&&(!anchor||a===anchor||b===anchor))
  const cost=roles.map(role=>{
   const profile=NERIS_COMBAT_PROFILES[role],preferred=preferredPair(profile,slot)
   const already=new Set(Object.values(allocations[role]).map(pair=>pair!.join(':')))
   return choices.map(([a,b],index)=>
    (a===preferred[0]?0:9)+(b===preferred[1]?0:5)+
    ([a,b].includes(profile.focus)?0:3)+([a,b].includes(profile.support)?0:2)+
    (already.has(a+':'+b)?10000:0)+index*.0001)
  })
  const match=assignPairs(cost)
  for(let i=0;i<roles.length;i++){
   const assigned=choices[match[i]]
   if(!assigned||cost[i][match[i]]>=10000)throw new Error('No unique pair for '+roles[i]+' / '+slot)
   allocations[roles[i]][slot]=assigned
  }
 }
 return allocations as Record<string,Record<BoundSlot|ComplementarySlot,readonly [GearStat,GearStat]>>
}
export const NEUTRAL_GEAR_PAIRS=buildNeutralPairs()

export const getGearStatPair=(profile:CombatProfile,slot:BoundSlot|ComplementarySlot,roleId?:string):
 readonly [GearStat,GearStat]=>{
 const role=roleId??Object.keys(NERIS_COMBAT_PROFILES).find(id=>NERIS_COMBAT_PROFILES[id]===profile)
 return role&&NEUTRAL_GEAR_PAIRS[role]?NEUTRAL_GEAR_PAIRS[role][slot]:preferredPair(profile,slot)
}
