# Terrúnia v0.6 — slice visual isométrico (VISUAL_DRAFT)

## Estado
Prévia experimental opt-in em `/visual-v06`. Não substituir a cena de produção em `/play` antes de validar renderer, picking, input, navegação, colisão, NPCs, combate, interiores e E2E.

## Implementado
- Prévia acessível pelo botão `Visão 3D · v0.6` na cidade funcional.
- Movimentação experimental via WASD/setas e rotas por clique, reutilizando `findCityPath` e `isCityWalkable` da cidade 2D.
- NPCs da cidade derivados de `getCityCast(save)` (posições, identificação e sinalizadores reais).
- Interiores isométricos read-only alimentados por `getRoomPlan`, `getInteriorResidents` e `roomFurniture`.
- Arena isométrica read-only alimentada pelo estado de combate e PV reais; ações permanecem no jogo oficial.
- Teste E2E específico cobrindo acesso, deslocamento, interiores e retorno ao jogo.
- Terran isométrica demonstrativa com projeção 3D via CSS, oito IDs oficiais de instituições (incluindo Portal);
- seleção acessível de edifícios usando definições oficiais `content.terranLocations`;
- zoom com controles, detalhe do local e links para telas existentes;
- autenticação e save preservados por `GameBoot`; não grava nenhum campo novo no save;
- sem dependências externas nem shaders/assets obrigatórios.

## Limitações explícitas
**Não é Gaussian Splat nem motor real de geometria 3D.** Os volumes são placeholders em CSS 3D. Personagem e NPCs possuem tokens volumétricos 3D na prévia; interiores e combates mostram geometria volumétrica ligada aos dados oficiais, mas **não executam as interações de gameplay nessa visualização**. A movimentação da cidade é local à prévia e usa colisão/pathfinding oficial, sem persistir posição no save. O combate, a interação com NPCs, a navegação funcional por casas e todos os turnos continuam no renderer 2D da rota `/play`. Não há Gaussian Splat nem glTF nesta etapa.

## Próximo slice para renderer 3D real
1. Renderer Three.js/WebGL como módulo de apresentação, desacoplado do domínio;
2. projeção world->scene usando coordenadas oficiais; controles/picking e caminho navegável;
3. props e personagens com assetRegistry e fallback, glTF/splat somente quando autorizados e disponíveis;
4. mesmo adapter para interiores e arenas de combate (eventos da máquina de estados);
5. comparação visual, testes de entrada/saída e preservação de saves;
6. feature flag e rollout controlado após lint, typecheck, testes, build e smoke E2E.

## Canon
As dimensões, alturas, perspectiva, materiais e geometrias são VISUAL_DRAFT, não introduzem lore ou mecânica. O Portal só despacha instâncias e os cinco vínculos seguem permanentes. Conflitos de regras não foram resolvidos neste slice.

## Release gate
Antes de produção: `npm run check` e `npm run e2e` no mesmo SHA, inspeção de deploy e teste de login/save; sem isso, manter PR isolado.
