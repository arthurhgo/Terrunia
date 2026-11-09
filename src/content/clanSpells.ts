import type { CombatSkillDefinition, StatusEffectDefinition } from './types'

// v0.5.14.1: eight new alternatives plus four historical clan spells in combat.ts.
// Every numerical value here is BALANCE_DRAFT until the owner validates gameplay.
export const CLAN_SPELL_OPTIONS: Record<string, readonly [string, string, string]> = {
  dunavar: ['skill_clan_dunavar_guard', 'skill_clan_dunavar_aegis', 'skill_clan_dunavar_barrier_shock'],
  rustal: ['skill_clan_rustal_glyph', 'skill_clan_rustal_ward', 'skill_clan_rustal_disjunction'],
  cebios_esti: ['skill_clan_cebios_orb', 'skill_clan_cebios_omen', 'skill_clan_cebios_orbit_shards'],
  estres_do_et: ['skill_clan_estres_flux', 'skill_clan_estres_containment', 'skill_clan_estres_discharge'],
}
export const HISTORICAL_CLAN_SPELLS: Record<string,string> =
  Object.fromEntries(Object.entries(CLAN_SPELL_OPTIONS).map(([clan, ids]) => [clan, ids[0]]))

export const newClanSpells = [
  { id: 'skill_clan_dunavar_aegis', name: 'Égide da Vigília',
    description: 'A Barreira protege seu portador: +1 de mitigação por dois turnos.', target: 'self',
    mpCost: 2, cooldownTurns: 3, damageDieSteps: 0,
    effects: [{type:'applyStatus',statusId:'status_clan_aegis',durationTurns:2,chance:1}] },
  { id: 'skill_clan_dunavar_barrier_shock', name: 'Choque da Barreira',
    description: 'Concentra o Vínculo em uma descarga protetora com +1 poder.', target: 'enemy',
    mpCost: 3, cooldownTurns: 2, damageDieSteps: 0, effects: [{type:'damage',powerBonus:1}] },
  { id: 'skill_clan_rustal_ward', name: 'Selo de Reforço',
    description: 'Inscrição de defesa: +1 mitigação por dois turnos.',target:'self',
    mpCost:2,cooldownTurns:3,damageDieSteps:0,
    effects:[{type:'applyStatus',statusId:'status_clan_rune_ward',durationTurns:2,chance:1}]},
  { id: 'skill_clan_rustal_disjunction', name: 'Marca de Dissolução',
    description: 'Selo que reduz a mitigação do adversário em 1 durante dois turnos.',target:'enemy',
    mpCost:3,cooldownTurns:3,damageDieSteps:0,
    effects:[{type:'applyStatus',statusId:'status_clan_disjunction',durationTurns:2,chance:1}]},
  { id: 'skill_clan_cebios_omen',name:'Presságio do Orbe',
    description:'Leitura celestial que aumenta em 1 o ataque por dois turnos.',target:'self',
    mpCost:2,cooldownTurns:3,damageDieSteps:0,
    effects:[{type:'applyStatus',statusId:'status_clan_omen',durationTurns:2,chance:1}]},
  { id: 'skill_clan_cebios_orbit_shards',name:'Fragmentos da Órbita',
    description:'Projétil celeste e 40% do dano final em um inimigo vizinho.',target:'enemy',
    mpCost:4,cooldownTurns:3,damageDieSteps:0,
    effects:[{type:'damage',powerBonus:0},{type:'adjacentSplash',fraction:0.4,maxTargets:1,basis:'primaryFinalDamage'}]},
  { id: 'skill_clan_estres_containment',name:'Selo de Contenção',
    description:'Enfraquece o ataque inimigo em 1 durante dois turnos.',target:'enemy',
    mpCost:2,cooldownTurns:3,damageDieSteps:0,
    effects:[{type:'applyStatus',statusId:'status_clan_containment',durationTurns:2,chance:1}]},
  { id: 'skill_clan_estres_discharge',name:'Descarga Desordenada',
    description:'Dano arcano +1 poder e 25% em um inimigo vizinho.',target:'enemy',
    mpCost:4,cooldownTurns:3,damageDieSteps:0,
    effects:[{type:'damage',powerBonus:1},{type:'adjacentSplash',fraction:0.25,maxTargets:1,basis:'primaryFinalDamage'}]},
].map(skill=>({...skill,presentationGroup:'magic' as const,iconAssetId:'skill.'+skill.id,
  status:'BALANCE_DRAFT' as const})) satisfies CombatSkillDefinition[]

export const newClanStatuses: StatusEffectDefinition[] = [
  ['status_clan_aegis','Égide Ativa','Égide mágica do Dûn\'Avar.',0,1,'beneficial'],
  ['status_clan_rune_ward','Selo Reforçado','Inscrição de defesa de Rustal.',0,1,'beneficial'],
  ['status_clan_disjunction','Marca Dissolvente','Inscrição que reduz a defesa.',0,-1,'harmful'],
  ['status_clan_omen','Presságio Favorável','Visão celestial que reforça o ataque.',1,0,'beneficial'],
  ['status_clan_containment','Contenção Arcana','Ruptura contida, ataque enfraquecido.',-1,0,'harmful'],
].map(([id,name,description,attack,mitigation,tone]) => ({
  id:String(id),name:String(name),description:String(description),tone:tone as 'beneficial'|'harmful',
  startTurnDamage:0,attackModifier:Number(attack),mitigationModifier:Number(mitigation),status:'BALANCE_DRAFT' as const,
}))
