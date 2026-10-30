# Terrúnia — Verificação de estante e HUD v0.7

**VISUAL_DRAFT**. O HUD exibe ícones cinza vazios nos slots não vinculados, sem carregamento de sprites de itens; apenas a instância vinculada resolve uma imagem. O botão ATRIBUTOS recolhe/expande atributos, ataque e defesa, sem interferir em barras de recursos.

As quatro abas do lado esquerdo permanecem alinhadas à margem da gameplay e expandem para o espaço livre usando `align-items: flex-end`, inclusive quando o botão expandido é maior que o rail.

O Arsenal Visual e o manual de suporte ficam no móvel `eldamar_archive` da Casa de Eldamar. O atalho Arsenal foi retirado da navegação global, e o catálogo visual foi removido do painel Inventário. A rota histórica `/arsenal` continua existente para preservar compatibilidade de links e não apagar o simulador de fundações.

Não há mudança de save, de progressão, de Clã/Classe, nem novas regras canonizadas.