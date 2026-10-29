# Assets substituíveis

Os SVGs deste diretório são placeholders `VISUAL_DRAFT`. A interface consome IDs de `src/assets/assetRegistry.ts`; substitua caminhos no registro em vez de acoplar arquivos diretamente aos componentes.

## Índice de sprites v0.1

O arquivo [`manifests/terrunia-sprites-v0.1.json`](manifests/terrunia-sprites-v0.1.json)
é a **lista descoberta pelo Work**: cada entrada declara `assetId`, caminho absoluto público,
família (`item`, `monster`, `npc`, `player`), dimensões e coordenadas de atlas (quando existe).

- `item`: ícones 16×16; inclui loot, consumíveis, Joias, Essências, equipamentos, cinco prévias e sete Graus. Quatro armaduras da v0.7 receberam artes próprias.
- `monster`: inimigos 32×32; chefes 48×48.
- `npc`: retratos 32×32 para diálogos sem troca de cenário.
- `player`: retratos 32×32 do Terrírian inicial.

Para uso direto no React, **prefira `AssetImage assetId="..."`**: resolve o registro, amplia com
`image-rendering: pixelated` e troca pela imagem fallback quando o arquivo não existir.
Os atlas são opcionais, já montados em grade sem antialiasing:

- `atlas/terrunia-item-v0.1.png`: células 16×16.
- `atlas/terrunia-npc-v0.1.png`: células 32×32.

Geração determinística: `python3 scripts/build_pixel_assets.py` (requer Pillow).
As imagens e índices são estudos `VISUAL_DRAFT`; nenhum sprite cria, equipa ou desbloqueia itens.
As mecânicas e IDs de conteúdo continuam em `src/content/`, separados da arte.
