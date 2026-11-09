# Terrúnia v0.5.13.1 — hotfix de habilidades e acesso às Câmaras

## Problemas reproduzidos
1. Submenu de Habilidades exibindo cabeçalho duplicado e cards cortados em painel de pouca altura. A sobreposição anterior reservava espaço extra e ativava a barra vertical.
2. Ao retornar pelo Portal, a localização salva pode estar em `astravel_entry`, enquanto a etapa 15/15 permanece liberada. `enterDungeon` aceitava somente dois IDs físicos e bloqueava a entrada legítima.

## Alterações
- Grade de cards quadrados em viewport fixo da ação, sem barra de rolagem, preenchimento por quantidade, limite responsivo por linhas/colunas e botão Voltar à direita. Não muda dano, cooldown ou ativos.
- `enterDungeon` aceita nó de origem pertencente à trilha de Astravél configurada, somente quando o marco do chefe já está `bossCurrent` ou `completed`. O `gameStore` passa a trilha como parâmetro explícito.
- Reentrada de outras regiões e de Terran continua bloqueada.
- Save schema, marcadores, inventário, recompensas e progressão não são alterados; não precisa reiniciar campanha.

## Validação
- Unitário: bloqueio fora de Astravél, retorno pelo Portal e fluxo de UI.
- Navegador: geometria quadrada, zero scroll no seletor de habilidades e entrada real nas Câmaras via etapa 15/15.
- CI: `npm run check` e Playwright.

## OWNER_DECISION
Ajuste final do tamanho artístico dos sprites de habilidade para futuros breakpoints permanece refinável, sem afetar a correção.
