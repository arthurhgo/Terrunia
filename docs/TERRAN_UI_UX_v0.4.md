# Terrúnia — Ajustes UI/UX de Terran v0.4
**VISUAL_DRAFT · 29/10/2026**

## Nova interface
- Menu de navegação em faixa própria (fora do canvas), com cinco ícones compactos. Ao passar o mouse ou usar foco por teclado, a aba expande e revela o texto. Em telas sensíveis ao toque o rótulo permanece acessível por título e ARIA.
- O aviso inferior “Você está em...” foi removido do cenário. A localização continua identificada no cabeçalho.
- Cena e painel contextual utilizam colunas próximas, com intervalo de 4px e bordas alinhadas. Em telas estreitas o painel mantém comportamento sobreposto.
- A preferência de movimento reduzido desativa as transições de expansão.

## Interiores
As **seis instituições oficiais** e a residência particular possuem plantas e proporções próprias: arquivo estreito para Eldamar, posto aberto para Vorren, oficina ampla, quartel em cruz, salão cerimonial, Casa de Daeryn com alas e residência compacta. Posições de portas, spawn, obstáculos e NPCs vêm de roomGeometry.ts, independentemente das imagens; móveis vinculados por ID e pontos em roomContent.ts.

## Invariantes
- Não cria nem remove missões, Clãs, Classes, equipamentos ou pontos de Essência.
- Não altera o schema de save, mundos, lojas ou comportamento de combate.
- Todos os interiores continuam na mesma rota e usam o registro de NPCs existente.
- roomGeometry.test.ts verifica acessibilidade e rota dos pontos interativos.

## OWNER_DECISION
Arte definitiva e sprites de móveis (atualmente VISUAL_DRAFT), caminhos de fuga, eventuais salas adicionais e expansão do espaço pessoal.