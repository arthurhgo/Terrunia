# TERRÚNIA — v0.5.9 · Animações de monstros, níveis, drops e evolução

**Data:** 2026-11-06. **Branch:** `feat/gameplay-v0.5.9`. **PR:** #60 (draft).  
**Natureza:** incremento de vertical slice; `VISUAL_DRAFT`, `CONTENT_DRAFT`, `BALANCE_DRAFT`.  
**Hierarquia:** seguir `AGENTS.md`, `TERRUNIA_GAME_APP_MASTER_SPEC_v0.4.md` (prioridade 0B), `CANON_DECISIONS.md`, `NEXUS_AND_QUEST_JOURNAL.md`. Este documento não inventa verdades históricas nem altera os cinco Vínculos permanentes.

## 1. Quatro animações próprias

Sprites nativos de jogo, PNG RGBA, pixel art sem anti-aliasing. Cada monstro ganhou um spritesheet **128×128**, organizado em **4 colunas × 4 linhas**, frames de **32×32**.

Linhas fixas: **0 repouso | 1 ataque | 2 dano | 3 derrota**. Cada linha contém quatro quadros distintos.

| Inimigo / ID | Linguagem animada própria | Velocidades idle/ataque/dano/derrota (ms) |
|---|---|---|
| Fungorro Espinhal · `enemy_fungorro_thornback` | Pulsação esverdeada e espinhos que se projetam na investida; queda com desprendimento de espinhos | 1050 / 620 / 420 / 850 |
| Casco de Esporos · `enemy_spore_bulwark` | Respiração pesada e placas de proteção; impacto acompanhado por onda de quitina e colapso do casco | 1480 / 750 / 520 / 1150 |
| Rastreador Micelial · `enemy_mycelial_stalker` | Oscilação e vultos arroxeados; salto horizontal com rastro fúngico, dispersão na derrota | 730 / 480 / 350 / 690 |
| Vigia do Limiar · `enemy_ruin_warden` | Pulsos rúnicos turquesa, emissão de sinais na investida; fraturas e fragmentação na derrota | 1750 / 880 / 600 / 1200 |

**Arte implementada:** `public/assets/enemies/progression/enemy_*_motion.png`. Sprites de repouso 32×32 e fontes SVG editáveis permanecem preservados. Os caminhos, ritmos e fallbacks são configuráveis por `assetRegistry[assetId].motionSheet`.

**Componente:** `src/ui/battle/EnemyMotionSprite.tsx`, renderizado por `BattleScreen.tsx` conforme estados reais de combate `idle/attack/hit/defeat`. A lógica da máquina de turnos, dano, morte e drop **não depende** de sprite, frame, CSS nem PNG. Em `reducedMotion` ou para inimigos sem sheet, usa `AssetImage` estático sem quebrar a cena.

**Ainda provisório:** essas animações são quadros nativos de apresentação, não direção artística final licenciada, e não introduzem sons nem novos ataques mecânicos. Revisão visual de timing em navegador ainda obrigatória.

## 2. Requisitos de nível obrigatórios no domínio

O tipo `QuestPrerequisite` passou a admitir `{ type: 'characterLevel', value: number }`, validado em `content/catalog.ts` e avaliado em `questEngine.ts`. Uma missão **nova e bloqueada** só fica disponível quando TODOS os pré-requisitos, incluindo nível, forem satisfeitos; missões já ativas ou entregues nunca são re-bloqueadas.

O `gameStore.claimBattleRewards` reavalia missões depois de creditar XP, para não exigir troca de tela ou reload após subir de nível.

| Missão opcional | Nível mínimo | Outro requisito relevante | Material ou recompensa |
|---|---|---|---|
| Espinhos da Fronteira — Eldamar | 2 | primeiro contato entregue | 2 Espinhais; tônico + XP/Ouro/Essência Bruta |
| A Primeira Carapaça — Vorren | 3 | Bestiário de Vorren entregue | 2 Cascos; antídoto + XP/Ouro/Essência Bruta |
| Quitina para a Fornalha — Durnan | 3 | Bestiário de Vorren entregue | entrega 2 Quitinas; antídoto + XP/Ouro/Essência Bruta |
| Rastros sob o Micélio — Daeryn | 4 | Caçadores entregues e A Primeira Carapaça entregue | 2 Rastreadores; Runa de Campo consumível |
| Vigias do Último Limiar — Lithwynn | 5 | Corrupção entregue e Rastros entregues | 2 Vigias; Essência Vital consumível |

As recompensas são de **entrega única**. Item de encomenda é consumido **somente ao entregar a missão** ao NPC correto; nunca automaticamente ao aceitar ou obter a mercadoria.

**Caçadas adicionais:** Rastro Micelial exige nível **4**, além do capítulo de Vorren concluído; Guardiões do Limiar exige nível **5**, além do capítulo de Lithwynn concluído. Os três encontros do Portal existentes antes deste incremento continuam sem novo nível mínimo.

Os requisitos e valores acima estão como `BALANCE_DRAFT`, pendentes de decisão do proprietário, mas são aplicados e testáveis na branch.

## 3. Drops, progressão e economia

Os quatro monstros fornecem **materiais já cadastrados**, sem novos itens substitutos dos Vínculos:

| Espécie | Drop material definido | Uso existente |
|---|---|---|
| Fungorro Espinhal | Núcleo Fúngico | venda, conversão em Essência Bruta, contratos |
| Casco de Esporos | Quitina de Esporos | venda/conversão, encomenda de Durnan e outros contratos |
| Rastreador Micelial | Fibra Micelial | venda/conversão e encomendas |
| Vigia do Limiar | Lasca da Ruína | venda/conversão e encomendas de marcações |

As regras de drop permanecem na definição dos inimigos/encontros, não nos sprites. Ondas continuam limitadas a quatro inimigos; recompensas únicas de Grau de Vínculo e Memória do Colosso não entram nos modos repetíveis. Níveis, XP, Ouro, Ressonância e quantidade de materiais continuam `BALANCE_DRAFT`.

## 4. Lore que acompanha a evolução

`src/content/progressiveFaunaLore.ts` define observações do Bestiário de campo para as quatro espécies, ainda `CONTENT_DRAFT`. A descoberta é derivada exclusivamente de `BattleWon:encounterId` ou `completedEncounterIds`, ambos registrados após reivindicação da vitória: abrir o Portal, ver o NPC ou aceitar uma missão não revela fatos.

- **Base:** seção recolhível de relatórios de fauna realmente identificada neste save; somente os dados já conhecidos aparecem.
- **Vorren:** Bestiário existente mantém seu desbloqueio canônico, mas agora contabiliza vitórias em Ondas/Caçadas além da campanha, exibindo observações das quatro espécies quando conhecidas.
- **Sem migração de schema para lore:** as fichas são derivadas do save real, não criam progressão narrativa paralela nem modificam memórias dos cinco Vínculos.
- **Lore histórico:** documentos de Ruína, Vyltranos e Crônicas continuam fora deste incremento; integrar fatos antigos requer revisão de cânone.

## 5. Checklist de release

- [ ] `npm run check` passou no commit final, incluindo novos testes de sprites, gate de nível, drops, missões e descobertas.
- [ ] Imagens 128×128 existem, são PNG RGBA, e cada um dos 16 quadros difere dos demais.
- [ ] `BattleScreen` exibe animações corretas para idle, ataque, dano, morte; opções de movimento reduzido e fallback.
- [ ] Missões de nível 2/3/4/5 só liberam no nível certo e nunca se autoaceitam.
- [ ] Caçadas extras bloqueiam realmente no domínio se nível ou capítulo não atenderem.
- [ ] Drops/XP/Ouro entram uma única vez na vitória; entrega consome material só uma vez.
- [ ] Bestiário não revela espécies não encontradas e suporta vitórias repetíveis.
- [ ] Nenhum save antigo perde Vínculos, quests, Inventário, Ouro, Base ou registros.
- [ ] Playwright E2E e QA visual de timings/frames em 1366×768 e 1920×1080; nenhum deploy ou merge até autorização.

## 6. OWNER_DECISION

Arte final, balanceamento numérico, nomes definitivos, frequência de drop, novos ataques exclusivos (habilidade mecânica), música e diálogos históricos ainda exigem aprovação específica. Este pacote não canoniza interpretações visuais nem implementa habilidades mágicas novas.
