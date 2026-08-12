import type { QuestDefinition, QuestProgressionOutcome } from './types'
import { clanDefinitions, classDefinitions } from './progression'

const mainLoreClassVariants = Object.fromEntries(classDefinitions.map((classDefinition) => [
  classDefinition.id,
  {
    summary: `Investigue o primeiro eco da Main Lore como ${classDefinition.name}, levando o contexto de ${clanDefinitions.find((clan) => clan.id === classDefinition.clanId)?.name ?? classDefinition.clanId} e usando ${classDefinition.role.toLowerCase()} para interpretar a ruptura.`,
  },
]))

const socialTrial = (
  id: string,
  title: string,
  summary: string,
  npcId: string,
  category: 'clan' | 'class',
  prerequisites: QuestDefinition['prerequisites'],
  outcome: QuestProgressionOutcome,
): QuestDefinition => ({
  id,
  title,
  summary,
  giverNpcId: npcId,
  turnInNpcId: npcId,
  category,
  objectives: [{ id: `${id}_objective`, type: 'interact', targetId: id, required: 1, label: `Realize: ${title}` }],
  rewards: [{ type: 'characterXp', value: category === 'clan' ? 15 : 25 }],
  prerequisites,
  outcomes: [outcome],
  initialStatus: 'locked',
  terranFlow: { active: 'location_terran_clan_hall', ready_to_turn_in: 'location_terran_clan_hall' },
  status: 'CANON',
})

const clanTrialChain = (
  clanId: string,
  npcId: string,
  trials: Array<[string, string, string]>,
) => trials.map(([id, title, summary], index) => socialTrial(
  id,
  title,
  summary,
  npcId,
  'clan',
  [
    { type: 'noClan' },
    index === 0 ? { type: 'clanKnown', clanId } : { type: 'questCompleted', questId: trials[index - 1][0] },
  ],
  index === trials.length - 1
    ? { type: 'clanEligibility', clanId }
    : { type: 'clanReputation', clanId, value: 1 },
))

const classTrial = (
  id: string,
  title: string,
  summary: string,
  npcId: string,
  clanId: string,
  classId: string,
) => socialTrial(id, `Prova — ${title}`, summary, npcId, 'class', [
  { type: 'clanJoined', clanId },
  { type: 'noClass' },
], { type: 'classEligibility', classId })

export const questDefinitions = [
  {
    id: 'vs_astravel_first_contact',
    title: 'O Primeiro Rastro',
    summary: 'Investigue a entrada de Astravél e enfrente a presença Fungorra detectada por Eldamar.',
    giverNpcId: 'npc_eldamar', turnInNpcId: 'npc_eldamar', category: 'main',
    objectives: [
      { id: 'talk_eldamar', type: 'talk', targetId: 'npc_eldamar', required: 1, label: 'Receba as instruções de Eldamar' },
      { id: 'visit_astravel', type: 'visit', targetId: 'astravel_entry', required: 1, label: 'Entre na rota de Astravél' },
      { id: 'defeat_fungorro', type: 'kill', targetId: 'enemy_fungorro_crawler', required: 1, label: 'Derrote um Fungorro Rastejante' },
    ],
    rewards: [{ type: 'characterXp', value: 20 }],
    terranFlow: { active: 'location_terran_portal_plaza', ready_to_turn_in: 'location_terran_eldamar_house' },
    status: 'CONTENT_DRAFT',
  },
  {
    id: 'main_lore_identity_01',
    title: 'Ecos da Identidade',
    summary: 'O Salão dos Clãs reconhece sua identidade e revela uma ruptura que exige seu caminho específico.',
    giverNpcId: 'npc_curador_nexo', turnInNpcId: 'npc_curador_nexo', category: 'main',
    objectives: [{ id: 'interpret_identity_echo', type: 'interact', targetId: 'main_lore_identity_01', required: 1, label: 'Interprete o eco segundo sua Classe' }],
    rewards: [{ type: 'characterXp', value: 35 }],
    prerequisites: [{ type: 'hasClan' }, { type: 'hasClass' }],
    classVariants: mainLoreClassVariants,
    initialStatus: 'locked',
    terranFlow: { active: 'location_terran_clan_hall', ready_to_turn_in: 'location_terran_clan_hall' },
    status: 'CONTENT_DRAFT',
  },
  ...clanTrialChain('dunavar', 'npc_mireya_dunavar', [
    ['clan_dunavar_01', 'Permanecer', 'Proteja um objetivo sob pressão. O protegido precisa sobreviver.'],
    ['clan_dunavar_02', 'A Barreira', 'Escolha quando defender, avançar, proteger e reagir.'],
    ['clan_dunavar_03', 'Aquilo que Está Atrás de Você', 'Proteja algo cujo valor ainda não compreende completamente.'],
  ]),
  ...clanTrialChain('rustal', 'npc_master_rustal', [
    ['clan_rustal_01', 'A Marca Incompleta', 'Investigue uma inscrição quebrada antes de alterá-la.'],
    ['clan_rustal_02', 'Matéria e Intenção', 'Escolha componentes compatíveis com o efeito desejado.'],
    ['clan_rustal_03', 'A Primeira Inscrição', 'Auxilie na restauração de uma inscrição funcional.'],
  ]),
  ...clanTrialChain('cebios_esti', 'npc_observador_cebios', [
    ['clan_cebios_01', 'O Céu Não Responde', 'Encontre um padrão entre sinais aparentemente desconexos.'],
    ['clan_cebios_02', 'Caminhos Possíveis', 'Interprete pistas incompletas para escolher um caminho.'],
    ['clan_cebios_03', 'A Constelação Ausente', 'Descubra o elemento que não deveria estar no padrão.'],
  ]),
  ...clanTrialChain('estres_do_et', 'npc_guardador_estres', [
    ['clan_estres_01', 'Fluxo Instável', 'Continue operando enquanto a energia muda constantemente.'],
    ['clan_estres_02', 'Não Interrompa o Caos', 'Redirecione e equilibre a fonte em vez de destruí-la.'],
    ['clan_estres_03', 'À Beira da Ruptura', 'Use parte da instabilidade para estabilizar o todo.'],
  ]),
  classTrial('class_sentinela_trial', 'Sentinela da Luz', 'Proteja vários objetivos com recursos defensivos limitados.', 'npc_master_sentinela', 'dunavar', 'sentinela_da_luz'),
  classTrial('class_gladiador_trial', 'Gladiador da Barreira', 'Sobreviva usando defesa, timing e contra-ataque.', 'npc_master_gladiador', 'dunavar', 'gladiador_da_barreira'),
  classTrial('class_batedor_trial', 'Batedor da Vigília', 'Reconheça ameaças, evite batalhas e descubra uma rota.', 'npc_master_batedor', 'dunavar', 'batedor_da_vigilia'),
  classTrial('class_forjador_trial', 'Forjador Arcano', 'Construa um mecanismo com componentes limitados.', 'npc_master_forjador', 'rustal', 'forjador_arcano'),
  classTrial('class_inscricoes_trial', 'Guardião das Inscrições', 'Restaure uma sequência enquanto ameaças tentam corrompê-la.', 'npc_master_inscricoes', 'rustal', 'guardiao_das_inscricoes'),
  classTrial('class_gravador_trial', 'Gravador das Sombras', 'Encontre e neutralize inscrições ocultas.', 'npc_master_gravador', 'rustal', 'gravador_das_sombras'),
  classTrial('class_astrologo_trial', 'Astrólogo Celestial', 'Alinhe pontos de energia na sequência correta.', 'npc_master_astrologo', 'cebios_esti', 'astrologo_celestial'),
  classTrial('class_profeta_trial', 'Profeta do Orbe', 'Determine quais informações de diferentes visões importam.', 'npc_master_profeta', 'cebios_esti', 'profeta_do_orbe'),
  classTrial('class_cacador_trial', 'Caçador de Constelações', 'Rastreie uma assinatura celestial entre áreas.', 'npc_master_cacador', 'cebios_esti', 'cacador_de_constelacoes'),
  classTrial('class_canalizador_trial', 'Canalizador do Caos', 'Redirecione fluxos instáveis sem sobrecarga.', 'npc_master_canalizador', 'estres_do_et', 'canalizador_do_caos'),
  classTrial('class_ruptura_trial', 'Guardador da Ruptura', 'Mantenha várias fissuras sob controle.', 'npc_master_ruptura', 'estres_do_et', 'guardador_da_ruptura'),
  classTrial('class_ruina_trial', 'Mago da Ruína', 'Destrua partes instáveis sem provocar colapso.', 'npc_master_ruina', 'estres_do_et', 'mago_da_ruina'),
] satisfies QuestDefinition[]
