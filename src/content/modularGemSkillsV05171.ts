import type {CombatSkillDefinition} from './types'
/** BALANCE_DRAFT: installed elemental gem on an earned Bound Grade III+ unlocks a skill. */
export const elementalGemSkillDefinitionsV05171:CombatSkillDefinition[]=[
 {id:'skill_modular_fire_v05171',name:'Centelha da Joia de Fogo',
  description:'Descarrega a joia ígnea vinculada. Rito de Joia exige Grau III.',
  target:'enemy',presentationGroup:'magic',damageAspect:'fire',delivery:'arcane',
  mpCost:3,cooldownTurns:2,damageDieSteps:0,effects:[{type:'damage',powerBonus:1}],
  status:'BALANCE_DRAFT'},
 {id:'skill_modular_water_v05171',name:'Jorro das Marés',
  description:'Canaliza o fluxo de água por meio da joia instalada.',
  target:'enemy',presentationGroup:'magic',damageAspect:'water',delivery:'arcane',
  mpCost:3,cooldownTurns:2,damageDieSteps:0,effects:[{type:'damage',powerBonus:1}],
  status:'BALANCE_DRAFT'},
 {id:'skill_modular_earth_v05171',name:'Impacto Telúrico',
  description:'Descarrega energia telúrica do Vínculo contra a proteção inimiga.',
  target:'enemy',presentationGroup:'magic',damageAspect:'earth',delivery:'arcane',
  mpCost:3,cooldownTurns:3,damageDieSteps:0,effects:[{type:'damage',powerBonus:1}],
  status:'BALANCE_DRAFT'},
 {id:'skill_modular_air_v05171',name:'Rajada dos Ventos',
  description:'Descarrega uma rajada de ar conjurada pelo núcleo vinculado.',
  target:'enemy',presentationGroup:'magic',damageAspect:'air',delivery:'arcane',
  mpCost:3,cooldownTurns:2,damageDieSteps:0,effects:[{type:'damage',powerBonus:1}],
  status:'BALANCE_DRAFT'}
]
