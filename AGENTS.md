# Instruções do projeto Terrúnia

## Autoridade

Antes de alterar regras, leia `docs/TERRUNIA_GAME_APP_MASTER_SPEC_v0.4.md`, `docs/NEXUS_AND_QUEST_JOURNAL.md`, `docs/GAMEPLAY_RECRUITMENT_AND_RESET.md` para missões/recrutamento/reset e, para qualquer trabalho em Terran, `docs/TERRAN_CITY_STRUCTURE.md`. Em conflito, aplique:

1. decisões mais recentes do criador registradas em `docs/GAMEPLAY_RECRUITMENT_AND_RESET.md`, `docs/NEXUS_AND_QUEST_JOURNAL.md` e `docs/TERRAN_CITY_STRUCTURE.md` no respectivo domínio;
2. seção 0B;
3. seção 0A;
4. seções de sistema mais novas;
5. lore;
6. material legado.

Nunca silencie um conflito. Registre a resolução em `docs/CANON_DECISIONS.md`.

## Invariantes

- O jogador cria um Terrírian original, sem Clã, Classe ou identidade de NPC/herói.
- Clã e Classe são conquistas de gameplay.
- Missões só entram no Journal após aceitação explícita; o limite global é três `ACTIVE` + `READY_TO_TURN_IN`.
- Clã exige três provas, elegibilidade, convite, confirmação e rito; Classe exige Clã ativo, prova e confirmação.
- Reset de campanha preserva autenticação e preferências, invalida a geração cloud e limpa o save local.
- Os cinco equipamentos vinculados são permanentes e não podem ser substituídos por loot.
- Cada barra completa gera exatamente um Ponto de Essência e preserva o excedente.
- Abates e níveis não concedem Pontos de Essência diretamente.
- Existem exatamente sete Graus por item vinculado.
- Combate é uma máquina de estados de domínio, sem dependência de React.
- Conteúdo e balanceamento devem permanecer data-driven.
- Assets devem ser resolvidos pelo registro central e aceitar fallback.

## Qualidade

- Mantenha regras em funções puras e cubra mudanças com testes.
- Rode `npm run check` antes de publicar.
- Não versione `.env`, credenciais, `node_modules`, `dist`, relatórios ou saves locais.
- Marque suposições com `BALANCE_DRAFT`, `CONTENT_DRAFT`, `VISUAL_DRAFT` ou `OWNER_DECISION`.
