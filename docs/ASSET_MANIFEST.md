# Manifesto de assets

O registro central fica em `src/assets/assetRegistry.ts`. Telas solicitam um `assetId`; o componente `AssetImage` resolve caminho, texto alternativo e fallback.

Atualização v0.11: o manifest pixelado inclui 129 entradas (66 itens, 10 monstros, 51 NPCs e 2 aparências de jogador). `item.echo-fragment` é um novo cristal violeta nativo 16×16 para contratos comerciais. Os 51 NPCs mantêm os PNGs de 32×32 compartilhados com os retratos e são desenhados no mundo com 28 px; a escala não altera os arquivos-fonte. A tabela abaixo registra a base histórica inicial.

| Grupo | Estado | Local |
|---|---|---|
| Marca do Nexo | `VISUAL_DRAFT` vetorial | `public/assets/ui/terrunia-mark.svg` |
| Terrírian base | dois sprites neutros de 32×32 px, `VISUAL_DRAFT` | `public/assets/characters/terririan/` |
| Eldamar | placeholder substituível | `public/assets/placeholders/npc.svg` |
| Fungorro Rastejante, Semeador e Colosso Micélio | placeholders substituíveis | `public/assets/placeholders/enemy.svg` |
| Arma do prólogo, Graus I–VII | sete sprites nativos de 16×16 px, `VISUAL_DRAFT`, progressão da mesma peça | `public/assets/equipment/weapon/weapon_prologue_g*.png` |
| Catálogo de equipamentos | 15 sprites nativos de 16×16 px; 7 armas do manual e 8 conceitos visuais sem gameplay | `public/assets/equipment/catalog/` |
| Cinco slots de Vínculo | prévias pixeladas de 16×16 px; não são equipamentos recebidos | `public/assets/equipment/slot-previews/` |
| Drops, Tônico, Fragmento Micelial, Joia e Registro | ícones pixelados de 16×16 px, `VISUAL_DRAFT` | `public/assets/items/` e `public/assets/gems/` |
| Referência visual | somente referência, não servida no jogo | `docs/reference/ui-terrunia-main-v0.4.png` |

Para trocar arte sem alterar telas, mantenha o mesmo `assetId` e atualize somente a entrada do registro. Assets ausentes caem em `placeholder.generic`.

A grade oficial de produção visual desta primeira rodada está documentada em `docs/PIXEL_ART_GUIDE_v0.1.md`. Nenhum sprite de prévia preenche o save inicial nem altera a lógica de gameplay.

O catálogo da nova rota `/inventory` usa metadados em `src/content/visualEquipment.ts` e está documentado em `docs/PIXEL_INVENTORY_v0.2.md`. Prancha de revisão: `docs/reference/terrunia-inventory-pixel-v0.2.png`.
