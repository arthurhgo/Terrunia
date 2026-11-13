import type {CombatSkillDefinition} from './types'
import {classDefinitions} from './progression'

/** CONTENT_DRAFT: every skill requires an in-world Class earned through its existing NPC/quest. */
export const CLASS_DISCIPLINE_SKILLS_V0517:Record<string,string> = {
  'sentinela_da_luz': 'skill_class_sentinela_da_luz_v0517',
  'gladiador_da_barreira': 'skill_class_gladiador_da_barreira_v0517',
  'batedor_da_vigilia': 'skill_class_batedor_da_vigilia_v0517',
  'forjador_arcano': 'skill_class_forjador_arcano_v0517',
  'guardiao_das_inscricoes': 'skill_class_guardiao_das_inscricoes_v0517',
  'gravador_das_sombras': 'skill_class_gravador_das_sombras_v0517',
  'astrologo_celestial': 'skill_class_astrologo_celestial_v0517',
  'profeta_do_orbe': 'skill_class_profeta_do_orbe_v0517',
  'cacador_de_constelacoes': 'skill_class_cacador_de_constelacoes_v0517',
  'canalizador_do_caos': 'skill_class_canalizador_do_caos_v0517',
  'guardador_da_ruptura': 'skill_class_guardador_da_ruptura_v0517',
  'mago_da_ruina': 'skill_class_mago_da_ruina_v0517',
}
export const classDisciplineSkillDefinitionsV0517:CombatSkillDefinition[] = [
  {id:'skill_class_sentinela_da_luz_v0517',name:'Égide da Sentinela',description:'Disciplina sentinela da luz desenvolvida após a prova do mestre do Clã Dûn Avar. Conteúdo parametrizável para revisão do proprietário.',target:'self',presentationGroup:'magic',mpCost:2,cooldownTurns:3,damageDieSteps:0,effects:[{"type":"restoreArcaneGuard","value":3}],status:'BALANCE_DRAFT'},
  {id:'skill_class_gladiador_da_barreira_v0517',name:'Golpe da Barreira',description:'Disciplina gladiador da barreira desenvolvida após a prova do mestre do Clã Dûn Avar. Conteúdo parametrizável para revisão do proprietário.',target:'enemy',presentationGroup:'skills',mpCost:3,cooldownTurns:2,damageDieSteps:0,effects:[{"type":"damage","powerBonus":2}],status:'BALANCE_DRAFT'},
  {id:'skill_class_batedor_da_vigilia_v0517',name:'Visão da Vigília',description:'Disciplina batedor da vigilia desenvolvida após a prova do mestre do Clã Dûn Avar. Conteúdo parametrizável para revisão do proprietário.',target:'self',presentationGroup:'skills',mpCost:2,cooldownTurns:3,damageDieSteps:0,effects:[{"type":"applyStatus","statusId":"status_focus_v0517","durationTurns":2,"chance":1}],status:'BALANCE_DRAFT'},
  {id:'skill_class_forjador_arcano_v0517',name:'Marca do Forjador',description:'Disciplina forjador arcano desenvolvida após a prova do mestre de Rustal. Conteúdo parametrizável para revisão do proprietário.',target:'enemy',presentationGroup:'magic',mpCost:3,cooldownTurns:2,damageDieSteps:0,effects:[{"type":"damage","powerBonus":1},{"type":"applyStatus","statusId":"status_stagger_v0517","durationTurns":1,"chance":0.5}],status:'BALANCE_DRAFT'},
  {id:'skill_class_guardiao_das_inscricoes_v0517',name:'Selo de Salvaguarda',description:'Disciplina guardiao das inscricoes desenvolvida após a prova do mestre de Rustal. Conteúdo parametrizável para revisão do proprietário.',target:'self',presentationGroup:'magic',mpCost:2,cooldownTurns:3,damageDieSteps:0,effects:[{"type":"restoreArcaneGuard","value":3}],status:'BALANCE_DRAFT'},
  {id:'skill_class_gravador_das_sombras_v0517',name:'Marca das Sombras',description:'Disciplina gravador das sombras desenvolvida após a prova do mestre de Rustal. Conteúdo parametrizável para revisão do proprietário.',target:'enemy',presentationGroup:'magic',mpCost:3,cooldownTurns:3,damageDieSteps:0,effects:[{"type":"damage","powerBonus":1},{"type":"applyStatus","statusId":"status_slow_v0517","durationTurns":2,"chance":0.6}],status:'BALANCE_DRAFT'},
  {id:'skill_class_astrologo_celestial_v0517',name:'Centelha Celestial',description:'Disciplina astrologo celestial desenvolvida após a prova do mestre de Cebios Esti. Conteúdo parametrizável para revisão do proprietário.',target:'enemy',presentationGroup:'magic',mpCost:3,cooldownTurns:2,damageDieSteps:0,effects:[{"type":"damage","powerBonus":2}],status:'BALANCE_DRAFT'},
  {id:'skill_class_profeta_do_orbe_v0517',name:'Presságio do Orbe',description:'Disciplina profeta do orbe desenvolvida após a prova do mestre de Cebios Esti. Conteúdo parametrizável para revisão do proprietário.',target:'self',presentationGroup:'magic',mpCost:2,cooldownTurns:3,damageDieSteps:0,effects:[{"type":"applyStatus","statusId":"status_haste_v0517","durationTurns":2,"chance":1}],status:'BALANCE_DRAFT'},
  {id:'skill_class_cacador_de_constelacoes_v0517',name:'Dardo das Constelações',description:'Disciplina cacador de constelacoes desenvolvida após a prova do mestre de Cebios Esti. Conteúdo parametrizável para revisão do proprietário.',target:'enemy',presentationGroup:'magic',mpCost:3,cooldownTurns:2,damageDieSteps:0,effects:[{"type":"damage","powerBonus":2}],status:'BALANCE_DRAFT'},
  {id:'skill_class_canalizador_do_caos_v0517',name:'Impulso do Fluxo',description:'Disciplina canalizador do caos desenvolvida após a prova do mestre de Estres do Ét. Conteúdo parametrizável para revisão do proprietário.',target:'self',presentationGroup:'magic',mpCost:2,cooldownTurns:3,damageDieSteps:0,effects:[{"type":"applyStatus","statusId":"status_haste_v0517","durationTurns":2,"chance":1}],status:'BALANCE_DRAFT'},
  {id:'skill_class_guardador_da_ruptura_v0517',name:'Selo da Ruptura',description:'Disciplina guardador da ruptura desenvolvida após a prova do mestre de Estres do Ét. Conteúdo parametrizável para revisão do proprietário.',target:'enemy',presentationGroup:'magic',mpCost:3,cooldownTurns:3,damageDieSteps:0,effects:[{"type":"damage","powerBonus":1},{"type":"applyStatus","statusId":"status_stagger_v0517","durationTurns":2,"chance":0.6}],status:'BALANCE_DRAFT'},
  {id:'skill_class_mago_da_ruina_v0517',name:'Raio da Ruína',description:'Disciplina mago da ruina desenvolvida após a prova do mestre de Estres do Ét. Conteúdo parametrizável para revisão do proprietário.',target:'enemy',presentationGroup:'magic',mpCost:4,cooldownTurns:3,damageDieSteps:0,effects:[{"type":"damage","powerBonus":3}],status:'BALANCE_DRAFT'}
]
/** All 12 current Classes must have exactly one earned initial discipline. */
export const classDisciplineCatalogIsCompleteV0517 = () =>
 classDefinitions.length===Object.keys(CLASS_DISCIPLINE_SKILLS_V0517).length &&
 classDefinitions.every(cls=>Boolean(CLASS_DISCIPLINE_SKILLS_V0517[cls.id]))
