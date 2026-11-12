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

## Bloqueio de campanha existente — OWNER_DECISION resolvida (12/11/2026)

`enterDungeon` exige `save.character.clan.clanId` não nulo. Um personagem sem Clã chega ao Limiar da Ruína, mas **não entra nas Câmaras Fúngicas**. Essa regra foi preservada. A simulação comprova que há bloqueio, então usa uma fixture de personagem **já filiado** para verificar as 13 batalhas restantes — **não** concede um Clã automaticamente ao jogador real.

**Decisão de UX delegada pelo proprietário:** manter a filiação como um gate significativo para o marco 15; avisar sobre a exigência desde a conclusão do marco 5 e indicar o fluxo existente de Rosetta (nível 4), representantes e Salão dos Clãs. Não conceder Clã automaticamente nem desbloquear Classe na criação.

## Outras decisões ainda abertas

- `OWNER_DECISION RESOLVIDA`: **O Primeiro Rastro** permanece pronto após o primeiro combate, com entrega opcional imediata ou após concluir o capítulo 1. Uma volta antecipada libera recompensas, a Base e tutoriais úteis para preparação, sem ser exigida para concluir marcos 2–5.
- `BALANCE_DRAFT`: nível recomendado, consumo de PV/PM, compra de itens e mortes do personagem precisam de uma **partida real** com atributos e itens obtidos naturalmente.
- `UX_DRAFT`: precisão do tempo entre combates, tempo de caminhada e retornos repetidos ainda não são observáveis pelo save; o registro atual não mantém timestamps por missão/ação.
- `CONTENT_DRAFT`: nomes Torvan, Brenna e Ilyra, textos narrativos e distribuição final de contratos ainda aguardam revisão autoral.

## Critérios finais para aprovação humana

1. Iniciar um Terrírian sem Clã e Classe, completar tutorial e O Primeiro Rastro sem build pré-definida.
2. Jogar marcos 1–5 com inventário e combate **sem atributos inflados**; anotar mortes e paradas involuntárias.
3. Retornar a Eldamar, aceitar com Vorren e concluir 6–10; observar a quantidade real de tarefas e deslocamentos.
4. Entregar a Vorren, aceitar com Lithwynn, lutar 11–14 e conferir orientação para o Salão dos Clãs e requisito da Ruína.
5. Obter filiação legitimamente por NPCs/missões/rito (**requisito mantido por decisão delegada de UX**), concluir as quatro salas e o chefe, entregar a Lithwynn.
6. Conferir itens úteis, materiais reservados, pagamentos, relatório e progressão de missões na tela de vitória.
7. Reabrir saves nos marcos 5, 10 e após o boss; confirmar continuidade e ausência de drops/recompensas duplicados.
8. Verificar navegação e UI em 1366×768, 1920×1080 e mobile. Substituição de sprites detalhados fica fora do escopo.

**Não chamar de playtest humano concluído**: a suíte é uma simulação técnica determinística. O teste manual é o próximo critério de aceite e permanece pendente.

## Resultado e rastreabilidade

- Teste de jornada: `src/domain/quests/astravelJourneyFullV0516.test.ts`.
- A versão até então possui suíte geral CI + testes de navegador Playwright no PR #80.
- Consultar os checks vinculados ao **commit mais recente** do PR para o estado final; não reutilizar um resultado de commit anterior.
- Até a aprovação do proprietário: **PR DRAFT, `main` preservada, Vercel de produção preservada**.


## Adendo QA — combatentes normais, primeiras cinco batalhas (12/11/2026)

Teste automatizado: `src/domain/quests/astravelNaturalBalanceV0516.test.ts` (determinístico, sem reforçar artificialmente Vida/Ataque/Defesa, com o motor de combate e o dado aleatório real).

### Cenário conservador

- Nível 1, arma vinculada inicial, apenas ataques básicos. Sem descanso, poções, bônus temporários, habilidades ativas, distribuição de atributos ou armadura.
- Primeiro Fungorro: **24 vitórias em 24 seeds**; média de 1,88 ações do jogador.
- Capítulo I inteiro sem pausa (16 seeds): **16/16** completaram marco 1, **15/16** marco 2, **2/16** marco 3, **0/16** marco 4 e **0/16** marco 5.
- Esse cenário com seis pontos iniciais não distribuídos é deliberadamente conservador e **não representa o fluxo obrigatório da criação pela UI**.

### Builds legais com os 6 pontos iniciais distribuídos

| Build | Vida inicial | Ataque | Defesa | Marco 3 vencido | Marco 4 vencido | Marco 5 vencido |
|---|---:|---:|---:|---:|---:|---:|
| 4 Vigor, 2 Força | 28 | 7 | 2 | 6/16 | 0/16 | 0/16 |
| 4 Força, 2 Vigor | 24 | 8 | 1 | 3/16 | 0/16 | 0/16 |
| 3 Vigor, 3 Força | 26 | 7 | 1 | 2/16 | 0/16 | 0/16 |

Sem poções, descanso ou equipamentos adicionais; um padrão de ataques básicos sem Defesa/Habilidade.

### Preparação existente do tutorial e loot da trilha

Fixture de 4 Vigor/2 Força, arma vinculada inicial e a **Túnica de Linho Gasta equipável** obtida pela lição de Rosetta. A fixture usa `equipBasicArmor`; não altera o cálculo de defesa nem cria um novo item no catálogo. Sem descanso, habilidades ofensivas ou upgrades de forja.

| Preparação | Marco 1 | Marco 2 | Marco 3 | Marco 4 | Marco 5 |
|---|---:|---:|---:|---:|---:|
| Túnica, sem consumível | 16/16 | 16/16 | 14/16 | 0/16 | 0/16 |
| Túnica + Tônico de Campo **obtido após o marco 2** e usado em combate | 16/16 | 16/16 | 16/16 | 2/16 | 0/16 |

O uso do Tônico foi validado através do motor de itens em combate (cura real de 8 PV, com consumo da unidade). Os resultados **não** medem um jogador usando suas melhores habilidades, runas, upgrades de forja, Defesa manual, equipamentos superiores ou retorno à Base. Por isso não são taxa real de vitória nem justificam diminuir silenciosamente o dano de criaturas.

### Achado e encaminhamento

- **Achado QA:** a continuidade do Capítulo I tem alto risco de exigir preparação/cura adicional, especialmente entre os marcos 3 e 5. Isso contradiz a sensação pretendida de avanço fluido **se o jogador não receber orientação clara**.
- **Correção segura aplicada:** atualizar dicas táticas dos marcos 3 e 4 para indicar a túnica, o tônico obtido na Clareira, a preservação de Vida e o foco no Semeador. Nenhum inimigo, atributo, drop ou requisito foi alterado.
- **OWNER_DECISION / BALANCE_DRAFT:** testar manualmente uma run completa com tutorial, habilidade ativa, consumíveis, runas, forja e descanso legal. Caso ainda haja interrupções excessivas, avaliar explicitamente pontos de recuperação, suprimentos extras ou ajustes no dano; não presumir valores.
- Testes de responsividade de Terran já cobrem **1366×768, 1920×1080 e 390×844** em `terran-exploration-contracts.spec.ts`, e a exploração de Astravél cobre **1366×768 e 390×844** em `vertical-slice.spec.ts`. A revisão humana visual continua pendente.

**Release gate:** o requisito de Clã foi mantido com aviso antecipado por decisão de UX delegada. O playtest humano ainda é pendente; o documento não autoriza merge/deploy de produção.


## Decisões UX delegadas — rodada final de v0.5.16 (12/11/2026)

O criador delegou ao desenvolvimento decisões de **experiência do jogador**, com registro explícito e sem mudar silenciosamente Clãs, Classes, Vinculação ou economia.

### 1. Filiação ao Clã: gate mantido, aviso antecipado

- Permanecer em `enterDungeon` a exigência de `clan.clanId` para as Câmaras Fúngicas.
- `getFungalChambersClanNoticeV0516` avisa após a **primeira transição de capítulo (marco 5)**, em vez de só após o marco 10.
- Rosetta, nível mínimo 4, representantes e Salão dos Clãs continuam sendo o fluxo regular; nenhum Clã/Classe é atribuído automaticamente.

### 2. O Primeiro Rastro: entrega opcional após o primeiro encontro

- O objetivo segue pronto após a primeira vitória e a visita à trilha, como na versão original.
- O jogador pode retornar imediatamente a Eldamar e prosseguir com Base/Tutoriais, ou continuar até o marco 5 antes de voltar.
- Não existe retorno obrigatório à cidade no meio dos marcos 1–5; o caminho principal seguinte exige sua missão correspondente aceita.

### 3. Recuperação entre encontros, sem modificar os monstros

Somente o catálogo de encontros de Astravél foi ajustado usando a propriedade existente `fieldRecovery`, aplicada **após vitória e coleta de recompensas**, com PV/PM limitados ao máximo real do personagem. Uma derrota não recebe benefício. Nenhuma cura é concedida ao aceitar missão ou realizar level up.

| Marco concluído | Cura PV | Cura PM | Status |
|---|---:|---:|---|
| 2 — Clareira Luminescente | +8 | +2 | `BALANCE_DRAFT` |
| 3 — Travessia das Mariposas | +10 | +3 | `BALANCE_DRAFT` |
| 4 — Margem dos Esporos | +8 | +2 | `BALANCE_DRAFT` |
| 5 — Acampamento | +10 | +6 | existente, preservada |

### Comparação com 16 seeds, personagem preparado por Rosetta

Mesmo build legal 4 Vigor/2 Força, arma vinculada de início, Túnica de Linho Gasta real via `equipBasicArmor`, ataques básicos sem habilidades/manobra de Defesa, sem descanso entre combates:

| Recursos | Antes (5/5) | Depois (5/5) |
|---|---:|---:|
| Túnica sem Tônico | 0/16 | 9/16 |
| Túnica + Tônico obtido no marco 2 | 0/16 | **15/16** |

A melhoria vem do sistema de recuperação pós-vitória, não de dano reduzido, drops extras ou status inventados. Os testes não incluem uso estratégico de habilidades, outras distribuições de itens ou custo real de caminhada; não substituem o playtest humano. O balanceamento continua configurável e poderá ser refinado com dados reais, sem retroativamente alterar saves concluídos.

### Divergência narrativa identificada, sem alteração silenciosa de cânon

A especificação técnica v0.4 ainda descreve o **Colosso Micélio** como chefe das Câmaras Fúngicas (seção 23), enquanto o boss implementado no jogo v0.5.16 é a **Sentinela Corrompida**. A interface e a missão atuais acompanham o combate implementado para evitar informação incorreta durante a sessão. **CONTENT_DRAFT / OWNER_DECISION:** esta divergência deve ser reconciliada explicitamente no roadmap narrativo, sem substituir o chefe nem alterar o texto da especificação silenciosamente neste release.

### Evidências de testes

- `src/domain/quests/astravelNaturalBalanceV0516.test.ts`: compara dados reais sem stats inflados, builds com atributos legais e tutorial+Tônico.
- `src/domain/quests/questFlowV0516.test.ts`: aviso de Clã após o capítulo I, contador de marcos e texto do boss implementado.
- `src/domain/quests/astravelJourneyFullV0516.test.ts`: fluxo dos 15 marcos, gate de Clã e entregas explícitas.
- **Falta somente playtest humano e aprovação de publicação; não fazer merge automaticamente.**
