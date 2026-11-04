# Terrúnia v0.5.1 — UX de Missões e NPCs

Status: **Implementação em PR #50 — ainda não publicada na `main`**.

## Mudanças de interface

- A coluna esquerda mostra exclusivamente missões aceitas, em progresso e prontas para entrega; concluídas ficam recolhidas. Ofertas `available` e `offered` não aparecem no diário.
- As seções permanecem visíveis com linhas horizontais e placeholders cinzas quando não existem missões.
- Na criação, a indicação **01 · Falar com Rosetta** é um passo de onboarding visual, não um novo objeto de missão no save. Ao aceitar a primeira lição existente da Rosetta, o quadro passa a listar a missão real.
- O diário completo também mostra categorias vazias em linhas cinzas e não sugere uma oferta disponível como missão atual.
- Todas as janelas baseadas em `DialogueWindow` usam geometria consistente: centro da tela, largura máx. 860px, altura até 620px ou viewport, área interna rolável.
- As escolhas do diálogo estão ocultas até o jogador abrir o botão **Responder**; após escolher, o painel recolhe e mantém foco no texto seguinte. Navegação por teclado e redução de espaço preservadas.
- O botão **Mochila** fica no canto inferior direito da área de exploração, abrindo o inventário acima dele sem ocupar o diário.

## Rastreio e canon

- A prévia da Rosetta aponta em **branco** apenas para NPCs com ofertas elegíveis ainda não aceitas (`available` ou `offered`). Mantém a origem na Rosetta, tanto ao passar o cursor quanto ao fixar a exibição.
- Os trajetos rastreados pelo diário mantêm os estados aprovados: dourado/azul para progresso, verde fluorescente para entrega. A prévia branca tem prioridade enquanto a indicação de Rosetta está ativada.
- Não são criadas quests novas, não são liberados requisitos ocultos, não existem ajustes de recompensa/atributo, nem migração de schema.
- As lições do tutorial já existentes permanecem `rosetta_tutorial_equip`, `rosetta_tutorial_supply`, `rosetta_tutorial_refine`; o texto inicial não altera a autoridade desses IDs.
- **OWNER_DECISION:** caso o passo “Falar com Rosetta” deva virar uma missão real persistida, especificar ID, gatilhos e efeitos em documento canônico futuro. Até lá é indicação de UX.

## Validação

- Testes de respostas retráteis; troca de falas; janela de missão; ofertas brancas sem misturar tarefas aceitas; linhas vazias, histórico e intro de Rosetta.
- GitHub Actions: `npm run check` (TypeScript, testes automatizados e build).
- Testes manuais recomendados: 1366×768, 1920×1080 e viewport móvel; páginas de Rosetta e NPCs com múltiplas opções; navegação por teclado; abertura da mochila; entrega verde e ofertas brancas.
- Publicação: somente após CI e aceite do responsável.
