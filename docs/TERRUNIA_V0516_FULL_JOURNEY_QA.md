# Terrúnia v0.5.16 — Congelamento de escopo e auditoria da campanha 1–15

**Estado:** `QA_REVIEW` · **branch:** `feature/v0.5.16-quest-flow-approval` · **PR:** #80 DRAFT  
**Base publicada:** v0.5.15.3 na `main` (não alterar antes de aprovação).  
**Fonte canônica:** `TERRUNIA_GAME_APP_MASTER_SPEC_v0.4.md`; nenhuma regra de Clã, Vínculo, Classe, Essência ou drop foi alterada nesta auditoria.

## Decisão de escopo

**Congelada a inclusão de novas mecânicas na v0.5.16.** A etapa atual somente admite correções de falhas encontradas nos testes, atualização de critérios e revisão do conteúdo existente. Os oito protótipos SVG não substituem os sprites de produção; remake visual avançado continua reservado à v0.6.

## Cobertura automatizada — prova técnica de jornada

Arquivo: `src/domain/quests/astravelJourneyFullV0516.test.ts`. Este teste executa o **motor real de turnos e sua rolagem de iniciativa** com uma personagem deliberadamente superforte para evitar que uma derrota imprevisível interrompa a auditoria de navegação. Não é um playtest humano de dificuldade, economia, tempo ou legibilidade.

| Marco | Nome / nó | Regra / observação validada |
|---|---|---|
| 1 | Presença Fungorra · `astravel_fungorro_01` | Missão O Primeiro Rastro aceita; primeira vitória deixa entrega pronta |
| 2 | Clareira Luminescente · `astravel_luminous_02` | Segue sem obrigação de retorno imediato |
| 3 | Travessia das Mariposas · `astravel_moth_03` | Inimigos reais e registro retrospectivo de Fungorro Espinhal |
| 4 | Margem dos Esporos · `astravel_spore_bank_04` | Combate e progressão contínua |
| 5 | Acampamento Abandonado · `astravel_camp_03` | Checkpoint, próximo trecho aberto; teste de recarga do save |
| 6 | Rastros dos Caçadores · `astravel_hunter_tracks_06` | Bloqueado até entregar a Eldamar e aceitar Caçadores Perdidos com Vorren |
| 7 | Jardim Contaminado · `astravel_spore_garden_07` | Combate do novo capítulo |
| 8 | Emboscada de Esporos · `astravel_spore_ambush_04` | Segundo vestígio dos caçadores preservado |
| 9 | Brejo Esporulante · `astravel_horror_09` | Registro de rastros miceliais, sem combate duplicado obrigatório |
| 10 | Refúgio dos Caçadores · `astravel_hunter_refuge_10` | Terceiro vestígio, entrega pronta a Vorren, teste de recarga do save |
| 11 | Vigília das Ruínas · `astravel_ruin_watch_11` | Bloqueado até entrega a Vorren e aceite da investigação de Lithwynn |
| 12 | Galeria de Micélio · `astravel_mycelial_12` | Combate do terceiro capítulo |
| 13 | Guardião Raiz-Negra · `astravel_blackroot_13` | Minichefe; combate real via FSM |
| 14 | Limiar da Ruína · `astravel_ruin_threshold_05` | Abre o nó de boss `bossCurrent`; não premia nem conclui antecipadamente |
| 15 | Câmaras Fúngicas · `astravel_boss_preview` | Quatro salas × três estágios **mais** Sentinela Corrompida: 13 batalhas internas; conclusão só após a derrota do boss e entrega a Lithwynn |

### Invariantes verificados

- São **15 marcos** no mapa, mas o 15º contém **13 batalhas internas**. Portanto, a validação executa 14 encontros externos + 13 internos = **27 resoluções de combate**. Esse total não representa a duração esperada de uma sessão real.
- A máquina de estados usa `createBattle` + `submitBattleCommand` com iniciativa e alvos reais, sem pular diretamente para vitória. A personagem de teste possui atributos elevadíssimos **somente na simulação**, por isso o resultado **não valida** o balanceamento.
- Exige aceitar `vs_astravel_first_contact`, `main_astravel_lost_hunters` e `main_astravel_corruption` separadamente. As entregas em Eldamar, Vorren e Lithwynn passam por `turnInQuest`; a repetição da entrega é rejeitada.
- Não permite iniciar os capítulos II e III antes da missão correspondente.
- A progressão confirma o `completed` dos 15 encontros, 8 vestígios do relatório e o capítulo `aftermath` no final.
- Em um roteiro isolado das três principais, a telemetria registra três aceites ao longo dos 15 marcos, **máximo de um aceite entre combates**. Isso mede o roteiro testado, não o comportamento de todos os jogadores.
- `migrateAndValidateSave` recarrega saves após os marcos 5 e 10, sem perder o checkpoint ou a missão pronta para entrega.
- A suíte anterior segue cobrindo o legado de 29 sidequests, contratos divididos por capítulo, inventário comprometido, entregas sequenciais e proteção de recompensas contra duplicação.

## Bloqueio de campanha existente — OWNER_DECISION

`enterDungeon` exige `save.character.clan.clanId` não nulo. Um personagem sem Clã chega ao Limiar da Ruína, mas **não entra nas Câmaras Fúngicas**. Essa regra foi preservada. A simulação comprova que há bloqueio, então usa uma fixture de personagem **já filiado** para verificar as 13 batalhas restantes — **não** concede um Clã automaticamente ao jogador real.

**Decisão do proprietário:** confirmar que a filiação antes do marco 15 é um requisito intencional da campanha e que Rosetta/Salão dos Clãs devem apresentar essa necessidade na jornada. Caso não seja intencional, redefinir explicitamente o gate antes de alterar a regra.

## Outras decisões ainda abertas

- `OWNER_DECISION`: O Primeiro Rastro fica pronto após o primeiro combate, mas pode ser entregue apenas no retorno do capítulo I. Tornar a entrega obrigatória no marco 5 exigiria alteração expressa do cânon.
- `BALANCE_DRAFT`: nível recomendado, consumo de PV/PM, compra de itens e mortes do personagem precisam de uma **partida real** com atributos e itens obtidos naturalmente.
- `UX_DRAFT`: precisão do tempo entre combates, tempo de caminhada e retornos repetidos ainda não são observáveis pelo save; o registro atual não mantém timestamps por missão/ação.
- `CONTENT_DRAFT`: nomes Torvan, Brenna e Ilyra, textos narrativos e distribuição final de contratos ainda aguardam revisão autoral.

## Critérios finais para aprovação humana

1. Iniciar um Terrírian sem Clã e Classe, completar tutorial e O Primeiro Rastro sem build pré-definida.
2. Jogar marcos 1–5 com inventário e combate **sem atributos inflados**; anotar mortes e paradas involuntárias.
3. Retornar a Eldamar, aceitar com Vorren e concluir 6–10; observar a quantidade real de tarefas e deslocamentos.
4. Entregar a Vorren, aceitar com Lithwynn, lutar 11–14 e conferir orientação para o Salão dos Clãs e requisito da Ruína.
5. Obter filiação legitimamente por NPCs/missões/rito **se a exigência for aprovada**, concluir as quatro salas e o chefe, entregar a Lithwynn.
6. Conferir itens úteis, materiais reservados, pagamentos, relatório e progressão de missões na tela de vitória.
7. Reabrir saves nos marcos 5, 10 e após o boss; confirmar continuidade e ausência de drops/recompensas duplicados.
8. Verificar navegação e UI em 1366×768, 1920×1080 e mobile. Substituição de sprites detalhados fica fora do escopo.

**Não chamar de playtest humano concluído**: a suíte é uma simulação técnica determinística. O teste manual é o próximo critério de aceite e permanece pendente.

## Resultado e rastreabilidade

- Teste de jornada: `src/domain/quests/astravelJourneyFullV0516.test.ts`.
- A versão até então possui suíte geral CI + testes de navegador Playwright no PR #80.
- Consultar os checks vinculados ao **commit mais recente** do PR para o estado final; não reutilizar um resultado de commit anterior.
- Até a aprovação do proprietário: **PR DRAFT, `main` preservada, Vercel de produção preservada**.
