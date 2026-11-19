# Terrúnia v0.6 — versão isométrica publicada

A apresentação de referência é a versão 2 de Terrúnia — Teste 3D, commit de origem `2648a8e950b836d1c75d032561e70ecf0f5dac90`. A decisão do criador de 2026-11-19 substitui a experiência 2D e o modo CSS experimental da PR #85 pela gameplay desse teste em `/play`.

## Conteúdo integrado

- Cidade do Gaussian Splash Studio: `public/assets/terran/cidade-de-terran.psf`, 184.626 pontos, 3.692.560 bytes, servida pelo próprio jogo.
- Projeção isométrica ortográfica, câmera de seguimento, profundidade e oclusão dos atores. O PSF é rasterizado uma vez em buffers de cor e profundidade; o desenho usa Canvas, como na versão de referência.
- Interiores isométricos derivados das plantas e móveis existentes, com NPCs, cama, baú, serviços e saídas.
- Dados de combate d4, d6, d8, d10 e d12 com geometria própria; faces de ataque, bônus, defesa e contra-ataque fornecidas pelo motor.
- Controles, colisões, pathfinding, Diário, diálogos, lojas, progressão e autenticação do jogo existente.
- Campos opcionais de rolagens no schema do save, mantendo a leitura de saves históricos.

## Acesso

`/play` abre a cidade 3D por padrão, inclusive em sessões que usaram preferências antigas. Não há alternância para 2D. A cidade mostra um estado de carregamento e permite recarregar se o arquivo não for carregado; não desenha a cidade antiga como fallback. Os interiores usam a mesma apresentação isométrica.

A rota de laboratório `/visual-v06` e os componentes CSS experimentais foram retirados do fluxo publicado. Os arquivos de domínio e a documentação histórica permanecem preservados. A exploração externa e a arena mantêm o comportamento visual da versão de referência; esta publicação não cria novos mapas para esses lugares.

## Canon e limites

A decisão trata da apresentação visual. Não altera custos, recompensas, Clã, Classe, sete Graus ou regras dos cinco Vínculos. Formas, iluminação, proporções e coordenadas continuam `VISUAL_DRAFT`. O mapa é um asset substituível pelo registro central; a lógica não depende da imagem.

A flag `VITE_TERRAN_3D_REVIEW` não é necessária para habilitar a cidade 3D na Vercel. As configurações Firebase existentes continuam sendo usadas.
