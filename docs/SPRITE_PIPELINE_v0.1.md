# Terrúnia — Pacote de sprites v0.1

**Status:** `VISUAL_DRAFT` · perspectiva 3/4 superior · grade nativa · PNG RGBA com transparência · nearest-neighbor.

## Arquivos indexados

| Família | Quantidade | Célula nativa | Uso |
| --- | ---: | ---: | --- |
| Itens e equipamentos | 48 | 16×16 | Ícones de inventário, sete Graus, cinco Vínculos, sete arquétipos de arma, doze conceitos de equipamento, dez Joias e duas Essências visuais |
| Inimigos | 2 | 32×32 | Rastejante Fungorro e Semeador de Esporos |
| Chefe | 1 | 48×48 | Colosso Micélio |
| NPCs | 18 | 32×32 | Retratos para diálogos em Terran; seis NPCs centrais e doze mestres de Classe |
| Terrírian | 2 | 32×32 | Aparência neutra e variação grafite |

**Total:** 71 sprites individuais nativos, 36 deles acrescentados nesta rodada; os 35 iniciais foram preservados, com a esmeralda atualizada para verde. As quatro armaduras antes representadas por desenhos repetidos agora têm arte individual.

## Contrato de integração Work

1. Ler `public/assets/manifests/terrunia-sprites-v0.1.json` para inventariar `assetId`, `path`, `family`, `width`, `height` e, quando presente, `atlas` com `x`, `y`, `width` e `height`.
2. O código React utiliza `src/assets/assetRegistry.ts` e `AssetImage`; **não inferir uma regra de gameplay a partir da arte**.
3. Para atlas, a coordenada `(x, y)` é o **pixel de origem** no PNG; não tem margem, borda ou espaçamento. Todas as células são quadradas.
4. Todos os nomes canônicos de conteúdo permanecem em `src/content/items.ts`, `gems.ts`, `enemies.ts` e `npcs.ts`. `npcDefinitions[].portraitAssetId`, `enemyDefinitions[].assetId`, `gemComponentDefinitions[].iconAssetId` e `itemDefinitions[].iconAssetId` correspondem ao `assetId` do índice.
5. Dois conceitos de Essência têm IDs de arte (`essence.fungal-weak`, `essence.mycelial`) e **não** são itens adicionais no inventário.
6. O `visualEquipmentCatalog` é uma vitrine de arte, **não um inventário**. Na versão 0.7, alguns `boundItemBaseDefinitions` reutilizam essas imagens por ID para representar armas e equipamentos válidos; a aquisição e os pré-requisitos continuam exclusivamente no domínio. Nenhum ícone vira loot nem substitui um Vínculo automaticamente.

## Evolução posterior

- Arte 16×16: redesenhar no mesmo canvas, sem alterar `assetId`.
- Monstros: cada encontro já tem arte de combate (`idle`); variantes `hurt`, `attack` e `dead` podem entrar em nova versão do índice sem interferir na máquina de combate.
- NPCs: retratos mantêm o cenário ativo, acompanhando os diálogos existentes; mais poses e expressões entram como novos assets, não novas entidades de conteúdo.
- A grade 3/4 superior é a referência de perspectiva, sem prometer spritesheet 4 direções (a movimentação atual possui renderização própria).

## Regenerar e conferir

```bash
python3 scripts/build_pixel_assets.py
npm run check
```

Pranchas ampliadas para aprovação (não usar como textura do jogo):
`docs/reference/terrunia-sprites-item-v0.1.png`, `terrunia-sprites-monster-v0.1.png` e `terrunia-sprites-npc-v0.1.png`.

Nenhuma regra de drop, Essência, dano, equipamento, Classe ou Clã foi modificada.
