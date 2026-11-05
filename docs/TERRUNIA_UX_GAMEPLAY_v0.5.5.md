# Terrúnia v0.5.5 — Consistência visual e combate cinematográfico

Status: PR #54 em validação; não declarar publicação antes de merge e Vercel READY.

## Autoridade e canon
Complementa a especificação técnica atual TERRUNIA_GAME_APP_MASTER_SPEC_v0.4.md. Não altera Clã, Classe, progressão de itens vinculados, atributos, dados ou fórmulas do motor de combate.

## Personagem
- Sprite procedural **32×32**, base visual de proporções NPC, com tonalidade/shading de pele, roupas, cabelos, detalhes faciais e silhuetas.
- Gera spritesheet **128×128**, quatro direções (baixo, esquerda, direita, cima), passos sincronizados à estrutura já aceita por `drawActorImage`.
- A única fonte visual é `character.appearance?` com fallback do `assetRegistry` em saves legados. Para futuros artistas, todos os componentes continuam substituíveis via registro de assets.
- O criador permite prévias de frente, costas e lados, além de close de rosto na mesma direção artística do personagem jogável.
- Uso integrado nos ambientes: cidade Terran, interiores de casas, Astravél, Câmaras Fúngicas, prólogo, batalha, derrota e historinhas/cutscenes.
- Cores, sexo/apresentação, corpo, cabelo, rosto e roupas são estritamente cosméticos.

## Linha do tempo de combate
- Somente retratos/cabeças de cada ator, com pequenos números de resultado real da iniciativa. Sem textos extensos e sem sequência de eventos visíveis.
- A ordem vem de `battle.initiativeOrder`, destaques de turno de `actorId` e `actorCursor`, e falecimento de `alive`.
- Até rolar a iniciativa, não são mostrados valores. Nomes e números permanecem disponíveis no hover e na acessibilidade.
- Os anúncios de rodada `TURNO N` continuam discretos, com numeração derivada de `battle.round`.

## Dados e animação
- Removida a janela visual de dados. `BattleDicePlatform` ocupa apenas a arena com uma camada de esmaecimento.
- Durante a ação, o jogador arrasta o dado verticalmente e solta na barra `ESCOLHA SUA AÇÃO` (alternativa de teclado preservada).
- Dado voa da região inferior de ações e cai no meio da arena; rosto e nome do combatente identificam quem está rolando.
- A animação mostra faces/resultados **calculados pelo motor** e apenas após o efeito de lançamento.
- Golpes, ataques inimigos, efeitos físicos/arcanos, iluminação de impacto e animações de morte são apresentação CSS temporária, sem alterar estado/matemática do jogo.
- O log real do motor segue acessível no painel ALVO quando o jogador o abre.

## QA
- Checar continuidade visual em todas as cenas, em todos os quatro sentidos, incluindo visitas às casas e cutscenes.
- Checar 32×32 da figura, 128×128 do sheet, e escala igual aos NPCs.
- Verificar click/tap isolado não rola, arraste para cima solta, resultado não é aplicado antes do final da animação.
- Conferir turnos, múltiplos monstros, ações de consumíveis e skills, mortes, loot e saves antigos.

## OWNER_DECISION
- Animações finais por arma e por tipo de monstro (spritesheets exclusivas), bem como imagens substitutas desenhadas manualmente, dependem de assets futuros. Não são transformadas silenciosamente em canon.
- Valores e fórmula da iniciativa, dano da face do dado e efeitos de classe/clã permanecem como na versão anterior.
