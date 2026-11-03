# Terrúnia — HUD de equipamentos em combate v0.21

Data: 2026-11-03. Autoridade: `TERRUNIA_GAME_APP_MASTER_SPEC_v0.4.md`. Escopo: leitura visual dos equipamentos reais na batalha, **sem alterar a máquina de estados, as fórmulas, o save schema 17 nem a Skill Tree**.

## HUD do Terrírian: cinco slots

Sempre mostram Arma, Escudo/Protetor Arcano, Armadura, Colar e Pulseira, nesta ordem.

- **Vínculo equipado**: ícone real de `boundItemBase.assetIdByGrade[grade]` do item em `save.character.bondedEquipment[slot]`, nome, grau e ressonância.
- **Proteção simples**: caso a Armadura ainda não tenha Vínculo e `getEquippedBasicArmor` confirme a peça, mostra seu ícone real, Tier, refinamento e os bônus de mitigação/iniciativa definidos no conteúdo.
- **Slot vazio**: placeholder manualmente substituível, cinza e dessaturado, borda inativa. Nunca aparentar ser item já adquirido.
- Na batalha os slots são de **inspeção somente**. A interface não permite equipar/trocar durante o turno, preservando a regra do domínio.

## Detalhes por hover, foco e toque

- Desktop: hover/foco mostra painel temporário. Clique fixa o detalhe; Escape, botão de fechar ou toque externo o dispensam.
- Mobile: toque fixa o painel. A tooltip é projetada sobre a cena (portal), não fica recortada pela área rolável de status.
- Conteúdo: nome e tipo, Grau/Tier/refinamento, Ressonância do Vínculo, atributos diretamente atribuíveis ao item, descrição do catálogo. O estado vazio informa apenas **Não equipado**.
- Acessibilidade: botões com rótulos de slot/nome, `aria-disabled` para estado visual inativo, `aria-describedby` com tooltip, saída por Escape e foco pelo teclado.

## Atributos, sem dados fictícios

O resolvedor puro `getBattleGearSummary(save, content)`, em `src/domain/combat/battleEquipment.ts`, lê:
- `boundItemBase.basePower` da Arma como **Poder base da arma** (não soma atributo/nível);
- `boundItemBase.statBonuses` diretamente registrados: Vida/Mana máximas, Defesa e Iniciativa;
- upgrades da Forja de Durnan presentes na instância equipada, com nome e efeitos próprios;
- Armadura simples: mitigação + refinamento aprovado e modificador de iniciativa real.

Resumo abaixo dos cinco slots: **Poder, Def, Vida, Mana e Inic** somente se existir contribuição direta diferente de zero. Efeitos gerais de atributos, Clã, Skill Tree, status temporários ou mecanismos ainda não finalizados não são atribuídos ao item. Os totais efetivos de combate seguem em `deriveCharacterStats` e no `BattleState`. Bônus de runas/memórias ainda sem fórmula própria não são inventados.

## Compatibilidade, testes e próximos passos

- Não cria campos no save, não altera drops, economia, combate, Grau de Vínculo, fórmula de iniciativa ou pré-requisitos.
- Testes de domínio confirmam cinco slots, estados reais, defesa da armadura refinada, escudo, colar e modificadores de Forja comparados às contribuições derivadas.
- Testes de UI cobrem hover/foco/touch-clique, comportamento cinza de vazio e painel de atributos da proteção simples.
- `npm run check`: lint, TypeScript, Vitest e build; teste visual real em navegador e deploy Vercel são verificações independentes.

## OWNER_DECISION
Possíveis bônus específicos de Memórias, Cicatrizes, Runas e Joias precisam ser definidos na regra de combate canônica antes de exibição como valores adicionais. Não apresentar números estimados.
