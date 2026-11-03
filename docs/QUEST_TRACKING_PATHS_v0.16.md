# Terrúnia — rastreamento visual de missões v0.16

Data: 2026-11-03. Referência superior: `TERRUNIA_GAME_APP_MASTER_SPEC_v0.4.md`. Escopo: vertical slice de Terran, sem alterar regras de Vínculos, essência, recompensas, economia ou progresso do personagem.

## Fluxo de UX (implementado)

- Aceitar uma missão a torna a única **missão atual**, mas não remove outras missões do diário.
- Abrir o painel **Missões** em Terran exibe automaticamente **uma rota pontilhada**, da posição atual do personagem até o destino da missão rastreada.
- Expandir uma missão e pressionar **Rastrear missão** passa o foco a ela e desativa a rota anterior. **Remover rastreamento** apaga imediatamente a rota, sem cancelar a missão.
- A recomendação do painel à esquerda passa a priorizar a missão selecionada como **MISSÃO ATUAL**, incluindo sua descrição/destino. O minimapa acompanha o mesmo destino e não inventa rotas para missões não rastreadas.
- Fechar a aba Missões oculta esse traçado; a prévia geral de caminhos dourados de Rosetta permanece independente, disponível por hover/foco ou pelo botão de Rosetta.
- Ao aceitar outra missão, a seleção muda para a nova missão. Progresso de missões paralelas não rouba o foco do jogador.
- Missões prontas para entregar apontam ao NPC de entrega. Missões que exigem combate/coleção em instâncias apontam ao Portal (acesso verificado de Terran). Missões de equipar itens mostram **Sem rota visual** em vez de uma linha inútil.
- Saves antigos com múltiplas flags de rastreamento são normalizados de maneira determinística, dando preferência ao último rastreamento explícito do histórico (ou aceitação); objetivos, itens, recompensas e moedas são preservados. O schema 16 permanece o mesmo.

## Identidade visual

| Categoria | Cor | Opacidade | Estilo |
|---|---|---:|---|
| Principal / Rosetta / Clã / Classe | dourado `#EDC87C` | 100% | pontos 3–5, traço fino, animação leve |
| Secundária / Caçada | azul claro `#A8E6FF` | 20% | pontos 3–5, traço fino, sem brilho |
| Sem rota disponível | sem traço | — | aviso pequeno no diário |

No minimapa, a rota rastreada acompanha o mesmo destino e cor. As linhas são renderizadas em SVG com `pointer-events:none`, sem interferir em botões do cenário, sprites ou controles.

## Contrato técnico

- Estado do jogador: `GameSave.quests[id].tracked`, booleanos existentes; nenhum campo novo.
- Mutação: `setQuestTracked(save, id, enabled, now)`, `acceptQuest`, e eventos de objetivo em `questEngine.ts`.
- Migração conservadora: `normalizeTrackedQuests` na validação de saves.
- Resolução única: `getTrackedQuestRoute(save, catalog)` em `rosettaGuide.ts`; devolve `null` se o objetivo não possui destino físico.
- Exibição: `PixelCityCanvas` distingue prévia de Rosetta da rota única, evitando duplicações; `TerranScreen` ativa o modo rastreado quando `drawer === 'quests'`.
- `QuestGrid` indica qual missão está atual e se existe rota física.

## Limites conhecidos e OWNER_DECISION

Rotas a destinos de exploração que ocorram fora da cidade (como salas específicas de dungeons) param na porta do Portal. Caminhos por interiores, entre regiões e instâncias exigem waypoints específicos futuramente. Não inventar trajetos até bosses que não existam no mapa. Contratos com objetivos fora de Terran podem precisar da definição explícita de um destino/waypoint em versão futura (`OWNER_DECISION`).

## Validação

`npm run check`: lint, TypeScript, unitários e build. Testes de regressão cobrem troca e remoção de rastreamento, migração de saves, destinos por estado, cores/opacidade e abertura da aba Missões. E2E visual pode ser executado separadamente.
