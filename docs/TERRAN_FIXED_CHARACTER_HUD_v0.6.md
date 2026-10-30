# Terrúnia — HUD do personagem permanente, abas laterais v0.6
**29/10/2026 · UI/UX VISUAL_DRAFT**

## Design implementado
- Rail da esquerda: **Local**, **Inventário** (antiga Mochila), **Missões**, **Skill Tree** (antiga Evolução). Ícones compactos expandem ao hover/foco; têm labels ARIA.
- **Base removida do rail e de qualquer acesso direto por menu**. A Base permanece acessível manualmente por porta dentro do mundo, com cama e baú. Os painéis de serviço de cama/baú surgem apenas após as interações físicas.
- A aba Skill Tree abre a **tela própria `/skill-tree`**, mantendo ramos do Nexo, Clã, Classe e cinco Vínculos. A antiga árvore reduzida só para armas não substitui a tela completa.
- Gameplay pixelada permanece fixa no centro. Ao selecionar Local, Inventário ou Missões, surge um painel contextual sobre a esquerda do canvas, sem desmontar ou deslocar o cenário.
- HUD da direita fica **sempre visível durante a exploração**, inspirado na organização de RPGs pixel-art clássicos com molduras arcano-douradas.
- HUD exibe dados REAIS do save: retrato, nome, nível, Clã, Classe, Ouro, PV/MP, XP, Essência, pontos, cinco itens vinculados, atributos Astúcia/Agilidade/Força/Vigor/Espírito e ataque/defesa derivados.
- **Não adiciona STR/DEX/CON/SKL/INT** como atributos novos: a referência gráfica serve para organização visual, não para alterar cânone.
- Os slots mostram estados vazio/inicial e sprites substituíveis pelo assetRegistry, sem imagem controlando lógica.
- Layout mobile: para preservar leitura, a coluna do personagem passa abaixo do canvas; na tela ampla permanece permanentemente à direita.
- Sem alteração no save v11, regras de progressão, combate ou drops.

## Validação de regressão
Testes de interface verificam o rail com quatro botões, ausência de Base no menu, permanência do HUD ao abrir drawers e navegação separada para Skill Tree. Teste de dados modifica PV/Ouro e confirma atualização reativa do HUD.
