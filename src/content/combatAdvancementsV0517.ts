import type { CombatSkillDefinition, StatusEffectDefinition } from './types'

/** BALANCE_DRAFT: no skill grants Clan or Class. Bound grades and affiliation remain authoritative. */
export const extraCombatSkillsV0517: CombatSkillDefinition[] = [
 {id:'skill_bow_fire_arrow_v0517',name:'Flecha Ígnea',description:'Flecha elemental de fogo: testa a afinidade ígnea do alvo. Não gasta munição unitária.',target:'enemy',presentationGroup:'skills',mpCost:3,cooldownTurns:2,damageDieSteps:0,damageAspect:'fire',effects:[{type:'damage',powerBonus:1}],status:'BALANCE_DRAFT'},
 {id:'skill_bow_poison_arrow_v0517',name:'Flecha Tóxica',description:'Disparo tóxico que pode aplicar veneno leve por 2 turnos.',target:'enemy',presentationGroup:'skills',mpCost:3,cooldownTurns:3,damageDieSteps:0,damageAspect:'poison',effects:[{type:'damage',powerBonus:0},{type:'applyStatus',statusId:'status_arrow_poison_v0517',durationTurns:2,chance:0.65}],status:'BALANCE_DRAFT'},
 {id:'skill_scepter_fire_spark_v0517',name:'Centelha Ígnea',description:'Canalização de fogo que testa afinidades elementais sem dano físico.',target:'enemy',presentationGroup:'magic',mpCost:3,cooldownTurns:2,damageDieSteps:0,damageAspect:'fire',effects:[{type:'damage',powerBonus:1}],status:'BALANCE_DRAFT'},
 {id:'skill_scepter_dispel_v0517',name:'Dissipação Arcana',description:'Dissipa efeitos benéficos ativos do inimigo sem conceder dano gratuito.',target:'enemy',presentationGroup:'magic',mpCost:3,cooldownTurns:3,damageDieSteps:0,effects:[{type:'cleanseBeneficial'}],status:'BALANCE_DRAFT'},
 {id:'skill_enemy_thorn_pressure_v0517',name:'Investida Rompe-Escudo',description:'Investida pesada de Fungorro Espinhal; o impacto pressiona o limiar ESC por 2 turnos.',target:'enemy',mpCost:0,cooldownTurns:0,damageDieSteps:0,damageAspect:'physical',effects:[{type:'damage',powerBonus:0},{type:'applyStatus',statusId:'status_guard_pressure_v0517',durationTurns:2,chance:1}],status:'BALANCE_DRAFT'},
 {id:'skill_enemy_spore_miasma_v0517',name:'Miasma de Lentidão',description:'Esporos viscosos dificultam a próxima rolagem de iniciativa.',target:'enemy',mpCost:0,cooldownTurns:0,damageDieSteps:0,damageAspect:'poison',effects:[{type:'damage',powerBonus:0},{type:'applyStatus',statusId:'status_slow_v0517',durationTurns:2,chance:1}],status:'BALANCE_DRAFT'},
 {id:'skill_enemy_ruin_arcane_v0517',name:'Fenda no Véu',description:'Ruptura arcana que causa dano e esgota parcialmente a proteção ARC.',target:'enemy',mpCost:0,cooldownTurns:0,damageDieSteps:0,damageAspect:'ruin',effects:[{type:'damage',powerBonus:0},{type:'drainArcaneGuard',value:2}],status:'BALANCE_DRAFT'},
  {
    id:'skill_caster_arcane_guard_v0517',name:'Véu Arcano',description:'Canalização de mago: restaura até 3 pontos de Proteção Arcana, que são consumidos pelo próximo dano mágico.',
    target:'self',presentationGroup:'magic',mpCost:2,cooldownTurns:3,damageDieSteps:0,
    effects:[{type:'restoreArcaneGuard',value:3}],status:'BALANCE_DRAFT',
  },
  {
    id:'skill_clan_dunavar_arcane_shield_v0517',name:'Conjurar Barreira de Dûn’Avar',
    description:'Arte defensiva da linhagem Dûn’Avar. Canaliza a Barreira Arcana e restaura até 4 pontos de Proteção Arcana, mantendo o escudo físico vinculado.',
    target:'self',presentationGroup:'magic',mpCost:3,cooldownTurns:3,damageDieSteps:0,
    effects:[{type:'restoreArcaneGuard',value:4}],status:'BALANCE_DRAFT',
  },
  {
    id:'skill_bow_rooting_arrow_v0517',name:'Flecha Imobilizadora',
    description:'Flecha que prende o inimigo ao terreno; 70% de chance de Enraizado por 2 turnos, reduzindo iniciativa e dado de iniciativa.',
    target:'enemy',presentationGroup:'skills',mpCost:3,cooldownTurns:3,damageDieSteps:0,damageAspect:'physical',
    effects:[{type:'damage',powerBonus:0},{type:'applyStatus',statusId:'status_rooted_v0517',durationTurns:2,chance:0.7}],status:'BALANCE_DRAFT',
  },
  {
    id:'skill_axe_guardbreak_v0517',name:'Quebra-Guarda',
    description:'Golpe de machado físico que desestabiliza a postura inimiga e reduz sua iniciativa por 2 turnos.',
    target:'enemy',presentationGroup:'skills',mpCost:3,cooldownTurns:3,damageDieSteps:0,damageAspect:'physical',
    effects:[{type:'damage',powerBonus:1},{type:'applyStatus',statusId:'status_stagger_v0517',durationTurns:2,chance:1}],status:'BALANCE_DRAFT',
  },
  {
    id:'skill_scepter_accelerate_v0517',name:'Aceleração Etérea',
    description:'Aumenta em 2 a iniciativa e evolui um passo no dado de iniciativa durante dois turnos.',
    target:'self',presentationGroup:'magic',mpCost:3,cooldownTurns:3,damageDieSteps:0,
    effects:[{type:'applyStatus',statusId:'status_haste_v0517',durationTurns:2,chance:1}],status:'BALANCE_DRAFT',
  },
  {
    id:'skill_quiver_focus_v0517',name:'Foco da Aljava',description:'O arqueiro prepara flechas com precisão; acelera em um passo seu dado de iniciativa durante dois turnos.',
    target:'self',presentationGroup:'skills',mpCost:2,cooldownTurns:3,damageDieSteps:0,
    effects:[{type:'applyStatus',statusId:'status_focus_v0517',durationTurns:2,chance:1}],status:'BALANCE_DRAFT',
  },
]
export const extraCombatStatusesV0517: StatusEffectDefinition[] = [
 {id:'status_haste_v0517',name:'Pressa Arcana',description:'Iniciativa +2 e dado de iniciativa +1 passo. Reordena a próxima rodada.',tone:'beneficial',startTurnDamage:0,attackModifier:0,mitigationModifier:0,initiativeModifier:2,initiativeDieSteps:1,status:'BALANCE_DRAFT'},
 {id:'status_slow_v0517',name:'Lentidão',description:'Iniciativa -2 e dado de iniciativa -1 passo. Reordena a próxima rodada.',tone:'harmful',startTurnDamage:0,attackModifier:0,mitigationModifier:0,initiativeModifier:-2,initiativeDieSteps:-1,status:'BALANCE_DRAFT'},
 {id:'status_rooted_v0517',name:'Enraizado',description:'Iniciativa -2 e dado de iniciativa -1 passo enquanto durar. O movimento físico futuro permanece OWNER_DECISION.',tone:'harmful',startTurnDamage:0,attackModifier:0,mitigationModifier:0,initiativeModifier:-2,initiativeDieSteps:-1,status:'BALANCE_DRAFT'},
 {id:'status_stagger_v0517',name:'Postura Rompida',description:'Iniciativa -1, defesa -1 e dado de iniciativa -1 passo enquanto durar.',tone:'harmful',startTurnDamage:0,attackModifier:0,mitigationModifier:-1,initiativeModifier:-1,initiativeDieSteps:-1,status:'BALANCE_DRAFT'},
 {id:'status_focus_v0517',name:'Foco do Arqueiro',description:'Dado de iniciativa +1 passo; não garante crítico ou primeiro turno.',tone:'beneficial',startTurnDamage:0,attackModifier:0,mitigationModifier:0,initiativeModifier:0,initiativeDieSteps:1,status:'BALANCE_DRAFT'},
 {id:'status_guard_pressure_v0517',name:'Guarda Pressionada',description:'Ataques pesados reduzem o limiar do escudo em 2 por dois turnos; o Vínculo não sofre desgaste permanente.',tone:'harmful',startTurnDamage:0,attackModifier:0,mitigationModifier:0,shieldGuardModifier:-2,status:'BALANCE_DRAFT'},
 {id:'status_arrow_poison_v0517',name:'Veneno da Flecha',description:'Toxina de aljava: 1 de dano no início do turno por 2 turnos.',tone:'harmful',startTurnDamage:1,attackModifier:0,mitigationModifier:0,status:'BALANCE_DRAFT'},
]
