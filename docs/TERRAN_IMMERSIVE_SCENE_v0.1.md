# Terran — exploração contínua em pixels (vertical slice v0.1)

Status: implementação técnica `VISUAL_DRAFT`/`CONTENT_DRAFT`, direção de UX aprovada em 2026-10-28.

## Experiência

- `/terran` é uma cena única, sem abas de navegação no topo. A cidade e o personagem são desenhados em canvas com resolução lógica **384 × 256** e `image-rendering: pixelated`.
- Perspectiva superior 3/4. O terreno utiliza módulo de **16 × 16 px**; o personagem ocupa quadro de **32 × 32 px**. As sete coordenadas já existentes são as fontes de posição, sem reescrever o cânone geográfico.
- WASD/setas movem; toque/clique indica destino; botões com nomes acessíveis indicam instituições; **E** interage na proximidade; no celular há controles direcionais.
- A Casa de Eldamar, Posto de Vorren, Oficina dos Vínculos, Quartel de Zareth, Salão dos Clãs, Casa de Daeryn e Praça do Portal permanecem simultaneamente na cena.
- Mochila, personagem/Vínculos, diário e evolução abrem um painel **ao lado do mapa**. No celular, o painel se sobrepõe parcialmente à cidade. O mapa não é desmontado quando o jogador interage com a interface.
- Selecionar uma instituição desloca o personagem até a entrada. Ela abre um painel lateral que inclui NPCs/serviços. A conversa é apresentada sobre a cidade; não há troca de cenário.

## Progressão narrativa

O seletor puro `getNextCutscene(GameSave)` escolhe a etapa mais avançada. Nenhuma cena desbloqueia quests ou altera itens por conta própria.

| ID | Condição de desbloqueio | Persistência |
|---|---|---|
| `terran_arrival` | Arma vinculada no prólogo e missão de Astravél disponível/oferecida | `CutsceneViewed:terran_arrival` |
| `astravel_call` | Missão de Astravél ativa | `CutsceneViewed:astravel_call` |
| `ruins_threshold` | Flag `fungal_chambers_threshold_discovered` | `CutsceneViewed:ruins_threshold` |
| `colossus_aftermath` | Flag `colossus_mycelium_defeated` | `CutsceneViewed:colossus_aftermath` |

O `eventLog` permanece dentro do save local/cloud já versionado. Não exige migração de schema. O usuário pode avançar ou pular a apresentação; isto não equivale a aceitar missões nem validar recompensas.

## Separação técnica

- `src/ui/terran/pixelCityArt.ts`: desenho de terreno/edifícios/personagem, sem regras de missão.
- `src/ui/terran/PixelCityCanvas.tsx`: input, movimento e callback de interação, sem manipulação direta de inventário.
- `src/ui/screens/TerranScreen.tsx`: composição do mundo com painéis de gameplay existentes e diálogos.
- `src/domain/terran/cutscenes.ts`: gatilhos de cenas derivados do save, sem dependências React.
- `src/state/gameStore.ts`: registra apenas o marcador de cena vista, de maneira idempotente.

## Próximos incrementos (não implementados)

- Colisão por máscara de elementos decorativos, câmera para regiões maiores e deslocamento autônomo de NPCs.
- Retratos e sprites definitivos exclusivos de cada NPC, diálogos aprovados pelo criador e triggers canônicos de visitantes/condicionais.
- Efeitos sonoros, trilha sonora e novas cutscenes de Clã, Classe e evolução dos cinco Vínculos.
- Consolidar as telas legadas de combate/exploração em uma transição de mundo coesa após validar esta vertical slice de Terran.

## Incremento visual v0.2 — 2026-10-28

### Matriz de sprites

- `src/ui/terran/pixelActorArt.ts` define 16×16 pixels por personagem, quatro orientações (cima, baixo, esquerda, direita), três quadros de passada e paletas de Terrírian, sigilo e instituições. O personagem é ampliado a 32×32 px; silhuetas de NPC permanecem 16×16 px no mundo para respeitar a densidade do mapa.
- Os retratos originais continuam independentes dos atores na cidade. Uma futura animação manual pode substituir o render procedural via `character.terririan.map` no `assetRegistry`. O formato opcional é PNG 128×128: quatro colunas de quadros 32×32, linhas na ordem **baixo, esquerda, direita, cima**. A matriz desenhada por código é fallback seguro.
- A imagem é apenas representação: obter um drop nunca troca o protagonista, e nenhum Vínculo é concedido pela cena.

### Interação e colisão

- `src/ui/terran/cityNavigation.ts` cria uma malha técnica de 8×8 px sobre o canvas de 384×256. Busca em largura encontra rotas ortogonais até portas/NPCs e compacta trechos retos para animação suave.
- Obstáculos são definidos por volumes explícitos dos seis edifícios e do Portal. São independentes de cores/imagens; a troca de tiles não altera o movimento.
- WASD/setas deslizam ao encontrar parede; toque/clique percorre o caminho; **E** prioriza o NPC próximo e depois a instituição. O cenário não é desmontado durante o painel ou diálogo.
- Os NPCs visíveis são derivados de `GameSave`, com até três representantes por instituição na rua; o painel de local mostra a lista de moradores elegíveis. Condicionais e visitantes exigem `npc_presence:<presenceId>` no save. Esse prefixo é uma convenção `CONTENT_DRAFT` e não cria novas missões.

### Diálogos e cutscenes

- `src/domain/terran/cityDialogue.ts` concentra falas ambientais `CONTENT_DRAFT`, com pequenas variantes após descobertas relevantes. Dados existentes de `NPCDefinition.dialogue` têm prioridade.
- As quatro cutscenes preservam seus triggers e marcadores persistentes, mas agora apresentam quadros em canvas 384×160 com portal, arquitetura, esporos e silhueta do Colosso em pixel art (`cinematicArt.ts`). O texto avançado pelo jogador é separado do desenho.
- Os moradores visíveis em Terran não modificam o `GameSave` por conta própria. Missões continuam exigindo oferta, aceite explícito e entrega ao NPC correto.
