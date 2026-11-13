# Terrúnia v0.5.17.1 — Release de Armas Modulares, Drops e Defesas
Autoridade: TERRUNIA_GAME_APP_MASTER_SPEC_v0.4.md.
Branch: feature/v0.5.17.1-modular-weapons-skills. PR #84.
Estado: BALANCE_DRAFT e VISUAL_DRAFT; não alterar canon não aprovado.

## Implementação
- Armas completas e revestimentos comerciais retirados das lojas; kits de Clã/Classe mantêm apenas nove itens sem arma.
- Vínculos permanentes preservam mesmo ID, grau, ressonância, memórias, joias e runas; schema18 possui migração aditiva do schema17.
- Oito famílias com quatro módulos estruturais cada e 5 Tiers, 160 definições e 160 sprites SVG 16-bit.
- Torvan vende componentes T1–T3; Durnan possui mesa visual interativa de quatro recipientes com drag/drop, preview de atributos reais, consumo único de Ouro e parte confirmados.
- Drops determinísticos registrados em BattleState nas 15 trilhas de Astravél e em todas as ondas do Portal. Drops antigos nunca removidos; itens são coletados uma vez.
- Novas joias Fogo/Água/Terra/Ar no inventário; só o rito de Grau III permite instalar Joia, Grau II Essência, Grau IV Runa. O quarto módulo estrutural não abre um soquete mágico prematuro.
- Cinco missões extras de Rosetta para montagem, compra de peças, defesa e ataque modular, após tutorial existente.
- DEFESAS independentes na batalha: Bloqueio, Aparar, Esquiva e Contragolpe com elegibilidade por tipo de ataque, bônus das peças, dado persistido e natural 1 falha (BALANCE_DRAFT).
- Golpe de Escudo como ação voluntária, sem Ataque Duplo. Contragolpe rola dado próprio de reação; padrão Golem mantido.
- Filtros e recomendações neutras de Magia, Arco, Guerreiro e Híbrido nas lojas; ninguém recebe Clã/Classe na criação.
- Baú preserva recursos ao liberar espaço para retirada de joia/fragmento quando mochila cheia de partes temporárias.

## Critérios de release
1. npm ci + npm run check: lint, TypeScript, Vitest e build verdes.
2. Playwright E2E: Mercados, Rosetta, Astravél, ondas, chefes, saves e resoluções aprovados.
3. Validação de identidade de Vínculo e invariantes do Grau I–VII.
4. Nenhum segredo Firebase; sem gameplay dependente de sprites.
5. Somente depois de checks verdes: merge PR #84 e verificar Vercel produção.

## OWNER_DECISION
Arte final (SVGs funcionais mas VISUAL_DRAFT); taxas e custos de balanceamento; efeitos de Água/Terra/Ar; reversão de módulos e tratamento definitivo de componentes substituídos; restrição truncada do escudo ofensivo. Esses valores não são canon.
