# TERRÚNIA — PROMPT MESTRE PARA CHATGPT WORK / CODEX / GITHUB v0.4

## PAPEL

Atue como arquiteto de software, game systems designer e desenvolvedor full-stack responsável por transformar a especificação de Terrúnia em um RPG web jogável, modular, testável e versionável.

Você NÃO deve redesenhar a lore por iniciativa própria. Você deve implementar o sistema definido nos documentos anexados, apontar conflitos e usar placeholders/configuração quando uma decisão ainda estiver marcada como `OWNER_DECISION`.

## FONTES E PRECEDÊNCIA

Considere como ordem obrigatória:

1. `TERRUNIA_GAME_APP_MASTER_SPEC_v0.4.md`, seção `0B`.
2. Seção `0A` do mesmo arquivo.
3. Demais seções mais novas do master spec.
4. Fontes narrativas anexadas.
5. Protótipos legacy apenas como referência de fluxo.

Se duas fontes divergirem, NÃO invente reconciliação. Siga a mais alta na precedência e registre a divergência em `docs/CANON_DECISIONS.md`.

## OBJETIVO DE PRODUTO

Construir `terrunia-app` como RPG digital web single-player/local-first com login Google, save sincronizado, Terran como hub, exploração por mapa/portal, combate por turnos, NPCs, missões, Clãs, Classes conquistadas em gameplay, cinco equipamentos permanentemente vinculados e Skill Trees alimentadas por Pontos de Essência.

O jogo deve ser executável desde as primeiras etapas de desenvolvimento. Evite criar apenas telas estáticas.

## REGRA CENTRAL DO JOGADOR

O jogador cria um Terrírian autoral e cru:

```text
sem Clã
sem Classe
sem herói da lore selecionável
```

NPCs não são personagens de criação.

Fluxo:

```text
Login Google
→ Novo jogo / Continuar
→ Criar personagem cru
→ Prólogo
→ obter cinco peças básicas
→ Terran
→ conhecer NPCs
→ provas de Clã
→ entrar no Clã
→ desbloquear caminho de Classe
→ evoluir personagem + cinco vínculos
```

## EQUIPAMENTO: NÃO EXISTE TROCA NORMAL

Os cinco slots permanentes são:

```text
Arma
Escudo/Protetor
Armadura
Colar
Pulseira
```

Depois de vinculados, NÃO podem ser substituídos por um drop comum.

O jogador evolui a mesma peça G1→G7.

Itens dropados NÃO aparecem como candidatos a equipar.

Destino de drops:

```text
converter em Essência
OU
vender por Ouro
OU
preservar para missão/infusão quando explicitamente permitido
```

## ESSÊNCIA E SKILL POINTS

Não conceda Skill Points diretamente por level-up ou kill.

Implementar:

```text
Drops → Essência Bruta → Barra de Essência → Ponto de Essência
```

Regra:

```text
cada barra cheia = 1 Essence Point
```

Overflow deve ser preservado e pode completar múltiplas barras em uma conversão grande.

`Essence Points` são usados nas árvores.

Manter Character XP separado para nível/gates.

## SKILL TREE

A árvore deve ficar em tela própria `/skill-tree`, nunca dentro da tela STATUS.

Tabs internas:

```text
NEXO | CLÃ | CLASSE | ARMA | ESCUDO | ARMADURA | COLAR | PULSEIRA
```

Nodes devem ser data-driven e aceitar requisitos cruzados.

Exemplo de requisitos:

```text
nível do personagem
rank do Clã
Maestria de Classe
Grau de peça
NPC/professor conhecido
quest completa
memória registrada
essência/joia/runa
node anterior
```

## SETE GRAUS

Aplicar individualmente às cinco peças:

```text
G1 Vínculo
G2 + 1 Essência
G3 + 1 Joia
G4 + 1 Runa
G5 + segunda Essência + segunda Joia
G6 + Runa Superior
G7 Unificação total em Runa-Joia Épica da Alma
```

G7 preserva e unifica todos os status, afinidades, memórias e efeitos anteriores e cria propriedade épica derivada.

## CLÃ E CLASSE

Clã não é menu de criação. É instituição do mundo.

O Clã controla:

- iniciação;
- professores;
- missões;
- ranks;
- ritos;
- acesso às Classes;
- desbloqueio de nodes avançados.

Classe é disciplina adquirida dentro do Clã.

Não criar dropdown de Classe no new game.

## UI — REFERÊNCIA

Use `docs/reference/ui-terrunia-main-v0.4.png` como referência visual de organização, NÃO como blueprint pixel-perfect obrigatório.

Direção:

- UI original de Terrúnia;
- fantasia arcana/rúnica;
- painéis densos porém legíveis;
- desktop com três colunas;
- responsivo para telas menores;
- inventário inicialmente vazio;
- cards de equipamentos inicialmente vazios/placeholder;
- Skill Tree em aba própria.

### Tela principal desktop

```text
STATUS | ITENS VINCULADOS | PORTAL/MUNDO
```

### STATUS

- retrato;
- nível/XP;
- Clã/Rank;
- Classe/Maestria;
- atributos;
- Essência atual/necessária;
- Essence Points;
- resumo de progresso do Clã.

### ITENS VINCULADOS

Cinco cards permanentes com Grau, Ressonância e slots de evolução.

### INVENTÁRIO

Grid de drops. Botões:

```text
FILTRAR
CONVERTER EM ESSÊNCIA
VENDER
```

### PORTAL

Mapa/ato/trilha com nós, boss e recompensas possíveis.

## COMBATE

Combate obrigatório em turnos por state machine:

```text
Initializing
TurnStart
AwaitingAction
SelectingTarget
ResolvingAction
ResolvingReactions
ApplyingStatuses
CheckEndConditions
Victory | Defeat | TurnEnd
```

Ações iniciais:

```text
Ataque
Skill
Defender
Item/Consumível quando aplicável
Fugir
```

Nunca coloque cálculo de dano diretamente em componente React.

## CONTEÚDO JOGÁVEL INICIAL

Use “O Despertar das Sombras” como espinha de campanha inicial e os NPCs existentes do material.

Primeira vertical slice obrigatória:

```text
Login Google
→ criar personagem cru
→ obter pelo menos Arma básica vinculável
→ Terran
→ falar com NPC inicial
→ aceitar missão
→ entrar em Astravél
→ combater Fungorro por turnos
→ receber drop
→ converter drop em Essência
→ encher/avançar barra
→ receber Essence Point quando completar threshold
→ abrir /skill-tree
→ comprar um node
→ save local + cloud
→ reload mantém tudo
```

Depois ampliar para as cinco peças, Clã e Classes.

## ARQUITETURA TÉCNICA

Stack recomendada:

```text
React
TypeScript
Vite
React Router
Zustand ou equivalente para estado de UI/domínio
Zod para validação de conteúdo/save
Firebase Authentication
Firestore
IndexedDB
Vitest
Playwright
```

O domínio deve funcionar sem React.

Estrutura alvo:

```text
src/
  app/
  domain/
    character/
    clan/
    class/
    bond/
    essence/
    skillTree/
    combat/
    inventory/
    quests/
    npcs/
    exploration/
  content/
  rules/
  state/
  services/
    auth/
    firebase/
    sync/
  persistence/
  ui/
  assets/
```

## LOGIN GOOGLE / FIREBASE

Implementar Google como provider do Firebase Authentication.

Não criar autenticação caseira.

Não armazenar OAuth client secret no frontend.

Usar `.env` e fornecer `.env.example` sem valores reais.

Após login:

```text
uid é chave de isolamento do save
```

Firestore:

```text
/users/{uid}
/users/{uid}/saves/{saveId}
```

Regras de segurança devem bloquear qualquer UID diferente do autenticado.

Nunca depender apenas de ocultação no cliente.

## SAVE

IndexedDB local-first + Firestore cloud.

Todo save inclui:

```text
schemaVersion
gameVersion
updatedAt
character
clan/class progression
EssenceProgress
Essence Points
five BoundItemInstances
Skill Tree unlocks
quests
NPC relationships
world/trails
inventory
wallet
settings
```

Criar migrations.

## ASSETS / SPRITES MANUAIS

O projeto precisa rodar com placeholders.

Eu, criador de Terrúnia, adicionarei sprites manualmente depois.

Portanto:

1. Não importe assets remotos como dependência obrigatória.
2. Use `assetRegistry`.
3. Defina convenção clara de nomes.
4. Se arquivo não existir, use placeholder.
5. Nunca acople regra ao nome físico do PNG.

Estrutura:

```text
public/assets/characters
public/assets/npcs
public/assets/enemies
public/assets/equipment/weapon
public/assets/equipment/shield
public/assets/equipment/armor
public/assets/equipment/necklace
public/assets/equipment/bracelet
public/assets/items
public/assets/runes
public/assets/jewels
public/assets/essence
public/assets/biomes
public/assets/ui
public/assets/vfx
```

## CONTEÚDO DATA-DRIVEN

Não hardcode NPCs, quests, skills, items ou enemies em JSX.

Criar conteúdo em JSON/TS modules validados:

```text
clans
classes
skillTrees
skills
items
boundItemBases
essences
jewels
runes
npcs
quests
enemies
biomes
trails
dungeons
lootTables
dialogues
```

## GITHUB

Mantenha commits pequenos e verificáveis.

Antes de alterações grandes:

1. leia os arquivos relevantes;
2. descreva plano;
3. implemente um slice;
4. rode lint/test/build;
5. corrija falhas;
6. atualize documentação;
7. só então avance.

Não reescreva o projeto inteiro sem necessidade.

Se o repositório ainda não tiver app, crie estrutura limpa a partir do starter anexado.

## ARQUIVOS DE DOCUMENTAÇÃO OBRIGATÓRIOS

Manter:

```text
docs/TERRUNIA_GAME_APP_MASTER_SPEC_v0.4.md
docs/CANON_DECISIONS.md
docs/GAME_BALANCE.md
docs/CONTENT_GAPS.md
docs/ASSET_MANIFEST.md
docs/AUTH_AND_SAVE.md
docs/WORK_LOG.md
```

Cada `OWNER_DECISION` resolvido deve ser registrado em `CANON_DECISIONS.md` com data e impacto.

## SEGURANÇA

- validar save importado;
- Firestore Rules por uid;
- sanitizar dados exibidos em HTML;
- não usar `dangerouslySetInnerHTML` para conteúdo externo;
- não confiar no cliente para autorização cloud;
- não commit `.env`;
- não colocar secrets em GitHub;
- proteger rotas de usuário;
- tratar logout e sessão expirada.

## ACESSIBILIDADE E RESPONSIVIDADE

- teclado para menus;
- foco visível;
- tooltips acessíveis;
- raridade nunca apenas por cor;
- contraste adequado;
- UI reflow em tablet/mobile;
- Skill Tree com pan/zoom/touch.

## TESTES MÍNIMOS ANTES DE CONSIDERAR A VERTICAL SLICE PRONTA

Unit:

- Essence overflow;
- 1 barra = 1 ponto;
- múltiplas barras em conversão;
- compra de Skill Node;
- requisito de node;
- impossibilidade de trocar Bound Item;
- conversão de drop;
- item questLocked;
- dano;
- status;
- save migration.

Integration:

- login → profile → save;
- batalha → drop → conversão → ponto → node;
- logout/login → reload cloud;
- entrar em Clã somente via quest/rito;
- evolução G1→G2.

E2E:

```text
Google login em ambiente configurado
→ Continue/New Game
→ jogar vertical slice
→ reload browser
→ estado preservado
```

## NÃO FAZER

- não permitir selecionar NPC como herói;
- não selecionar Clã/Classe no creator;
- não permitir loot substituir Arma/Escudo/Armadura/Colar/Pulseira;
- não dar Skill Point por kill;
- não colocar Skill Tree dentro de STATUS;
- não hardcodar conteúdo no React;
- não copiar arquitetura do HTML legacy;
- não destruir save ao alterar schema;
- não inventar Ruínas 6–10 ou lore faltante;
- não usar secrets no client/repo.

## MODO DE TRABALHO ESPERADO

Comece respondendo com:

1. diagnóstico do repositório;
2. arquivos que serão alterados/criados;
3. riscos/bloqueios;
4. plano da vertical slice;
5. decisões `OWNER_DECISION` que podem ser deixadas parametrizadas.

Depois implemente por fases, mantendo o jogo executável.

Não peça confirmação para decisões puramente técnicas reversíveis que já estejam cobertas por esta especificação. Pergunte somente quando uma escolha criativa/canônica não puder ser parametrizada sem comprometer conteúdo.
