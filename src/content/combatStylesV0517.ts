import type { CombatSkillDefinition } from './types'

/** v0.5.17 BALANCE_DRAFT. Success is rolled on incoming damage, never guaranteed. */
export const DEFENSE_RULES_V0517 = {
 block:{name:'Bloqueio',dc:3,reduction:3,usesShield:true,counterFraction:0},
 parry:{name:'Aparar',dc:4,reduction:0,usesShield:true,counterFraction:0},
 dodge:{name:'Esquiva',dc:4,reduction:0,usesShield:false,counterFraction:0},
 counter:{name:'Contragolpe',dc:4,reduction:2,usesShield:false,counterFraction:0.4},
} as const
export type DefenseModeV0517 = keyof typeof DEFENSE_RULES_V0517
export const COMMON_DEFENSE_SKILL_IDS_V0517 = [
 'skill_nexus_block_v0517','skill_nexus_parry_v0517',
 'skill_nexus_dodge_v0517','skill_nexus_counter_v0517',
] as const
export const defensiveSkillDefinitionsV0517: CombatSkillDefinition[] = [
 {id:'skill_nexus_block_v0517',name:'Bloqueio',description:'Vigor contra 3 no próximo golpe: sucesso reduz 3 de dano. Escudo vinculado concede +1 ao teste e à redução; falha não bloqueia.',target:'self',presentationGroup:'skills',mpCost:0,cooldownTurns:1,defenseStance:'block',damageDieSteps:0,effects:[],status:'BALANCE_DRAFT'},
 {id:'skill_nexus_parry_v0517',name:'Aparar',description:'Agilidade contra 4: sucesso apara o próximo golpe, falha sofre dano. Escudo vinculado concede +1 ao teste.',target:'self',presentationGroup:'skills',mpCost:1,cooldownTurns:2,defenseStance:'parry',damageDieSteps:0,effects:[],status:'BALANCE_DRAFT'},
 {id:'skill_nexus_dodge_v0517',name:'Esquiva',description:'Agilidade contra 4: sucesso evita o próximo golpe, falha sofre o dano.',target:'self',presentationGroup:'skills',mpCost:1,cooldownTurns:2,defenseStance:'dodge',damageDieSteps:0,effects:[],status:'BALANCE_DRAFT'},
 {id:'skill_nexus_counter_v0517',name:'Contragolpe',description:'Força contra 4: sucesso reduz 2 de dano e devolve 40% do Ataque. Falha não concede proteção.',target:'self',presentationGroup:'skills',mpCost:2,cooldownTurns:3,defenseStance:'counter',damageDieSteps:0,effects:[],status:'BALANCE_DRAFT'},
]
export const scepterExtraSkillDefinitionsV0517: CombatSkillDefinition[] = [
 {id:'skill_scepter_ethereal_arrow_v0517',name:'Dardo Etéreo',description:'Projétil mágico preciso canalizado pelo Cetro.',target:'enemy',presentationGroup:'magic',mpCost:2,cooldownTurns:1,damageDieSteps:0,effects:[{type:'damage',powerBonus:1}],status:'BALANCE_DRAFT'},
 {id:'skill_scepter_arcane_nova_v0517',name:'Nova Arcana',description:'Explosão mágica que aplica 25% do dano principal a cada inimigo adjacente elegível.',target:'enemy',presentationGroup:'magic',mpCost:4,cooldownTurns:3,damageDieSteps:1,effects:[{type:'damage',powerBonus:2},{type:'adjacentSplash',fraction:0.25,maxTargets:2,basis:'primaryFinalDamage'}],status:'BALANCE_DRAFT'},
]
const labels:Record<string,{single:string;area:string;description:string}>={
 blade:{single:'Corte de Espada',area:'Varredura da Lâmina',description:'Ataque físico da espada.'},
 axe:{single:'Machadada',area:'Varredura do Machado',description:'Ataque pesado de machado.'},
 bow:{single:'Flecha Direta',area:'Flecha de Dispersão',description:'Disparo de flecha do Arco Longo.'},
 dagger:{single:'Estocada de Adaga',area:'Corte Circular',description:'Ataque rápido com adaga.'},
 arcaneFocus:{single:'Projétil Arcano',area:'Onda de Energia',description:'Conjuração mágica do Cetro.'},
 grimoire:{single:'Selo Projetado',area:'Selo Disperso',description:'Inscrição arcana do Grimório.'},
 staff:{single:'Pulso do Cajado',area:'Onda de Conjuração',description:'Conjuração do Cajado.'},
}
export function getWeaponAttackNamesV0517(archetype?:string){
 return labels[archetype??''] ?? labels.blade
}
export function getWeaponAttackCardsV0517(archetype?:string):CombatSkillDefinition[]{
 const names=getWeaponAttackNamesV0517(archetype)
 return [
  {id:'attack_single_v05141',name:names.single,description:names.description+' Ataque direto com o dado da arma.',target:'enemy',presentationGroup:'attack',mpCost:0,cooldownTurns:0,damageDieSteps:0,iconAssetId:'action.attack-single',effects:[{type:'damage',powerBonus:0}],status:'BALANCE_DRAFT'},
  {id:'skill_basic_area_attack',name:names.area,description:names.description+' 60% do dano no alvo principal; cada adjacente elegível recebe 30% desse impacto.',target:'enemy',presentationGroup:'attack',mpCost:0,cooldownTurns:0,damageDieSteps:0,iconAssetId:'action.attack-area',effects:[{type:'damage',powerBonus:0}],status:'BALANCE_DRAFT'},
 ]
}
