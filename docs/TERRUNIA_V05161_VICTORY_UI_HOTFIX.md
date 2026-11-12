# Terrúnia v0.5.16.1 — hotfix da interface pós-vitória

**Status:** UX_DRAFT / HOTFIX_UI. A master spec v0.4 segue como autoridade. Nenhuma regra nova de gameplay.

## Regressão
O resumo estendido de recompensas da v0.5.16 ocupa a coluna central e os controles inferiores de vitória deixam de ficar visíveis em viewports baixos, bloqueando continuidade e retorno.

## Alteração
- Ações de **recolher os espólios, continuar expedição, próxima onda e retornar** foram deslocadas para a aba **Próximos passos**, padrão, no painel direito.
- A aba **Mochila · Poções** mantém drops e recuperação manual, com botão de voltar aos próximos passos.
- Lembrete explícito de recuperação **opcional** na aba de saída. Abrir a mochila e a aba não consome suprimentos.
- Os botões de saída ficam em seção separada da descrição rolável. Em tela estreita, o layout continua navegável.
- Destinos especiais de Clã, Portal e dungeon são preservados.
- A coleta de loot continua exigida pelo motor antes da continuidade, sem bypass.
- Não há mudança no motor de combate, drops, recompensas, save, Clã, Classe ou equipamentos vinculados.

## QA
- Vitest: abas, controle de coleta, retorno e ondas, não consumo automático, consumo explícito da poção.
- Playwright: fluxo de campanha, saída dentro do viewport antes e depois de visitar a aba Mochila.
- CI: TypeScript, lint, build e suite.

**Pendência:** conferir manualmente a altura de viewport ilustrada pelo screenshot original e revisar arte final em v0.6.0.
