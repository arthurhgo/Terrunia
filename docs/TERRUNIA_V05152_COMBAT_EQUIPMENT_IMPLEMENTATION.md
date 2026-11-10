# TERRÚNIA — v0.5.15.2: Combate, consumíveis, Mochila de vitória e equipamentos iniciais

**Status:** IMPLEMENTADO NA BRANCH DE TESTES · `BALANCE_DRAFT` / `OWNER_DECISION`. **NÃO PUBLICADO.**
Branch: `balance/v0.5.15.2-neris-gear-stats-draft`. Não integrar em `main` sem aprovação.

Este documento implementa o adendo `TERRUNIA_V05152_BACKLOG_COMBATE_EQUIPAMENTOS.md` e mantém a prioridade da especificação principal `TERRUNIA_GAME_APP_MASTER_SPEC_v0.4.md`.

## Consumíveis no combate

- Consumíveis **restaurativos/de suporte em si mesmo** (cura de Vida, Mana, remoção de efeitos negativos) são resolvidos imediatamente pela FSM **sem consumir a ação principal**, sem rolagem, sem reação inimiga e sem avançar rodada. Aplicar uma unidade e registrar a transação no save.
- Poção Restauradora: recupera **10% da Vida máxima instantaneamente**. O cooldown anterior de **dois turnos é mantido apenas DURANTE o combate** como `BALANCE_DRAFT` até decisão final. A regeneração antiga de dois turnos não acontece.
- Consumíveis ofensivos (arremessáveis, runas ofensivas) **continuam ações normais** para não conceder dano gratuito.
- Uso sem efeito útil é recusado sem débito do item.

## Ataques básicos por arma, Clã e Classe

As ações universais **Ataque Único, Ataque Duplo e Ataque em Área** ficam disponíveis no painel de Ataque para qualquer personagem em condição de agir — incluindo os quatro Clãs e suas doze Classes, sem seleção de afiliação na criação.

- Ataque Único: usa dano normal.
- Ataque em Área: **uma rolagem manual** calcula ataque principal e impactos adjacentes. Preserva `BALANCE_DRAFT` de 60% no centro e 30% desse resultado em cada lateral. Respeita bloqueio de chefes.
- Ataque Duplo: **uma única rolagem** produz dois impactos no mesmo alvo; sem duas janelas de dado. A apresentação executa duas pulsadas de impacto após o foco de dado e um único comando avança o turno. O bônus de dado adicional da arma é computado automaticamente na mesma ação, sem segunda solicitação manual.
- **OWNER_DECISION:** por falta de especificação definitiva, `combatActionRulesV05152.ts` usa **30% DO DANO PÓS-DEFESA EM CADA IMPACTO**, total alvo de 60%, com um mínimo de 1 de dano quando houver impacto. O proprietário deve decidir se era 30% em cada golpe OU 100% + 30% adicional; não canonizar o comportamento provisório.

O painel `ATAQUE` utiliza os mesmos cartões `SkillCard` das habilidades/magias, três quadrados em fila horizontal responsiva, com dano/dado/tooltips/ícones e recarga.

## Vitória, drops e recuperação

- Após derrota de todos os inimigos, área lateral `ALVO` vira `MOCHILA · PREPARAÇÃO`.
- Drops são agrupados por definição, destacados visualmente, com ícone, raridade, quantidade e indicador NOVO / NA MOCHILA.
- **Um** botão central `RECOLHER TODOS OS ESPÓLIOS` mantém a transação idempotente anterior.
- Antes ou depois da coleta, consumíveis restaurativos podem ser usados livremente entre ondas; cada clique consome uma unidade e recupera imediatamente o valor, limitado aos máximos. Não avança onda nem dispara IA.
- A transação pura `applyVictoryRecovery` atualiza `save.vitals` e `save.battle.combatants.combatant_player` em conjunto, e é persistida via `consumeVictoryItem` no Zustand.
- A onda seguinte é gerada a partir de `save.vitals`, preservando recuperação e progressão. O painel normal de alvo retorna quando há monstros.

## Protetor, Colar e Pulseira antes dos Vínculos

- Os três itens comerciais **Treino do Guarda — Tier I** podem ser equipados no personagem inicial, desde que cumpram os requisitos normais de nível/filiação.
- O slot `equippedGearStyles` é usado como camada **comercial temporária** mesmo quando o Bond está ausente; o save valida esse caso para `shield`, `necklace`, `bracelet` sem criar o Vínculo. Ao conquistar o Vínculo, a instância comercial continua ocupando o mesmo slot como revestimento.
- Arma vinculada continua necessária para um revestimento comercial de arma; armadura inicial segue `equippedBasicArmor` até sua vinculação.
- O registro e as imagens nunca determinam regras do equipamento. Os **1.400 IDs** seguem preservados.
- O cálculo do personagem usa ambos os atributos do item e o Grau G1–G3; Armadura básica aplica Defesa **uma vez só**, outros bônus são somados. O `commit` existente limita PV/PM atuais aos máximos derivados ao retirar equipamentos.
- Tooltip de mochila usa `previewCommercialEquip`: canal de compra, Tier, Grau, slot, requisitos, dois bônus, próxima melhoria e **delta derivado real** (ex.: Defesa 2 → 3) sem alterar o save. O Grid também descreve os bônus no hover.

## QA local sem Vercel

- `commercialGearPreviewV05152.test.ts`: comprados/equipados os 3 itens de treino citados, com save válido e sem Bond, verifica Defesa e Mana. Itera **1.400 SKUs** para detectar bônus que não mudam atributos.
- `combatFlowV05152.test.ts`: cura e Mana instantâneas, turno e RNG intactos, recusa consumível inútil, combate ofensivo separado, Duplo e Área com um dado, recuperação no estágio Victory e gasto atômico.
- Atualizadas as regressões antigas da poção gradual e do painel de drops.
- GitHub Actions `balance-draft-v05152.yml`: TypeScript, lint, unitários, integração de campanha, build, Playwright Chromium local. **Nenhum comando de deploy** nessa workflow.

## Itens ainda a confirmar

1. `OWNER_DECISION`: distribuição exata dos 30% do Ataque Duplo e seu mínimo por impacto.
2. `OWNER_DECISION`: manter, reduzir ou retirar cooldown das poções **no meio** do combate (fora do combate, entre ondas, não há recarga).
3. `OWNER_DECISION`: aprovar a camada de equipamentos comerciais temporários nos slots dos futuros Vínculos.
4. `OWNER_DECISION`: sprites finais do Ataque Duplo; há placeholder substituível via asset registry.
5. `BALANCE_DRAFT`: validar orçamento de ataque/defesa e monstros com teste manual antes do deploy.

**Não fazer merge, não publicar na Vercel e não converter hipóteses de balanceamento em canon automaticamente.**
