# Manifesto de assets

O registro central fica em `src/assets/assetRegistry.ts`. Telas solicitam um `assetId`; o componente `AssetImage` resolve caminho, texto alternativo e fallback.

| Grupo | Estado | Local |
|---|---|---|
| Marca do Nexo | `VISUAL_DRAFT` vetorial | `public/assets/ui/terrunia-mark.svg` |
| Retratos do jogador | placeholders substituíveis | `public/assets/placeholders/character*.svg` |
| Eldamar | placeholder substituível | `public/assets/placeholders/npc.svg` |
| Fungorro Rastejante, Semeador e Colosso Micélio | placeholders substituíveis | `public/assets/placeholders/enemy.svg` |
| Arma vinculada Graus I–II | placeholders substituíveis | `public/assets/placeholders/weapon.svg` |
| Drops, Tônico e Fragmento Micelial | placeholders substituíveis | `public/assets/placeholders/item.svg` |
| Referência visual | somente referência, não servida no jogo | `docs/reference/ui-terrunia-main-v0.4.png` |

Para trocar arte sem alterar telas, mantenha o mesmo `assetId` e atualize somente a entrada do registro. Assets ausentes caem em `placeholder.generic`.
