# Terrúnia v0.5.17.1 — Auditoria de consolidação e critérios de liberação

**Data da revisão:** 2026-11-14  
**Base técnica:** `TERRUNIA_GAME_APP_MASTER_SPEC_v0.4.md`, seção 0B; plano `TERRUNIA_V05171_PLANO_TECNICO.md` (fornecido ao projeto).  
**Referência de implementação:** PR #84 (`feature/v0.5.17.1-modular-weapons-skills`), HEAD inicial `7d2a0d571bdd9e9acf99d43e980b5b85e118ab2e`.  
**Status:** CONSOLIDATION_DRAFT. Nenhum merge na `main`, publicação em produção ou canonização de números é autorizado por este documento.

## 1. Reconciliação de branches e validação inicial

- PR #83 (`feature/v0.5.17.1-modular-forge-combat`) e PR #84 partiram da mesma `main` (`e961efe`) e **divergiram**. Não mesclar a #83 cegamente sobre a #84.
- A #84 passou em GitHub Actions `CI` (run `43514820549`: `npm ci` e `npm run check`) e `Playwright E2E` (run `43514820451`) no HEAD inicial, **antes** das correções adicionais listadas aqui.
- A aprovação do runner não substitui Playwright específico de montagem, validação do fluxo novo/legado, revisão visual a 1366×768, smoke em Preview Vercel ou decisões explícitas do criador.

## 2. Implementado e verificado no código-base da #84

| Área | Evidência localizada | Estado |
| --- | --- | --- |
| Armas comerciais | `src/domain/inventory/equipmentV0515.ts` bloqueia compras e revestimentos de arma, inclusive kits; os 5 Vínculos permanecem separados | Implementado |
| Montagem | `src/content/modularWeaponsV05171.ts`: 8 famílias × 4 encaixes × 5 Tiers = 160 partes; `modularAssemblyV05171.ts`: preview puro, commit com revisão, compra Torvan T1–T3 | Implementado; economia BALANCE_DRAFT |
| Forja | `WeaponAssemblyWorkbenchV05171.tsx` e `ForgePanel.tsx`: seleção/drag-and-drop, renderização de camadas, confirmação, mantendo serviços antigos | Implementado; UX e arte VISUAL_DRAFT |
| Dano e defesa | `derivedStats.ts`, `engine.ts`, `defensiveResolutionV05171.ts`: atributos derivados e Bloqueio/Aparar/Esquiva/Contragolpe; Golpe de Escudo explícito | Implementado; balanço BALANCE_DRAFT |
| Drops | `modularLootV05171.ts`, `waves.ts` e `engine.ts`: roll determinístico no estado da batalha, com partes adicionadas ao loot original nas 15 trilhas e Ondas | Implementado; tabelas e limites econômicos pendentes |
| Rosetta | Cinco missões `rosetta_modular_*_v05171` em `rosettaTutorial.ts`, atreladas a compra/forja/defesa/combate | Implementado parcialmente frente ao plano completo |
| Gems | Fogo, Água, Terra e Ar catalogados, com acesso condicionado ao rito de Grau III | Conteúdo BALANCE_DRAFT |
| Save | Schema 18 e migração 17→18; mantenimento do ID dos Vínculos e preservação de revestimentos legados | Implementado; falta teste de sync/rollback completo |
| Assets | 160 SVGs de partes, sistema de ID/registry e fallback | VISUAL_DRAFT, não arte final |

## 3. Correções da consolidação

1. **Compatibilidade de mão secundária:** `getAssemblyFamily` agora impede aplicar módulos de escudo físico à Aljava ou Protetor Arcano; o slot `shield` continua um único Vínculo permanente.
2. **Dano sem contagem indevida:** bônus do módulo de escudo deixam de entrar em `primaryAttack` e nas técnicas da mão principal. O Golpe de Escudo continua a usar `shieldBashBonus` próprio.
3. **Prévia inequívoca:** forja apresenta Dano físico, Dano mágico, ARM, ESC, ARC, Iniciativa, Vida e Mana, com `Atual → Após` e delta explícito.
4. **Teste de regressão:** incompatibilidade com Protetor Arcano/Aljava, isolamento de dano principal e bônus ofensivo do escudo.
5. **Reação contra Área:** `applyAreaDodgeV05171` concentra uma regra parcial BALANCE_DRAFT (50% de dano retido), chamada em ataques direcionados com tipo Área e no ataque de área básico. Uma Esquiva bem-sucedida não gera imunidade a Área; Bloqueio/Aparar/Contragolpe não ganham elegibilidade contra Área. Teste de função pura e elegibilidade adicionados.

## 4. Pendências P0 antes de declarar a v0.5.17.1 completa

- **Área — QA de integração:** a aplicação parcial de Esquiva foi adicionada ao motor com fator configurável BALANCE_DRAFT; validar a rodada visual no navegador, efeitos de Área multialvo, cooldown, dano crítico e comportamento com ARM/ESC/ARC antes de aprovar o balanço.
- **Economia/drops:** a rotina atual garante uma peça a cada batalha, com Tier por índice, sem catálogo completo de matéria-prima/proveniência, pesos e `firstClearOnly` por fonte. Especificar limites de repetição e proteger os primeiros clears antes de aprovar a economia.
- **Rosetta:** a cadeia atual ensina compra e montagem; faltam os passos de coleta contextualizada, leitura explícita de stats, rito opcional Grau II, rito opcional Grau III e ação ofensiva específica do escudo previstos no plano. Nenhum tutorial deve exigir sorteio ou desbloqueio prematuro de Joias/Essências.
- **Idempotência e segurança:** estender testes para duplo clique/repetição após refresh, salvamento concorrente local/cloud, inventário lotado, componentes protegidos e migração de estilo comercial legado; rollback/backup antes de primeira gravação do schema 18.
- **Apresentação visual:** sprites são SVGs funcionais, não pixel-art final; confirmar qualidade das 8 famílias e sobreposição das 4 camadas (em todos os Tiers), animação de forja e viewport 1366×768.
- **Matriz E2E de jogabilidade:** iniciar Terrírian cru, obter vínculo, receber instrução de Rosetta, comprar e instalar peça, verificar ataque real e ESC, vencer encontro, recolher drop só uma vez, recarregar save sem perder estrutura. Repetir para Aljava e Protetor Arcano (deve rejeitar módulos físicos), além de legado do schema 17.
- **Build/Preview:** após a consolidação, rodar CI e Playwright novamente no novo SHA, revisar screenshots e validar Preview Vercel antes de pedir autorização de merge.

## 5. OWNER_DECISION — não converter proposta em canon

- Restrição inacabada relacionada ao escudo ofensivo (frase original interrompida).
- Destino de partes estruturais removidas/atualizadas, reembolso e manutenção das memórias de instalação.
- Chances, limites de farm, preços, bônus e distribuição T1–T5 por regiões e ondas.
- Efeitos e resistências de Água/Terra/Ar; comportamento ativo da Joia de Fogo.
- Política final para revestimentos comerciais de arma em saves antigos.
- Status de arte final, nomenclatura de materiais e atribuição de vendedores por família.

**Gate de liberação:** só declarar `v0.5.17.1 RELEASE` quando nenhum item P0 estiver aberto, CI + E2E + QA visual + Preview forem revalidados no mesmo SHA, e decisões canônicas forem registradas em `docs/CANON_DECISIONS.md`. Até lá, manter a PR em draft e a `main` intocada.
