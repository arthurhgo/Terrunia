# TERRÚNIA — PLANO EXECUTIVO v0.5.9 · POLISH VISUAL, SPRITES E VALIDAÇÃO

**Data:** 2026-11-06  
**Estado:** PLANO_EXECUTIVO / VISUAL_DRAFT. Não equivale a funcionalidade já implementada nem altera o cânone.  
**Branch-alvo:** feat/gameplay-v0.5.9 · **PR:** #60 (draft) · **Baseline de leitura:** 2aecf9af126e2746b155effd28ff99d7a22a1e6e.  
**Objetivo:** transformar o gameplay já implementado em uma vertical slice visualmente coesa, legível, acessível e estável, sem reescrever mecânicas aprovadas.

## 1. Fontes, autoridade e limites

Respeitar AGENTS.md; docs/TERRUNIA_GAME_APP_MASTER_SPEC_v0.4.md (0B/0A); docs/CANON_DECISIONS.md; docs/NEXUS_AND_QUEST_JOURNAL.md; docs/GAMEPLAY_RECRUITMENT_AND_RESET.md; docs/TERRAN_CITY_STRUCTURE.md; e o documento de auditoria TERRUNIA_GAMEPLAY_v0.5.9_AUDITORIA_E_PLANO_PARA_VALIDACAO.md.

- Não escolher Clã/Classe na criação; não alterar progressão, economia ou fórmulas silenciosamente.
- Os cinco Vínculos são permanentes; equipamentos simples continuam sujeitos às exceções já registradas antes do vínculo.
- Nenhuma morte, drop ou nível gera diretamente Pontos de Essência; a barra preserva excedentes.
- Saves, progresso, flags, baú, missões e equipamentos não podem ser resetados por mudanças visuais.
- Assets são substituíveis via assetRegistry; sprites inexistentes usam placeholders. Nenhuma regra de gameplay depende de PNG, frames, nome ou cor.
- Sem merge na main, publicação ou deploy manual sem autorização posterior. Evitar pushes supérfluos enquanto o Vercel Hobby estiver limitado.

## 2. Estado inicial observado

A branch já possui criação com alocação ponto a ponto, mapa do Portal, HUD de expedição, missões de NPCs, guia de Rosetta, Base com serviços e polimento de batalha. Não reimplementar blocos existentes. O último CI verificado no commit-baseline é o workflow #42269449652, concluído com sucesso para npm run check. Isso não comprova QA visual nem Playwright E2E. O status de Vercel no último commit não confirma novo deploy.

## 3. Backlog executivo com prioridade, arquivos e critérios de aceite

| ID | Prioridade | Tarefa | Pontos do código a inspecionar / alterar | Critério verificável |
|---|---|---|---|---|
| POL-00 | P0 | Congelar baseline e mapear inconsistências de interface com capturas por fluxo | src/ui/screens; src/ui/terran; src/ui/expedition; testes e docs | Checklist de diferenças e screenshots em 1366×768 e 1920×1080; nenhuma alteração de save |
| POL-01 | P0 | Unificar tokens visuais, bordas, botões, estados, foco e tipografia | estilos globais existentes; gameplayV057.css; terranFixedSidebar.css; battleCinematic.css; portalHub.css | Mesmas cores e estados sem divergência entre cidade, portal, batalha, expedição e Base |
| POL-02 | P0 | Corrigir overlays, overflow, scroll, proporção de cena e responsividade | GameShell.tsx; TerranScreen.tsx; ExpeditionScreen.tsx; BattleScreen.tsx; CSS correspondentes | Cena em destaque; botões acessíveis; sem scroll horizontal nem painel fora de viewport; foco visível |
| POL-03 | P1 | Refinar painel de missão/NPC, estado cinza de aceita, entrega em destaque e guia Rosetta | NpcMissionHub.tsx; NpcNameplate.tsx; QuestNpcPanel; RosettaGuide.tsx; questTrackingPaths.css; diário | Aceitar não gera autoaceite; missão ativa cinza; próxima oferta selecionada; legenda legível; nenhuma duplicação de recompensa |
| SPR-01 | P0 | Padronizar player: pivô, escala, quatro direções, arma nas mãos/costas e silhueta | EquippedCharacter.tsx; equipmentCanvas.ts; equipmentVisuals.ts; CharacterSprite.tsx; registro de assets | Mesmo personagem/arma nas quatro direções; não flutua, não espelha incorretamente, sem ruptura na troca de cena |
| SPR-02 | P1 | Definir contrato de sprites substituíveis, metadados, fallback e estados de animação | assetRegistry existente; componentes de sprite e canvas; docs de assets | ID estável, fallback legível, estados opcionais e sem imports PNG obrigatórios no domínio |
| SPR-03 | P1 | Diferenciação visual dos NPCs principais: Rosetta, Eldamar, Daeryn, Vorren, Lithwynn, Sylwen e prestadores existentes | registro de NPCs/retratos; PixelCityCanvas.tsx; PixelInteriorCanvas.tsx; NpcNameplate.tsx | Silhueta/paleta distintas para os prioritários, escala coerente e correspondência entre retrato e cena; placeholder aceito se imagem final faltar |
| SPR-04 | P1 | Monstros: clareza de variantes, idle, hit e derrota; fungorros e Colosso como prioridade | registro de inimigos; BattleScreen.tsx; componentes de entidade de combate; CSS/VFX | Ator correto reage; inimigo morto não ataca nem continua selecionável; nenhuma regra mecânica associada à imagem |
| BAT-01 | P0 | Fechar apresentação de ataque → impacto → dano sobre cabeça → morte → próximo ator | BattleScreen.tsx; battleCinematic.css; presentationTiming.ts; timeline | Sem confirmação redundante; dano real do alvo correto; cadáver/morte mostrados antes do próximo turno; timing configurável |
| BAT-02 | P1 | VFX leves e feedback contextual: slash, cura, escudo, magia, erro, disponibilidade | VFX e assetRegistry; estilos de batalha; widgets de ações | Efeitos são cosméticos, respeitam reduced-motion, não atrasam state machine, não escondem menus |
| WOR-01 | P1 | Portal: mapa mais identificável, distinção de instâncias e entradas, marco zero claro | PortalHubScreen.tsx; portalHub.css; PortalPanel.tsx | Movimento/seleção consciente; bloqueios reais; sem batalha automática no hub; voltar preserva o save |
| WOR-02 | P1 | Astravél: profundidade de cenário, marcos, vegetação, ruínas e HUD lateral sem colisão visual | AstravelPixelCanvas.tsx; ExpeditionScreen.tsx; ExpeditionStatusHud.tsx; CSS | Marco e destino legíveis; HUD não encobre interações; cena permanece jogável sem asset externo |
| HOM-03 | P2 | Base: cama, baú e registros com hierarquia e sensação de refúgio | TerranScreen.tsx; TerranServices.tsx; estilos da Base | Três ações identificáveis e funcionais; registros apenas dados do save; chave/flags idempotentes |
| UI-ITEM | P1 | Inventário, itens, raridade e vínculos: ícones homogêneos, tooltip e preview antes/depois | TerranCharacterHud.tsx; InventoryPanel; armorSilhouette.ts; componentes vinculados | Grau, raridade, material e afinidade não confundidos; itens vinculados protegidos; preview não muda status |
| QA-01 | P0 | Regressão automatizada de jogabilidade, visual e migração | Vitest, Playwright, persistence/saveSchema.ts, integração | npm run check aprovado + E2E crítico + teste visual humano documentado |

Os caminhos são pontos de inspeção, não autorização para modificar todos indiscriminadamente. Se um componente já atender ao critério, marcar DONE e não reescrever.

## 4. Ordem de execução — commits pequenos

### Sprint A — Base visual e UX (P0)
1. Registrar baseline e screenshots de Criação, Terran, NPC, Portal, Astravél, Batalha e Base.
2. Criar/reusar tokens CSS de cor, espaçamento, tipografia, foco, borda e profundidade.
3. Corrigir sobreposição e scroll sem eliminar as funções atuais; apoiar mouse, teclado e viewport menor.
4. Testar e commitar em blocos autocontidos. Gate A: npm run check + screenshots comparativos.

### Sprint B — Pipeline de sprites e protagonistas (P0/P1)
1. Especificar sprite profiles data-driven: actorId/assetId, facing, anchor, logical size, state e fallback.
2. Refinar player + equipamento primeiro; validar frente, costas, esquerda e direita em cidade, interiores e batalha.
3. Trabalhar NPCs principais e fungorros; sprite final pode ser substituído manualmente sem mudança de lógica.
4. Se não houver sprites autorais fornecidos, melhorar placeholder e composição; NÃO declarar sprites finais entregues.
5. Gate B: teste de ausência de asset, espelhamento, animação reduzida e consistência mundo/retrato.

### Sprint C — Game feel e informações críticas (P0/P1)
1. Garantir cadeia visual de combate determinística pelo evento de domínio.
2. Aplicar VFX leves e animação de dano/morte sem bloquear interações futuras.
3. Revisar NPCs, missões e Rosetta preservando estados, sinais e aceitação explicitamente canônicos.
4. Gate C: testes de batalha com 1/2/3 inimigos, letalidade, consumíveis, aceitar/entregar missão e navegação por teclado.

### Sprint D — Cenário, Base e fechamento (P1/P2)
1. Melhorar profundidade ambiental em Portal/Astravél/Base com props pixelados e camadas cosméticas.
2. Refazer apenas composições necessárias, sem criar biomas, missões ou mecânicas não aprovadas.
3. Auditar paleta e iconografia do inventário contra a semântica real do catálogo.
4. Gate D: walkthrough completo e medições de desempenho; sem regressão de save.

### Sprint E — Validação de release (P0)
1. Executar npm run check e npm run e2e (Playwright não faz parte de npm run check).
2. Realizar QA humano: 1366×768; 1920×1080; viewport móvel 390×844, se suportado; zoom, foco e reduced-motion.
3. Testar criar/continuar, NPC, Portal → marco 0 → combate → drops/Essência → voltar, Base, reload e isolamento entre contas.
4. Atualizar documentos de QA, alterações visuais, lacunas e decisões pendentes. Manter PR #60 como draft até aprovação do proprietário.
5. Conferir CI e Vercel. Só solicitar merge/publicação após gate e autorização específica.

## 5. Direção artística provisória — VISUAL_DRAFT

- Identidade: pixel art de fantasia arcana, contraste legível, ornamentação modular, cena como elemento dominante.
- Paleta de UI proposta: fundo #0D151B, painel #253841, dourado #DDB66B, arcano #70AFC2, dano #B74D4D. Verde de cura e cores de missões respeitam semântica já definida; paleta estética não redefine raridade nem estado do jogo.
- Layout: escalas inteiras quando possível, alinhamentos consistentes, bordas de pixel nítidas, boa leitura de nomes, PV, MP e botões.
- Sprites: manter proporção aparente de player e NPCs; quatro direções para player. Estados desejáveis idle/walk/attack/hit/defeated com fallback para os não disponíveis.
- NPCs: silhueta, vestuário e paleta próprios; contadores e ícones de missões não devem se sobrepor.
- Inimigos: reconhecer variante por silhueta e tom, não depender exclusivamente de cor; hit e morte claramente distinguíveis.
- Acessibilidade: foco visível, contraste, tooltips com textos, suporte a prefers-reduced-motion e nenhuma interação obrigatória exclusivamente via hover.
- Áudio: opcional e somente com recursos autorais/licenciados; estado de mudo e volume são detalhes abertos, sem implementação silenciosa.

## 6. Critérios objetivos de conclusão

- [ ] Não há novo conteúdo mecânico que altere o cânone sem decisão explícita.
- [ ] Contrato de sprites documentado, placeholders íntegros, assets futuros substituíveis.
- [ ] Player/equipamento sem desalinhamentos nas 4 direções e telas.
- [ ] NPCs prioritários e inimigos atuais com leitura visual coerente; ausência de arte final explicitada.
- [ ] Combat readability: agressor, alvo, dano, morte, próximo turno e Voltar corretos.
- [ ] Rosetta/NPC/Diário com estado real e navegação não redundante.
- [ ] Portal/Astravél/Base visualmente consistentes e com interações explícitas.
- [ ] Nenhum bloqueio de viewport em resoluções-alvo; recursos de acessibilidade preservados.
- [ ] Saves antigos e atuais carregam sem perda de progressão, Vínculos, Ouro, baú ou flags.
- [ ] CI, E2E e QA visual documentados com links/evidências; PR revisado antes de merge.
- [ ] Produção inalterada até autorização específica.

## 7. Decisões que permanecem abertas — OWNER_DECISION

1. Resolução lógica e densidade final de cada sprite (não alterar sprites antigos silenciosamente).
2. Quantidade de frames desenhados à mão por animação versus poses/fallbacks processuais.
3. Arte final dos NPCs/monstros e efeitos de áudio: precisam ser fornecidos ou aprovados; este plano não fornece PNGs finais.
4. Preferência final de ornamentação da UI (fantasia mais densa ou visual compacto).
5. Mudanças de balanceamento/economia, casos extras de lojas e novos inimigos: fora deste polish sem aprovação separada.

**Nota operacional:** este documento adiciona o próximo passo de execução ao PR #60. Não é evidência de que o polish foi codificado, testado visualmente ou publicado.
