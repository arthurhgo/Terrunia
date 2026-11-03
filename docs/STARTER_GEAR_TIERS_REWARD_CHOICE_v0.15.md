# Terrúnia v0.15 — escolha de proteção inicial, tiers e mochila de seleção única

Data: 2026-11-03. Base: `TERRUNIA_GAME_APP_MASTER_SPEC_v0.4.md`. Este documento registra um **CONTENT_DRAFT / BALANCE_DRAFT** solicitado pelo criador, sem alterar os cinco Vínculos permanentes.

## Princípio de cânone
Tiers dizem respeito exclusivamente às **proteções simples temporárias** da mochila. Não substituem os **sete Graus** dos cinco itens vinculados (arma, escudo/protetor arcano, armadura, colar, pulseira), nem concedem pontos de Essência diretamente.

## Primeira missão de Rosetta: escolher uma única recompensa

1. Rosetta oferece **Uma Primeira Proteção**. Aceitar a missão **não** entrega nenhum equipamento.
2. O objetivo é visitar o Mercado de Terran; o jogo reconhece a visita, inclusive quando ocorreu antes do aceite.
3. Ao retornar à Praça do Portal com o objetivo completo, a interface exibe uma escolha **exclusiva** de três proteções Tier I. O botão de concluir permanece desabilitado sem escolha.
4. Uma única peça é adicionada à mochila **no mesmo evento atômico** de pagamento da missão. A escolha não é entregue novamente ao reler o save, conversar ou repetir o clique.
5. **Comprar para se Preparar** ensina a equipar o item escolhido e comprar o Tônico de Campo com Neris.
6. **O Primeiro Aprimoramento** fornece uma Linha de Linho e ensina a reforçar a própria peça em Durnan. Comprar couro não é obrigatório.

## Tiers e opções de entrada — proposta parametrizável

| Tier | Item | Defesa base | Iniciativa | Aquisição |
|---|---|---:|---:|---|
| I | Túnica de Linho Gasta | +1 | 0 | Escolha inicial ou compra |
| I | Túnica de Aprendiz | 0 | +1 | Escolha inicial ou compra |
| I | Gibão de Couro Leve | +2 | -1 | Escolha inicial ou compra |
| II | Armadura de Couro Simples | +2 | 0 | Neris, após **O Primeiro Aprimoramento** |
| III | Cota de Guarda de Terran | +3 | -1 | Neris, após **Caçadores Perdidos** |
| IV–V | A definir | — | — | **OWNER_DECISION**, ainda não disponíveis |

O tier é uma propriedade do item-base no catálogo, e o refinamento (`+1`) é uma melhoria independente da instância. Nenhuma imagem define status ou requisito. Novos sprites podem ser adicionados manualmente por ID; Gibão e Cota usam temporariamente o sprite do couro (`VISUAL_DRAFT`).

## Rebalanceamento provisório

| Missão | XP | Ouro | Outros |
|---|---:|---:|---|
| Uma Primeira Proteção | 5 | 32 | Escolher **1 proteção Tier I** |
| Comprar para se Preparar | 5 | 0 | Aprender a equipar e comprar |
| O Primeiro Aprimoramento | 10 | 5 | Linha de Linho ao aceitar |
| Proteção para a Estrada (opcional) | 5 | 4 | Acesso após reforço |

O Ouro inicial é suficiente para um Tônico (18) e um reforço (8), restando 11 ao finalizar as três missões essenciais. Preços, atributos e todos os tiers superiores são `BALANCE_DRAFT`, sujeitos a `OWNER_DECISION`.

## Mochila e UX/UI

- **Uma única seleção ativa** em qualquer modo, inclusive venda e conversão. Clique no mesmo item para limpar a seleção.
- Mouse hover e foco de teclado exibem uma **janela flutuante** com nome, Tier, raridade/categoria, defesa, iniciativa, refinamento, descrição, condição de uso e valores de Ouro/Essência.
- **Equipar / Retirar proteção** permanece ação explícita no painel do item escolhido, bloqueada em batalha ou quando já há Vínculo de Armadura.
- A janela flutuante usa portal para não ser cortada pela rolagem da aba esquerda. No celular, tocar no item mantém acesso aos detalhes e botão Equipar.
- Venda e conversão atuam sobre **um único item** por vez; a proteção equipada, favorita ou protegida não pode ser descartada.

## Migração e compatibilidade

Save schema **15 → 16**, app **0.15.0**. A migração preserva armas/itens vinculados, Ouro, Essência, inventário e histórico:
- missões concluídas não são reabertas;
- missões de Rosetta em andamento mantêm progresso antigo; o antigo objetivo de vestir uma túnica ou visita já registrada torna a primeira missão elegível para entrega;
- equipamentos que os jogadores receberam em versões anteriores não são apagados;
- nenhum item da escolha nova é concedido automaticamente a saves antigos;
- a missão opcional do couro, se já ativa ou concluída, mantém seu estado.

## Validação

`npm run check`: lint, typecheck, testes unitários e build. Regressões específicas cobrem escolha exclusiva, conclusão única, bloqueios de tiers, seleção única, tooltip e retomada de saves. E2E de Rosetta foi adaptado, mas requer execução separada via Playwright.

## OWNER_DECISION para expansão

- Quantidades e nomes canônicos dos tiers IV/V.
- Árvore de upgrades dos itens simples, limites de refinamento por Tier e sua transição para o Vínculo permanente.
- Arte final e identidade visual própria de Gibão, Cota e equipamentos superiores.
