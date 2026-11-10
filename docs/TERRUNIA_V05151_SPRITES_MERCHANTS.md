# Terrúnia v0.5.15.1 — Sprites completos e mercadores individuais

## Mudanças aprovadas

**Neris, Mercado de Terran** vende apenas equipamentos **comuns Tier I, Grau de Forja 1**, sem nenhum pré-requisito de Clã ou Classe. São 12 estilos de Tier I × 10 slots = **120 peças**. O estilo sugerido de uma Classe não restringe a compra da linha comum. As proteções Tier I legadas do tutorial continuam comuns; as Tier II e III antigas não podem mais ser compradas em Neris.

As mochilas (utilitários, não equipamentos Tier) foram transferidas a **Edran**. Valmira continua vendendo materiais, e Rosetta permanece com suas três lições principais. A missão secundária opcional `rosetta_tutorial_armor` foi adaptada a uma segunda proteção comum Tier I em vez de exigir uma compra Tier II que agora seria impossível.

**Castelos de Clã:** o miniportal atual, no Salão dos Clãs, continua levando somente ao castelo do Clã efetivamente conquistado. Cada castelo tem **um único Intendente** que vende, em uma mesma loja:
- **Linha do Clã** → cinco conjuntos Tier I–V exclusivos de seu Clã.
- **Três linhas de Classe** → cinco conjuntos Tier I–V por Classe pertencente àquele Clã.

São **4 castelos × 1 Intendente = 4 NPCs mercadores**. Cada mercador tem ID, retrato, localização e estoque exclusivos, e o menu permite filtrar por Clã, Classe e Tier. Itens de Classe continuam bloqueados até o personagem conquistar a disciplina. Os nomes funcionais são `CONTENT_DRAFT`; nomes pessoais e biografias: `OWNER_DECISION`. A revisão conserva os IDs anteriores dos quatro Intendentes.

## Bloqueio obrigatório de compra

O motor de inventário verifica **em toda compra**:
1. O ID exato do mercador com estoque autorizado.
2. O local correto, sem acesso por outro castelo ou pelo painel genérico.
3. Nível/Tier mínimo para linhas exclusivas.
4. Filiação efetiva ao Clã exigido.
5. Classe efetivamente desbloqueada para itens de Classe.
6. Ouro suficiente e integridade dos dez SKUs quando compra o kit inteiro.

Sem essas condições a operação falha **sem debitar Ouro nem gerar itens**. Neris recusa qualquer SKU de Clã, Classe ou Tier II–V, mesmo após a missão ou por chamada direta do store. Os Vínculos de sete graus são permanentes e não são substituídos pelos revestimentos.

## Sprites nativos

- **1.400 equipamentos × 3 versões G1/G2/G3 = 4.200 PNGs RGBA de 32×32 px**, fundo transparente.
- **4 retratos dos Intendentes de castelo** também em PNG RGBA 32×32 px.
- Formas diferentes para cada slot: capacete, colar, acessório I, arma, escudo/protetor, armadura, calças, botas, acessório II e pulseira.
- Paletas de categoria, Classe, Clã, Tier, efeito de G2 metálico e G3 emissivo.
- A geração é **procedural e determinística**, não arte final desenhada individualmente. Garante que o jogo tenha sprites funcionais para todas as 4.200 variantes, com personalização independente.
- Arquivos gerados pelo comando `npm run sprites:equipment` em `public/assets/equipment/v05151/<SKU>_g1.png`, `_g2.png`, `_g3.png`; e `public/assets/npcs/castle_merchants/<NPC_ID>.png`.
- O `assetRegistry` referencia cada PNG. Na ausência de uma imagem, a UI mantém o fallback existente sem quebrar a aplicação.
- A geração ocorre automaticamente antes do **dev, build, test:run e e2e**.

### Substituir manualmente uma arte sem perdê-la no build

Coloque PNG RGBA 32×32 na pasta **versionada**, com o nome exato correspondente à saída:

- `public/assets/equipment/manual/v05151/<SKU>_g1.png` (ou G2/G3).
- `public/assets/npcs/castle_merchants_manual/<NPC_ID>.png`.

O gerador dá **prioridade ao override manual** e copia o arquivo para o destino final. Nunca use os diretórios gerados ignorados pelo Git para armazenar a arte autoral definitiva. Isso preserva IDs, save e mecânicas.

## Pendente: OWNER_DECISION

- Fonte de aquisição das **480 peças comerciais comuns dos Tiers II–V**. Preservadas no catálogo sem vendedor atribuído; não aparecem em Neris nem são desviadas aos castelos exclusivos.
- Materiais e requisitos adicionais da forja G2/G3 e ranks avançados não definidos na MASTER_SPEC v0.4.
- Nomes pessoais e histórias dos quatro Intendentes, caso sejam necessários.
- Substituição posterior da arte procedural por sprites manuais finalizados, sem alterar lógica nem progresso.

## Critérios de aceite

- Catálogo: 140 conjuntos, 1.400 peças, 4.200 variantes de sprite, 4 retratos.
- Neris: apenas Tier I Grau 1 comum; inclusive a loja antiga não oferece Tier II/III e utilitários passam para Edran.
- Castelos: um mercador por castelo; a mesma loja reúne as linhas de Clã e Classe, sem dispensar requisitos.
- Anti-bypass: chamadas diretas ao domínio falham sem requisitos.
- Saves de versões anteriores preservados; cinco Vínculos intactos.
- `npm run check` e `npm run e2e` aprovados antes do merge.
