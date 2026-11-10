# Terrúnia v0.5.15.3 — Oito melhorias de gameplay e apresentação

**Base:** `fix/v0.5.15.3-terran-market-specialists` (acumulativa às sete melhorias de UX).  
**Status:** revisão na branch de desenvolvimento, pendente de revisão manual.  
**Autoridade:** `TERRUNIA_GAME_APP_MASTER_SPEC_v0.4.md`.  
**Sem merge na `main` e sem deploy da Vercel nesta etapa.**

## Escopo implementado

1. **Feedback no combate:** o dado continua sendo o mesmo resultado autoritativo da FSM. Impactos agora diferenciam `ACERTO`, `CRÍTICO!` e `SEM DANO`, sem novo cálculo de dano ou RNG. Efeitos respeitam movimento reduzido.
2. **Identidade visual de equipamentos:** protetor, colar e pulseira comerciais são desenhados no sprite mesmo antes do Vínculo permanente, quando verdadeiramente equipados. A arma ainda exige seu Vínculo; um revestimento jamais cria um item vinculado.
3. **Requisitos de progressão:** os ritos G2/G3 existentes informam explicitamente Grau, déficit de Ressonância e falta de componente. Nada é entregue automaticamente.
4. **Balanceamento auditável:** matriz de testes usa os mesmos 25 inimigos, a FSM real e dois seeds determinísticos por espécie. Registra duração, rodadas, HP restante e desfecho. Os números permanecem `BALANCE_DRAFT`; não pressupõe vitória em toda luta.
5. **Forja comparativa:** mostra G1 → G2 → G3, os dois atributos reais, custo, saldo projetado e motivo exato do bloqueio. Os sete Graus permanentes de Vínculo não são alterados.
6. **Avisos de ameaça:** exibidos quando o Ataque/Defesa do monstro superam os parâmetros reais do personagem, quando há efeitos ativos, proteção de boss ou Vida crítica. São marcadores `VISUAL_DRAFT`, sem revelar dado ou ação futura nem adicionar regra.
7. **Efeitos sonoros:** sintetizados localmente por Web Audio, sem arquivos/música licenciados. Rolagem, crítico, impacto, bloqueio, compra, evolução e conclusão possuem sinais distintos. `settings.soundEnabled` já existente é controlado em Configurações e salvo no schema atual. Dispositivo sem Web Audio silencia graciosamente.
8. **Desempenho visual:** animações de inimigos isoladas com `React.memo`; mercado em grade deixa de desenhar cartões fora da viewport quando o navegador suporta `content-visibility`. Os cards continuam no DOM, mantendo os filtros e IDs. Modo `reducedMotion` continua desabilitando animações.

## Testes de regressão

- `src/ui/characters/equipmentVisuals.test.tsx`: shells comerciais antes dos Vínculos.
- `src/ui/terran/GearForgeV0515.test.tsx`: atributos/custos e prévia não mutante.
- `src/domain/combat/combatReadoutsV05153.test.ts`: readouts derivados, sem efeitos mecânicos.
- `src/domain/combat/enemyMatrixV05153.test.ts`: 25 espécies × 2 seeds, limites de HP e não travamento.
- Pipeline CI isolado: `npm run check`, seguido de `npm run e2e -- --project=chromium` em Vite local.

## Ainda depende de OWNER_DECISION

- Dano final do Ataque Duplo: dois impactos a 30% ou golpe integral + 30%.
- Cooldown da poção durante o combate.
- Economia final, custos de materiais e atributos de forja.
- Sprites, trilha e mixagem finais, valores definitivos de dificuldade e nomes de comerciantes.

## Revisão de aceite

1. Com som desligado, todas as ações continuam silenciosas. Com som ligado, o usuário recebe pistas curtas de cada ação sem alterar turnos.
2. Rolar, causar dano e acertar um crítico não atualiza HP antes do encerramento do foco no dado.
3. Comprar e equipar um Escudo, Colar ou Pulseira de treino faz o sprite aparecer; o estado de `bondedEquipment` continua nulo.
4. Rito bloqueado identifica precisamente o que falta; forja de peça comercial mostra preço e bônus exatos.
5. Monstros do catálogo preservam IDs, recompensas, ataques e a distribuição existente; resultados da matriz são diagnóstico e não canon.
6. UI em 1366×768 e 1920×1080, com zoom, movimento reduzido e teclado, permanece legível.
7. Recarregar save preserva `soundEnabled`, Vínculos, equipamentos, Ouro, Essência e missões.

**Liberação:** exige CI verde, inspeção funcional e autorização explícita para merge/deploy.
