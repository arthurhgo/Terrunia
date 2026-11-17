# Terrúnia v0.5.17.1 — decisões do proprietário e parâmetros de produção

**Autoridade:** `TERRUNIA_GAME_APP_MASTER_SPEC_v0.4.md` (revisão 0B).  
**Situação:** DRAFT / OWNER_DECISION; nenhum número abaixo é canon sem aprovação explícita.  
**Objetivo:** evitar perda de itens, exploits e bloqueios de campanha enquanto as decisões definitivas não são tomadas.

## 1. Desmontagem e substituição de componentes

**Proteção provisória implementada:** `replacedPartDisposition: 'return_to_inventory'`. 
A montagem substitui apenas o ID do módulo estrutural do slot e registra a peça antiga no histórico. Na **mesma transação**, a peça anterior retorna ao inventário; se não houver espaço, o fluxo de overflow do projeto pode roteá-la ao baú. Nenhuma peça antiga some, nenhum Ouro é reembolsado, e desmontagem/downgrade voluntário permanecem indisponíveis. Toda peça estrutural permanece **material temporário**, nunca um Vínculo novo.

**OWNER_DECISION:** confirmar retorno à mochila, guardar permanentemente como memória sem item recuperável, reciclagem em Essência, desmontagem paga ou regra mista. Só alterar a política depois de testar migração, rollback e impacto econômico.

## 2. Joias e afinidades elementais

- Fogo/Rubi da Ira e Água/Safira das Marés já possuem identidades e modificadores existentes no catálogo; preservar IDs, compatibilidade e progressão por Grau.
- Terra e Ar estão catalogadas em v0.5.17.1 como `CONTENT_DRAFT`, com modificadores `BALANCE_DRAFT`; **não** declarar status adicionais como canon.
- `elementalGemDropsEnabled: false` suspende geração de novos drops genéricos elementais nas ondas e trilhas até existir tabela de proveniência aprovada. **Nenhum item já conquistado no save é retirado.**
- O rito do Grau III é a única via canônica de instalar a primeira Joia. A existência de um encaixe físico estrutural não antecipa esse rito.

**OWNER_DECISION:** bioma/inimigo/boss responsável por cada elemento, probabilidades, efeitos de Água/Terra/Ar, se Rubi acrescenta status de combustão ou permanece modificador plano.

## 3. Escudo ofensivo e mão secundária

**Provisório já executável:** Golpe de Escudo somente para `offhandKind === 'shield'`, como **ação explícita** do jogador, com mana/cooldown; sem Ataque Duplo ou segundo turno automático. Escudo físico, Aljava e Protetor Arcano compartilham slot vinculado, mas módulos físicos só equipam a família `shield`. Bônus estruturais de proteção física entram em **ESC**, não duas vezes em ARM. Reações de Aparar/Bloquear/Esquivar/Contragolpear continuam limitadas pela família do ataque.

**OWNER_DECISION:** completar a restrição textual original interrompida após “escudo pode ser uma arma, não quero...” para não inventar regra canônica.

## 4. Economia, Tiers e drops repetíveis

**BALANCE_DRAFT aplicado em `src/content/modularBalanceV05171.ts`:**

| Tier | Nível mínimo | Compra Torvan | Preço | Forja (25%) |
| --- | ---: | :---: | ---: | ---: |
| I | 1 | Sim | 12 Ouro | 3 Ouro |
| II | 4 | Sim | 32 Ouro | 8 Ouro |
| III | 7 | Sim | 80 Ouro | 20 Ouro |
| IV | 10 | Não | 168 Ouro (valor de referência) | 42 Ouro |
| V | 13 | Não | 310 Ouro (valor de referência) | 77 Ouro |

**Origem:** cada uma das 15 trilhas de Astravél conserva o loot histórico e produz pelo menos uma oportunidade de peça no primeiro clear. Em ondas infinitas não há garantia de peça a cada combate nem multiplicação por quantidade de monstros.

| Faixa de ondas | Probabilidade de uma peça por vitória | Tier estrutural |
| --- | ---: | --- |
| 1–3 | 70% | I |
| 4–7 | 55% | II |
| 8–11 | 45% | III |
| 12–19 | 35% | IV |
| 20+ | 30% | III (57%), IV (35%), V (8%) |

O percentual de Tier V nas ondas 20+ é **condicional ao sorteio de uma peça**; chance por vitória = 30% × 8% = **2,4%** neste rascunho. O resultado de cada batalha é determinístico e persistido; coletá-lo duas vezes é rejeitado.

**OWNER_DECISION:** chances/limites finais, distribuição por inimigo/região, políticas first-clear/pity, como converter e vender módulos substituídos, crafting de recursos T4–T5 e se a chance de gemas elementais é vinculada a fontes específicas. Não alterar progressão de Graus, Pontos de Essência ou fontes de Clã/Classe.

## 5. Critérios para aprovação de canon

1. Executar CI e Playwright **sobre o mesmo commit**.
2. Revisar E2E de personagens novos, saves legados e conflitos local/cloud.
3. Aprovar custos/chances depois de simulação e de testar o primeiro ciclo Rosetta → Torvan → Durnan → combate.
4. Confirmar formalmente cada `OWNER_DECISION` antes de mover seu status para `CANON` em `docs/CANON_DECISIONS.md`.
5. Só então liberar merge na `main` e validar produção. Até lá, manter PR #84 draft.

**Não aprovado neste documento:** canonização das porcentagens, Vercel produção, restrição final do escudo, efeitos novos de Joias ou reciclagem/desmontagem definitiva.
