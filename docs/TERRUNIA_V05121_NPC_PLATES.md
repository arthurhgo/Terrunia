# Terrúnia v0.5.12.1 — correção visual das placas de NPC

**Base:** v0.5.12 consolidada na `main`. **Escopo:** exclusivamente composição gráfica das placas de NPC e indicadores de missão. **Estado:** implementada em PR específico e sujeita a CI/E2E antes de mesclar.

## Problema reproduzido

A v0.5.12 exibia uma faixa horizontal inesperada atrás do nome e fitas textuais como `Aceita 2` do lado esquerdo da placa. A origem da faixa é a regra genérica `.pixel-city__npc span` / `.pixel-interior__npc span`, que também estiliza os `span` internos do componente. A apresentação de etiquetas não correspondia à referência visual aprovada.

## Comportamento autorizado

1. **Uma única janela:** o box principal exibe somente **nome** e **cargo/título** do NPC. Não existem caixas ou barras adicionais para as duas linhas. O ícone indicador de missão/tutorial permanece separado, à esquerda da placa, conforme decisão anterior.
2. **Etiquetas inferiores:** todas as categorias não vazias formam **uma única fileira horizontal** pendurada sob a janela, com a borda superior discretamente encoberta pela própria janela para simular a saída de trás da placa. Não exibir faixas à esquerda, acima, ou barra horizontal atrás do nome.
3. **Símbolo + número:** `! 2` dourado para principais disponíveis; `! 1` azul-claro para secundárias; `··· 3` cinza para aceitas; `✓ 1` verde para entregas. Não exibir `Aceita`, `Principal`, `Entrega` nem outra descrição no texto visível. O título do elemento mantém a descrição para informação contextual.
4. **Zero a quatro categorias:** etiquetas inexistentes não renderizam, sem células vazias e sem forçar largura ou altura extras na placa.
5. **Cidade e interiores:** mesmo componente/estilo. Preservar títulos realmente cadastrados e identidade do NPC; não criar lore.
6. **Compatibilidade:** preservar interação/seleção de NPC, missão, estado real do save e cores do tutorial de Rosetta. Nenhuma alteração em domínio, quest acceptance, prioridades, recompensas ou diálogos.
7. **Responsividade:** os indicadores não podem sobrepor a área do nome, nem criar uma barra separada ao passar o mouse. Como regra visual configurável, limitar a largura da placa e reduzir ligeiramente os indicadores em telas menores.

## Arquivos e testes

- `src/ui/terran/npcNameplate.css`: substitui camadas CSS históricas por uma única fonte de apresentação com quadro de fundo próprio (`::before`) acima das abas, protegida contra regras genéricas aplicadas a `span`.
- `src/ui/terran/NpcNameplate.tsx`: preserva nome, título e indicador principal; delega etiquetas.
- `src/ui/terran/NpcQuestBadges.tsx`: conta somente grupos válidos da v0.5.12, renderiza símbolo e número, sem rótulos de texto visível.
- `src/ui/terran/NpcQuestBadges.test.tsx`: estados 0, 1, 2, 3 e 4, ocultação de categorias vazias e correspondência dos símbolos/contagens.

## Aceite

- [ ] `npm run check` aprovado.
- [ ] Playwright E2E aprovado sem regressões em Terran/interiores.
- [ ] Uma janela nome/título; nenhuma barra horizontal extra.
- [ ] Etiquetas alinhadas horizontalmente na parte de baixo e visualmente surgindo de trás da janela.
- [ ] Exatamente um símbolo e um número por etiqueta; cores da v0.5.12 preservadas.
- [ ] NPC sem missões não apresenta fileira; NPC com 1–4 categorias não apresenta etiquetas vazias.
- [ ] Merge em `main` e status de deploy Vercel confirmados.

**VISUAL_DRAFT:** alturas, offsets, fontes e espessuras das molduras são parâmetros de composição, não regras de gameplay ou canon.
