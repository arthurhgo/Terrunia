# Câmaras Fúngicas de Astravél — dungeon pixelada v0.1

Status: `VISUAL_DRAFT`/`CONTENT_DRAFT`. Incremento posterior à expedição externa em 2026-10-28.

## Mapa e fluxo

```text
Terran → Praça do Portal → Astravél (trilha externa)
→ investigar Limiar da Ruína → marco Câmaras Fúngicas
→ entrar na dungeon (/dungeon)
→ Vestíbulo Micelial → Galeria dos Esporos
→ Santuário das Raízes → Núcleo da Ruína
→ confirmar combate contra Colosso Micélio
→ reclamar recompensa exatamente uma vez
→ continuar no interior / sair para Astravél / voltar a Terran
```

- Canvas lógico **384×256**, personagem base 16×16 projetado em 32×32, tiles de 8×8 e perspectiva superior 3/4. Salas conectadas, decoração fúngica, runas e raízes são geradas por desenho em pixels exatos. Caminhabilidade vem de retângulos declarados em `src/content/dungeons.ts`, independente de sprites.
- Caminhar com WASD/setas, clique/toque ou D-pad, inspecionar por E e abrir **Salas, Mochila e Missões** em painéis laterais sem desmontar a cena.
- A entrada depende de `astravel_boss_preview` em `bossCurrent` (limiar investigado), e ocorre exclusivamente pelo último marco da trilha externa, após despacho original pelo Portal. A URL `/dungeon` isolada não concede acesso.
- Quatro salas têm identificadores estáveis e registro idempotente por flags `dungeon-room-discovered:<roomId>`; somente a primeira entrada em `dungeon_fungal_chambers` marca `dungeon_fungal_entered`. Não há itens, XP ou Ouro por descoberta de sala.
- O Colosso conserva o encontro `encounter_colossus_mycelium_01` e a recompensa do motor de combate preexistente; iniciar batalha exige estar dentro da dungeon **e** ter alcançado `fungal_core`. Vitória mantém a localização na dungeon até a decisão do usuário.
- A cutscene `fungal_descent` é apenas narrativa e possui marcador de visualização no `eventLog`, sem alterar flags de missão, inventário ou progressão.
- Continuidade compatível com o save atual: `world.currentLocationId` aceita `dungeon_fungal_chambers`, `unlockedLocationIds` registra descoberta e `worldFlags` registra salas. **Nenhuma migração de schema** é necessária. Recarregar a página posiciona o personagem na última sala descoberta, não preserva a coordenada intermediária.
- Uma expedição já concluída pode ser **revisitada** pelo Portal; o último marco vira acesso ao interior, sem reiniciar boss, abrir novo loot ou conceder missão novamente. Isso inclui campanhas da versão anterior que já derrotaram o Colosso antes de existir o mapa interior.

## Limites atuais

- Os nomes e a disposição das quatro salas são `CONTENT_DRAFT`/`VISUAL_DRAFT`; não substituem lore canônico das Ruínas da Entropia.
- Criaturas documentadas (Fungorro Rastejante, Semeador de Esporos, Bola de Gosma Fúngica, Horror Esporulante, Titan Raiz-Negra) ficam reservadas para encontros interiores futuros, com autorização de balanceamento. Apenas o Colosso já possui confronto nesta etapa.
- Sem loot oculto, puzzles, armadilhas com efeitos persistentes, câmera com scrolling, IA livre nem novos sistemas de economia.
- Inspecionar uma sala não remove nem adiciona missões ao Journal; o fluxo de aceitação e entrega continua centrado nos NPCs de Terran.
- QA visual automatizado depende de Chromium instalado; lint, tipos, testes e build são executados por `npm run check`.
