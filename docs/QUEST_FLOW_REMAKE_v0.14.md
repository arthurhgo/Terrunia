# TERRÚNIA — Missões, reutilização de itens e painel lateral v0.14

Data: 2026-11-03. Branch: `feature/quest-progression-left-panel-v014`.

## Objetivo e precedência

Este ajuste refina o fluxo de onboarding, sem substituir as regras da `TERRUNIA_GAME_APP_MASTER_SPEC_v0.4.md`, seção 0B. Personagem, cinco Vínculos permanentes, barra de Essência, Pontos de Essência e save local/cloud permanecem inalterados. Valores econômicos e textos são `BALANCE_DRAFT`/`CONTENT_DRAFT`; os valores definitivos são `OWNER_DECISION`.

## Progressão simplificada (três lições obrigatórias)

1. **Uma Primeira Proteção**: Rosetta entrega duas túnicas; o jogador escolhe e equipa uma. Ao entregar, recebe 70 Ouro e 10 XP.
2. **Comprar para se Preparar**: comprar um Tônico com Neris por 18 Ouro; entregar a Rosetta.
3. **O Primeiro Aprimoramento**: Rosetta entrega Linha de Linho; Durnan reforça qualquer proteção simples por 8 Ouro, mantendo a túnica escolhida. A entrega concede 20 XP e 10 Ouro.

**Proteção para a Estrada** (`rosetta_tutorial_armor`) mantém seu ID, objetivos, progresso e recompensas, mas passa a ser uma missão secundária **opcional**, nunca pré-requisito para reforjar a túnica. Assim, o jogador pode optar pela Armadura de Couro Simples (+2 Defesa) sem ser obrigado a descartar a escolha inicial. Missões já aceitas/concluídas e itens já comprados não são reiniciados.

## Destino para itens excedentes

- Túnica de Linho Gasta e Túnica de Aprendiz extras: 8 Essência bruta **ou** 3 Ouro, sempre com ação explícita em Lorian/Feril.
- Armadura de Couro Simples extra: 16 Essência bruta **ou** 9 Ouro.
- Valores provisórios ficam abaixo dos respectivos preços de compra, prevenindo arbitragem de compra/revenda.
- Proteção atualmente vestida não pode ser vendida nem convertida; precisa ser retirada primeiro. Itens favoritos, travados e componentes protegidos seguem as regras preexistentes.
- Os cinco Vínculos não são vendidos, convertidos ou substituídos; as peças simples só ocupam temporariamente o eixo Armadura antes do Vínculo permanente.

## UX do painel à esquerda / Registro de Missões

- Card de **Próximo passo** com título, objetivo e NPC/localização. O mesmo ranqueamento é lido por diário, Rosetta e orientação da cidade.
- Ação prioritária: **pronta para entrega → em andamento → disponível**, com prioridade interna por **principal, Clã, Classe, secundária, contrato**; rastreamento desempata. Não altera o status do save.
- Missão prioritária identificada visualmente; a lista compacta mostra título, estado e contagem. Recompensas e objetivos completos ficam na expansão, reduzindo ruído.
- Entregas de materiais apresentam quantidade na mochila contra quantidade exigida.
- Painéis abrem com rolagem no topo; filtros e textos longos não cortam o layout lateral. Histórico de concluídas continua recolhido.
- A mochila informa finalidade dos materiais e contratos ativos, para evitar descarte inadvertido.

## Compatibilidade

Nenhum campo novo foi adicionado ao save; o schema permanece 15. Na validação de um save existente, requisitos já satisfeitos são reavaliados e missões agora elegíveis mudam apenas de `locked` para `available`, sem mexer em recompensas, equipamentos, moedas, quest progress ou objetivos já aceitos. Nenhuma compra ou entrega é realizada automaticamente.

## Validação e limite

Testes de regressão adicionados para: concluir três lições com a túnica original, proteção contra descarte equipado, obtenção de Essência/Ouro de peças reserva e retomada de campanha com a missão do couro pendente. A validação de CI deve executar `npm run check`. E2E atualizado para percorrer a nova rota sem comprar couro.

**Não incluído:** rebalancear todas as campanhas e drops após Astravél; reorganização ampla de missões principais futuras; decisão definitiva da economia. Esses temas precisam de avaliação específica antes de alterar o cânone.
