import type { CombatSkillDefinition, StatusEffectDefinition } from './types'

/** BALANCE_DRAFT: no skill grants Clan or Class. Bound grades and affiliation remain authoritative. */
export const extraCombatSkillsV0517: CombatSkillDefinition[] = [
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
]
