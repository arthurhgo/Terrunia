# TERRÚNIA — v0.5.15.3 · Market Specialists & Rosetta UX

**Status:** implementado em branch isolada. Não integrado à `main`; não publicado.
**Branch:** `fix/v0.5.15.3-terran-market-specialists`
**Autoridade:** `TERRUNIA_GAME_APP_MASTER_SPEC_v0.4.md`, com o cânon dos cinco Vínculos permanentes preservado.

## Problema e arquitetura

A v0.5.15.2 exibiu no Mercado um navegador de conjuntos genéricos de dez peças, repetido com a antiga loja individual. O Tônico usado na missão `rosetta_tutorial_supply` estava vendido por Edran apesar do texto mandar procurar Neris. Assim, o jogador não reconhecia o caminho do tutorial.

A v0.5.15.3 divide os **120 SKUs comuns Tier I/G1** entre três especialistas, mantendo os IDs, atributos, categorias e preços do catálogo, sem exigir afiliação ou Classe. A arte de itens é resolvida pelo `assetRegistry`. **Não existe troca de Vínculo permanente**: são acessórios, armaduras iniciais ou revestimentos comerciais já previstos.

| Vendedor | Presença / NPC | Estoque |
|---|---|---|
| Neris | `presence_neris` / `npc_neris` | Consumíveis apenas (Tônico, Poção, Compressa, Éter, Antídoto, Essência Vital, Frasco de Ressonância) |
| Armeiro de Terran | `presence_terran_weaponsmith` / `npc_terran_weaponsmith` | **12** revestimentos de armas Tier I/G1 |
| Armadureiro de Terran | `presence_terran_armorer` / `npc_terran_armorer` | **60** equipamentos comuns: armadura, escudo, capacete, calças e botas; mais três peças básicas legadas |
| Artesão de Acessórios | `presence_terran_accessory_artisan` / `npc_terran_accessory_artisan` | **48** colares, pulseiras e acessórios I/II |
| Edran | `presence_edran` | Mochilas e material utilitário `material_linen_thread` |
| Valmira | `presence_valmira` | Componentes, fragmentos, gemas e runa de proteção |

**Preços preservados:** Tônico 18, Poção Restauradora 28, Compressa 8, Essência Vital 26, Frasco de Ressonância 24, Túnica de Linho 22, Túnica de Aprendiz 28, Gibão de Couro Leve 25 Ouro.

**OWNER_DECISION / BALANCE_DRAFT:** preço de Éter Simples (18) e Antídoto (16) adotado provisoriamente para viabilizar loja com todas as funções de recuperação. Ajustável apenas no catálogo; não é cânon de economia.

**OWNER_DECISION / CONTENT_DRAFT:** os três NPCs aparecem sob nomes **funcionais**, sem biografias/nome próprio canônico. Têm retratos únicos em `public/assets/npcs/market_*.svg`, substituíveis por sprites definitivos via `npcVisuals.json`/assetRegistry, sem alterar IDs, gameplay ou saves.

## UI, UX e economia

- Um **NPC por categoria**. Não há botão para comprar kit; cada mercador vende peças avulsas em cards horizontais com sprite pixelado, nome, Tier, Grau, função, bônus real e preço em Ouro.
- Filtros por **nome/descrição de status, slot, atributo**; a categoria é determinada pelo NPC.
- Cores semânticas: **consumíveis turquesa**, **armaduras azul-aço**, **armas bronze**, **acessórios violeta**.
- Hover/foco exibe bônus G1–G3, comparação real antes/depois, bloqueio e memória de Vínculos preservados.
- O domínio `checkGearAccess` autoriza apenas oferta `PUBLIC_TERRAN` Tier I do **NPC exato para seu slot**. Neris e mercadores de castelo não conseguem burlar a separação. Regras de Clã e Classe continuam exclusivas aos castelos.
- `buyMarketItem` valida itens antigos e consumíveis por NPC, local, estoque, Ouro e transação; `purchaseGear` gerencia os 120 SKUs em peças individuais.
- A interface original de conjuntos do componente `GearShopV0515` permanece exclusiva para castelos; o acesso de Neris ao antigo menu é recusado, inclusive por chamada direta.

## Rosetta: missões e migração

Os **IDs antigos foram preservados**:
- `rosetta_tutorial_equip`: visitar Mercado, voltar a Rosetta e escolher **uma** das três proteções, não duas túnicas automaticamente.
- `rosetta_tutorial_supply`: equipar a proteção, comprar `consumable_minor_tonic` de **Neris por 18 Ouro**, voltar para entregar; o item fica na mochila.
- `rosetta_tutorial_refine`: receber Linha de Linho e aprimorar a proteção com Durnan por 8 Ouro.
- `rosetta_tutorial_armor`: opcional; comprar `equipment_light_leather_vest` com o **Armadureiro**, equipar, concluir na Rosetta.

Nova missão secundária `rosetta_tutorial_market_specialists` (**CONTENT_DRAFT**, sem Ouro/XP):
- Após `rosetta_tutorial_supply`, Rosetta apresenta os ofícios do Mercado.
- Objetivos são conversar com `npc_terran_weaponsmith`, `npc_terran_armorer` e `npc_terran_accessory_artisan`, em qualquer ordem, sem comprar nada.
- O gameplay registra `MarketSpecialistTalk:<npcId>` após interação real; ações anteriores à aceitação são reconciliadas em `refreshTutorialQuestProgress`. A missão fica pronta e é entregue somente à Rosetta. Sem filiação, Vínculos gratuitos ou efeitos narrativos desconhecidos.
- A orientação rastreada da Rosetta aponta a **Neris para Tônico** e ao **Armadureiro para Gibão**; a missão opcional aponta ao NPC que falta conversar.
- Compras antigas registradas como `MarketPurchase:presence_edran:consumable_minor_tonic` e `MarketPurchase:presence_neris:equipment_light_leather_vest` continuam válidas para o progresso, evitando que saves antigos sejam penalizados.

## Arquivos principais

`src/content/terranGearMerchantsV05153.ts`: distribuição data-driven por slot.
`src/domain/inventory/equipmentV0515.ts`: validação de autorização pelo NPC.
`src/domain/terran/market.ts`: consumíveis Neris, armaduras introdutórias Armadureiro, mochilas/material Edran.
`src/ui/terran/TerranSpecialistShopV05153.tsx` e CSS: lista individual com sprites e filtros.
`src/ui/terran/MarketServices.tsx`: render de lojas por NPC, destaque de itens de missão.
`src/content/terran.ts`, `src/ui/terran/roomGeometry.ts`, `src/content/npcs.ts`, `src/content/npcVisuals.json`: personagens, mapa e artes provisórias.
`src/content/rosettaTutorial.ts`, `src/domain/quests/tutorialProgress.ts`, `src/state/gameStore.ts`, `src/domain/terran/rosettaGuide.ts`: missões e eventos persistidos.

## Aceitação antes de publicar

1. Neris vende consumíveis e **zero equipamentos**; aceita compra do Tônico a 18 Ouro.
2. Edran vende mochilas e materiais, não mais o Tônico.
3. Contagem de peças: **12 / 60 / 48**, com sprite/atributos/preços corretos.
4. Os quatro Clãs continuam com seu próprio Intendente e estoques exclusivos intactos.
5. Visita ao Mercado → escolher proteção em Rosetta → equipar → comprar Tônico → concluir missão → aprimorar em Durnan.
6. Compras antigas de Edran/Neris são reconhecidas por evento; nenhuma missão precisa ser repetida.
7. Opcional: conversar com os três novos NPCs, inclusive antes de aceitar a missão, e depois concluir em Rosetta.
8. Nenhum NPC obtém Clã, Classe ou Vínculo pela compra; os cinco Vínculos permanecem independentes.
9. Todos os NPCs são fisicamente acessíveis no interior do Mercado, sem novas casas.
10. CI (`npm run check`), Playwright Chromium local e inspeção do fluxo de usuário sem consumir Vercel.

**Release:** NÃO fazer merge ou deploy até resultado verde e revisão final.
