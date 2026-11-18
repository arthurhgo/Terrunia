# Terrúnia v0.6 — implementação visual isométrica (VISUAL_DRAFT)

## Estado atual

A v0.6 possui dois níveis de visualização experimental:

1. **Modo integrado jogável**: /play?view=iso. Reutiliza TerranScene (quests, NPC, casa, serviços, progressão e save), exibe IsometricCityCanvas/IsometricInteriorCanvas e oferece câmera inclinada na arena real de BattleScene.
2. **Laboratório isolado**: /visual-v06. Mantido para comparar volumes e inspecionar dados sem acionar callbacks de gameplay.

A opção na própria cena de Terran alterna «Jogar em 3D · v0.6» / «Visão clássica». A query string é apenas preferência temporária de visualização; não migra nem altera GameSave.

## Implementado na PR #85

- Cidade isométrica com oito localizações oficiais (Praça do Portal e sete instituições) e Base do Terrírian.
- Navegação WASD, setas, interação E e rota por clique. Colisões e caminhos importados de cityNavigation.ts e interiorLayout.ts.
- Entrada nos edifícios somente por aproximação; a transição chama openLocation original.
- NPCs obtidos de getCityCast(save) e getInteriorResidents(save, id), com marcadores, retratos e diálogos reais por callbacks da TerranScene.
- Interiores gerados dos ROOM_PLANS e roomFurniture, preservando interação com cama, baú, serviços, missões, objetos e portais de Clã quando autorizados no save.
- Sprite do personagem e itens compostos por EquippedCharacter, conectado ao assetRegistry com fallback existente.
- Arena em /play?view=iso continua sendo BattleScene, preservando fases, efeitos, rolagens e motor de domínio; ângulo de câmera é experimental.
- HUD, Diário, modais, loot e relações com NPC continuam sendo componentes existentes de TerranScene.
- Testes Playwright de prévia e fluxo de cidade isométrica → interior → cidade → visão clássica.

## Arquitetura

IsometricPlayableWorld.tsx é apresentação: recebe save, IDs, pontos, atores e callbacks de interação. Movimento 2D e pathfinding usam as mesmas coordenadas oficiais do modo clássico. O componente não chama ações de gameStore para conceder recompensas e não escreve save diretamente. Os callbacks de TerranScene são a fonte de autoridade para NPCs, lojas, portas, missões e objetos.

Nenhuma regra nova de combate, clãs, classes, essência, equipamento ou save foi introduzida.

## Limitações e OWNER_DECISION

**Não é Gaussian Splat, glTF, Three.js ou WebGL.** A geometria é placeholder CSS 3D com sprites do registro real. O termo "3D" no botão indica perspectiva experimental, não um renderer 3D final.

- OWNER_DECISION: pipeline de asset 3D definitivo (.splat, .ply, glTF ou mistura); tamanho de texturas, resolução de splats, LOD e orçamento de GPU.
- Os desenhos, alturas, luzes e materiais ainda são VISUAL_DRAFT, não canon arquitetônico.
- A cidade inteira é exibida em maquete isométrica; câmera de perseguição, iluminação volumétrica e efeitos de oclusão reais ainda não estão implementados.
- As cenas da cidade e interiores são jogáveis com os callbacks existentes, mas o sistema de splats e a exploração de Astravél/dungeons ainda estão pendentes.
- Objetos de cena sem sprite disponível exibem fallback, sem interferir em colisões nem regras.
- Caminhos visuais de Rosetta e trilhas de quests têm a implementação completa somente no renderizador 2D; para o modo isométrico, o Diário funcional permanece acessível.

## Próximas etapas para v0.6 final

1. Introduzir um renderAdapter de cena que possa trocar CSS placeholder por WebGL e Gaussian Splat opcional, sem dependência do domínio.
2. Importar assets de Gaussian Splash Studio via assetRegistry, incluindo fallback 2D.
3. Implementar câmera isométrica de seguimento e picking consistente de NPCs, portas e objetos em WebGL.
4. Aplicar a renderização na exploração, nas dungeons e no combate mantendo as ações do motor atual.
5. Testar performance, navegação, turnos, loot, visibilidade, acessibilidade e saves, desktop e mobile.

## Release gates

npm run check, Playwright E2E e deployment Vercel no mesmo SHA. A versão estável da main só deve ser promovida após checks aprovados; manter esta PR como draft enquanto a substituição definitiva de renderer e a aceitação visual estiverem pendentes.

## Canon

Personagem-Nexo inicial sem Clã e Classe; os cinco Vínculos são permanentes; o Portal só acessa instâncias; sem alterar Essência, missão, combate ou regras de progressão. Em conflito, prevalecem AGENTS.md e TERRUNIA_GAME_APP_MASTER_SPEC_v0.4.md.
