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

- Sprites animados em 4 direções, colisão por máscara, pathfinding real e câmera para mapas maiores.
- NPCs com deslocamento, sprites exclusivos e diálogos canônicos completos; condicionalidade dos residentes, visitantes e mestres por flags de progressão.
- Cutscenes com quadros desenhados individualmente, efeitos sonoros e direção de cena, sem mudar a máquina de progressão do jogo.
- Consolidar as telas legadas de combate/exploração em uma transição de mundo coesa após validar esta vertical slice de Terran.
