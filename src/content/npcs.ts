import type { NPCDefinition } from './types'

export const secondaryQuestIdForNpc = (npcId: string) => `secondary_${npcId.replace(/^npc_/, '')}`

const ambientNpc = (id: string, name: string, title: string, dialogue: string): NPCDefinition => ({
  id,
  name,
  title,
  settlementId: 'terran',
  roles: ['normal', 'questGiver'],
  questIds: [],
  portraitAssetId: `${id}.portrait`,
  dialogue: [dialogue],
  status: 'CONTENT_DRAFT',
})

const baseNpcDefinitions = [
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
  ambientNpc('npc_torvynn', 'Torvynn', 'Decifrador de Manuscritos', 'Há símbolos nas Ruínas que ainda não aprenderam a ficar em silêncio.'),
  ambientNpc('npc_gethin', 'Gethin', 'Guardião da Memória Oral', 'Traga histórias do Portal; as que sobrevivem ao retorno merecem registro.'),
  ambientNpc('npc_elvira', 'Elvira', 'Leitora do Pergaminho Oculto', 'Certas páginas só se revelam diante de materiais vindos das Ruínas.'),
  ambientNpc('npc_vorren', 'Vorren', 'Caçador e Rastreador', 'Um monstro deixa mais do que pegadas; seus materiais contam como ele vive.'),
  ambientNpc('npc_elric', 'Elric', 'Caçador Gentil', 'Caçar bem também significa voltar com aquilo que a cidade pode estudar.'),
  ambientNpc('npc_draelis', 'Draelis', 'Cartógrafo de Rotas', 'Cada onda do Portal altera a rota seguinte. Marque o que mudou.'),
  ambientNpc('npc_keldron', 'Keldron', 'Caçador Sombrio', 'A criatura mais perigosa costuma esperar atrás do alvo óbvio.'),
  ambientNpc('npc_nerion', 'Nerion', 'Cartógrafo Celestial', 'Até os ecos do Portal obedecem a padrões, se observar por tempo suficiente.'),
  ambientNpc('npc_lithwynn', 'Lithwynn', 'Analista da Corrupção', 'Traga amostras intactas; a fissura importa tanto quanto o material.'),
  ambientNpc('npc_valmira', 'Valmira', 'Artífice Rúnica', 'Uma lasca de Ruína pode ensinar mais do que uma inscrição perfeita.'),
  ambientNpc('npc_talia', 'Talia', 'Mestra do Cristal', 'A luz do Gel Luminescente atravessa estruturas que o fogo não alcança.'),
  ambientNpc('npc_edran', 'Edran', 'Gravador de Símbolos', 'Preciso comparar marcas de sentinelas com as inscrições da Oficina.'),
  ambientNpc('npc_feril', 'Feril', 'Guardião das Pedras', 'Pedra viva e pedra da Ruína quebram de formas muito diferentes.'),
  ambientNpc('npc_lorian', 'Lorian', 'Alquimista das Inscrições', 'Esporos, pó e gel: separados são resíduos; juntos são uma pergunta.'),
  ambientNpc('npc_durnan', 'Durnan', 'Ferreiro Errante', 'Se uma criatura tem carapaça, há uma ferramenta capaz de compreendê-la.'),
  ambientNpc('npc_zareth', 'Capitão Zareth', 'Comandante do Quartel', 'A melhor defesa começa eliminando a ameaça antes que alcance os muros.'),
  ambientNpc('npc_kaedin', 'Kaedin', 'Vigia Silencioso', 'Complete uma vigília no Portal sem perder atenção entre as ondas.'),
  ambientNpc('npc_torvan', 'Torvan', 'Escudo de Terran', 'Quero saber até onde sua postura resiste quando os inimigos se multiplicam.'),
  ambientNpc('npc_dremor', 'Dremor', 'Último Sentinela', 'O Portal repete ameaças, mas nunca exatamente da mesma forma.'),
  ambientNpc('npc_daeryn', 'Daeryn', 'Curandeira de Terran', 'Alguns reagentes só permanecem ativos quando recolhidos logo após a luta.'),
  ambientNpc('npc_sylwen', 'Sylwen', 'Criadora de Poções', 'O Pó do Vazio exige uma dose precisa e mãos ainda mais precisas.'),
  ambientNpc('npc_briana', 'Briana', 'Herbalista', 'A quitina fúngica protege a criatura e pode proteger quem a estuda.'),
  ambientNpc('npc_orlan', 'Orlan', 'Herbalista Solitário', 'O Gel Luminescente cresce onde raízes comuns recusam ficar.'),
  ambientNpc('npc_portal_guardian', 'Guardião do Portal', 'Registrador de Expedições', 'O Portal registra destinos, não desejos. A autorização vem da missão.'),
  ambientNpc('npc_class_masters_council', 'Conselho dos Mestres', 'Mestres de Classe', 'Uma disciplina futura começa observando como você reage a ameaças diferentes.'),
] satisfies NPCDefinition[]

export const npcDefinitions = baseNpcDefinitions.map((npc) => ({
  ...npc,
  questIds: [...npc.questIds, secondaryQuestIdForNpc(npc.id)],
})) satisfies NPCDefinition[]
