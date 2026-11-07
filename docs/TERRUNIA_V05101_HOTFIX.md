# Terrúnia v0.5.10.1 — hotfix de viewport, primeiro Vínculo e arma nas costas

## Origem e alcance

Três defeitos relatados por captura de tela: painéis esquerdo/direito extrapolavam a área do navegador (inclusive com zoom); distribuição de atributos exigida prematuramente na criação; arma guardada atrás do corpo ao olhar para cima. Esta correção é de **UX/visual** e de ordenação do fluxo existente — nenhuma regra de Clã, Classe, Essência, Grau ou drop foi inventada.

## Alterações

- Criação: apenas nome/aparência. O save inicial permanece com **6 pontos livres**, sem distribuir automaticamente. Perfis antigos preservam seus dados.
- Primeiro Vínculo: selecionar arma → iniciar a distribuição → alocar pontos individualmente → validar requisitos da arma → confirmar a arma Grau I. O CTA de conclusão fica desabilitado até gastar os seis pontos e cumprir os requisitos. O motor de atributos existente permanece a fonte da verdade.
- O aumento de Vida/Mana na preparação inicial preenche os valores atuais até os máximos, sem modificar progressão após o Vínculo.
- Terran: colunas permanentes **Diário | Cenário | Status** agora vivem dentro de uma grade contida em 100% do viewport. Nenhum rail usa right:100%/left:100% para escapar da moldura.
- Em navegador estreito ou zoom aumentado, as abas **Missões** e **Status** são botões recolhíveis nas bordas, com painéis sobrepostos acessíveis e sem rolagem horizontal. A cena mantém largura dinâmica.
- Arma de costas: quando facing='up', a peça fica visível na frente do sprite de costas (sobre a vestimenta, como arma guardada); âncoras usadas tanto por Canvas quanto pela composição React. Outras direções e IDs de assets inalterados.

## Critérios de aceite

- Criação sem pontos, alocação somente após iniciar o Vínculo de uma arma.
- Testes Playwright em 1366×768, 1920×1080, 1440×900, 1024×768, 2560×1080, 844×390 e 390×844: cena e painéis inteiros; tabs estreitas operantes.
- Arma visível em facing='up' no Canvas e React, com draw layer frontal.
- TypeScript, lint, unit tests, build, E2E: execução via GitHub Actions após o commit final.

**Pendências não relacionadas:** arte definitiva e ajustes BALANCE_DRAFT/OWNER_DECISION dos biomas.

- 2026-11-07: correção de regressão pós-teste: regras da grade limitadas à cena de Terran, sem alterar z-index do backdrop/janela da expedição; cabeçalho translúcido deixa os cliques passarem; botões de seleção de arma possuem hitboxes estáveis (animação só no ícone).

- Última regressão mobile: painéis recolhidos usam seletores com especificidade para vencer regras legadas de até 720px. Painel oculto não recebe pointer events, permitindo Ocultar caminhos de Rosetta.
