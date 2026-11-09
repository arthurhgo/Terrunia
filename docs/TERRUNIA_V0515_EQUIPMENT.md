# Terrúnia v0.5.15 — Equipamentos, Mercado e Castelos

**Data:** 2026-11-09. **Branch:** `feat/equipment-v0.5.15-market-castles` · **PR:** #75 (draft).
**Autoridade:** `TERRUNIA_GAME_APP_MASTER_SPEC_v0.4.md` 0B + decisões da v0.5.15.

## Conteúdo implementado

- **140 conjuntos completos × 10 slots = 1.400 SKUs**, registrados por IDs e configurados por dados em `src/content/equipmentV0515.ts`.
- 60 conjuntos comerciais universais, organizados em cinco tiers para cada uma das 12 Classes; os nomes de Classe na loja são apenas recomendações.
- 20 conjuntos exclusivos de Clã, cinco tiers para cada Clã, comprados somente no castelo de afiliação.
- 60 conjuntos exclusivos de Classe, cinco tiers para cada Classe, comprados no mesmo castelo após o desbloqueio da disciplina.
- Compras avulsas e conjuntos completos com operação atômica, conferindo nível, localização, Ouro, Clã e Classe no domínio.
- Tier 1–5, separadamente da forja G1–G3. Os vendedores oferecem somente G1; Durnan refina individualmente G2 e G3.
- Comparação de status da mesma peça: `Tier N G3 < Tier N+1 G1`. Os incrementos G2/G3 são +1 e +2 sobre a base de cada Tier (BALANCE_DRAFT).
- 10 slots visuais e de equipamento: arma, escudo, armadura, colar, pulseira, capacete, calças, botas e acessórios I e II.
- Cada slot tem paletas parametrizadas, com brilho cintilante, metalizado ou acentuado por Grau. Sprites registráveis/substituíveis, com placeholders e silhuetas pixeladas de 32 px.
- Não existe bônus automático obrigatório por conjunto completo; as peças podem ser misturadas.
- Salvamento: `equippedGearStyles` opcional nos saves antigos, enquanto G1–G7, Essência, Joias, Runas, memórias e árvores de Vínculos permanecem inalterados.

## Separação dos cinco Vínculos

**Os Vínculos permanecem permanentes.** Equipamentos do comércio relativos aos cinco slots vinculados são *revestimentos* que transferem apenas visual e status comerciais. Não substituem o registro `boundItems`, seus graus, habilidades ou componentes. Exigem um Vínculo existente no slot antes de equipar. Armaduras comerciais podem ser vestidas como proteção básica antes da vinculação de Armadura.

## Preços e forja

Preços base por slot Tier I G1: capacete 20, colar 30, acessório I 22, arma 65, escudo 35, armadura 25, calças 20, botas 20, acessório II 24, pulseira 28 Ouro.

Multiplicadores por Tier: 1 / 2,6 / 6 / 12 / 23. Canais: Terran 1,0; Clã 1,1; Classe 1,2.

Custo G2: arredondamento de 25% do preço de G1. Custo G3: arredondamento de 35% do preço de G1. **Cálculo em Ouro é BALANCE_DRAFT.**

## Pendências explícitas OWNER_DECISION

1. **Materiais específicos de forja:** o catálogo exige materiais por Tier, mas não determina a matéria-prima. Nesta implementação de draft, a forja de equipamentos comerciais cobra **somente Ouro**; não inventa material.
2. **Ranks/quests extras:** até definir gates canônicos, acesso usa nível, Clã e Classe reais, sem criar quests ou ranks artificiais.
3. **Atributos de estilos ligados:** o revestimento soma status de equipamento temporário, mas não pode remover ganhos do Vínculo; verificar fórmulas de combate em QA.
4. **NPC exclusivo:** Neris vende equipamentos e mochilas. Os materiais de forja foram atribuídos a Valmira e os suprimentos do tutorial a Edran, com atualização do diálogo e objetivos da Rosetta.
5. **Sprites finais:** os efeitos e silhuetas são placeholders originais. Importação manual via `assetRegistry` não altera gameplay.

## QA de aceite

- Catálogo: 140/1.400 e dez tipos por kit.
- Acesso: exclusividade de localização, Clã e Classe por operação.
- Economia: compra atômica, Ouro insuficiente, G1→G2→G3, sem salto de Tier.
- Save: abrir/recarregar um save antigo, vestir e tirar revestimentos, guardar equipamento e não duplicar instâncias.
- Combate/visual: validar que os bônus equipados entram na estatística derivada e que a mudança de cor aparece em Terran e combate.
- Verificar `npm run check` e `npm run e2e` antes de promover para main.

## Merge

Não promover automaticamente. PR fica draft até CI completa e review de balanceamento/UX.
