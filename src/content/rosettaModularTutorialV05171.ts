import type {QuestDefinition} from './types'
/** Rosetta educates; Durnan mounts. No free Bond, Class or Essence Points. */
const common={giverNpcId:'npc_rosetta',turnInNpcId:'npc_rosetta',status:'CONTENT_DRAFT' as const}
const q=(id:string,title:string,summary:string,category:'main'|'secondary',
 objective:QuestDefinition['objectives'],previous:string,location:string,extra:Partial<QuestDefinition>={}):QuestDefinition=>({
 ...common,id,title,summary,category,objectives:objective,
 rewards:[{type:'characterXp',value:7}],initialStatus:'locked',
 prerequisites:[{type:'questCompleted',questId:previous}],
 terranFlow:{active:location,ready_to_turn_in:'location_terran_portal_plaza'},...extra
})
export const rosettaModularQuestsV05171:QuestDefinition[]=[
 q('rosetta_modular_01','Uma Arma, Quatro Partes',
  'Inspecione os quatro encaixes de Durnan. O Vínculo permanece o mesmo.',
  'main',[{id:'bench',type:'interact',targetId:'forge_assembly_bench_v05171',required:1,label:'Inspecione a bancada com Durnan'}],
  'rosetta_tutorial_refine','location_terran_forge'),
 q('rosetta_modular_02','Peças da Trilha',
  'Encontre uma parte estrutural nas trilhas ou ondas e recolha o espólio.',
  'main',[{id:'part',type:'collect',targetId:'any_modular_part_v05171',required:1,label:'Recolha uma parte modular real'}],
  'rosetta_modular_01','location_terran_portal_plaza', {rewards:[{type:'characterXp',value:6},{type:'gold',value:8}]}),
 q('rosetta_modular_03','O Primeiro Encaixe',
  'Escolha uma parte compatível, compare seu efeito e confirme a montagem.',
  'main',[{id:'forge',type:'assemble',targetId:'bound_modular_v05171',required:1,label:'Confirme uma montagem real na forja'}],
  'rosetta_modular_02','location_terran_forge'),
 q('rosetta_modular_04','Uma Arma, Outro Potencial',
  'Inspecione os atributos derivados e vença uma batalha com a peça instalada.',
  'main',[{id:'inspect',type:'interact',targetId:'inspect_assembly_stats_v05171',required:1,label:'Compare os status na bancada'},
   {id:'battle',type:'battleWithAssembly',targetId:'bound_modular_v05171',required:1,label:'Vença uma batalha com o módulo instalado'}],
  'rosetta_modular_03','location_terran_portal_plaza', {rewards:[{type:'characterXp',value:8},{type:'gold',value:12}]}),
 q('rosetta_modular_05','O Núcleo de Essência',
  'O recipiente estrutural não substitui o rito de Essência, disponível no Grau II.',
  'secondary',[{id:'essence',type:'completeRite',targetId:'bound_grade_2_v05171',required:1,label:'Complete o rito real do Grau II'}],
  'rosetta_modular_04','location_terran_bond_workshop'),
 q('rosetta_modular_06','A Joia e o Grau',
  'Joias mágicas só são instaladas pelo rito do Grau III; o quarto módulo é um encaixe estrutural.',
  'secondary',[{id:'gem',type:'completeRite',targetId:'bound_grade_3_v05171',required:1,label:'Complete o rito real do Grau III'}],
  'rosetta_modular_05','location_terran_bond_workshop'),
 q('rosetta_modular_defense','A Defesa Certa',
  'Escolha uma postura defensiva em combate. O sucesso depende do dado real.',
  'secondary',[{id:'defend',type:'defendAction',targetId:'any_defense_v05171',required:1,label:'Use uma postura defensiva em batalha'}],
  'rosetta_modular_04','location_terran_portal_plaza'),
]
