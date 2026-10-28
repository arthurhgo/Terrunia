# Manifesto de assets

O registro central fica em `src/assets/assetRegistry.ts`. Telas solicitam um `assetId`; o componente `AssetImage` resolve caminho, texto alternativo e fallback.

| Grupo | Estado | Local |
|---|---|---|
| Marca do Nexo | `VISUAL_DRAFT` vetorial | `public/assets/ui/terrunia-mark.svg` |
| Terrírian base | dois sprites neutros de 32×32 px, `VISUAL_DRAFT` | `public/assets/characters/terririan/` |
| Eldamar | placeholder substituível | `public/assets/placeholders/npc.svg` |
| Fungorro Rastejante, Semeador e Colosso Micélio | placeholders substituíveis | `public/assets/placeholders/enemy.svg` |
| Arma vinculada Grau I | ícone pixelado de 16×16 px, `VISUAL_DRAFT`; Graus II–III continuam placeholders | `public/assets/equipment/weapon/` |
| Cinco slots de Vínculo | prévias pixeladas de 16×16 px; não são equipamentos recebidos | `public/assets/equipment/slot-previews/` |
| Drops, Tônico, Fragmento Micelial, Joia e Registro | ícones pixelados de 16×16 px, `VISUAL_DRAFT` | `public/assets/items/` e `public/assets/gems/` |
| Referência visual | somente referência, não servida no jogo | `docs/reference/ui-terrunia-main-v0.4.png` |

Para trocar arte sem alterar telas, mantenha o mesmo `assetId` e atualize somente a entrada do registro. Assets ausentes caem em `placeholder.generic`.

A grade oficial de produção visual desta primeira rodada está documentada em `docs/PIXEL_ART_GUIDE_v0.1.md`. Nenhum sprite de prévia preenche o save inicial nem altera a lógica de gameplay.
