# Terrúnia — Estante dos Registros de Eldamar e HUD v0.7
**30/10/2026 · VISUAL_DRAFT**

## Interface do personagem
- Um espaço de Vínculo vazio mostra apenas ícone neutro cinza: nenhuma imagem de item é renderizada até existir uma instância vinculada com definição válida.
- Um espaço ocupado mostra o sprite real de seu Grau, usando o assetRegistry; os cinco slots permanentes não são alterados.
- A seção **ATRIBUTOS** do HUD à direita pode ser expandida ou recolhida por botão acessível `aria-expanded`, sem afetar Vida, Mana, XP, Essência ou Vínculos.

## Abas laterais
- Abas à esquerda expandem **para a área vazia à esquerda**, com `align-items: flex-end` e alinhamento do botão à borda direita do rail, inclusive quando sua largura ultrapassa a largura da faixa.
- Nenhum hover amplia o botão sobre o mapa. Em telas pequenas, rótulos continuam acessíveis por nome e teclado.

## Registros físicos de Eldamar
- A **Estante dos Registros** é um objeto do interior da Casa de Eldamar com ID estável `eldamar_archive`, visual próprio de livros e interação via clique/caminhada ou E.
- Abre o **Arquivo de Eldamar** com três capítulos: Guia do Viajante, Arsenal Visual (antes misturado no Inventário) e Fundamentos dos Vínculos.
- O Arsenal Visual foi retirado do painel de Inventário e o atalho para Arsenal foi removido da navegação global. A rota antiga continua disponível para compatibilidade, mas o acesso aos materiais visuais e guias no fluxo normal é pela estante.
- Suporte documental (movimentação, progressão, Essência, itens, combate, Base, salvamento) concentrado no Guia da estante. Informações funcionais necessárias para jogar continuam visíveis em menus operacionais.
- Todos os capítulos são **consultivos**, sem modificar save, conceder itens, liberar progressão ou transformar conceitos visuais em cânone.

## OWNER_DECISION
Conteúdo final do manual/lore, texturas e sprites definitivos da estante; nenhuma mecânica nova foi criada.
