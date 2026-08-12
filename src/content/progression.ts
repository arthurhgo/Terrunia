import type { CharacterClassDefinition, ClanDefinition } from './types'

export const clanDefinitions = [
  {
    id: 'dunavar',
    name: "Dûn'Avar",
    philosophy: 'Proteção é uma escolha. A Barreira existe porque algo deve sobreviver.',
    recruiterNpcId: 'npc_mireya_dunavar',
    recruitmentQuestIds: ['clan_dunavar_01', 'clan_dunavar_02', 'clan_dunavar_03'],
    classIds: ['sentinela_da_luz', 'gladiador_da_barreira', 'batedor_da_vigilia'],
    // BALANCE_DRAFT: os valores podem mudar sem alterar o rito ou a identidade do Clã.
    bonusLabel: '+4 Vida · +1 Defesa',
    bonuses: { maxHp: 4, mitigation: 1 },
    status: 'CANON',
  },
  {
    id: 'rustal',
    name: 'Rustal',
    philosophy: 'Poder sem compreensão produz ruína. Uma Runa é uma regra transformada em forma.',
    recruiterNpcId: 'npc_master_rustal',
    recruitmentQuestIds: ['clan_rustal_01', 'clan_rustal_02', 'clan_rustal_03'],
    classIds: ['forjador_arcano', 'guardiao_das_inscricoes', 'gravador_das_sombras'],
    bonusLabel: 'Sabedoria das Runas',
    bonuses: { magicalAttack: 2 },
    status: 'CANON',
  },
  {
    id: 'cebios_esti',
    name: 'Cebios Esti',
    philosophy: 'Observar é diferente de olhar. O candidato deve interpretar relações sob incerteza.',
    recruiterNpcId: 'npc_observador_cebios',
    recruitmentQuestIds: ['clan_cebios_01', 'clan_cebios_02', 'clan_cebios_03'],
    classIds: ['astrologo_celestial', 'profeta_do_orbe', 'cacador_de_constelacoes'],
    bonusLabel: 'Leitura Estelar',
    bonuses: { mana: 4, magicalAttack: 1 },
    status: 'CANON',
  },
  {
    id: 'estres_do_et',
    name: 'Estres do Ét',
    philosophy: 'O instável precisa ser compreendido antes de poder ser controlado.',
    recruiterNpcId: 'npc_guardador_estres',
    recruitmentQuestIds: ['clan_estres_01', 'clan_estres_02', 'clan_estres_03'],
    classIds: ['canalizador_do_caos', 'guardador_da_ruptura', 'mago_da_ruina'],
    bonusLabel: 'Fluxo Caótico',
    bonuses: { physicalAttack: 1, magicalAttack: 1 },
    status: 'CANON',
  },
] satisfies ClanDefinition[]

export const classDefinitions = [
  { id: 'sentinela_da_luz', clanId: 'dunavar', name: 'Sentinela da Luz', role: 'Proteção e prioridade', principle: 'Ninguém passa por você.', masterNpcId: 'npc_master_sentinela', trialQuestId: 'class_sentinela_trial', status: 'CANON' },
  { id: 'gladiador_da_barreira', clanId: 'dunavar', name: 'Gladiador da Barreira', role: 'Defesa e contra-ataque', principle: 'A Barreira também avança.', masterNpcId: 'npc_master_gladiador', trialQuestId: 'class_gladiador_trial', status: 'CANON' },
  { id: 'batedor_da_vigilia', clanId: 'dunavar', name: 'Batedor da Vigília', role: 'Reconhecimento e precisão', principle: 'Vencer antes do primeiro golpe.', masterNpcId: 'npc_master_batedor', trialQuestId: 'class_batedor_trial', status: 'CANON' },
  { id: 'forjador_arcano', clanId: 'rustal', name: 'Forjador Arcano', role: 'Construção e adaptação', principle: 'Criar é transformar potencial em forma.', masterNpcId: 'npc_master_forjador', trialQuestId: 'class_forjador_trial', status: 'CANON' },
  { id: 'guardiao_das_inscricoes', clanId: 'rustal', name: 'Guardião das Inscrições', role: 'Preservação e defesa', principle: 'A regra deve permanecer.', masterNpcId: 'npc_master_inscricoes', trialQuestId: 'class_inscricoes_trial', status: 'CANON' },
  { id: 'gravador_das_sombras', clanId: 'rustal', name: 'Gravador das Sombras', role: 'Investigação e manipulação', principle: 'Nem toda marca deseja ser encontrada.', masterNpcId: 'npc_master_gravador', trialQuestId: 'class_gravador_trial', status: 'CANON' },
  { id: 'astrologo_celestial', clanId: 'cebios_esti', name: 'Astrólogo Celestial', role: 'Padrões e alinhamento', principle: 'Compreender o padrão.', masterNpcId: 'npc_master_astrologo', trialQuestId: 'class_astrologo_trial', status: 'CANON' },
  { id: 'profeta_do_orbe', clanId: 'cebios_esti', name: 'Profeta do Orbe', role: 'Visão e discernimento', principle: 'Ver o futuro não é compreendê-lo.', masterNpcId: 'npc_master_profeta', trialQuestId: 'class_profeta_trial', status: 'CANON' },
  { id: 'cacador_de_constelacoes', clanId: 'cebios_esti', name: 'Caçador de Constelações', role: 'Rastreamento celestial', principle: 'Todo rastro existe para quem sabe olhar.', masterNpcId: 'npc_master_cacador', trialQuestId: 'class_cacador_trial', status: 'CANON' },
  { id: 'canalizador_do_caos', clanId: 'estres_do_et', name: 'Canalizador do Caos', role: 'Redirecionamento de fluxos', principle: 'O caos é movimento.', masterNpcId: 'npc_master_canalizador', trialQuestId: 'class_canalizador_trial', status: 'CANON' },
  { id: 'guardador_da_ruptura', clanId: 'estres_do_et', name: 'Guardador da Ruptura', role: 'Contenção de fissuras', principle: 'Não deixe a fenda crescer.', masterNpcId: 'npc_master_ruptura', trialQuestId: 'class_ruptura_trial', status: 'CANON' },
  { id: 'mago_da_ruina', clanId: 'estres_do_et', name: 'Mago da Ruína', role: 'Destruição seletiva', principle: 'Saber o que destruir exige saber o que preservar.', masterNpcId: 'npc_master_ruina', trialQuestId: 'class_ruina_trial', status: 'CANON' },
] satisfies CharacterClassDefinition[]
