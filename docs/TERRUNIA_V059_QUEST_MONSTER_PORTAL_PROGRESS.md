# Terrúnia v0.5.9 — Missões sincronizadas, monstros por estágio e Portal com botões

**Data:** 2026-11-06 · **Branch:** `feat/gameplay-v0.5.9` · **PR:** #60 (draft).  
**Autoridade:** `AGENTS.md`, `TERRUNIA_GAME_APP_MASTER_SPEC_v0.4.md`, `CANON_DECISIONS.md`, `NEXUS_AND_QUEST_JOURNAL.md`, `GAMEPLAY_RECRUITMENT_AND_RESET.md`, `TERRAN_CITY_STRUCTURE.md`.  
**Estado:** `CONTENT_DRAFT`, `BALANCE_DRAFT`, `VISUAL_DRAFT`; decisões definitivas de nomes, aparência e valores = `OWNER_DECISION`.

## 1. Objetivo da rodada

Conectar a progressão narrativa ao avanço real por Astravél, inserir inimigos com variação de dificuldade/silhueta, e substituir o deslocamento obrigatório no hub por botões claros para as atividades disponíveis.

Não inventar regiões, classes, clãs, efeitos de equipamentos ou regras de recompensa únicas. Não reescrever missões antigas nem criar mais de 15 encontros no caminho principal.

## 2. Progressão derivada do save

| Etapa | Trecho atual | Marcos | Missão principal já existente |
|---|---|---|---|
| 1 | Borda Luminescente | 1–5 | `vs_astravel_first_contact` |
| 2 | Território dos Esporos | 6–10 | `main_astravel_lost_hunters` |
| 3 | Raízes da Ruína | 11–15 | `main_astravel_corruption` |

O seletor `getAstravelChapterProgress` combina o estado de cada missão com os nós de `save.world.trailNodeStates`: mostra encontros concluídos (0–5), missão aceita, entrega pendente, relato entregue ou etapa ainda fechada. O Diário completo e o Portal apresentam os mesmos resultados, sem aceitar automaticamente a próxima missão.

### Nova sequência secundária opcional

| Quest ID | Responsável | Disponibilidade e sincronia | Alvo | Recompensa provisória |
|---|---|---|---|---|
| `side_astravel_spore_shells` | Vorren | Entregar `main_vorren_bestiary`; Caçada de Esporos ou marco 5 acessível | 2 Cascos de Esporos | 35 XP · 20 Ouro · 18 Essência Bruta · 1 Antídoto |
| `side_astravel_mycelial_tracking` | Daeryn | Entregar `main_astravel_lost_hunters` **e** estudo anterior; marco 9/12 ou novo Rastro Micelial | 2 Rastreadores Miceliais | 55 XP · 35 Ouro · 35 Essência Bruta · 1 Runa de Campo consumível |
| `side_astravel_ruin_wardens` | Lithwynn | Entregar `main_astravel_corruption` **e** estudo anterior; marco 14 ou nova Caçada dos Guardiões | 2 Vigias do Limiar | 85 XP · 52 Ouro · 60 Essência Bruta · 1 Essência Vital consumível |

Regras: aceite e entrega explícitos; side quests nunca bloqueiam a campanha principal; recompensas por entrega única; conteúdo novo do save é migrado sem apagar missões existentes. As missões já aceitas na versão anterior preservam os IDs, progresso e objetivos. Todos os números estão marcados `BALANCE_DRAFT`, não são canon.

## 3. Monstros progressivos

| Enemy ID | Nome provisório | Nível | Vida | Defesa | Ataque | Material obtido |
|---|---|---|---|---|---|---|
| `enemy_fungorro_thornback` | Fungorro Espinhal | 2 | 10 | 1 | 3 | Núcleo Fúngico |
| `enemy_spore_bulwark` | Casco de Esporos | 3 | 14 | 2 | 3 | Quitina de Esporos |
| `enemy_mycelial_stalker` | Rastreador Micelial | 4 | 16 | 1 | 5 | Fibra Micelial |
| `enemy_ruin_warden` | Vigia do Limiar | 5 | 21 | 3 | 5 | Lasca da Ruína |

O posicionamento usa os **mesmos 15 nós** de Astravél: Espinhal no marco 3, Casco no marco 5, Rastreador no marco 9 e Vigia no marco 14. Os pools do Modo Ondas incluem os novos adversários por faixas de nível, com limite de quatro atores inimigos.

### Sprites provisórios

Sprites únicos, separados e substituíveis no `assetRegistry`:
- `/assets/enemies/progression/enemy_fungorro_thornback_idle.svg`
- `/assets/enemies/progression/enemy_spore_bulwark_idle.svg`
- `/assets/enemies/progression/enemy_mycelial_stalker_idle.svg`
- `/assets/enemies/progression/enemy_ruin_warden_idle.svg`

São desenhos modulares de pixel art em SVG (apenas pose idle), não sprites finais com frames de ataque, dano ou morte. O fallback central de inimigos continua válido. A lógica do combate usa enemy IDs e não caminhos de arte.

## 4. Portal por botões — substitui seleção por caminhada

A nova direção de UX foi registrada em `docs/CANON_DECISIONS.md`. Não há deslocamento físico no hub nem segunda confirmação.

- **Floresta de Astravél**: abre a trilha no marco `astravel_entry` a partir da seleção explícita; nunca inicia luta automaticamente.
- **Modo Ondas**: botão liberado após o primeiro encontro de Astravél, com recorde real e requisito de Vida positiva.
- **Caçadas já existentes:** Ninho Luminescente, Caçada de Esporos e Vigília da Ruína continuam liberadas após o primeiro encontro; nenhum save antigo perde acesso já conquistado.
- **Caçadas adicionais**: Rastro Micelial só após entrega de `main_astravel_lost_hunters`; Guardiões do Limiar somente após entrega de `main_astravel_corruption`.
- Botões fechados permanecem visíveis, desabilitados e com explicação de desbloqueio; botões abertos iniciam a ação na mesma interação.
- O painel lateral de Terran mantém uma entrada única para a seleção; removidos atalhos redundantes de cada caçada.

**Segurança:** `canStartPortalHunt` continua verificando domínio, combate em curso, localização, história e Vida. Nenhum desbloqueio é simulado por dados de apresentação. Caçadas repetíveis não oferecem Memória do Colosso, Joia única, Fragmento de Grau II nem world flags da vitória narrativa.

## 5. Critérios de aceite e regressão

- [ ] `npm run check` (lint, typecheck, Vitest, build) aprovado no commit final.
- [ ] 15 nós preservados, cada encontro com inimigos existentes, máximo de 4 por combate.
- [ ] Quatro sprites registrados e renderizados, com fallback e sem dependência mecânica.
- [ ] Nova cadeia de 3 missões aparece em sequência, sem autoaceite ou reward antecipado.
- [ ] Saves antigos mantêm Vínculos, quests, Ouro, recordes e equipamentos.
- [ ] Abrir Portal não inicia batalha; clicar no botão de Astravél abre o marco 0; clicar em Ondas inicia a primeira onda se liberada.
- [ ] Caçadas avançadas respeitam a entrega dos capítulos; três caçadas antigas mantêm desbloqueio original.
- [ ] Nenhuma premiação de Ponto de Essência direto por kill/level e nenhum equipamento vinculado substituído.
- [ ] Testes E2E e QA visual em 1366×768/1920×1080 ainda devem ser executados antes do merge.
- [ ] Vercel é verificado; sem deploy manual ou merge sem autorização do proprietário.

## 6. Decisões em aberto — OWNER_DECISION

1. Nomes, espécies e descrições narrativas finais dos quatro monstros.
2. Números de Vida, defesa, ataque, XP, Ouro e Ressonância, além das recompensas das novas missões/caçadas.
3. Arte definitiva em 4 direções/frames de combate e licença de efeitos sonoros.
4. Se o Portal deve continuar como um hub puramente de botões ou se receberá uma vista opcional do cenário pixelado em atualização posterior.
5. Possível extensão do arco opcional para múltiplos ramos, sem tornar missões secundárias obrigatórias.

**Status de publicação:** alterar documentação/código em PR #60 não significa merge ou release. Conferir CI e QA antes da aprovação.
