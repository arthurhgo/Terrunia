import { castleMerchantNpcsV05151 } from './castleMerchantsV05151'
import type { NPCDefinition } from './types'
import { streetNpcDefinitions } from './streetNpcs'
import { collectionQuestIdsForNpc } from './collectionContracts'
import { rosettaTutorialQuests } from './rosettaTutorial'

const clanSidequestIdsByNpc: Record<string,string[]> = {
  "npc_mireya_dunavar": [
    "side_clan_dunavar_watch_echoes",
    "side_clan_dunavar_oath"
  ],
  "npc_master_rustal": [
    "side_clan_rustal_stone",
    "side_clan_rustal_glyphs"
  ],
  "npc_observador_cebios": [
    "side_clan_cebios_esti_orbit",
    "side_clan_cebios_esti_missing_light"
  ],
  "npc_guardador_estres": [
    "side_clan_estres_do_et_rift",
    "side_clan_estres_do_et_balance"
  ]
}

const baseNpcDefinitions = [
  {
    id: 'npc_rosetta', name: 'Rosetta', title: 'Guardiã do Portal',
    settlementId: 'terran', roles: ['lore', 'normal', 'questGiver'], questIds: [],
    portraitAssetId: 'npc.rosetta.portrait',
    dialogue: [
      'Bem-vindo a Terran. Sou Rosetta. Antes da estrada, vamos aprender a usar sua mochila, vestir uma proteção e negociar no Mercado.',
      'Cada lição pede uma ação sua. Você escolherá uma proteção de treino, comprará consumíveis com Neris e conhecerá os especialistas do Mercado antes do primeiro reforço com Durnan.',
      'Na Biblioteca de Eldamar há uma Estante dos Registros. Leia seus manuais e relatos sempre que precisar de orientação.',
      'No nível quatro posso orientar seu único juramento: Dûn\'Avar protege, Rustal grava runas, Cebios Esti interpreta presságios e Estres do Ét domina fluxos instáveis.',
    ],
    status: 'CONTENT_DRAFT',
  },
  {
    id: 'npc_eldamar',
    name: 'Eldamar',
    title: 'Mestre dos Registros',
    settlementId: 'terran',
    roles: ['questGiver', 'lore'],
    questIds: ['vs_astravel_first_contact'],
    portraitAssetId: 'npc.eldamar.portrait',
    dialogue: [
      'Há marcas recentes nos registros de Astravél. Não são tinta, nem fungo comum.',
      'Entre pela rota mais curta, observe o que despertou e retorne com provas.',
    ],
    status: 'CONTENT_DRAFT',
  },
  {
    id: 'npc_daeryn', name: 'Daeryn', title: 'Curandeira de Terran', settlementId: 'terran',
    roles: ['questGiver', 'artisan'], questIds: ['main_terran_first_home'],
    portraitAssetId: 'npc.daeryn.portrait',
    dialogue: ['Quem volta das Ruínas precisa de abrigo. Ajude-me a preparar um quarto e ele será seu.', 'Um bom repouso restaura Vida e Mana. A experiência da jornada permanece.'],
    status: 'CONTENT_DRAFT',
  },
  {
    id: 'npc_sylwen', name: 'Sylwen', title: 'Alquimista de Terran', settlementId: 'terran',
    roles: ['vendor', 'artisan'], questIds: [],
    portraitAssetId: 'npc.sylwen.portrait',
    dialogue: ['Meu balcão oferece remédios simples. Consulte o preço antes de comprar.'],
    status: 'CONTENT_DRAFT',
  },
  {
    id: 'npc_vorren', name: 'Vorren', title: 'Rastreador de Terran', settlementId: 'terran',
    roles: ['questGiver', 'lore'], questIds: ['main_astravel_lost_hunters', 'main_vorren_bestiary'],
    portraitAssetId: 'npc.vorren.portrait',
    dialogue: ['Um caçador não precisa derrotar todas as criaturas. Primeiro deve compreendê-las.', 'Leia os sinais, reconheça as fraquezas e registre o que descobrir.'],
    status: 'CONTENT_DRAFT',
  },
  {
    id: 'npc_lithwynn', name: 'Lithwynn', title: 'Analista dos Vínculos', settlementId: 'terran',
    roles: ['questGiver', 'bondMaster'], questIds: ['main_astravel_corruption', 'main_lithwynn_signs'],
    portraitAssetId: 'npc.lithwynn.portrait',
    dialogue: ['Toda alteração de um Vínculo deixa uma marca. Vamos observar antes de agir.', 'A Essência é um recurso de transformação, não um prêmio de abate.'],
    status: 'CONTENT_DRAFT',
  },
  {
    id: 'npc_mireya_dunavar', name: 'Mireya Dûn’Avar', title: 'Guardiã da Barreira', settlementId: 'terran',
    roles: ['clanRecruiter', 'clanMaster', 'questGiver'], questIds: ['clan_dunavar_01', 'clan_dunavar_02', 'clan_dunavar_03'],
    portraitAssetId: 'npc.mireya.portrait', dialogue: ['A Barreira não existe para quem a conjura. Ela existe por aquilo que permanece atrás.'], status: 'CANON',
  },
  {
    id: 'npc_master_rustal', name: 'Mestre Rustal', title: 'Guardião das Inscrições', settlementId: 'terran',
    roles: ['clanRecruiter', 'clanMaster', 'questGiver'], questIds: ['clan_rustal_01', 'clan_rustal_02', 'clan_rustal_03'],
    portraitAssetId: 'npc.rustal.portrait', dialogue: ['Compreenda a regra antes de tentar transformá-la em forma.'], status: 'CONTENT_DRAFT',
  },
  {
    id: 'npc_observador_cebios', name: 'Observador Cebios', title: 'Intérprete do Céu', settlementId: 'terran',
    roles: ['clanRecruiter', 'clanMaster', 'questGiver'], questIds: ['clan_cebios_01', 'clan_cebios_02', 'clan_cebios_03'],
    portraitAssetId: 'npc.cebios.portrait', dialogue: ['Olhar mostra pontos. Observar revela a relação entre eles.'], status: 'CONTENT_DRAFT',
  },
  {
    id: 'npc_guardador_estres', name: 'Guardador do Ét', title: 'Custódio da Instabilidade', settlementId: 'terran',
    roles: ['clanRecruiter', 'clanMaster', 'questGiver'], questIds: ['clan_estres_01', 'clan_estres_02', 'clan_estres_03'],
    portraitAssetId: 'npc.estres.portrait', dialogue: ['O caos não pede reverência. Pede compreensão e controle.'], status: 'CONTENT_DRAFT',
  },
  {
    id: 'npc_curador_nexo', name: 'Curador do Nexo', title: 'Guardião das Identidades', settlementId: 'terran',
    roles: ['questGiver', 'lore'], questIds: ['main_lore_identity_01'],
    portraitAssetId: 'npc.curador.nexo.portrait', dialogue: ['Agora que Clã e Classe possuem forma, o mundo responderá de maneira diferente ao seu caminho.'], status: 'CONTENT_DRAFT',
  },
  ...[
    ['npc_master_sentinela', 'Mestra da Luz', 'Sentinela da Luz', 'class_sentinela_trial'],
    ['npc_master_gladiador', 'Mestre da Barreira', 'Gladiador da Barreira', 'class_gladiador_trial'],
    ['npc_master_batedor', 'Mestre da Vigília', 'Batedor da Vigília', 'class_batedor_trial'],
    ['npc_master_forjador', 'Mestre Forjador', 'Forjador Arcano', 'class_forjador_trial'],
    ['npc_master_inscricoes', 'Mestra das Inscrições', 'Guardião das Inscrições', 'class_inscricoes_trial'],
    ['npc_master_gravador', 'Mestre Gravador', 'Gravador das Sombras', 'class_gravador_trial'],
    ['npc_master_astrologo', 'Mestre Astrólogo', 'Astrólogo Celestial', 'class_astrologo_trial'],
    ['npc_master_profeta', 'Mestra do Orbe', 'Profeta do Orbe', 'class_profeta_trial'],
    ['npc_master_cacador', 'Mestre das Constelações', 'Caçador de Constelações', 'class_cacador_trial'],
    ['npc_master_canalizador', 'Mestre Canalizador', 'Canalizador do Caos', 'class_canalizador_trial'],
    ['npc_master_ruptura', 'Mestra da Ruptura', 'Guardador da Ruptura', 'class_ruptura_trial'],
    ['npc_master_ruina', 'Mestre da Ruína', 'Mago da Ruína', 'class_ruina_trial'],
  ].map(([id, name, title, questId]) => ({
    id, name, title, settlementId: 'terran', roles: ['classTrainer', 'questGiver'] as NPCDefinition['roles'],
    questIds: [questId], portraitAssetId: `${id}.portrait`, dialogue: [`A prova de ${title} exige ação, não uma escolha de menu.`], status: 'CONTENT_DRAFT' as const,
  })),
  {
    id: 'npc_neris', name: 'Neris', title: 'Mercadora de Suprimentos', settlementId: 'terran',
    roles: ['vendor', 'questGiver'], questIds: [], portraitAssetId: 'npc.neris.portrait',
    dialogue: ['Aqui você encontra poções, tônicos, éteres, antídotos e consumíveis de campo.', 'O Armadureiro vende proteções, o Armeiro fornece revestimentos de armas e o Artesão cuida dos acessórios. Clã e Classe têm seus próprios fornecedores nos castelos.'],
    status: 'CONTENT_DRAFT',
  },
  {
    id: 'npc_terran_weaponsmith', name: 'Torvan', title: 'Especialista em Armas Comuns',
    settlementId: 'terran', roles: ['vendor'], questIds: [],
    portraitAssetId: 'npc.terran-weaponsmith.portrait',
    dialogue: ['Cada arma vinculada tem sua história. Vendo revestimentos comuns para atender diferentes estilos físicos e mágicos.',
      'As peças comerciais oferecem atributos; Durnan pode reforçá-las. Não substituem o Vínculo permanente da sua arma.'],
    status: 'CONTENT_DRAFT',
  },
  {
    id: 'npc_terran_armorer', name: 'Brenna', title: 'Especialista em Proteções Comuns',
    settlementId: 'terran', roles: ['vendor'], questIds: [],
    portraitAssetId: 'npc.terran-armorer.portrait',
    dialogue: ['Tenho túnicas, gibões, proteções, capacetes, calças e botas para um Terrírian no início da jornada.',
      'Rosetta pode lhe entregar uma proteção de treino. Equipe-a na Mochila e procure Durnan quando precisar reforçá-la.'],
    status: 'CONTENT_DRAFT',
  },
  {
    id: 'npc_terran_accessory_artisan', name: 'Ilyra', title: 'Especialista em Acessórios Comuns',
    settlementId: 'terran', roles: ['vendor'], questIds: [],
    portraitAssetId: 'npc.terran-accessory-artisan.portrait',
    dialogue: ['Cada colar, pulseira e adorno oferece atributos diferentes. Compare Vida, Mana, Defesa e Iniciativa.',
      'Os acessórios comerciais de treino podem ser usados antes de obter seus Vínculos. Quando conquistá-los, nenhuma memória será substituída.'],
    status: 'CONTENT_DRAFT',
  },
  {
    id: 'npc_durnan', name: 'Durnan', title: 'Ferreiro dos Vínculos', settlementId: 'terran',
    roles: ['artisan', 'questGiver'], questIds: [], portraitAssetId: 'npc.durnan.portrait',
    dialogue: ['O metal muda sob o martelo, mas o Vínculo pertence a você. Traga materiais e trabalharemos sua própria arma.', 'A têmpera abre novos caminhos na árvore. A escolha de aprendê-los continua sendo sua.'],
    status: 'CONTENT_DRAFT',
  },
] satisfies NPCDefinition[]

export const npcDefinitions: NPCDefinition[] = [
  ...baseNpcDefinitions.map((npc) => ({
    ...npc,
    questIds: npc.id === 'npc_rosetta' ? [...rosettaTutorialQuests.map((quest) => quest.id), 'main_rosetta_clan_guidance_v05141'] : [...npc.questIds, 'side_' + npc.id, ...(clanSidequestIdsByNpc[npc.id] ?? []), ...collectionQuestIdsForNpc(npc.id)],
  })),
  ...streetNpcDefinitions,
  ...castleMerchantNpcsV05151,
]
