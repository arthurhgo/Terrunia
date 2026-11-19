# Terrúnia v0.6.1 — controles isométricos relativos à câmera

Correção isolada da movimentação manual, sem alteração do mundo e da gameplay v0.6.

- Setas, WASD e direcional visual passam a apontar para cima, baixo, esquerda e direita **na tela**, de acordo com a câmera isométrica fixa.
- O vetor de entrada é convertido para os eixos do terreno pela inversa da projeção isométrica `isometricGround`, já usada no clique para caminhar.
- Cidade de Terran e interiores compartilham a mesma convenção; combinações diagonais continuam possíveis e têm normalização de velocidade preexistente.
- O sprite acompanha a direção da tecla; movimentos automáticos por clique continuam usando os eixos originais do mundo.
- Não alterar coordenadas do mapa, Gaussian splat PSF, colisão, pathfinding, câmera, combate, NPCs, missões, equipamento, progresso ou saves.

Categoria: `VISUAL_DRAFT` (controle e apresentação). Escopo desta publicação: versão `0.6.1`.
