# Terrúnia — v0.5.16 · Progressão fluida de missões (candidata à aprovação)

**Branch de revisão:** `feature/v0.5.16-quest-flow-approval`  
**Base:** v0.5.15.3 publicada na `main`  
**Estado:** `CONTENT_DRAFT` + `BALANCE_DRAFT`; **não aprovado como canon**  
**Autoridade:** `TERRUNIA_GAME_APP_MASTER_SPEC_v0.4.md`; nunca substituir Vínculos, Clã/Classe, Essência ou eventos do motor de combate.

## Problema observado

Playtest do proprietário: após avançar uma rota de Astravél, o diário acumulou **29 sidequests**. Muitas visitas entre NPCs, retornos e coleta de tarefas antes de novos combates. O desbloqueio por `questCompleted: vs_astravel_first_contact` disparava ofertas de inimigos e materiais de fases posteriores. A origem era de progressão/UX, não de quantidade máxima do save.

## Estratégia proposta

**História e combate determinam QUANDO uma nova oferta aparece.** Aceitar, entregar e receber recompensas continuam sendo ações explícitas. Os 15 encontros existentes e os pré-requisitos próprios de Clã/Classe permanecem inalterados.

| Etapa | Nó real de desbloqueio | Quest principal | Responsável / entrega | Secundárias expostas progressivamente |
|---|---|---|---|---|
| Capítulo I · Borda Luminescente (1–5) | Início / Primeiro Contato | `vs_astravel_first_contact` | Eldamar | Liora, Espinhos da Fronteira (e outras somente quando seus requisitos originais forem atendidos) |
| Capítulo II · Território dos Esporos (6–10) | `astravel_camp_03` (marco 5 concluído) | `main_astravel_lost_hunters` | Vorren | Arlen, Siven, relatório da carapaça, quitina da forja, pedido de Vorren |
| Capítulo III · Raízes da Ruína (11–15) | `astravel_hunter_refuge_10` (marco 10 concluído) | `main_astravel_corruption` | Lithwynn | Nara, Ruven, relatório micelial, inscrições de Lithwynn |
| Pós-Astravél | `astravel_boss_preview` (marco 15 concluído) | Conteúdo posterior | NPCs e contratos opcionais | Contratos comerciais e pedidos gerais não prioritários |

A correspondência `questId -> checkpoint` fica em `src/domain/quests/questPacingV0516.ts`. Os IDs dos NPCs, missões, marcos e recompensas não mudam.

## Comportamento de unlock e migração

1. `getNpcActionableQuests`, `getNpcQuestCounts`, `getNpcQuestBadgeCounts` e `getSuggestedQuest` **não exibem** uma missão `available` se seu checkpoint ainda não foi cumprido. `offerQuest` aplica a mesma condição no domínio; não depende apenas de UI.
2. `available` antigo **não é apagado**: conserva o status no save, porém aguarda o novo marco antes de ser ofertado. `offered`, `active`, `ready_to_turn_in` e `completed` legados permanecem utilizáveis — inclusive 29 aceitas.
3. `refreshQuestAvailability` recupera provas persistentes dos marcos 5, 9 e 14 para relatórios já em andamento; ao aceitar, `acceptQuest` já reconcilia objetivos `visit` concluídos. Nenhum autoaceite, premiação automática nem combate refeito.
4. Exigir o nó 5 para a missão principal de Vorren e o nó 10 para a missão principal de Lithwynn evita saltar para um capítulo antes da última luta anterior. A entrega narrativa anterior continua obrigatória.
5. A progressão de Clã/Classe, Rosetta e suas provas não ganha bloqueios adicionais por capítulo, preservando decisões e atividades já estabelecidas.
6. Sem limite de quests no save; a lateral apenas destaca até **três secundárias da etapa** e recolhe as outras e entregas excedentes. O Diário completo continua acessível.

## Revisão de repetição (BALANCE_DRAFT)

- `side_astravel_thornback_signs`: um Fungorro Espinhal (marco 3), sem exigir outra onda apenas por um segundo exemplar.
- `side_street_liora`: um Semeador de Esporos (marco 4).
- `side_street_siven`: uma Gosma Fúngica (marco 7).
- `side_street_nara`: dois Semeadores (marcos avançados).
- `side_astravel_forge_chitin`: uma Quitina, com requisito e consumo alinhados.
- `side_astravel_spore_shells`: relatório do marco 5, já registrado após a vitória; entregue a Vorren.
- `side_astravel_mycelial_tracking`: relatório do marco 9, após a etapa dos caçadores; entregue a Daeryn.
- `side_astravel_ruin_wardens`: relatório do marco 14, após o fim do arco; entregue a Lithwynn.

As recompensas atuais permanecem provisórias e não foram reprecificadas.

## UX

O painel fixo mostra:
- capítulo atual da trilha e próxima faixa de marcos;
- missões principais ativas;
- até três secundárias relacionadas à etapa;
- até três entregas prontas;
- outras ativas, entregas excedentes e concluídas em grupos recolhidos.

A interface não executa aceites ou entregas escondidas. O rastro dourado e o Diário mantêm suas funções existentes.

## Deliberações para aprovação (OWNER_DECISION)

1. **Nomes pessoais provisórios dos três comerciantes**: Torvan (Armeiro), Brenna (Armadureira), Ilyra (Artesã de Acessórios). Aprovar ou substituir antes do canon final.
2. **Nova política de relatos retrospectivos**: usar o marco vencido para satisfazer o objetivo de observação, com aceitação e entrega manuais. Testar saves antigos.
3. **Contratos pós-capítulo**: os pedidos gerais e encomendas de material ficam para depois da trilha principal; poderão futuramente migrar para um quadro de contratos opcional.
4. **Agrupamento de entregas**: nesta versão a entrega **continua presencial e individual**. Um botão de entrega múltipla ou relatório remoto requer decisão específica, para não duplicar recompensas ou ignorar ritos de NPC.
5. **Valores de XP, Ouro, Materiais e exigência de kills**: mantidos como BALANCE_DRAFT até playtest.
6. **Direção visual de sprites**: ver `TERRUNIA_V0516_VISUAL_APPROVAL.md`. O remake detalhado de personagens/ambientes continua previsto para v0.6.0.

## Critérios técnicos

- Zero mudança de `CURRENT_SAVE_SCHEMA = 17`.
- Não tocar em `bondedEquipment`, trocas de Classe/Clã, Skill Tree, árvore de Essência, cálculos de dano, itens vinculados, autenticação ou Firebase.
- Testes: capítulo I/II/III, NPC não oferece cedo, ofertas legadas, relatórios retroativos, saves com 29 missões, consumo da Quitina, invariância de economia/itens.
- Antes do merge, revisar em 1366×768 e 1920×1080, jogar a sequência real de marcos 1–15 e provar que o jogador não precisa repetir encontros que já passaram para concluir observações.

**Publicação:** até aprovação explícita, **sem merge na main e sem deploy em produção**.
