# TERRÚNIA — GAME APP MASTER SPEC v0.4

**Documento consolidado para ChatGPT Work / GitHub / implementação jogável.**

**Base:** `TERRUNIA_APP_SYSTEM_SPEC.md` v0.1 + revisões v0.3 do Personagem-Nexo + revisão v0.4 de UI, progressão por Essência, inventário sem troca de equipamento, autenticação Google e preparação GitHub/Work.

**Nota de precedência:** `0B — REVISÃO CANÔNICA v0.4` > `0A — REVISÃO CANÔNICA v0.3` > seções 51+ > material v0.1. Em qualquer conflito, a regra de versão mais nova vence. Valores ainda não fechados permanecem `OWNER_DECISION`.


# 0B. REVISÃO CANÔNICA v0.4 — UI, ESSÊNCIA, EQUIPAMENTO PERMANENTE, LOGIN E GITHUB

Esta seção é **OBRIGATÓRIA** para qualquer implementação iniciada pelo ChatGPT Work, Codex ou outro agente. Ela substitui regras anteriores de inventário/equipamento/progressão que permitam trocar as cinco peças vinculadas ou concedam Skill Points diretamente por level-up/loot.

## 0B.1 Filosofia central da interface

A organização visual pode usar como referência a leitura compacta de RPGs clássicos com três painéis, mas a arte, os componentes e a identidade devem ser originais de Terrúnia.

Tela principal recomendada em desktop:

```text
┌────────────────────┬──────────────────────────────┬────────────────────┐
│ STATUS / NEXO      │ ITENS VINCULADOS             │ PORTAL / MUNDO     │
│ personagem         │ arma | escudo | armadura     │ região / ato       │
│ nível / atributos  │ colar | pulseira             │ nós / missões      │
│ Essência           │ Ressonância                  │ recompensas        │
│ progresso do Clã   │ inventário de drops          │ entrar/explorar    │
└────────────────────┴──────────────────────────────┴────────────────────┘

Navegação inferior/lateral:
STATUS | SKILL TREE | MISSÕES | NPCs/RELAÇÕES | CONFIG
```

**Skill Tree é uma tela/aba separada.** Não renderizar a árvore completa dentro do painel STATUS.

A imagem de referência oficial desta versão deve ficar em:

```text
/docs/reference/ui-terrunia-main-v0.4.png
```

## 0B.2 As cinco peças vinculadas são permanentes

O personagem possui exatamente cinco eixos principais de equipamento pessoal:

```text
weapon    = Arma Vinculada
shield    = Escudo / Protetor Vinculado
armor     = Armadura Vinculada
necklace  = Colar Vinculado
bracelet  = Pulseira Vinculada
```

Regra canônica:

> Depois que uma peça base é vinculada ao personagem, ela **não é substituída por drops**. Ela evolui.

Drops de armas, armaduras, escudos, acessórios ou artefatos não são candidatos a equipamento. Eles são tratados como fontes de matéria/energia, itens de venda, itens de missão ou referências de conhecimento.

Exceção futura só pode existir com evento narrativo explícito de `Reforja do Recipiente`, preservando a identidade/árvore/memórias do vínculo. Não implementar troca normal de equipamento.

## 0B.3 Estado inicial visual

No início da campanha, a UI de equipamento deve estar limpa. Os cards de Arma, Escudo, Armadura, Colar e Pulseira exibem moldura, nome do slot e silhueta/placeholder até a obtenção/vinculação da peça base correspondente.

O inventário também começa vazio.

A UI não deve preencher o inventário com equipamentos demonstrativos em produção.

## 0B.4 O inventário não é um armário de equipamentos

O inventário armazena apenas objetos obtidos no mundo que ainda aguardam destino:

```text
drop
material
fragment
essence_source
rune
jewel
consumable
quest
lore
trade
```

Um item obtido pode possuir ações permitidas:

```ts
convertToEssence?: boolean;
sellable?: boolean;
consumable?: boolean;
questLocked?: boolean;
canInfuseBoundItem?: boolean;
```

`questLocked = true` bloqueia venda e conversão.

## 0B.5 Conversão de drops em Essência

Fluxo padrão:

```text
Combate / missão / baú
        ↓
Receber drops
        ↓
Inventário temporário
        ↓
┌─────────────────────┬───────────────────┐
│ CONVERTER EM ESSÊNCIA│ VENDER POR OURO   │
└─────────────────────┴───────────────────┘
        ↓                         ↓
Essência bruta             Economia / NPCs
```

Não equipar o drop.

Conversão deve mostrar preview:

```text
nome do drop
raridade
essência gerada
afinação/afinidade opcional
bônus por Clã/Skill/passiva
confirmação
```

## 0B.6 Barra de Essência e Pontos de Essência

A build não recebe Skill Points diretamente de drops, kills ou level-up.

A progressão principal de árvores usa:

```text
Essência Bruta → Barra de Essência → Ponto de Essência
```

Estrutura:

```ts
type EssenceProgress = {
  current: number;
  required: number;
  essencePoints: number;
  lifetimeEssence: number;
  cycle: number;
};
```

Ao converter um drop:

```text
current += essenceValue
```

Enquanto `current >= required`:

```text
current -= required
essencePoints += 1
cycle += 1
required = nextEssenceThreshold(cycle)
```

Overflow é preservado. Nunca descartar Essência excedente.

### Regra canônica

> **1 barra completa = 1 Ponto de Essência.**

O valor `required` deve ser data-driven. Para desenvolvimento, usar uma tabela editável, não uma fórmula escondida.

Exemplo inicial de teste, NÃO CANÔNICO:

```json
[100, 125, 150, 180, 215, 255, 300, 350, 405, 465]
```

Após o último valor da tabela, o ruleset pode usar crescimento configurável. `OWNER_DECISION` para curva final.

## 0B.7 Relação entre XP normal e Essência

Separar conceitos:

```text
Character XP     = nível, gate narrativo e acesso de conteúdo
Essence          = enchimento da barra
Essence Points   = moeda de evolução das Skill Trees
Clan Reputation  = progressão institucional no Clã
Class Mastery    = prática e provas da Classe
Resonance        = experiência individual de cada peça vinculada
```

**Level-up não concede automaticamente Essence Points.**

Missões podem conceder Character XP, Essência Bruta, Reputação, Maestria, Ressonância e Ouro como recompensas independentes.

## 0B.8 Skill Tree em aba própria

Rota obrigatória:

```text
/skill-tree
```

A tela deve permitir trocar contexto por tabs internas:

```text
NEXO
CLÃ
CLASSE
ARMA
ESCUDO
ARMADURA
COLAR
PULSEIRA
```

Cabeçalho:

```text
Pontos de Essência disponíveis
Essência atual / necessária
Clã / Rank
Classe / Maestria
Grau da peça quando aplicável
```

Cada node declara:

```ts
type SkillTreeNode = {
  id: string;
  treeId: string;
  name: string;
  description: string;
  costEssencePoints: number;
  requires: Requirement[];
  effects: Effect[];
  position: { x: number; y: number };
  hiddenUntil?: Requirement[];
  iconAssetId?: string;
};
```

Compra:

```text
validar requisitos
→ validar Essence Points
→ confirmação se node for irreversível
→ descontar pontos
→ aplicar unlock
→ emitir SkillNodeUnlocked
→ autosave
```

## 0B.9 Papel do Clã na progressão

O Clã é o guardião institucional da evolução. O jogador não compra todas as capacidades apenas porque possui Pontos de Essência.

Nodes avançados podem exigir:

- Rank do Clã;
- professor/NPC conhecido;
- missão de iniciação;
- rito concluído;
- Maestria de Classe;
- Grau mínimo de equipamento;
- Memória específica;
- Essência/Joia/Runa específica.

Isso conecta jogador, NPCs, missões e build.

## 0B.10 Transformação dos cinco vínculos

Os 7 Graus continuam válidos individualmente para cada peça:

| Grau | Estrutura |
|---|---|
| I | Vínculo e árvore básica |
| II | 1 Fragmento de Essência |
| III | 1 Joia |
| IV | 1 Runa |
| V | segunda Essência + segunda Joia |
| VI | Runa Superior |
| VII | Unificação em Runa-Joia Épica da Alma |

O item pode mudar:

- sprite;
- nome;
- moldura;
- efeitos visuais;
- estatísticas;
- habilidades;
- branches da Skill Tree.

O `assetRegistry` deve aceitar sprite por peça + Grau sem alteração de código de domínio.

## 0B.11 UI principal revisada

### STATUS
Mostrar somente:

- retrato;
- nome;
- nível e XP;
- Clã/Rank;
- Classe/Maestria;
- atributos;
- barra de Essência;
- Pontos de Essência;
- resumo de progresso do Clã;
- atalhos de navegação.

Não mostrar árvore completa aqui.

### ITENS VINCULADOS
Cinco cards:

```text
ARMA | ESCUDO | ARMADURA | COLAR | PULSEIRA
```

Cada card mostra:

- sprite atual/placeholder;
- Grau;
- Ressonância;
- slots estruturais liberados pelo Grau;
- resumo de status;
- botão DETALHES / EVOLUIR.

### INVENTÁRIO
Grid limpo. Ações principais:

```text
FILTRAR
CONVERTER EM ESSÊNCIA
VENDER
```

### PORTAL
Mapa/ato/trilha com nós:

```text
completed
current
locked
boss
quest
```

## 0B.12 Login obrigatório com Google

Produção deve possuir tela `/login` antes do save em nuvem.

Stack recomendada:

```text
Firebase Authentication
Provider: Google
Firestore: save/profile cloud
IndexedDB: cache/local-first
```

O frontend usa variáveis de ambiente para configuração de projeto. **Nunca colocar client secret OAuth no frontend ou repositório.**

Arquivos esperados:

```text
src/services/firebase/firebase.ts
src/services/auth/authService.ts
src/state/authStore.ts
src/ui/screens/LoginScreen.tsx
firestore.rules
.env.example
```

Modelo de usuário:

```ts
type UserProfile = {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL: string | null;
  createdAt: string;
  lastLoginAt: string;
  activeSaveId: string | null;
};
```

Coleções sugeridas:

```text
/users/{uid}
/users/{uid}/saves/{saveId}
/users/{uid}/meta/settings
```

Somente o usuário autenticado pode ler/escrever seus documentos.

## 0B.13 Save local + cloud

Objetivo:

```text
IndexedDB = resposta imediata/local
Firestore = backup/sync autenticado
```

Fluxo:

```text
login
→ carregar profile
→ ler save local
→ ler save cloud
→ resolver versão/updatedAt
→ migrar schema
→ carregar jogo
```

Autosave em:

- unlock de node;
- evolução de Grau;
- inserção de componente;
- conclusão de quest;
- recompensa importante;
- retorno de combate;
- mudança de Clã/Classe;
- saída segura.

## 0B.14 Rotas revisadas

```text
/login
/
/new-game
/character/create
/terran
/character
/skill-tree
/inventory
/bound-items
/bound-items/:slot
/quests
/npcs
/world
/trail/:trailId
/dungeon/:dungeonId
/battle
/loot
/settings
/dev/content
```

## 0B.15 Política de sprites manuais

Nenhum sprite deve ser obrigatório para o motor funcionar.

Estrutura recomendada:

```text
/public/assets/
  characters/
  npcs/
  enemies/
  equipment/
    weapon/
    shield/
    armor/
    necklace/
    bracelet/
  items/
  runes/
  jewels/
  essence/
  biomes/
  ui/
  vfx/
```

O criador pode adicionar arquivos manualmente. O conteúdo aponta para `assetId`; `assetRegistry.ts` resolve o caminho. Arquivo ausente usa placeholder e warning em desenvolvimento.

## 0B.16 Recompensas de missão revisadas

Priorizar:

```text
Character XP
Essência Bruta
Ouro
Clan Reputation
Class Mastery
Ressonância de peça
Fragmentos de Essência
Joias
Runas
acesso a NPC/serviço
lore/memória/título
```

Evitar recompensa de “nova arma melhor” porque as peças vinculadas não são substituídas.

## 0B.17 Critérios de aceite adicionais v0.4

1. usuário consegue fazer login com Google;
2. usuário só acessa seu próprio save em nuvem;
3. novo personagem começa sem Clã e sem Classe;
4. cinco slots vinculados começam vazios/placeholder até aquisição do prólogo;
5. após vínculo, peça não pode ser trocada por drop;
6. drops podem ser convertidos em Essência ou vendidos conforme flags;
7. itens de quest não podem ser convertidos/vendidos;
8. barra de Essência preserva overflow;
9. cada barra cheia concede exatamente 1 Essence Point;
10. Skill Tree não está embutida no STATUS;
11. rota `/skill-tree` funciona independentemente;
12. node só pode ser comprado com requisitos + Essence Points;
13. cinco peças evoluem independentemente G1–G7;
14. sprites podem ser inseridos manualmente via registry;
15. ausência de sprite não quebra o jogo;
16. combate continua por turnos e data-driven;
17. missões/NPCs continuam conectados aos gates de Clã/Classe;
18. save local/cloud preserva árvore, Essência, vínculos e quests.

## 0B.18 Decisões ainda necessárias do criador

`OWNER_DECISION` prioritários após v0.4:

1. origem narrativa das cinco peças básicas;
2. momento exato em que cada uma é vinculada;
3. tabela final de Essência necessária por Ponto;
4. valor de Essência por raridade/drop;
5. taxa de venda por raridade;
6. se todas as árvores gastam o mesmo pool de Essence Points ou pools separados;
7. refund/respec de nodes;
8. custo de Ritos G2–G7;
9. limite de inventário para drops;
10. regra final de consumíveis;
11. quais Joias/Runas podem ser vendidas versus preservadas para infusão;
12. conflitos de sincronização local/cloud;
13. modo convidado ou login Google obrigatório desde a primeira tela;
14. domínio/hosting final;
15. nomes definitivos dos cinco equipamentos iniciais.


---

# TERRÚNIA — Especificação Mestre do Sistema para Aplicação

**Documento:** `TERRUNIA_APP_SYSTEM_SPEC.md`  
**Status:** Especificação de implementação / Canon técnico proposto v0.1  
**Objetivo:** transformar o sistema de RPG e o protótipo digital de Terrúnia em uma aplicação web modular, versionável no GitHub e legível por ChatGPT Work/agentes de desenvolvimento.  
**Idioma do produto:** pt-BR  
**Tipo de produto inicial:** RPG digital single-player, data-driven, com hub em Terran, exploração por trilhas, combate por turnos, progressão, inventário, equipamentos, quests e conteúdo expansível.

---

## 0. INSTRUÇÃO DIRETA PARA O WORK / AGENTE DE IMPLEMENTAÇÃO

Use este documento como **fonte técnica principal** para construir o aplicativo de Terrúnia.

Regras obrigatórias de implementação:

1. Não hardcodar conteúdo de jogo dentro dos componentes de interface.
2. Separar **motor de regras**, **estado do jogador**, **conteúdo**, **UI** e **persistência**.
3. Todos os valores de balanceamento devem existir em arquivos/configurações editáveis.
4. Toda entidade importante deve possuir `id` estável e independente do texto exibido.
5. O sistema deve aceitar expansão de clãs, classes, raças, biomas, itens, inimigos, dungeons, NPCs e quests sem alterar o núcleo do motor.
6. Não resolver silenciosamente divergências do material original. Valores marcados como `OWNER_DECISION` devem permanecer configuráveis até aprovação do criador.
7. A primeira versão deve funcionar sem backend obrigatório.
8. Persistência local deve possuir versão de schema e suporte a migração.
9. Combate deve ser implementado por máquina de estados, e não por encadeamento informal de botões.
10. Fórmulas de combate devem ser funções puras e testáveis.
11. Conteúdo narrativo não deve ser usado como regra mecânica sem campo explícito no banco de dados.
12. O projeto deve priorizar legibilidade, manutenção e expansão de longo prazo sobre velocidade de prototipagem.

---

# 0A. REVISÃO CANÔNICA v0.3 — PERSONAGEM COMO NEXO CENTRAL

Esta seção **substitui qualquer regra anterior** que trate Clã ou Classe como opções da tela de criação ou que trate NPCs existentes como personagens jogáveis selecionáveis.

## 0A.1 Regra central

O jogador controla **um personagem autoral criado do zero**. Esse personagem é o `Character Nexus` — o elo central entre:

```text
                           PERSONAGEM / NEXO
                                  │
             ┌────────────────────┼────────────────────┐
             │                    │                    │
            CLÃ                 CLASSE              MUNDO/NPCs
             │                    │                    │
             └─────────────── PROGRESSÃO ──────────────┘
                                  │
       ┌──────────────┬───────────┼───────────┬──────────────┐
       │              │           │           │              │
      ARMA          ESCUDO     ARMADURA      COLAR        PULSEIRA
       │              │           │           │              │
       └──────────────┴───────────┴───────────┴──────────────┘
                                  │
                       REDE DE VÍNCULO DA ALMA
```

NPCs, heróis históricos e personagens da lore **nunca são opções de criação**. Eles existem no mundo para ensinar, recrutar, conceder missões, testar, rivalizar, negociar e reagir ao personagem criado pelo jogador.

## 0A.2 Estado inicial do novo jogo

O novo personagem começa como:

```json
{
  "raceId": "terririan",
  "clanId": null,
  "classId": null,
  "clanRank": 0,
  "classMastery": 0,
  "titleIds": [],
  "bondedEquipment": {
    "weapon": null,
    "shield": null,
    "armor": null,
    "necklace": null,
    "bracelet": null
  }
}
```

Na criação, o jogador define apenas dados pessoais e fundação mecânica neutra aprovada pelo ruleset, como nome, aparência e distribuição inicial de atributos/perícias. **Clã e Classe não aparecem como escolhas de criação.**

## 0A.3 Entrada no Clã

A filiação ocorre por gameplay em Terran.

Fluxo:

```text
Criar personagem cru
→ conhecer Terran
→ conversar com representantes dos Clãs
→ realizar missões/provas de iniciação
→ escolher/ser aceito por um Clã
→ realizar Ritual de Filiação
→ desbloquear Árvore do Clã
→ receber acesso aos mestres e caminhos de Classe
```

O Clã passa a ser o **responsável institucional pela evolução do personagem**. Ele oferece:

- mestres e treinadores;
- provas de progressão;
- missões de graduação;
- ritos de Vínculo;
- acesso a técnicas de Classe;
- acesso a Runas/Joias compatíveis;
- cerimônias para os Graus de equipamentos;
- títulos e patentes;
- conteúdo narrativo exclusivo.

## 0A.4 Classe como progressão, não seleção inicial

A Classe é uma **disciplina do Clã**. Ela surge depois da filiação.

O personagem não “nasce” Sentinela da Luz, Forjador Arcano ou Caçador de Constelações. Ele entra em um Clã e, por treino, missões e escolhas na árvore, avança até um caminho de Classe.

Modelo:

```text
PERSONAGEM CRU
     │
 FILIAÇÃO
     │
   CLÃ
     │
TREINO FUNDAMENTAL
     │
 ┌───┼───────────────┐
 │   │               │
CAMINHO A        CAMINHO B        CAMINHO C
 │                   │               │
CLASSE A          CLASSE B         CLASSE C
 │                   │               │
MAESTRIA          MAESTRIA         MAESTRIA
```

Cada Classe continua pertencendo exclusivamente ao seu Clã, mas seu desbloqueio é um acontecimento do jogo.

## 0A.5 Progressões vinculadas

O personagem possui quatro progressões relacionadas, mas independentes o suficiente para serem salvas e balanceadas separadamente:

1. **Nível do Personagem** — experiência geral, atributos e perícias.
2. **Rank do Clã** — reputação, provas e acesso institucional.
3. **Maestria de Classe** — técnicas, passivas e especialização.
4. **Vínculo dos Equipamentos** — Ressonância e 7 Graus de cada peça vinculada.

O Clã controla gates de progressão, mas não substitui XP. Exemplo:

```text
Requisitos para promoção de Classe:
Nível mínimo do personagem
+ Rank mínimo no Clã
+ nodes obrigatórios
+ missão/prova do mestre
+ feito com equipamento vinculado
```

## 0A.6 Os cinco equipamentos vinculados

Todo personagem possui cinco linhas principais de equipamento pessoal:

```text
weapon     = Arma
shield     = Escudo / Protetor Arcano de mão secundária
armor      = Armadura
necklace   = Colar
bracelet   = Pulseira
```

Essas cinco peças podem receber Vínculo e evoluir junto com o personagem.

O termo `shield` deve aceitar tanto um escudo físico quanto uma manifestação/protetor arcano compatível com builds que não usem escudo tradicional.

Cada peça possui:

- ID de instância único;
- Ressonância própria;
- Grau de Vínculo próprio;
- Skill Tree própria;
- Memórias;
- Cicatrizes;
- Essências;
- Joias;
- Runas;
- forma visual por Grau;
- nome evolutivo;
- relação com Clã/Classe.

## 0A.7 Regra dos 7 Graus aplicada aos cinco equipamentos

A progressão definida para o Item Vinculado passa a valer para **Arma, Escudo, Armadura, Colar e Pulseira**.

| Grau | Desbloqueio estrutural |
|---|---|
| I | Vínculo e Skill Tree básica |
| II | + 1 Fragmento de Essência |
| III | + 1 Joia |
| IV | + 1 Runa |
| V | + 1 Essência e + 1 Joia adicionais |
| VI | + 1 Runa Superior |
| VII | Unificação total em Runa-Joia Épica da Alma |

Cada equipamento evolui separadamente. Um personagem pode, por exemplo, ter:

```text
Arma       Grau V
Escudo     Grau III
Armadura   Grau IV
Colar      Grau II
Pulseira   Grau I
```

Isso cria decisões de prioridade e impede que todos os slots avancem automaticamente juntos.

## 0A.8 Rede de Skill Trees

A UI deve apresentar o personagem no centro e suas progressões orbitando-o:

```text
                         [ ÁRVORE DO CLÃ ]
                                │
                         [ ÁRVORE DE CLASSE ]
                                │
[ ARMA ] ── [ ESCUDO ] ── [ PERSONAGEM ] ── [ ARMADURA ]
                                │
                         [ COLAR ] [ PULSEIRA ]
```

Tecnicamente não precisa ser um único grafo físico; pode ser composto por árvores relacionadas. Porém, todos os nodes devem conseguir declarar requisitos cruzados, por exemplo:

```json
{
  "requires": [
    { "type": "characterLevel", "value": 6 },
    { "type": "clanRank", "value": 2 },
    { "type": "classMastery", "value": 4 },
    { "type": "equipmentGrade", "slot": "weapon", "value": 3 }
  ]
}
```

## 0A.9 Equipamento inicial

O personagem pode receber/obter um conjunto básico neutro no prólogo:

- arma básica;
- escudo/protetor básico;
- armadura básica;
- colar simples;
- pulseira simples.

Essas peças não precisam ser mágicas ou raras. O valor delas está em poderem **crescer com o personagem**, tornando-se únicas ao longo da campanha.

A origem exata desse conjunto inicial é `OWNER_DECISION`:

- herança familiar;
- kit civil de Terran;
- presente de um mentor;
- equipamento da cerimônia de iniciação;
- peças obtidas nas primeiras missões.

## 0A.10 Regra para NPCs

`NPCDefinition` nunca deve possuir flag de seleção como personagem inicial.

NPCs podem assumir os papéis:

```text
clanRecruiter
clanMaster
classTrainer
bondMaster
questGiver
vendor
artisan
rival
companionNpc
lore
normal
```

O personagem criado pelo usuário é o único protagonista controlável no MVP.

---

# 1. VISÃO DO PRODUTO

Terrúnia é um universo de fantasia mágica em que biomas, povos, artefatos, runas e fenômenos entrópicos coexistem em uma malha arcana viva. A aplicação deve traduzir esse universo para um RPG digital no qual o jogador cria um personagem, desenvolve uma build, circula por Terran, recebe missões, equipa artefatos, explora trilhas e Ruínas, combate criaturas e progride até ameaças maiores ligadas à Entropia e à Ruína Crescente.

## 1.1 Pilares de gameplay

- **Identidade:** personagem cru → entrada no Clã → evolução de Classe orientada pelo Clã → cinco equipamentos vinculados → Skill Web pessoal.
- **Equipamento:** armas, armaduras, acessórios, runas, joias e consumíveis.
- **Dilema Terrírian:** Absorção de Essência sacrifica itens por poder temporário extremo.
- **Exploração:** trilhas/nós com encontros, baús, eventos, acampamentos e bosses.
- **Combate:** turnos, alvos, recursos, habilidades, efeitos temporários e recompensas.
- **Cidade:** Terran funciona como hub econômico, narrativo e de preparação.
- **Progressão:** XP, níveis, pontos de evolução, itens melhores, mapas e dungeons.
- **Narrativa sistêmica:** quests e NPCs conectam mecânicas à lore.

## 1.2 Loop principal

```text
Criar/Carregar personagem
        ↓
Terran — preparar build
        ↓
Aceitar quests / comprar / equipar / recuperar
        ↓
Escolher região ou Ruína
        ↓
Explorar trilha
        ↓
Combate / evento / loot / acampamento / NPC
        ↓
Boss ou objetivo
        ↓
XP + ouro + itens + progresso de quest
        ↓
Retorno a Terran
        ↓
Evoluir personagem e desbloquear novo conteúdo
        ↺
```

---

# 2. FONTES DO PROJETO E TRATAMENTO DE CANON

O material existente mistura versões de regras e conteúdo criadas em momentos diferentes. Para implementação, o app deve distinguir:

- `canonLore`: fatos do universo.
- `ruleset`: regras mecânicas selecionadas para a versão do jogo.
- `prototypeLegacy`: comportamentos existentes no HTML antigo.
- `experimental`: mecânicas ainda não aprovadas como definitivas.

## 2.1 Fontes principais analisadas

- `Introdução ao Sistema.txt`
- `Terrúnia - Manual de criação do Player.txt`
- `Manual Criação v2.2.txt`
- `SISTEMA CLASSES E CLÃS.txt`
- `📜 Terrúnia - RPG (Baseado em Savage Worlds).txt`
- `Terrunia - O Início das Ruínas.html`
- `terrunia resquicios da ruinas.txt`
- `Ruínas Perdidas de Terran_ As Dungeons da Entropia.txt`
- `Universo Terrúnia.txt`
- `Terrúnia_ Bioma e Ecosistema.txt`
- `NPCS TERRÚNIA.txt`
- materiais narrativos de Aelior Thamorel, Ruína Crescente e Terran.

## 2.2 Divergências que NÃO devem ser escondidas

### D01 — Pontos iniciais de atributos
- Algumas versões: **3 pontos**.
- Documento Savage Worlds anterior: **5 pontos**.
- Implementação: usar `rules.characterCreation.attributePoints`.
- Valor proposto para MVP: `3`.
- Status: `OWNER_DECISION`.

### D02 — Pontos iniciais de perícias
- Algumas versões: **3 pontos**.
- Documento Savage Worlds anterior: **12 pontos**.
- Implementação: usar `rules.characterCreation.skillPoints`.
- Valor proposto para MVP: `3` se as perícias funcionarem como bônus discretos; `12` se seguirem progressão d4–d12.
- Status: `OWNER_DECISION`.

### D03 — Progressão de atributos
Existem conceitos simultâneos de:
- dado base `d4 → d6 → d8 → d10 → d12`;
- valor numérico usado em fórmulas de Vida/Defesa/Ataque;
- bônus diretos de clã e classe.

**Solução técnica:** armazenar dois campos independentes:

```ts
Attribute {
  rank: 0 | 1 | 2 | 3 | 4;   // d4,d6,d8,d10,d12
  bonus: number;              // bônus numérico permanente
}
```

O dado é calculado por `rank`. O bônus numérico não altera automaticamente o rank.

### D04 — Fórmulas de status
O Manual v2.2 registra:

```text
Defesa = Vigor / 2 + equipamento defensivo
Ataque físico = Força / 2 + modificadores
Ataque mágico = Astúcia / 2 + modificadores
Vida = 10 + Vigor × 2
Mana = 5 + Espírito × 3
```

O protótipo HTML usa valores base independentes (`baseAtk`, `baseDef`, `maxHp`, `maxMp`, `agi`) e equipamentos somados diretamente.

**Implementação:** fórmulas devem ser configuráveis em `rules/combat.ts` ou em configuração serializável. Não reutilizar os números fixos do HTML como canon.

### D05 — XP
Manual:

```text
Nv1      0
Nv2    250
Nv3    750
Nv4  1.500
Nv5  2.500
Nv6  4.000
Nv7  6.000
Nv8  8.500
Nv9 11.500
Nv10 15.000
Nv11 19.000
Nv12 24.000
Nv13 30.000
Nv14 37.000
```

Protótipo HTML:
- `nextXp = 50` no nível 1.
- próximo requisito cresce `× 1.4`.

**Canon técnico proposto:** utilizar a tabela explícita do manual e manter nível máximo 14.

### D06 — Absorção de Essência
Existem descrições incompatíveis sobre chance de destruição/sobrevivência.

**Implementação:** criar tabela por raridade, não uma chance global. Todos os valores devem ser editáveis.

### D07 — Clãs, linhagens e famílias
O material usa:
- quatro clãs jogáveis principais;
- Anci Da em alguns textos como clã adicional;
- dez famílias fundamentais de Terran;
- antigas linhagens Dûn'Avar;

**Implementação:** não fundir essas categorias.

```text
PlayerClan       = identidade mecânica jogável
CivilFamily      = família social/cívica
HistoricalLineage= linhagem histórica
Faction          = organização genérica
```

---

# 3. ESCOPO DO MVP

## 3.1 Incluído

- criação de personagem cru, sem Clã e sem Classe;
- 4 Clãs acessíveis por iniciação dentro do mundo;
- 12 caminhos de Classe desbloqueáveis e evolutivos após a entrada em um Clã;
- atributos e perícias;
- vantagens/desvantagens;
- status derivados;
- inventário e equipamentos;
- ouro e lojas;
- quests;
- hub de Terran;
- cinco regiões de exploração;
- trilhas sequenciais;
- combate por turnos;
- consumíveis;
- runas/itens especiais básicos;
- loot e raridade;
- XP e níveis 1–14;
- Ruínas como conteúdo de dungeon;
- save local;
- arquitetura pronta para novos povos e campanhas.

## 3.2 Fora do MVP, mas previsto

- multiplayer;
- conta online;
- marketplace entre jogadores;
- servidor autoritativo;
- editor visual de mapas;
- crafting profundo;
- árvore extensa de talentos;
- party com múltiplos personagens controláveis;
- procedural avançado de dungeons;
- campanha cinematográfica completa;
- Vyn/Keryons como sistema jogável principal;
- outras raças jogáveis.

---

# 4. MODELO DE PERSONAGEM

## 4.1 Estrutura base

```ts
type CharacterId = string;

type Character = {
  id: CharacterId;
  name: string;
  age?: number;
  raceId: string;
  clanId: string;
  classId: string;

  level: number;
  xp: number;

  attributes: Record<AttributeId, AttributeValue>;
  skills: Record<SkillId, SkillValue>;

  advantages: string[];
  disadvantages: string[];

  resources: {
    hp: number;
    mp: number;
    fatigue: number;
  };

  progression: {
    unspentAttributePoints: number;
    unspentSkillPoints: number;
    unlockedMaps: string[];
    unlockedDungeons: string[];
  };

  equipment: EquipmentSlots;
  inventory: InventoryState;
  wallet: { gold: number };
  quests: QuestProgress[];
  flags: Record<string, boolean | number | string>;
};
```

## 4.2 Raça inicial

### Terrírian
Características essenciais para o sistema:

- pequeno em estatura;
- conexão excepcional com artefatos mágicos;
- grande domínio de equipamentos encantados;
- acesso à **Absorção de Essência**;
- forte relação com runas, joias e artefatos;
- cultura ligada a Terran.

No MVP, `raceId = "terririan"`.

---

# 5. ATRIBUTOS

## 5.1 Lista canônica atual

```text
astucia     — inteligência, análise, percepção e magia intelectual
agilidade   — reflexos, destreza, mobilidade
forca       — potência física
vigor       — resistência, saúde
espirito    — determinação, carisma, força de vontade e mana
```

## 5.2 Dados de atributo

| Rank | Dado |
|---:|:---:|
| 0 | d4 |
| 1 | d6 |
| 2 | d8 |
| 3 | d10 |
| 4 | d12 |

Representação:

```json
{
  "astucia": { "rank": 0, "bonus": 0 },
  "agilidade": { "rank": 0, "bonus": 0 },
  "forca": { "rank": 0, "bonus": 0 },
  "vigor": { "rank": 0, "bonus": 0 },
  "espirito": { "rank": 0, "bonus": 0 }
}
```

## 5.3 Valor mecânico numérico

Para fórmulas digitais, cada dado precisa possuir valor numérico derivado.

Proposta:

```text
d4  = 4
d6  = 6
d8  = 8
d10 = 10
d12 = 12
attributeScore = dieSize + bonus
```

Isso mantém a identidade visual de Savage Worlds e permite fórmulas digitais previsíveis.

---

# 6. STATUS DERIVADOS

## 6.1 Fórmulas propostas para ruleset `terrunia-core-v1`

```text
VIG = attributeScore(vigor)
FOR = attributeScore(forca)
AST = attributeScore(astucia)
AGI = attributeScore(agilidade)
ESP = attributeScore(espirito)

maxHP          = 10 + VIG × 2 + bônus
maxMP          = 5 + ESP × 3 + bônus
defense        = floor(VIG / 2) + armorDefense + buffs
physicalPower  = floor(FOR / 2) + weaponPower + buffs
magicPower     = floor(AST / 2) + focusPower + buffs
initiative     = AGI + initiativeBonus
```

`OWNER_DECISION`: definir se a esquiva será status separado.

Proposta:

```text
evasion = floor(AGI / 2) + skillBonus(reflexosRapidos) + equipmentEvasion
```

## 6.2 Nunca armazenar status derivados como fonte de verdade

Armazenar somente valores que não possam ser recalculados. `maxHP`, `defense`, `physicalPower` etc. devem ser produzidos por um `StatsCalculator`.

---

# 7. PERÍCIAS

## 7.1 Lista unificada

### Custo 1
- Atletismo
- Sobrevivência
- Persuasão
- Notar
- Curar
- Intimidação
- Investigação

### Custo variável conforme versão
- Acrobacia
- Conhecimento Arcano
- Reflexos Rápidos

### Custo 2
- Furtividade
- Lutar
- Atirar
- Ocultismo
- Conhecimento Histórico
- Mecânica

### Custo 2 ou 3 conforme versão
- Manipulação de Magia

### Custo 3
- Estratégia de Combate
- Domínio Elemental

## 7.2 Estrutura de dados

```json
{
  "id": "atirar",
  "name": "Atirar",
  "linkedAttribute": "agilidade",
  "creationCost": 2,
  "tags": ["combat", "ranged"],
  "description": "Precisão com armas à distância."
}
```

`OWNER_DECISION`: escolher um único custo para Acrobacia, Conhecimento Arcano, Reflexos Rápidos e Manipulação de Magia.

---

# 8. VANTAGENS E DESVANTAGENS

## 8.1 Orçamento

Modelo encontrado no material:

- personagem recebe pontos de vantagem;
- desvantagens fornecem pontos adicionais;
- teto sugerido de 6 pontos totais em uma versão;
- vantagens variam de custo +1 a +3;
- desvantagens variam de -1 a -3.

Proposta de configuração:

```json
{
  "baseAdvantagePoints": 3,
  "maxDisadvantagePoints": 3,
  "maxTotalAdvantageSpend": 6
}
```

## 8.2 Vantagens catalogadas

### Custo 1
- Conexão Arcana
- Olhos Atentos
- Instinto Selvagem
- Curador Nato
- Passo Sutil
- Sentidos Aguçados
- Resistência Natural
- Conhecimento Ancestral
- Reflexos Treinados

### Custo 2
- Guerreiro Rúnico
- Domador de Criaturas
- Magia Ancestral
- Perito em Armas
- Sorte Grande
- Conhecimento de Runas
- Reflexos de Combate
- Determinação Inabalável
- Olhar Estratégico

### Custo 3
- Mestre das Runas
- Canalizador Arcano
- Guardião Eterno
- Manipulador Elemental
- Mestre da Estratégia
- Espírito Indomável
- Instinto de Sobrevivência

## 8.3 Desvantagens catalogadas

### Valor 1
- Coração Generoso
- Gênio Difícil
- Pavio Curto
- Supersticioso
- Medroso
- Descuidado
- Corpo Frágil
- Memória Fraca

### Valor 2
- Fobia de Criaturas Grandes
- Frágil
- Péssimo Mentiroso
- Atração por Problemas
- Vulnerável a Magia
- Corpo Pesado
- Desorientado
- Falta de Foco

### Valor 3
- Ferimento Antigo
- Azarado
- Mão Ruim
- Visão Ruim
- Corpo Débil
- Impulsivo
- Instabilidade Mágica
- Destino Amaldiçoado

## 8.4 Implementação por efeitos

Não codificar pelo nome. Usar efeitos declarativos:

```json
{
  "id": "passo_sutil",
  "type": "advantage",
  "cost": 1,
  "effects": [
    { "type": "skillModifier", "skillId": "furtividade", "value": 2 }
  ]
}
```

---

# 9. CLÃS JOGÁVEIS

## 9.1 Dûn'Avar

**Identidade:** defesa, Barreira Arcana, proteção de Terran.

Passiva-base registrada:

```text
Proteção Arcana
1× por combate: reduzir em 50% o dano recebido durante 1 rodada.
```

Bônus de clã aparecem com variações entre documentos. Proposta configurável:

```json
{
  "attributeBonuses": { "vigor": 1 },
  "derivedBonuses": { "defense": 1 }
}
```

Classes:

1. **Sentinela da Luz** — Tanker
   - Muralha Viva
   - Postura Inquebrantável
   - Vigilância Absoluta

2. **Gladiador da Barreira** — Guerreiro
   - Impacto Arcano
   - Contra-Golpe Rúnico
   - Treino dos Guardiões

3. **Batedor da Vigília** — Assassino
   - Golpe Silencioso
   - Reflexo Sombrio
   - Presença Oculta

## 9.2 Rustal

**Identidade:** runas, inscrições, encantamentos.

Passiva:

```text
Sabedoria das Runas
Permite refazer um teste falho de feitiço/habilidade conforme limite do ruleset.
```

Classes:

1. **Forjador Arcano** — Tanker
   - Armadura Rúnica
   - Punho de Pedra
   - Pele de Cristal

2. **Guardião das Inscrições** — Suporte
   - Runa de Proteção
   - Marcar o Destino
   - Escrita Mística

3. **Gravador das Sombras** — Dano à distância
   - Projeção Arcana
   - Runa Explosiva
   - Fluxo de Mana

## 9.3 Cebios Esti

**Identidade:** astros, destino, previsão, energia celestial.

Passiva:

```text
Leitura Estelar
Prever evento / ganhar vantagem em próximo teste de Astúcia conforme contexto.
```

Classes:

1. **Astrólogo Celestial** — Mago
   - Chuva de Estrelas
   - Selo Astral
   - Sabedoria Antiga

2. **Profeta do Orbe** — Suporte
   - Olhar do Futuro
   - Bênção Celestial
   - Orbe do Destino

3. **Caçador de Constelações** — Dano à distância
   - Arco Estelar
   - Marcar a Lua
   - Disparo Astral

## 9.4 Estres do Ét

**Identidade:** entropia mágica, caos controlado, ruptura.

Passiva:

```text
Fluxo Caótico
Alterar um efeito mágico a favor do personagem 1× por combate.
```

Classes:

1. **Canalizador do Caos** — Mago
   - Explosão Entrópica
   - Distorção Volátil
   - Magia Inconstante

2. **Guardador da Ruptura** — Tanker
   - Zona de Ruína
   - Fluxo Inconstante
   - Padrões do Caos

3. **Mago da Ruína** — Dano à distância
   - Rajada Entrópica
   - Esfera do Caos
   - Ressonância Caótica

---

# 10. MODELO DE CLASSE E HABILIDADE

```ts
type CharacterClass = {
  id: string;
  clanId: string;
  name: string;
  role: 'tank' | 'fighter' | 'assassin' | 'mage' | 'support' | 'ranged';
  attributeBonuses: Partial<Record<AttributeId, number>>;
  passiveSkillId: string;
  activeSkillIds: string[];
  startingTags: string[];
};
```

```ts
type Skill = {
  id: string;
  name: string;
  kind: 'active' | 'passive' | 'reaction';
  cost?: { resource: 'mp' | 'hp' | 'item'; amount: number };
  target: 'self' | 'ally' | 'enemy' | 'allEnemies' | 'area';
  cooldownTurns?: number;
  effects: Effect[];
  tags: string[];
};
```

Exemplo:

```json
{
  "id": "muralha_viva",
  "name": "Muralha Viva",
  "kind": "active",
  "target": "self",
  "effects": [
    {
      "type": "flatDamageReduction",
      "value": 2,
      "durationTurns": 2
    }
  ],
  "tags": ["defense", "dunavar"]
}
```

---

# 11. PROGRESSÃO E XP

## 11.1 Nível máximo

`14`

## 11.2 Tabela de XP acumulado

```json
[
  { "level": 1, "xp": 0 },
  { "level": 2, "xp": 250 },
  { "level": 3, "xp": 750 },
  { "level": 4, "xp": 1500 },
  { "level": 5, "xp": 2500 },
  { "level": 6, "xp": 4000 },
  { "level": 7, "xp": 6000 },
  { "level": 8, "xp": 8500 },
  { "level": 9, "xp": 11500 },
  { "level": 10, "xp": 15000 },
  { "level": 11, "xp": 19000 },
  { "level": 12, "xp": 24000 },
  { "level": 13, "xp": 30000 },
  { "level": 14, "xp": 37000 }
]
```

## 11.3 Recompensas de nível

Material atual:

- cada level up: +1 ponto para atributo **ou** perícia;
- a cada 2 níveis: +1 ponto de perícia adicional.

O protótipo HTML entrega 2 pontos de atributo e aumenta HP/MP diretamente; esse comportamento deve ser tratado como `prototypeLegacy`, não regra definitiva.

---

# 12. FADIGA

O material registra uma mecânica ainda incompleta: uso narrativo correto de vantagens e desvantagens pode gerar XP extra ligado à fadiga.

Para o app digital, separar dois conceitos:

```text
fatigueResource = penalidade/condição mecânica
roleplayBonusXP = recompensa narrativa
```

Status atual: `EXPERIMENTAL`.

Não implementar no MVP como penalidade automática até haver regra fechada.

---

# 13. INVENTÁRIO

## 13.1 Categorias mínimas

```text
weapon
chestArmor
helmet
boots
accessory
rune
gem
consumable
fragment
quest
material
artifact
```

## 13.2 Peso

O protótipo atual possui capacidade máxima `50` e cada item possui `weight/peso`.

Proposta:

```json
{
  "baseCapacity": 50,
  "overweightPolicy": "blockPickup"
}
```

Opções futuras:

- `blockPickup`
- `movementPenalty`
- `combatPenalty`

## 13.3 Slots de equipamento

MVP:

```ts
type EquipmentSlots = {
  weapon: string | null;
  chest: string | null;
  helmet: string | null;
  boots: string | null;
  accessory: string | null;
  runes: string[];
  gems: string[];
};
```

O protótipo exibe arma, peitoral, capacete, botas e runas, mas possui também slot de acessório internamente. O novo app deve tornar acessório explícito.

## 13.4 Requisitos

Itens podem possuir:

```text
requiredLevel
allowedClasses
allowedClans
requiredAttributes
```

---

# 14. RARIDADE DE ITENS

O protótipo utiliza códigos:

```text
c = comum
u = incomum
r = raro
e = épico
```

A lore também contém itens lendários/divinos.

Canon de aplicação:

```ts
type Rarity =
  | 'common'
  | 'uncommon'
  | 'rare'
  | 'epic'
  | 'legendary'
  | 'divine';
```

---

# 15. RUNAS E JOIAS

## 15.1 Runas populares registradas

- Runa da Cura
- Runa de Regeneração
- Runa da Mana
- Runa do Escudo
- Runa do Vigor
- Runa do Sangue
- Runa da Purificação
- Runa do Fogo
- Runa da Velocidade
- Runa da Ruína

## 15.2 Joias/artefatos exemplificados

O universo contém joias de diferentes raridades e propriedades, incluindo exemplos como Topázio do Relâmpago, Diamante Celestial, Opala do Caos, Jade da Eternidade e Coração de Keth'Zar.

## 15.3 Estrutura de socket

```ts
type Socket = {
  id: string;
  socketType: 'rune' | 'gem';
  contentItemId: string | null;
};
```

Itens equipáveis podem possuir `sockets`.

---

# 16. ABSORÇÃO DE ESSÊNCIA — MECÂNICA EXCLUSIVA TERRÍRIAN

## 16.1 Conceito

Terrírians podem consumir/absorver temporariamente a essência de um item mágico e multiplicar fortemente seu efeito, arriscando destruir ou degradar o item.

É uma mecânica de **alto poder + perda permanente potencial**.

## 16.2 Modelo obrigatório

```ts
type AbsorptionProfile = {
  rarity: Rarity;
  powerMultiplier: number;
  durationTurns?: number;
  durationSeconds?: number;
  survivalChance: number;
  ifSurvives: 'intact' | 'degraded' | 'fragmented' | 'destroyed';
  copiedAbilities: number;
  sideEffectTableId?: string;
};
```

## 16.3 Configuração inicial proposta — NÃO CANÔNICA

Os documentos divergem. Portanto:

```json
[
  {
    "rarity": "common",
    "powerMultiplier": 3,
    "survivalChance": 0.05,
    "ifSurvives": "degraded",
    "copiedAbilities": 0
  },
  {
    "rarity": "rare",
    "powerMultiplier": 3,
    "survivalChance": 0.05,
    "ifSurvives": "degraded",
    "copiedAbilities": 1
  },
  {
    "rarity": "epic",
    "powerMultiplier": 3,
    "survivalChance": 0.01,
    "ifSurvives": "fragmented",
    "copiedAbilities": 2
  },
  {
    "rarity": "legendary",
    "powerMultiplier": 3,
    "survivalChance": 0,
    "ifSurvives": "destroyed",
    "copiedAbilities": 2
  }
]
```

`OWNER_DECISION`: revisar probabilidades antes do balanceamento final.

## 16.4 Fluxo

```text
Selecionar item elegível
→ visualizar risco e benefício
→ confirmação explícita
→ item marcado como locked durante resolução
→ aplicar buff de absorção
→ consumir duração
→ resolver sobrevivência/degradação
→ registrar evento no save/log
```

A confirmação é obrigatória porque o efeito pode destruir item raro permanentemente.

---

# 17. ITENS EXISTENTES NO PROTÓTIPO LEGACY

Exemplos úteis para seed de conteúdo:

### Armas
- Arco Simples
- Arco Composto
- Arco Élfico

### Peitorais
- Peitoral de Couro
- Peitoral Rúnico
- Peitoral Dragônico

### Capacetes
- Capacete de Couro
- Capacete de Aço

### Botas
- Botas de Couro
- Botas Ágis
- Botas do Vento

### Consumíveis
- Poção de Vida
- Poção de Mana
- Poção Grande

### Materiais / especiais
- Runa de Selamento
- Fragmento de Osso
- Fragmento Rúnico
- Essência de Entropia
- Amuleto de Força
- Anel de Agilidade

Esses itens são **conteúdo de protótipo**, não necessariamente canon de balanceamento.

---

# 18. TERRAN — HUB PRINCIPAL

## 18.1 Função

Terran concentra preparação, comércio, narrativa, quests e retorno após exploração.

## 18.2 Edifícios presentes no protótipo

```text
Taverna
Ferreiro
Armeiro
Loja de Poções
Clã
Guarda
Mercador
Praça
```

## 18.3 Serviços

### Taverna
- descanso;
- recuperação HP/MP;
- quests;
- diálogos.

### Ferreiro
- armaduras;
- melhorias futuras;
- reparos futuros;
- crafting futuro.

### Armeiro
- armas;
- itens ofensivos.

### Loja de Poções
- consumíveis;
- alquimia futura.

### Clã
- quests de clã;
- lore;
- progressão específica futura.

### Guarda
- contratos de combate;
- patrulhas;
- bounties futuros.

### Mercador
- compra/venda;
- materiais;
- raridades.

### Praça
- NPCs dinâmicos;
- rumores;
- eventos;
- anúncios.

---

# 19. NPCs

O banco narrativo possui dezenas de NPCs de Terran e regiões externas. A aplicação não deve manter NPCs como HTML ou textos locais de componentes.

## 19.1 Schema

```ts
type NPC = {
  id: string;
  name: string;
  title?: string;
  factionId?: string;
  clanId?: string;
  familyId?: string;
  settlementId: string;
  buildingId?: string;
  roles: ('vendor' | 'questGiver' | 'trainer' | 'lore' | 'normal')[];
  dialogueTreeId?: string;
  shopId?: string;
  questIds?: string[];
  portraitAsset?: string;
  tags: string[];
};
```

## 19.2 NPCs dinâmicos

O protótipo possui encontros em trilhas capazes de adicionar viajantes à praça. Manter o conceito, mas implementar como `DynamicNPCEvent` persistido no save.

---

# 20. QUESTS

## 20.1 Tipos já presentes

```text
kill        — matar inimigos
collect     — coletar itens
deliver     — entregar itens
seal        — selar marcações
```

Expansões previstas:

```text
visit
interact
escort
boss
survive
craft
dialogueChoice
exploreDungeon
```

## 20.2 Schema

```ts
type QuestDefinition = {
  id: string;
  title: string;
  giverNpcId: string;
  description: string;
  objectives: QuestObjective[];
  rewards: Reward[];
  prerequisites?: Condition[];
  repeatable: boolean;
  tags: string[];
};
```

```ts
type QuestProgress = {
  questId: string;
  status: 'available' | 'active' | 'completed' | 'claimed' | 'failed';
  objectiveProgress: Record<string, number>;
};
```

## 20.3 Eventos de domínio

Quests devem reagir a eventos:

```text
EnemyDefeated
ItemAdded
ItemRemoved
LocationVisited
MarkSealed
BossDefeated
NpcTalked
DungeonCompleted
```

Não chamar lógica de quest diretamente dentro de componentes de combate ou inventário.

---

# 21. REGIÕES E BIOMAS

Biomas atuais úteis para a aplicação:

1. Floresta de Astravél
2. Cerrado Místico
3. Deserto de Elduran
4. Deserto Glacial
5. Montanhas de Korduun

Cada bioma deve definir:

```ts
type Biome = {
  id: string;
  name: string;
  description: string;
  visualTheme: string;
  enemyPools: string[];
  floraIds: string[];
  faunaIds: string[];
  environmentalEffects: Effect[];
  soundtrackId?: string;
  mapAsset?: string;
};
```

---

# 22. EXPLORAÇÃO POR TRILHAS

O protótipo HTML substituiu um mapa em canvas por trilhas HTML interativas e sequenciais.

## 22.1 Tipos de plataforma/nó

```text
enemy
chest
specialChest
camp
mark
boss
```

## 22.2 Regra legacy atual

- 10 plataformas por mapa;
- primeira desbloqueada;
- próxima libera ao completar anterior;
- plataformas completas podem ser revisitadas;
- última plataforma tende a boss;
- encounters comuns usam 1–3 inimigos;
- inimigos recebem escala com mapa.

## 22.3 Geração legacy atual

Probabilidades aproximadas do protótipo:

```text
specialChest  0,1%
chest         2,0%
camp          5,0%
mark          5,0%
enemy         restante
boss          última plataforma
```

Esses valores devem virar configuração.

## 22.4 Novo schema

```ts
type TrailDefinition = {
  id: string;
  biomeId: string;
  name: string;
  recommendedLevel: { min: number; max: number };
  nodeCount: number;
  nodeGeneration: NodeGenerationRules;
  bossPool: string[];
};
```

```ts
type TrailRun = {
  runId: string;
  trailId: string;
  seed: string;
  nodes: TrailNode[];
  unlockedNodeIndex: number;
  startedAt: string;
  status: 'active' | 'completed' | 'abandoned';
};
```

Use seed para reproduzir uma run em debug/teste.

---

# 23. RUÍNAS / DUNGEONS DA ENTROPIA

As Ruínas são falhas/distorções da teia arcana que funcionam como dungeons e abrigam anomalias/bosses.

## 23.1 Dungeons registradas

### Nível 1 — Câmaras Fúngicas de Astravél
- localização: Floresta de Astravél;
- tema: Fungorros;
- boss: Colosso Micélio;
- fraquezas frequentes: Luz e Fogo.

Criaturas documentadas:
- Fungorro Rastejante;
- Semeador de Esporos;
- Bola de Gosma Fúngica;
- Horror Esporulante;
- Titan Raiz-Negra.

### Nível 2 — Catacumbas das Runas Esquecidas
- localização: subterrâneos de Terran;
- tema: runas instáveis;
- boss: Lorian, o Gravador Renegado.

### Nível 3 — Templo das Estrelas Quebradas
- localização: Montanhas de Korduun;
- tema: astronomia sombria;
- boss: Orbe de Valerian.

### Nível 4 — Poço das Almas Perdidas
- localização: Floresta de Astravél;
- tema: maldição ancestral;
- boss: O Sem-Rosto.

### Nível 5 — Vale das Engrenagens Corrompidas
- localização: Ruínas de Keth'Zar;
- tema: tecnomagia perdida;
- boss: Engrenagem Maldita.

O texto geral menciona escala de Ruínas até nível 10, porém apenas parte delas está especificada. Portanto, níveis 6–10 devem permanecer reservados.

---

# 24. INIMIGOS

## 24.1 Schema

```ts
type EnemyDefinition = {
  id: string;
  name: string;
  level: number;
  family?: string;
  maxHP: number;
  power: number;
  defense: number;
  speed: number;
  weaknesses: ElementId[];
  resistances: ElementId[];
  skills: string[];
  xpReward: RewardRange;
  goldReward?: RewardRange;
  lootTableId: string;
  tags: string[];
};
```

## 24.2 Fungorro Rastejante — seed de conteúdo

```json
{
  "id": "fungorro_rastejante",
  "name": "Fungorro Rastejante",
  "level": 1,
  "maxHP": 8,
  "defense": 6,
  "weaknesses": ["light", "fire"],
  "skills": ["mordida_parasitaria", "esporos_adesivos"],
  "xpReward": { "min": 15, "max": 15 },
  "tags": ["fungorro", "astravel", "corrupted"]
}
```

Outros inimigos do HTML antigo — Caveira, Espectro, Carniçal, Lobo Sombrio, Aranha Gigante e Necromante Corrompido — podem ser mantidos como conteúdo `prototypeLegacy` até serem ligados formalmente à lore.

---

# 25. COMBATE

## 25.1 Objetivo

Combate tático em turnos, data-driven, capaz de suportar múltiplos inimigos e, no futuro, múltiplos aliados.

## 25.2 Máquina de estados

```text
Initializing
    ↓
TurnStart
    ↓
AwaitingAction
    ↓
SelectingTarget
    ↓
ResolvingAction
    ↓
ResolvingReactions
    ↓
ApplyingStatuses
    ↓
CheckEndConditions
    ├─ Victory
    ├─ Defeat
    └─ TurnEnd → TurnStart
```

Estados extras:

```text
Paused
FleeAttempt
LootResolution
```

## 25.3 Ordem de turno

O documento de protótipo para Construct propõe timeline baseada em Agilidade.

Canon técnico recomendado:

```text
initiativeScore = AGI + modifiers + optionalRoll
```

`OWNER_DECISION`: definir se haverá rolagem de iniciativa ou somente valor fixo.

## 25.4 Ações

```text
BasicAttack
Skill
Item
Defend
Flee
AbsorbEssence
```

## 25.5 Dano

O HTML antigo usa:

```text
playerDamage = max(1, ATK - enemyDEF)
enemyDamage  = max(1, enemyATK - playerDEF)
skillDamage  = max(1, ATK + skill×2 - enemyDEF)
```

Esse cálculo é simples e funcional para protótipo, mas não deve substituir as fórmulas de personagem do manual.

Proposta de pipeline:

```text
1. basePower da ação
2. atributo escalador
3. bônus de arma/item
4. modificadores de skill/passiva
5. resistência/defesa do alvo
6. fraqueza/resistência elemental
7. crítico
8. redução plana
9. redução percentual
10. clamp mínimo
```

## 25.6 Efeitos de status

Suportar inicialmente:

```text
poison
burn
stun
slow
silence
root
marked
bleed
shield
attackUp
attackDown
defenseUp
defenseDown
evasionUp
evasionDown
regeneration
manaRegen
```

## 25.7 Reações

Necessárias para habilidades como Contra-Golpe Rúnico e esquivas reativas.

```ts
type ReactionTrigger =
  | 'onBlock'
  | 'onDodge'
  | 'onDamageTaken'
  | 'onSpellCast'
  | 'onEnemyDefeated'
  | 'onTurnStart'
  | 'onTurnEnd';
```

## 25.8 Fuga

HTML legacy: 70% de chance fixa.

Novo sistema recomendado:

```text
fleeChance = clamp(base + AGI difference + effects, min, max)
```

Valor legacy pode ser preset `0.70` no modo prototype.

## 25.9 Derrota

HTML legacy restaura personagem em 30% de HP/MP e encerra combate.

Novo app deve ter política configurável:

```text
returnToTerran
loseGoldPercent
loseConsumables?
retainXP
restoreHPPercent
restoreMPPercent
```

---

# 26. EXEMPLO DE AÇÃO DECLARATIVA

```json
{
  "id": "rajada_entropica",
  "name": "Rajada Entrópica",
  "kind": "active",
  "cost": { "resource": "mp", "amount": 6 },
  "target": "enemy",
  "effects": [
    {
      "type": "damage",
      "formulaId": "dice_plus_flat",
      "params": { "dice": "1d6", "flat": 2, "damageType": "entropy" }
    },
    {
      "type": "randomEffect",
      "chance": 0.30,
      "pool": ["push", "defenseDown", "burn"]
    }
  ]
}
```

---

# 27. LOOT

## 27.1 Loot table

```ts
type LootEntry = {
  itemId: string;
  chance: number;
  minQty: number;
  maxQty: number;
  conditions?: Condition[];
};
```

## 27.2 Baús

### Normal
- ouro;
- XP opcional;
- poções;
- fragmentos;
- materiais.

### Especial
- raridade mínima superior;
- 2–3 itens no protótipo;
- ouro e XP maiores.

O `0,1%` de chance de special chest do HTML deve ser configurável, pois pode ser excessivamente raro para UX moderna.

---

# 28. ECONOMIA

Moeda principal: `gold` / Ouro.

Sistema mínimo:

```text
buyPrice
sellPrice
vendorInventory
vendorTags
requiredReputation? (futuro)
```

Preço de venda não deve ser igual ao preço de compra por padrão.

Proposta:

```text
sellPrice = floor(basePrice × economy.sellMultiplier)
```

---

# 29. EVENTOS DA APLICAÇÃO

Criar barramento de eventos de domínio simples.

Eventos mínimos:

```text
CharacterCreated
LevelUp
ItemAdded
ItemRemoved
ItemEquipped
ItemUnequipped
ItemAbsorbed
GoldChanged
QuestAccepted
QuestObjectiveUpdated
QuestCompleted
QuestRewardClaimed
TrailStarted
TrailNodeCompleted
EnemyDefeated
BattleWon
BattleLost
BossDefeated
DungeonCompleted
MapUnlocked
NPCDiscovered
```

Isso reduz acoplamento entre módulos.

---

# 30. ESTADO GLOBAL

Evitar um objeto monolítico equivalente ao `Player` do HTML.

Separar slices/domínios:

```text
sessionState
characterState
inventoryState
questState
worldState
combatState
uiState
settingsState
```

`combatState` é transitório e não deve contaminar o estado persistente até a resolução de eventos válidos.

---

# 31. SAVE

## 31.1 Estrutura

```ts
type SaveGame = {
  schemaVersion: number;
  gameVersion: string;
  saveId: string;
  createdAt: string;
  updatedAt: string;
  activeCharacterId: string;
  characters: Character[];
  world: WorldProgress;
  settings: PlayerSettings;
};
```

## 31.2 Requisitos

- autosave após eventos críticos;
- save manual opcional;
- exportar save JSON;
- importar save JSON validado;
- checksum opcional;
- migrations por `schemaVersion`.

## 31.3 Persistência MVP

Preferência:

```text
IndexedDB
```

Fallback simples:

```text
localStorage somente para settings leves
```

Não armazenar save principal inteiro em localStorage se o conteúdo crescer.

---

# 32. ARQUITETURA RECOMENDADA DO APP

A especificação é agnóstica, mas a referência recomendada para implementação web é:

```text
TypeScript
React
Vite ou framework React equivalente
PWA opcional
IndexedDB
JSON/TypeScript data modules
Testes unitários do domínio
Testes E2E dos fluxos principais
```

O motor de regras deve permanecer independente de React.

---

# 33. ESTRUTURA DE REPOSITÓRIO GITHUB

```text
terrunia-app/
├─ README.md
├─ LICENSE
├─ package.json
├─ docs/
│  ├─ TERRUNIA_APP_SYSTEM_SPEC.md
│  ├─ CANON_DECISIONS.md
│  ├─ GAME_BALANCE.md
│  └─ CHANGELOG_CONTENT.md
├─ public/
│  ├─ icons/
│  ├─ audio/
│  └─ art/
├─ src/
│  ├─ app/
│  │  ├─ App.tsx
│  │  ├─ routes.tsx
│  │  └─ providers/
│  ├─ domain/
│  │  ├─ character/
│  │  ├─ combat/
│  │  ├─ inventory/
│  │  ├─ quests/
│  │  ├─ progression/
│  │  ├─ exploration/
│  │  └─ economy/
│  ├─ content/
│  │  ├─ clans.json
│  │  ├─ classes.json
│  │  ├─ skills.json
│  │  ├─ items.json
│  │  ├─ enemies.json
│  │  ├─ dungeons.json
│  │  ├─ biomes.json
│  │  ├─ npcs.json
│  │  ├─ quests.json
│  │  └─ lootTables.json
│  ├─ rules/
│  │  ├─ ruleset.ts
│  │  ├─ stats.ts
│  │  ├─ damage.ts
│  │  ├─ xp.ts
│  │  └─ absorption.ts
│  ├─ state/
│  │  ├─ characterStore.ts
│  │  ├─ worldStore.ts
│  │  ├─ combatStore.ts
│  │  └─ uiStore.ts
│  ├─ persistence/
│  │  ├─ database.ts
│  │  ├─ saveRepository.ts
│  │  └─ migrations/
│  ├─ ui/
│  │  ├─ components/
│  │  ├─ screens/
│  │  └─ theme/
│  ├─ assets/
│  └─ main.tsx
└─ tests/
   ├─ unit/
   ├─ integration/
   └─ e2e/
```

---

# 34. TELAS DO MVP

## 34.1 Boot
- verificar save;
- novo jogo;
- continuar;
- importar save.

## 34.2 Criação de personagem
Etapas:

```text
Nome
→ Raça
→ Clã
→ Classe
→ Atributos
→ Perícias
→ Vantagens/Desvantagens
→ Revisão
→ Confirmar
```

## 34.3 Terran
- painel de personagem;
- HP/MP/XP;
- ouro;
- equipamentos;
- mochila;
- locais da cidade.

## 34.4 Inventário
- filtros;
- peso;
- raridade;
- equipar;
- usar;
- comparar;
- absorver essência quando elegível.

## 34.5 Atributos
- valores;
- dados;
- bônus;
- status derivados;
- pontos não gastos.

## 34.6 Quests
- disponíveis;
- ativas;
- concluídas;
- recompensas.

## 34.7 Seleção de exploração
- região;
- nível recomendado;
- inimigos conhecidos;
- dungeon associada;
- estado de desbloqueio.

## 34.8 Trilha
- nós;
- nó atual;
- nós completos;
- objetivo;
- opção de retorno quando permitido.

## 34.9 Combate
- jogador;
- inimigos;
- HP/MP;
- timeline;
- ações;
- alvo;
- efeitos de status;
- log reduzido/opcional;
- feedback visual de dano.

## 34.10 Loot
- XP;
- ouro;
- itens;
- peso resultante;
- pegar tudo / pegar individual.

---

# 35. DESIGN SYSTEM DIGITAL

O HTML existente usa UI escura com acento azul e painéis modulares. Isso pode ser mantido como referência estrutural, não como direção visual final.

Tokens recomendados:

```text
background
surface
surfaceElevated
textPrimary
textMuted
accentArcane
success
warning
danger
rarityCommon
rarityUncommon
rarityRare
rarityEpic
rarityLegendary
```

Todos os tokens devem estar centralizados.

## 35.1 Direção visual recomendada

- fantasia arcana celta/feérica;
- interface limpa, escura, com luminosidade rúnica controlada;
- hierarquia clara;
- evitar excesso de ornamentos que prejudiquem legibilidade;
- raridade por cor + ícone + texto, nunca somente cor;
- responsivo desktop/mobile;
- acessibilidade de contraste.

---

# 36. CONTEÚDO VS. ENGINE

Regra crítica:

```text
ENGINE diz COMO algo funciona.
CONTENT diz O QUE existe.
```

Exemplo incorreto:

```ts
if (className === 'Mago da Ruína') {...}
```

Exemplo correto:

```ts
resolveEffects(classDefinition.passive.effects)
```

---

# 37. CONFIGURAÇÃO DO RULESET

```ts
type Ruleset = {
  id: string;
  characterCreation: {
    attributePoints: number;
    skillPoints: number;
    advantagePoints: number;
    maxDisadvantagePoints: number;
  };
  progression: {
    maxLevel: number;
    xpTable: number[];
  };
  inventory: {
    baseWeightCapacity: number;
  };
  combat: {
    minimumDamage: number;
    fleeBaseChance: number;
    useInitiativeRoll: boolean;
  };
  absorption: {
    enabled: boolean;
    profiles: AbsorptionProfile[];
  };
};
```

Isso permite criar no futuro:

```text
terrunia-core-v1
terrunia-tabletop-v1
terrunia-prototype-legacy
hardcore-mode
story-mode
```

sem duplicar o app.

---

# 38. VALIDAÇÃO DE CONTEÚDO

Ao iniciar em desenvolvimento, validar:

- IDs duplicados;
- referências quebradas;
- classe sem clã;
- habilidade inexistente;
- item com raridade inválida;
- quest sem NPC;
- loot com item inexistente;
- dungeon sem boss;
- inimigo sem loot table;
- fórmula inexistente;
- efeito inválido.

Falhar cedo em desenvolvimento.

---

# 39. TESTES PRIORITÁRIOS

## Unitários

1. cálculo de status;
2. XP e level up;
3. custo de criação;
4. dano;
5. mitigação;
6. efeitos por duração;
7. loot por seed;
8. capacidade de inventário;
9. equipar/desequipar;
10. absorção de essência;
11. progressão de quest;
12. desbloqueio de mapa.

## Integração

1. criar personagem → salvar → recarregar;
2. aceitar quest → matar alvo → concluir;
3. vencer combate → receber XP/ouro/loot;
4. concluir trilha → desbloquear próxima;
5. morrer → aplicar política de derrota;
6. absorver item → resolver resultado e salvar.

## E2E

```text
Novo jogo
→ criar Terrírian Dûn'Avar
→ entrar em Terran
→ aceitar quest
→ equipar item
→ explorar Astravél
→ vencer combate
→ obter loot
→ retornar
→ receber recompensa
→ salvar
→ recarregar
```

---

# 40. MIGRAÇÃO DO HTML LEGACY

O arquivo `Terrunia - O Início das Ruínas.html` deve ser tratado como **prova de conceito**, não como arquitetura a ser expandida.

## 40.1 Reaproveitar

- fluxo cidade → exploração → combate → loot;
- categorias de edifícios;
- conceito de trilha sequencial;
- tipos de nó;
- peso de inventário;
- filtros de raridade;
- quests reativas;
- NPCs encontrados durante exploração;
- multi-inimigo;
- seleção de alvo;
- baús e acampamentos.

## 40.2 Não transportar literalmente

- objeto global único `Player`;
- tabelas gigantes no mesmo arquivo;
- UI gerada por `innerHTML`;
- chamadas diretas entre sistemas;
- fórmulas hardcoded;
- balanceamento misturado com interface;
- progressão XP `×1.4` sem referência ao manual;
- duplicação de incremento de HP/MP existente no código de level up;
- dependência de nomes textuais para lógica;
- estado de combate global acoplado ao DOM.

---

# 41. MODELO JSON — PLAYER EXEMPLO

```json
{
  "id": "char_001",
  "name": "Aron",
  "raceId": "terririan",
  "clanId": "dunavar",
  "classId": "gladiador_barreira",
  "level": 1,
  "xp": 0,
  "attributes": {
    "astucia": { "rank": 0, "bonus": 0 },
    "agilidade": { "rank": 0, "bonus": 0 },
    "forca": { "rank": 1, "bonus": 0 },
    "vigor": { "rank": 1, "bonus": 1 },
    "espirito": { "rank": 0, "bonus": 0 }
  },
  "skills": {
    "lutar": { "rank": 1, "bonus": 0 },
    "atletismo": { "rank": 1, "bonus": 0 }
  },
  "advantages": [],
  "disadvantages": [],
  "resources": {
    "hp": 0,
    "mp": 0,
    "fatigue": 0
  },
  "equipment": {
    "weapon": null,
    "chest": null,
    "helmet": null,
    "boots": null,
    "accessory": null,
    "runes": [],
    "gems": []
  },
  "inventory": {
    "items": {}
  },
  "wallet": {
    "gold": 10
  },
  "quests": [],
  "flags": {}
}
```

Ao criar o personagem, `hp/mp` devem ser inicializados a partir de `StatsCalculator`.

---

# 42. MODELO JSON — ITEM

```json
{
  "id": "peitoral_runico",
  "name": "Peitoral Rúnico",
  "type": "chestArmor",
  "rarity": "rare",
  "weight": 5,
  "basePrice": 360,
  "requirements": {
    "level": 4
  },
  "modifiers": [
    { "stat": "defense", "mode": "flat", "value": 7 }
  ],
  "sockets": [
    { "id": "rune_1", "socketType": "rune", "contentItemId": null }
  ],
  "absorbable": true,
  "tags": ["armor", "runic", "rustal-compatible"]
}
```

---

# 43. MODELO JSON — QUEST

```json
{
  "id": "q_guard_varredura_01",
  "title": "Varredura da Trilha",
  "giverNpcId": "npc_capitao_guarda",
  "description": "Elimine ameaças registradas na primeira trilha.",
  "objectives": [
    {
      "id": "obj_kill_01",
      "type": "kill",
      "targetId": "caveira",
      "required": 5
    }
  ],
  "rewards": [
    { "type": "gold", "amount": 80 },
    { "type": "item", "itemId": "pocao_vida", "amount": 1 }
  ],
  "repeatable": false,
  "tags": ["guard", "combat"]
}
```

---

# 44. MODELO JSON — DUNGEON

```json
{
  "id": "camaras_fungicas_astravel",
  "name": "Câmaras Fúngicas de Astravél",
  "level": 1,
  "biomeId": "floresta_astravel",
  "theme": "fungal_corruption",
  "bossId": "colosso_micelio",
  "enemyPool": [
    "fungorro_rastejante",
    "semeador_esporos",
    "gosma_fungica",
    "horror_esporulante",
    "titan_raiz_negra"
  ],
  "tags": ["ruin", "entropy", "fungorro"]
}
```

---

# 45. BACKLOG DE IMPLEMENTAÇÃO

## Fase 0 — Fundação

- iniciar repositório;
- TypeScript;
- lint/format;
- testes;
- roteamento;
- design tokens;
- content loader;
- schemas de validação;
- save repository.

## Fase 1 — Personagem

- criação;
- clãs/classes;
- atributos/perícias;
- vantagens/desvantagens;
- calculadora de status;
- tela de personagem.

## Fase 2 — Terran

- hub;
- edifícios;
- NPCs;
- lojas;
- inventário;
- equipamento;
- descanso.

## Fase 3 — Exploração

- seleção de região;
- geração de trilha;
- seed;
- nodes;
- baú;
- acampamento;
- mark/event;
- unlock.

## Fase 4 — Combate

- state machine;
- iniciativa;
- ações;
- target selection;
- skills;
- status;
- vitória/derrota/fuga;
- rewards.

## Fase 5 — Quests

- eventos de domínio;
- objetivos;
- tracking;
- rewards;
- painel de quest.

## Fase 6 — Ruínas

- dungeon definitions;
- Fungorros;
- fraquezas elementais;
- bosses;
- progressão de Ruínas.

## Fase 7 — Identidade Terrúnia

- runas;
- joias;
- Absorção de Essência;
- conteúdo narrativo;
- NPCs canônicos;
- polish visual/sonoro.

---

# 46. CRITÉRIOS DE ACEITE DO MVP

O MVP é considerado funcional quando:

1. um personagem pode ser criado sem estado inválido;
2. o personagem é criado sem Clã/Classe, pode ingressar em um dos quatro Clãs por gameplay e posteriormente desbloquear um caminho de Classe daquele Clã;
3. status derivados respondem a atributos/equipamentos;
4. o personagem pode comprar, receber, usar e equipar itens;
5. capacidade de inventário é respeitada;
6. Terran possui locais navegáveis;
7. uma quest pode ser aceita, atualizada e resgatada;
8. Astravél pode gerar uma trilha válida;
9. combate suporta 1–3 inimigos;
10. skills consomem recursos corretamente;
11. vitória concede XP/ouro/loot;
12. derrota aplica política definida;
13. level up usa tabela configurada;
14. conclusão de mapa desbloqueia conteúdo;
15. save/reload preserva todo progresso;
16. regras essenciais possuem testes;
17. conteúdo pode ser alterado por JSON/config sem editar UI;
18. erros de referência de conteúdo são detectados em desenvolvimento.

---

# 47. DECISÕES QUE O CRIADOR PRECISA FECHAR POSTERIORMENTE

Marcadores `OWNER_DECISION` prioritários:

1. 3 ou 5 pontos iniciais de atributo?
2. 3 ou 12 pontos iniciais de perícia?
3. custo final de cada perícia divergente;
4. como converter rank de dado em valor numérico;
5. fórmula final de acerto;
6. existência de esquiva separada de defesa;
7. crítico e falha crítica;
8. iniciativa fixa ou rolada;
9. custo de MP das 24 habilidades iniciais;
10. progressão/desbloqueio de habilidades;
11. regra final de Absorção de Essência;
12. punição de derrota;
13. papel mecânico dos Anci Da;
14. relação formal entre quatro clãs e dez famílias;
15. quais inimigos do protótipo são canônicos;
16. Ruínas níveis 6–10;
17. economia final e preço de venda;
18. crafting/upgrade de runas e joias.

Nenhuma dessas decisões impede a construção do framework se tudo for parametrizado.

---

# 48. RECOMENDAÇÃO DE CANON TÉCNICO PARA COMEÇAR

Para permitir implementação imediata sem congelar decisões criativas:

```json
{
  "rulesetId": "terrunia-core-v1-draft",
  "characterCreation": {
    "attributePoints": 3,
    "skillPoints": 3,
    "advantagePoints": 3,
    "maxDisadvantagePoints": 3
  },
  "progression": {
    "maxLevel": 14,
    "xpMode": "manualTable"
  },
  "combat": {
    "minimumDamage": 1,
    "initiativeMode": "agility",
    "fleeBaseChance": 0.7
  },
  "inventory": {
    "baseWeightCapacity": 50
  },
  "absorption": {
    "enabled": true,
    "status": "experimental"
  }
}
```

Esses valores são **defaults de desenvolvimento**, não declaração irrevogável de canon.

---

# 49. PRINCÍPIO DE LONGO PRAZO

Terrúnia deve ser construída como uma **plataforma de universo**, não apenas como uma tela de RPG.

A mesma base de dados poderá futuramente alimentar:

- RPG principal;
- compêndio/lorepedia;
- construtor de personagem;
- bestiário;
- mapa do mundo;
- campaign manager;
- ferramentas de mestre;
- jogos paralelos;
- conteúdo de séries/filmes;
- APIs internas para outros projetos de Terrúnia.

Por isso, IDs, taxonomias e conteúdo estruturado são ativos de propriedade intelectual e precisam permanecer estáveis e reutilizáveis.

---

# 50. DEFINIÇÃO FINAL DO PROJETO

**Terrúnia App** deve começar como um RPG web single-player, modular, data-driven e local-first. Terran é o hub; trilhas e Ruínas formam o eixo de exploração; o personagem é o Nexo central; Clã e Classe são conquistados dentro do mundo; os cinco equipamentos vinculados, Essências, Runas e Joias definem a construção de build; Absorção de Essência diferencia os Terrírians; quests e NPCs conectam a mecânica à narrativa; e o banco de conteúdo deve ser independente do motor para permitir que Terrúnia cresça para múltiplas mídias sem reescrever sua fundação técnica.

**Este documento deve entrar no repositório como:**

```text
/docs/TERRUNIA_APP_SYSTEM_SPEC.md
```

**Próximo artefato técnico recomendado:** `CANON_DECISIONS.md`, usado somente para registrar decisões aprovadas pelo criador e substituir gradualmente os marcadores `OWNER_DECISION` deste documento.


---

# 51. ATUALIZAÇÃO CANÔNICA v0.3 — VÍNCULO DA ALMA E SKILL TREE

> **Regra de precedência:** em qualquer conflito entre as seções 1–50 e as seções 51+, prevalecem as seções 51+. As seções antigas continuam preservadas como histórico técnico e referência de migração.

## 51.1 Mudança central de design

O equipamento dos Terrírians não deve funcionar como loot descartável típico de RPG. A identidade mecânica passa a ser:

```text
PERSONAGEM
  ↓
VÍNCULO DA ALMA
  ↓
ITEM VINCULADO
  ↓
RESSONÂNCIA
  ↓
SKILL TREE DO ITEM
  ↓
ESSÊNCIAS + JOIAS + RUNAS
  ↓
TRANSFORMAÇÃO FÍSICA E MECÂNICA
  ↓
GRAU VII — ARTEFATO ÉPICO VINCULADO
```

O jogador ainda encontra novas armas no mundo, mas uma arma vinculada pode crescer a ponto de superar itens encontrados prontos. O valor principal passa a estar na **história construída com o equipamento**.

## 51.2 Fontes de identidade do jogador

A build final é composta por cinco camadas independentes e combináveis:

1. **Raça** — Terrírian no jogo inicial.
2. **Clã** — identidade mágica e passiva cultural.
3. **Classe** — papel de combate e nodes exclusivos.
4. **Personagem** — atributos, perícias, vantagens e nível.
5. **Item Vinculado** — 7 Graus, componentes, Skill Tree, Memórias e forma final.

## 51.3 Separação entre duas formas de Absorção

### Absorção Direta
O Terrírian absorve a energia de um item/essência em seu próprio corpo.

- efeito muito forte;
- temporário;
- mantém a filosofia antiga de alto risco;
- pode destruir/degradar o item conforme `AbsorptionProfile`;
- é uma decisão emergencial.

### Infusão Vinculada
O Fragmento de Essência é incorporado ao Item Vinculado.

- efeito menor inicialmente;
- permanente;
- modifica status e Skill Tree;
- não usa a tabela de destruição da Absorção Direta;
- é o caminho principal de evolução de armas.

Essas duas ações nunca devem compartilhar o mesmo botão sem distinção explícita.

---

# 52. OBJETIVO DE PRODUTO JOGÁVEL

O Work deve construir o projeto como **jogo funcional**, e não como compêndio estático.

## 52.1 Vertical slice obrigatório

A primeira versão jogável deve permitir este fluxo completo:

```text
Novo Jogo
→ Criar Terrírian
→ Escolher Clã
→ Escolher Classe
→ Distribuir atributos/perícias
→ Receber/escolher arma inicial
→ Executar Ritual de Vínculo — Grau I
→ Entrar em Terran
→ Conversar com Eldamar
→ Aceitar missão principal
→ Comprar/equipar consumíveis
→ Explorar Floresta de Astravél
→ Enfrentar Fungorros em combate por turnos
→ Receber XP, ouro, item e Fragmento de Essência
→ Retornar a Terran
→ Infundir Fragmento e alcançar Grau II quando elegível
→ Abrir novos nodes da Skill Tree
→ Continuar campanha
→ Salvar
→ Recarregar o jogo mantendo todo o estado
```

## 52.2 Conteúdo mínimo do primeiro build

- 1 raça jogável: Terrírian;
- 4 clãs;
- 12 classes;
- 7 armas iniciais do manual;
- sistema completo dos 7 Graus implementado;
- pelo menos 1 Skill Tree funcional por arquétipo de arma;
- 10 runas básicas;
- 10 joias registradas na lore;
- pelo menos 8 tipos de Fragmento de Essência de desenvolvimento;
- Terran como hub;
- Floresta de Astravél;
- Câmaras Fúngicas;
- 5 criaturas Fungorras documentadas;
- boss do primeiro arco/dungeon;
- campanha principal da Temporada 1 cadastrada;
- sidequests já existentes cadastradas como conteúdo;
- inventário, lojas, equipamento, loot e save;
- sistema de sprites substituíveis manualmente.

## 52.3 Regra para conteúdo incompleto

Quando existir mecânica sem arte final ou conteúdo fechado:

- usar placeholder;
- nunca travar o app por falta de sprite;
- nunca inventar silenciosamente lore definitiva;
- marcar como `CONTENT_DRAFT`, `BALANCE_DRAFT` ou `OWNER_DECISION`.

---

# 53. OS 7 GRAUS DO ITEM VINCULADO

## 53.1 Regra oficial

| Grau | Estado funcional | Novo desbloqueio | Componentes permanentes totais |
|---:|---|---|---|
| I | Vínculo | Skill Tree base | Arma + Vínculo |
| II | Infusão | 1 Fragmento de Essência | 1 Essência |
| III | Lapidação | 1 Joia | 1 Essência + 1 Joia |
| IV | Inscrição | 1 Runa | 1 Essência + 1 Joia + 1 Runa |
| V | Convergência | +1 Essência e +1 Joia | 2 Essências + 2 Joias + 1 Runa |
| VI | Ascensão Rúnica | 1 Runa Superior | 2 Essências + 2 Joias + 1 Runa + 1 Runa Superior |
| VII | Unificação | Fusão total | Runa-Joia Épica da Alma |

Os nomes de estágio são **rótulos técnicos propostos**. O número do Grau e os slots liberados são a regra aprovada; os nomes podem ser alterados sem mudar o sistema.

## 53.2 Grau I — Vínculo

O item:

- recebe `ownerCharacterId`;
- recebe `soulSignatureId`;
- inicia Ressonância;
- cria registro de Memórias;
- abre a Skill Tree básica;
- torna-se uma instância única, mesmo que tenha vindo de um item-base comum.

Slots disponíveis:

```text
essence: 0
gem: 0
rune: 0
superiorRune: 0
```

## 53.3 Grau II — Fragmento de Essência

Desbloqueia:

```text
essenceSlots = 1
```

A Essência adicionada:

- concede modificadores;
- adiciona tags mágicas;
- abre nodes de Essência na árvore;
- pode alterar aparência/VFX;
- passa a fazer parte da história permanente da arma.

## 53.4 Grau III — Primeira Joia

Desbloqueia:

```text
gemSlots = 1
```

A Joia:

- canaliza e estabiliza a Essência;
- fornece efeitos próprios;
- pode criar nodes de sinergia com a Essência;
- deve aparecer visualmente no item quando houver arte correspondente.

## 53.5 Grau IV — Primeira Runa

Desbloqueia:

```text
runeSlots = 1
```

Conceito mecânico:

```text
Essência = natureza do poder
Joia     = catalisador/canalização
Runa     = ordem/regra aplicada ao poder
```

A Runa altera skills existentes e pode criar reações/passivas.

## 53.6 Grau V — Convergência

Desbloqueia simultaneamente:

```text
essenceSlots = 2
gemSlots = 2
```

Este é o primeiro estágio de combinações híbridas profundas.

O motor deve verificar:

- sinergia Essência A × Essência B;
- sinergia Joia A × Joia B;
- combinações cruzadas;
- incompatibilidades;
- nodes híbridos disponíveis;
- transformação visual da arma.

## 53.7 Grau VI — Runa Superior

Desbloqueia:

```text
superiorRuneSlots = 1
```

Uma Runa Superior não é apenas uma versão numérica da runa comum. Ela atua como **regra dominante da arquitetura mágica da arma** e pode interpretar todos os componentes inseridos anteriormente.

## 53.8 Grau VII — Unificação

No Grau VII:

- os slots deixam de ser tratados como partes independentes em gameplay;
- todos os componentes são fundidos;
- nenhum status previamente incorporado é perdido;
- uma nova propriedade épica é gerada;
- a arma recebe forma final;
- nasce a **Runa-Joia Épica da Alma**;
- o item passa para a classificação funcional `epicBound`.

A classificação `epicBound` é especial e não deve ser confundida com um item épico comum encontrado em loot.

### Resultado conceitual

```text
ARMA BASE
 + ESSÊNCIA A
 + ESSÊNCIA B
 + JOIA A
 + JOIA B
 + RUNA
 + RUNA SUPERIOR
 + SKILL TREE
 + MEMÓRIAS
 + CLÃ/CLASSE
        ↓
UNIFICAÇÃO
        ↓
ARMA ÉPICA VINCULADA
        ↓
RUNA-JOIA ÉPICA DA ALMA
```

---

# 54. RESSONÂNCIA E AVANÇO DE GRAU

## 54.1 Ressonância

Ressonância é o XP do Item Vinculado.

Ela pode ser obtida por:

- usar a arma em combate;
- acertar ataques;
- bloquear/defender quando aplicável;
- usar skills da árvore;
- derrotar inimigos;
- derrotar bosses;
- completar missões com a arma equipada;
- atravessar Ruínas;
- sobreviver a eventos críticos;
- realizar feitos ligados ao arquétipo da arma;
- completar Memórias especiais.

## 54.2 Pontos de Ressonância

A cada faixa de Ressonância, o jogador recebe `resonancePoints` para gastar na Skill Tree.

A quantidade e curva devem ser configuráveis.

## 54.3 Thresholds de desenvolvimento

Para permitir um app imediatamente jogável, usar inicialmente:

```json
{
  "degreeThresholds": {
    "1": 0,
    "2": 100,
    "3": 300,
    "4": 700,
    "5": 1300,
    "6": 2200,
    "7": 3500
  }
}
```

Status: `BALANCE_DRAFT`.

## 54.4 Rito de Evolução

Ressonância sozinha não deve avançar o Grau.

Cada transição exige:

```text
Ressonância mínima
+ requisito de progressão
+ componente quando aplicável
+ Rito de Evolução
```

Exemplo:

```text
Grau II → III
300 Ressonância
+ Grau II concluído
+ 1 Joia compatível
+ executar Rito de Lapidação em Terran
```

O rito pode ser feito por NPC/edifício e transformado em pequena missão.

## 54.5 Evitar grind obrigatório

Missões principais, bosses e descobertas devem conceder grandes quantidades de Ressonância para que o jogador não precise repetir combates triviais excessivamente.

---

# 55. MODELO DE DADOS DO ITEM VINCULADO

```ts
type BoundItemInstance = {
  instanceId: string;
  baseItemId: string;
  ownerCharacterId: string;
  soulSignatureId: string;

  customName?: string;
  degree: 1 | 2 | 3 | 4 | 5 | 6 | 7;
  resonance: number;
  resonancePoints: number;

  components: {
    essences: string[];      // instance ids
    gems: string[];          // instance ids
    rune: string | null;
    superiorRune: string | null;
  };

  skillTree: WeaponSkillTreeState;
  memories: BoundItemMemory[];
  scars: BoundItemScar[];

  visualEvolution: {
    stage: number;
    spriteOverrideId?: string;
    vfxTags: string[];
  };

  finalCore?: EpicSoulCore;

  createdAt: string;
  updatedAt: string;
};
```

## 55.1 Slots por Grau

```ts
function getBoundSlots(degree: number) {
  if (degree <= 1) return { essence: 0, gem: 0, rune: 0, superiorRune: 0 };
  if (degree === 2) return { essence: 1, gem: 0, rune: 0, superiorRune: 0 };
  if (degree === 3) return { essence: 1, gem: 1, rune: 0, superiorRune: 0 };
  if (degree === 4) return { essence: 1, gem: 1, rune: 1, superiorRune: 0 };
  if (degree === 5) return { essence: 2, gem: 2, rune: 1, superiorRune: 0 };
  if (degree === 6) return { essence: 2, gem: 2, rune: 1, superiorRune: 1 };
  return { essence: 0, gem: 0, rune: 0, superiorRune: 0 }; // componentes fundidos no core
}
```

## 55.2 Memórias

```ts
type BoundItemMemory = {
  id: string;
  type: 'boss' | 'quest' | 'survival' | 'bond' | 'ruin' | 'special';
  sourceId: string;
  title: string;
  description: string;
  createdAt: string;
  unlockedNodeIds?: string[];
};
```

Exemplos:

- Primeira Ruína;
- Rainha Fungorra derrotada;
- Sobreviveu com 1 HP;
- Protegeu Terran;
- Primeira Essência Entrópica;
- Primeiro Rito Rúnico.

## 55.3 Cicatrizes

Cicatrizes são alterações narrativas/mecânicas causadas por eventos extremos.

Elas podem ser positivas, negativas ou híbridas e nunca devem substituir silenciosamente uma propriedade existente.

---

# 56. SKILL TREE DO ITEM — ARQUITETURA

## 56.1 O sistema deve ser um grafo

Não implementar a árvore como uma lista fixa de botões.

```ts
type WeaponSkillTreeState = {
  treeId: string;
  unlockedNodeIds: string[];
  activeNodeIds: string[];
  spentPoints: number;
  generatedBranchIds: string[];
};
```

```ts
type SkillTreeNodeDefinition = {
  id: string;
  name: string;
  description: string;
  category:
    | 'mastery'
    | 'bond'
    | 'form'
    | 'essence'
    | 'gem'
    | 'rune'
    | 'synergy'
    | 'convergence'
    | 'superiorRune'
    | 'epic';
  cost: number;
  degreeRequired: number;
  prerequisites: string[];
  conditions: Condition[];
  effects: Effect[];
  grantsSkillIds?: string[];
  tags: string[];
};
```

## 56.2 Categorias

### Mastery
Domínio do tipo de arma.

### Bond
Relação espiritual entre item e portador.

### Form
Mudanças físicas/funcionais do objeto.

### Essence
Nodes criados ou liberados por Fragmentos de Essência.

### Gem
Nodes de canalização e amplificação.

### Rune
Nodes que mudam regras de uso.

### Synergy
Exigem combinações específicas.

### Convergence
Grau V; misturam dois caminhos.

### Superior Rune
Grau VI; alteram o comportamento global do item.

### Epic
Grau VII; encerramento e habilidade exclusiva.

## 56.3 Estrutura visual por Graus

```text
GRAU I
  [Núcleo do Vínculo]
       ├─ Domínio
       ├─ Sintonia
       └─ Forma

GRAU II
  + ramo da Essência I

GRAU III
  + ramo da Joia I
  + primeira Sinergia

GRAU IV
  + ramo da Runa
  + modificadores rúnicos

GRAU V
  + Essência II
  + Joia II
  + nodes Híbridos
  + Convergência

GRAU VI
  + Runa Superior
  + Skill de Ascensão

GRAU VII
  todos os caminhos convergem
       ↓
  [UNIFICAÇÃO]
       ↓
  [SKILL ÉPICA]
```

## 56.4 Tree base sugerida para qualquer arma

### Grau I
- `bond_core` — obrigatório;
- `mastery_1` — precisão/eficiência;
- `bond_recall_1` — percepção do item;
- `form_adaptation_1` — pequena melhoria do atributo principal.

### Grau II
- `essence_channel_1`;
- `essence_active_1`;
- `essence_resistance_1`.

### Grau III
- `gem_focus_1`;
- `gem_amplification_1`;
- `synergy_essence_gem_1`.

### Grau IV
- `rune_rule_1`;
- `rune_reaction_1`;
- `rune_skill_modifier_1`.

### Grau V
- `dual_essence_1`;
- `dual_gem_1`;
- `hybrid_branch_1`;
- `convergence_skill_1`.

### Grau VI
- `superior_rune_governance`;
- `ascension_skill`.

### Grau VII
- `unification`;
- `epic_manifestation`.

## 56.5 Nodes dinâmicos

Quando um componente é inserido, o motor consulta suas `skillTreeHooks`.

Exemplo:

```json
{
  "id": "essence_tempest",
  "skillTreeHooks": [
    "branch_lightning",
    "node_static_charge",
    "node_chain_discharge"
  ]
}
```

Isso significa que a árvore visível pode crescer após a Infusão.

## 56.6 Nodes ocultos

Nodes secretos podem exigir:

- Memória específica;
- boss derrotado;
- combinação rara;
- clã;
- classe;
- Ruína;
- quantidade de uso;
- evento narrativo.

Eles devem existir no content DB, não ser programados diretamente na UI.

---

# 57. INTERAÇÃO CLÃ + CLASSE + SKILL TREE

A Skill Tree não substitui clã e classe. Ela os utiliza como filtros e modificadores.

## 57.1 Sobreposição de Clã

### Dûn'Avar
Tags preferenciais:

```text
barrier
shield
protection
counter
light
resistance
```

### Rustal

```text
rune
inscription
crystal
stability
craft
rewrite
```

### Cebios Esti

```text
astral
star
prediction
destiny
pierce
celestial
```

### Estres do Ét

```text
entropy
chaos
rupture
random
volatile
corruptionControl
```

## 57.2 Sobreposição de Classe

As skills de classe existentes devem continuar disponíveis, mas podem possuir melhorias na árvore vinculada.

Exemplo:

```text
Gladiador da Barreira
Impacto Arcano
   ↓
Node da arma: Impacto Vinculado
   ↓
Node Rúnico: Impacto Selado
   ↓
Node de Convergência: Ruptura de Barreira
```

## 57.3 Skills de classe registradas

### Dûn'Avar
- Muralha Viva
- Postura Inquebrantável
- Vigilância Absoluta
- Impacto Arcano
- Contra-Golpe Rúnico
- Treino dos Guardiões
- Golpe Silencioso
- Reflexo Sombrio
- Presença Oculta

### Rustal
- Armadura Rúnica
- Punho de Pedra
- Pele de Cristal
- Runa de Proteção
- Marcar o Destino
- Escrita Mística
- Projeção Arcana
- Runa Explosiva
- Fluxo de Mana

### Cebios Esti
- Chuva de Estrelas
- Selo Astral
- Sabedoria Antiga
- Olhar do Futuro
- Bênção Celestial
- Orbe do Destino
- Arco Estelar
- Marcar a Lua
- Disparo Astral

### Estres do Ét
- Explosão Entrópica
- Distorção Volátil
- Magia Inconstante
- Zona de Ruína
- Fluxo Inconstante
- Padrões do Caos
- Rajada Entrópica
- Esfera do Caos
- Ressonância Caótica

---

# 58. FRAGMENTOS DE ESSÊNCIA

## 58.1 Definição

Fragmentos de Essência são materiais mágicos derivados de criaturas, fenômenos, artefatos ou regiões.

```ts
type EssenceDefinition = {
  id: string;
  name: string;
  tier: 1 | 2 | 3 | 4;
  affinity: string[];
  sourceTags: string[];
  modifiers: Modifier[];
  skillTreeHooks: string[];
  incompatibilities?: string[];
  visualTags: string[];
  directAbsorptionProfileId?: string;
};
```

## 58.2 Famílias de Essência para o motor

- biológica;
- elemental;
- arcana;
- astral;
- entrópica;
- ancestral;
- espiritual;
- tecnomágica.

Essas famílias são taxonomia técnica e podem ser renomeadas.

## 58.3 Seeds derivados dos Fungorros

Conteúdo inicial proposto:

```text
Essência Fúngica Fraca          ← Fungorro Rastejante
Essência Esporulante            ← Semeador de Esporos
Núcleo de Gosma Instável        ← Bola de Gosma Fúngica
Núcleo de Infecção              ← Horror Esporulante
Coração Micelial Corrompido     ← Titan Raiz-Negra
```

Os nomes acima são `CONTENT_DRAFT` quando não existirem literalmente na fonte narrativa.

## 58.4 Drop de Essência

Nem todo inimigo precisa soltar essência em toda vitória.

```ts
type EssenceDropRule = {
  essenceId: string;
  chance: number;
  minQty: number;
  maxQty: number;
  requiresExtraction?: boolean;
};
```

---

# 59. JOIAS MÁGICAS — BANCO INICIAL

As dez joias registradas no universo devem existir como conteúdo inicial.

| ID sugerido | Nome | Tier/Lore | Efeito base de referência |
|---|---|---|---|
| `safira_mares` | Safira das Marés | Rara | água/cura; resistência ao calor |
| `rubi_ira` | Rubi da Ira | Rara | dano de fogo/físico; chance de inflamar |
| `esmeralda_crescimento` | Esmeralda do Crescimento | Rara | crescimento vegetal; suavizar venenos |
| `onix_sombra` | Ônix da Sombra | Épica | sombra, furtividade, ilusão |
| `ametista_mente` | Ametista da Mente | Épica | proteção mental; psíquico |
| `topazio_relampago` | Topázio do Relâmpago | Épica | eletricidade, mana, eletrocussão |
| `diamante_celestial` | Diamante Celestial | Lendária | proteção extrema; vitalidade |
| `opala_caos` | Opala do Caos | Lendária | teleporte; poder mágico e instabilidade |
| `jade_eternidade` | Jade da Eternidade | Lendária | longevidade; regeneração |
| `coracao_kethzar` | Coração de Keth'Zar | Lendária Única | força, resistência, custo de vitalidade |

Os valores percentuais exatos devem ficar em `gems.json` e ser balanceáveis.

## 59.1 Schema

```ts
type GemDefinition = {
  id: string;
  name: string;
  rarity: Rarity;
  tier: number;
  modifiers: Modifier[];
  activeEffectIds?: string[];
  skillTreeHooks: string[];
  affinityTags: string[];
  unique?: boolean;
};
```

---

# 60. RUNAS E RUNAS SUPERIORES

## 60.1 Runas básicas registradas

1. Runa da Cura
2. Runa de Regeneração
3. Runa da Mana
4. Runa do Escudo
5. Runa do Vigor
6. Runa do Sangue
7. Runa da Purificação
8. Runa do Fogo
9. Runa da Velocidade
10. Runa da Ruína

Runas adicionais presentes em outros materiais:

- Runa de Selamento;
- Runa de Preservação;
- Runa do Vento Sussurrante.

Estas devem ser mantidas em grupos de conteúdo próprios quando necessário.

## 60.2 Runa Superior

Schema:

```ts
type SuperiorRuneDefinition = {
  id: string;
  name: string;
  dominantRule: Effect[];
  requirements: Condition[];
  affinityTags: string[];
  skillTreeHooks: string[];
  source: 'craft' | 'boss' | 'quest' | 'artifact' | 'ritual';
};
```

Nomes e catálogo completo de Runas Superiores ainda são `OWNER_DECISION`.

O motor deve suportar o tipo mesmo antes de o catálogo final existir.

---

# 61. RUNA-JOIA ÉPICA DA ALMA — GRAU VII

## 61.1 Estrutura

```ts
type EpicSoulCore = {
  id: string;
  weaponInstanceId: string;
  generatedName: string;
  sourceComponents: {
    essenceIds: string[];
    gemIds: string[];
    runeId: string;
    superiorRuneId: string;
  };
  inheritedModifiers: Modifier[];
  inheritedSkillIds: string[];
  memoryIds: string[];
  epicPropertyId: string;
  affinityTags: string[];
  createdAt: string;
};
```

## 61.2 Algoritmo de unificação

```text
1. validar Grau VI completo
2. validar dois Fragmentos de Essência
3. validar duas Joias
4. validar Runa
5. validar Runa Superior
6. coletar modificadores permanentes
7. coletar nodes desbloqueados
8. coletar Memórias e Cicatrizes
9. calcular afinidades dominantes
10. aplicar matriz de sinergia
11. gerar/selecionar Propriedade Épica compatível
12. condensar componentes no EpicSoulCore
13. promover item para Grau VII
14. preservar component history
15. mudar visual stage para 7
16. disparar evento BoundItemUnified
17. autosave
```

## 61.3 Regra de preservação

A Unificação nunca pode apagar um modificador permanente válido sem uma regra explícita de conversão mostrada ao jogador.

## 61.4 Destruição e Reforja

Se um Item Vinculado de alto Grau for destruído por narrativa ou regra futura, gerar:

```text
SoulShard / Fragmento da Alma
```

Ele deve preservar pelo menos:

- identidade;
- Memórias;
- histórico de componentes;
- parte da Ressonância;
- ID da Runa-Joia quando existir.

A Reforja completa ainda é `OWNER_DECISION`, mas o schema deve suportá-la.

---

# 62. ITEM BASE VS. ITEM INSTÂNCIA

## 62.1 ItemDefinition

É o template do conteúdo.

```text
Espada Longa
Arco Longo
Cetro Arcano
```

## 62.2 ItemInstance

É o objeto real no save.

Duas Espadas Longas podem possuir IDs diferentes.

## 62.3 BoundItemInstance

É uma ItemInstance que recebeu Vínculo.

Depois do Vínculo, alterações devem acontecer na instância, nunca no template global.

## 62.4 Armas iniciais registradas no manual

| Arma | Dano de referência | Tipo | Peso |
|---|---:|---|---|
| Espada Longa | 3 | Corte | Médio |
| Machado de Guerra | 4 | Corte | Pesado |
| Arco Longo | 2 | Perfuração | Leve |
| Adaga | 2 | Perfuração | Leve |
| Cetro Arcano | 2 | Mágico | Leve |
| Livro de Magias “Projéteis” | 4 | Mágico | Médio |
| Cajado de Conjuração | 2 | Mágico | Pesado |

O Manual v2.2 deve ser a escala inicial. Os números elevados do protótipo HTML permanecem `prototypeLegacy`.

---

# 63. ARQUÉTIPOS DE ARMA E TREES

O Work deve separar tipo visual de arquétipo mecânico.

Arquétipos mínimos:

```text
blade
axe
bow
dagger
staff
grimoire
arcaneFocus
shield
```

Cada arquétipo possui `baseTreeId`.

## 63.1 Exemplo — Bow Tree

```text
G1 — Domínio do Arco
  ├─ Mira Vinculada
  ├─ Tensão Resonante
  └─ Chamado da Corda

G2 — Essência
  ├─ Projétil Imbuído
  └─ Resistência da Afinidade

G3 — Joia
  ├─ Foco Lapidado
  └─ Canalização de Precisão

G4 — Runa
  ├─ Disparo Inscrito
  └─ Reação Rúnica

G5 — Convergência
  ├─ Flecha Híbrida
  ├─ Dupla Afinidade
  └─ Chuva Convergente

G6 — Runa Superior
  ├─ Regra do Arco Ascendente
  └─ Disparo de Ascensão

G7 — Unificação
  ├─ Runa-Joia da Alma
  └─ Manifestação Épica
```

Os nomes acima são base de implementação e podem ser substituídos por nomenclatura final de lore.

---

# 64. PROGRESSÃO DO PERSONAGEM VS. PROGRESSÃO DA ARMA

São sistemas independentes.

## 64.1 Personagem

- nível 1–14;
- XP geral;
- atributos;
- perícias;
- vantagens/desvantagens;
- skills de classe;
- desbloqueios de mundo.

## 64.2 Item Vinculado

- Grau 1–7;
- Ressonância;
- Pontos de Ressonância;
- Skill Tree;
- componentes;
- Memórias;
- transformação.

Um personagem de nível alto pode começar um novo Vínculo em Grau I.

Um Item Vinculado não deve subir automaticamente quando o personagem sobe de nível.

---

# 65. COMBATE EM TURNOS — VERSÃO INTEGRADA

## 65.1 Máquina de estados final

```text
BattleInitializing
→ RoundStart
→ BuildInitiative
→ ActorTurnStart
→ ApplyStartEffects
→ AwaitCommand
→ SelectAction
→ SelectTarget
→ ConfirmAction
→ ResolveAction
→ ResolveWeaponTreeEffects
→ ResolveReactions
→ ApplyEndEffects
→ CheckDeaths
→ CheckBattleEnd
→ ActorTurnEnd
→ NextActor
→ RoundEnd
↺
```

## 65.2 Comandos do jogador

```text
ATACAR
HABILIDADE
ITEM
VÍNCULO
DEFENDER
FUGIR
```

### VÍNCULO abre submenu

```text
Skill da Arma
Absorção Direta
Inspecionar Ressonância
```

Infusão de Essência e evolução de Grau devem ocorrer fora de combate por padrão, salvo habilidade futura específica.

## 65.3 Ordem de iniciativa

Default de desenvolvimento:

```text
initiative = AGI + modifiers
```

Sem rolagem no MVP para tornar ordem previsível.

`OWNER_DECISION`: habilitar rolagem posteriormente.

## 65.4 Pipeline de ataque

```text
1. validar ator vivo
2. validar custo
3. validar cooldown
4. validar alvo
5. calcular acerto, se ruleset usar acerto
6. obter basePower
7. aplicar atributo escalador
8. aplicar arma
9. aplicar Skill Tree
10. aplicar classe/clã
11. aplicar buffs/debuffs
12. aplicar elemento/afinidade
13. aplicar defesa/resistência
14. resolver crítico
15. aplicar dano
16. aplicar status
17. disparar reactions
18. registrar log
19. atualizar quests/memórias por evento
```

## 65.5 Dano de desenvolvimento

Para manter compatibilidade com a escala do manual:

```text
physicalPower = floor(FOR / 2) + weaponDamage + modifiers
magicPower    = floor(AST / 2) + focusDamage + modifiers
rawDamage     = actionPower + scalingPower
finalDamage   = max(1, rawDamage - targetMitigation)
```

Todas as fórmulas devem ser trocáveis por ruleset.

## 65.6 IA inimiga mínima

```ts
chooseEnemyAction(enemy, battleState): ActionChoice
```

Prioridade simples:

1. usar skill especial quando condição for atendida;
2. atacar alvo válido;
3. aplicar cura/buff se configurado;
4. comportamento de boss por fase.

Nunca usar `Math.random()` espalhado. RNG deve passar por serviço seeded para testes.

## 65.7 Battle log

O log deve registrar eventos sem poluir UI.

Exemplo:

```text
[Turno 3] Aron usa Impacto Arcano.
[Turno 3] Fungorro Rastejante sofre 6 de dano.
[Turno 3] Essência Fúngica da arma ativa: +1 dano.
[Turno 3] Fungorro Rastejante foi derrotado.
```

---

# 66. TELA DE JOGO — COMBATE

## 66.1 Layout desktop

```text
┌───────────────────────────────────────────────────────────────────────┐
│ Local | Missão | Rodada | Menu | Configurações                       │
├──────────────────────┬──────────────────────────┬─────────────────────┤
│ PLAYER               │ CAMPO DE BATALHA          │ INIMIGOS / TIMELINE │
│ sprite               │                          │                     │
│ HP / MP              │ Player      Enemy A     │ ordem dos turnos    │
│ status               │             Enemy B     │ buffs/debuffs       │
│ arma vinculada       │             Enemy C     │ alvo selecionado    │
│ Grau / Ressonância   │                          │                     │
├──────────────────────┴──────────────────────────┴─────────────────────┤
│ ATACAR | HABILIDADE | ITEM | VÍNCULO | DEFENDER | FUGIR             │
├───────────────────────────────────────────────────────────────────────┤
│ Log recolhível / descrição da ação selecionada                       │
└───────────────────────────────────────────────────────────────────────┘
```

## 66.2 Mobile

- campo de batalha ocupa topo;
- player/inimigo em cards condensados;
- comandos em barra inferior;
- timeline horizontal rolável;
- painel da arma abre como drawer;
- log recolhível.

## 66.3 Feedback visual

- dano flutuante;
- cura flutuante;
- indicação de fraqueza;
- indicação de resistência;
- animação de status;
- highlight do alvo;
- pulso visual quando node da arma ativa;
- indicação de ganho de Ressonância;
- nunca depender somente de cor.

---

# 67. SPRITES E ASSETS — INSERÇÃO MANUAL

O criador deve conseguir adicionar/trocar sprites sem editar lógica do jogo.

## 67.1 Estrutura

```text
public/assets/
├─ player/
│  ├─ terririan/
│  └─ classes/
├─ enemies/
│  ├─ fungorros/
│  └─ bosses/
├─ npcs/
├─ weapons/
│  ├─ blade/
│  ├─ bow/
│  └─ ...
├─ items/
├─ gems/
├─ runes/
├─ essences/
├─ biomes/
├─ buildings/
├─ ui/
├─ vfx/
└─ audio/
```

## 67.2 Asset Registry

```json
{
  "id": "enemy_fungorro_rastejante",
  "type": "sprite",
  "states": {
    "idle": "/assets/enemies/fungorros/fungorro_rastejante_idle.png",
    "attack": "/assets/enemies/fungorros/fungorro_rastejante_attack.png",
    "hit": "/assets/enemies/fungorros/fungorro_rastejante_hit.png",
    "dead": "/assets/enemies/fungorros/fungorro_rastejante_dead.png"
  },
  "fallback": "/assets/placeholders/enemy.png"
}
```

## 67.3 Regra de fallback

Se um arquivo não existir:

- mostrar placeholder;
- registrar warning em desenvolvimento;
- não quebrar combate;
- não bloquear save.

## 67.4 Sprites de evolução da arma

Cada `BoundItemInstance` pode apontar para sprite por Grau:

```json
{
  "baseItemId": "arco_longo",
  "evolutionSprites": {
    "1": "weapon_arco_longo_g1",
    "2": "weapon_arco_longo_g2",
    "3": "weapon_arco_longo_g3",
    "4": "weapon_arco_longo_g4",
    "5": "weapon_arco_longo_g5",
    "6": "weapon_arco_longo_g6",
    "7": "weapon_arco_longo_g7"
  }
}
```

Se somente o sprite Grau I existir, usar o mesmo até os demais serem adicionados.

## 67.5 Convenção recomendada

```text
<categoria>_<id>_<estado>.<ext>
```

Exemplos:

```text
npc_eldamar_portrait.png
enemy_fungorro_rastejante_idle.png
weapon_arco_longo_g3.png
vfx_entropy_burst.png
```

---

# 68. TELAS DO JOGO — ROTAS

```text
/
/new-game
/character/create
/terran
/terran/:buildingId
/character
/inventory
/bound-item
/bound-item/tree
/quests
/world
/trail/:trailId
/dungeon/:dungeonId
/battle
/loot
/settings
/dev/content   // somente desenvolvimento
```

## 68.1 Tela do Item Vinculado

Deve mostrar:

- sprite/forma atual;
- nome;
- Grau;
- Ressonância atual/próximo Grau;
- componentes;
- modificadores totais;
- Memórias;
- botão Skill Tree;
- botão Rito de Evolução quando elegível;
- preview das mudanças antes de inserir componente.

## 68.2 Tela Skill Tree

Requisitos:

- pan/zoom;
- nodes por Grau;
- bloqueados visíveis;
- nodes ocultos não revelados até condição apropriada;
- linhas de pré-requisito;
- preview de custo;
- preview de efeito;
- ramo criado por Essência/Joia/Runa destacado;
- compatível com touch.

---

# 69. TERRAN — HUB JOGÁVEL

Edifícios iniciais:

```text
Praça
Taverna
Ferreiro
Armeiro
Loja de Poções
Casa/Salão do Clã
Guarda
Mercador
Oficina Rúnica
Lapidário/Joalheria
```

Os dois últimos podem compartilhar NPC/edifício inicialmente, mas o sistema deve suportá-los separadamente.

## 69.1 Serviços vinculados à evolução

### Ferreiro
- armas/armaduras;
- reparo;
- futuras reforjas.

### Oficina Rúnica
- inserir Runa no Grau IV;
- inserir Runa Superior no Grau VI;
- visualizar compatibilidades.

### Lapidário
- inserir Joia no Grau III;
- segunda Joia no Grau V.

### Ritual de Vínculo
Pode ocorrer no salão do Clã, templo ou NPC especializado. Local final: `OWNER_DECISION`.

### Ritual de Unificação
Deve ser evento especial no Grau VII, não uma ação instantânea de menu comum.

---

# 70. NPC DATABASE — CONTEÚDO JÁ EXISTENTE

## 70.1 Núcleo de Terran — 25 personagens ligados às antigas ramificações/clãs

### Guardiões Dûn'Avar
- Kaedin, o Vigia Silencioso
- Mireya, a Guardiã da Vigília
- Torvan, o Escudo de Terran
- Selaris, a Oráculo da Proteção
- Dremor, o Último Sentinela

### Tejedores de Runas
- Valmira, a Artífice Rúnica
- Edran, o Gravador de Símbolos
- Talia, a Mestra do Cristal
- Lorian, o Alquimista das Inscrições
- Feril, o Guardião das Pedras

### Sábios Celestiais
- Zyren, o Leitor de Estrelas
- Syra, a Profetisa Esquecida
- Gareth, o Guardião do Orbe
- Nerion, o Cartógrafo Celestial
- Velora, a Astróloga Proibida

### Mestres do Éter
- Eldrin, o Teórico Arcano
- Maelis, a Condutora de Fluxo
- Toren, o Caçador de Desequilíbrio
- Faylen, o Guardião dos Tomos
- Orvas, o Exilado da Magia

### Anciãos da Vida
- Theren, o Zelador da Árvore
- Mirael, a Guardiã dos Espíritos da Floresta
- Sylwen, a Criadora de Poções
- Jorvan, o Orador da Vida
- Velkan, o Guardião Adormecido

## 70.2 Cidadãos de Terran — 10

- Aedric, o Carpinteiro
- Briana, a Herbalista
- Cedric, o Aprendiz de Druida
- Dagna, a Tecelã
- Elric, o Caçador Gentil
- Faelyn, a Guardiã do Bosque
- Gethin, o Velho Contador de Histórias
- Hestia, a Ceramista
- Iomar, o Músico da Vila
- Junia, a Pastora de Ovelhas

Todos possuem objetivo pessoal no material-fonte e podem virar quest hooks.

## 70.3 NPCs de sidequest em Terran já detalhados

### Recompensa rara

1. Maelis, a Viajante Entre Mundos — Orbe de Valis
2. Durnan, o Ferreiro Errante — Lâmina de Vorst
3. Elvira, a Guardiã do Pergaminho Oculto — Tomo da Lua Perdida
4. Keldron, o Caçador Sombrio — Arco de Espectro
5. Syrel, o Ladrão de Runas — Runa do Vento Sussurrante

### Recompensa normal atualmente descrita

6. Orlan, o Herbalista Solitário — Saquinho de Ervas Curativas
7. Varis, o Feirante de Antiguidades — Chave de Ferro Velha
8. Grulf, o Taberneiro Cansado — Barril de Hidromel Forte
9. Elrik, o Mercenário Desiludido — Espada Cega de Ferro
10. Hellenia, a Cronista dos Dias Antigos — Caneta de Ponta de Cristal
11. Rando, o Escultor de Máscaras — Máscara de Madeira Enfeitiçada
12. Morik, o Domador de Criaturas Noturnas — Sinalizador de Chamada
13. Yasmin, a Ourives da Cidade — Anel de Quartzo
14. Garlan, o Informante de Beco — Mapa de Saídas Secretas
15. Neera, a Aprendiz de Alquimia — Frasco de Pó Luminescente

**Inconsistência da fonte:** o cabeçalho afirma “NPCs com itens normais (20)”, mas apenas 10 estão efetivamente descritos. Os 10 restantes são conteúdo faltante.

## 70.4 NPCs regionais — 20

### Haldar
- Nymara
- Zarak
- Golmar
- Yveli
- Kael

### Varash
- R’Zir
- Luthan
- Hara
- Ikan
- Darum

### Skjold
- Rymir
- Eiri
- Thormund
- Svyra
- Kjorn

### Vale de Korduun
- Orgra
- Vaelor
- Dorgar
- Krav
- Myn

Esses NPCs já possuem sidequest resumida no material e devem ser carregados em `npcs.json` e `quests.json`.

---

# 71. CONFLITOS DE NOMES/NPCS A RESOLVER

O app deve usar IDs distintos desde já.

## 71.1 Maelis
Existem pelo menos:

- Maelis, a Condutora de Fluxo;
- Maelis, a Viajante Entre Mundos.

`OWNER_DECISION`: mesma pessoa, homônimas ou renomear uma delas.

## 71.2 Lorian
Existem referências a:

- Lorian, o Alquimista das Inscrições;
- Lorian, o Gravador Renegado, boss das Catacumbas.

`OWNER_DECISION`: ligação narrativa ou nomes coincidentes.

## 71.3 Kael
O nome aparece em múltiplos contextos do universo. IDs devem impedir colisão mesmo antes da revisão de lore.

---

# 72. CAMPANHA PRINCIPAL — O DESPERTAR DAS SOMBRAS

A Temporada 1 existente deve ser adaptada como primeira campanha jogável.

## 72.1 Premissa

- tremores em Terran;
- perda de brilho da Árvore Celestáris;
- animais inquietos;
- bandidos de Argareth;
- Fragmento Corrompido de Celestáris;
- Fungorros despertos;
- corrupção crescente;
- revelação do possível despertar de Malakar.

## 72.2 Estrutura em 10 capítulos/quests

### MAIN-01 — Registros Antigos
NPC: Mestre Eldamar

Fonte narrativa:
- introduz a missão;
- libera Registros Antigos;
- revela mapa de caverna selada.

Implementação proposta:

```text
Talk Eldamar
→ Visit Records Archive
→ Inspect 3 records
→ Unlock cave map
```

### MAIN-02 — Caçadores Perdidos
NPC: Caçador Vorren

Fonte:
- perdeu grupo em emboscada;
- sabe dos Fungorros;
- recompensa Arco Encantado de Vorren.

Implementação proposta:

```text
Explore Astravél
→ Find 3 traces
→ Defeat Fungorro encounter
→ Discover fate of hunting group
→ Return Vorren
```

### MAIN-03 — Sinais de Corrupção
NPC: Lithwynn

Fonte:
- ensina identificação de corrupção;
- recompensa Poções de Resistência a Esporos.

Implementação proposta:

```text
Collect Fungo-Luminar
→ Collect corrupted sample
→ Return sample
→ Unlock corruption scan tutorial
```

### MAIN-04 — A Investida de Argareth
NPC: Capitão Zareth

Fonte:
- conduz primeiro combate real contra bandidos;
- recompensa Escudo de Luz Celestáris.

### MAIN-05 — Caminhos do Céu
NPC: Draelis

Fonte:
- permite transporte a locais inacessíveis;
- recompensa Grifo domesticado, utilizável uma vez por dia na versão narrativa.

No app, `daily` precisa ser definido: tempo real ou descanso/ciclo do jogo. `OWNER_DECISION`.

### MAIN-06 — Purificação dos Esporos
NPC: Curandeira Daeryn

Fonte:
- cura;
- ritual contra propagação Fungorra;
- Talismã de Cura.

### MAIN-07 — O Manuscrito Antigo
NPC: Torvynn

Fonte:
- manuscrito revela ameaça maior;
- recompensa runa para decifrar textos antigos.

### MAIN-08 — Karath, o Impiedoso
Boss/intermediário: Karath

Fonte:
- revela altar negro;
- armadura enfraquece criaturas corrompidas.

### MAIN-09 — Rainha Fungorra
Boss: Rainha Fungorra

Fonte:
- primeira grande batalha;
- recompensa objeto brilhante pulsando energia mágica.

Nome formal do objeto: `OWNER_DECISION`.

### MAIN-10 — O Selo Quebrado
Evento: Despertar de Malakar

Fonte:
- revelação final da temporada;
- título Protetores de Terran;
- bênção de Celestáris fortalece itens mágicos.

A bênção deve interagir com o sistema de Vínculo. Proposta:

```text
BlessingOfCelestaris
→ +Ressonância em evento
OU
→ unlock especial na Skill Tree
OU
→ bônus permanente em Item Vinculado
```

Escolha final: `OWNER_DECISION`.

---

# 73. SIDEQUESTS JÁ EXISTENTES — TERRAN

Cada uma deve receber um `questId` estável.

| Quest ID | NPC | Objetivo resumido existente |
|---|---|---|
| `sq_maelis_artifacts` | Maelis, Viajante | encontrar três artefatos perdidos |
| `sq_durnan_tools` | Durnan | recuperar equipamentos roubados |
| `sq_elvira_scroll` | Elvira | ajudar a decifrar pergaminho proibido |
| `sq_keldron_antidote` | Keldron | conseguir antídoto contra infecção Fungorra |
| `sq_syrel_rune` | Syrel | ajudar fuga ou entregar às autoridades |
| `sq_orlan_herb` | Orlan | encontrar erva mística rara |
| `sq_varis_amulet` | Varis | recuperar amuleto roubado |
| `sq_grulf_drink` | Grulf | conseguir ingrediente para bebida lendária |
| `sq_elrik_past` | Elrik | enfrentar inimigo do passado |
| `sq_hellenia_scroll` | Hellenia | achar pergaminho raro nas ruínas |
| `sq_rando_materials` | Rando | buscar materiais para máscaras |
| `sq_morik_bat` | Morik | recuperar filhote de morcego |
| `sq_yasmin_crystal` | Yasmin | encontrar cristal roubado |
| `sq_garlan_plot` | Garlan | descobrir quem trama contra ele |
| `sq_neera_experiment` | Neera | coletar ingredientes alquímicos |

A forma exata de cada objetivo ainda precisa de números, locais e encontros.

---

# 74. SIDEQUESTS REGIONAIS JÁ EXISTENTES

## Haldar

| ID | NPC | Sidequest |
|---|---|---|
| `sq_haldar_nymara` | Nymara | buscar ingrediente de antídoto no pântano |
| `sq_haldar_zarak` | Zarak | entregar mensagem furtivamente |
| `sq_haldar_golmar` | Golmar | coletar escamas de fera lendária |
| `sq_haldar_yveli` | Yveli | restaurar conexão espiritual |
| `sq_haldar_kael` | Kael | defender cultivo contra saqueadores |

## Varash

| ID | NPC | Sidequest |
|---|---|---|
| `sq_varash_rzir` | R’Zir | rastrear ladrões |
| `sq_varash_luthan` | Luthan | eliminar predador de serpentes |
| `sq_varash_hara` | Hara | encontrar tintura especial |
| `sq_varash_ikan` | Ikan | recuperar mapa roubado |
| `sq_varash_darum` | Darum | enfrentar inimigo do passado |

## Skjold

| ID | NPC | Sidequest |
|---|---|---|
| `sq_skjold_rymir` | Rymir | descobrir origem da maldição da caça |
| `sq_skjold_eiri` | Eiri | recuperar cristais raros |
| `sq_skjold_thormund` | Thormund | encontrar livro perdido no gelo |
| `sq_skjold_svyra` | Svyra | resgatar lobo desaparecido |
| `sq_skjold_kjorn` | Kjorn | quebrar maldição do machado |

## Korduun

| ID | NPC | Sidequest |
|---|---|---|
| `sq_korduun_orgra` | Orgra | encontrar pedra lendária |
| `sq_korduun_vaelor` | Vaelor | entregar mensagem entre picos |
| `sq_korduun_dorgar` | Dorgar | recolher ingredientes para liga metálica |
| `sq_korduun_krav` | Krav | encontrar cura antes de ataque inimigo |
| `sq_korduun_myn` | Myn | defender escavação de cristais |

---

# 75. QUEST ENGINE — DETALHAMENTO

## 75.1 Tipos de objetivo

```ts
type QuestObjectiveType =
  | 'talk'
  | 'kill'
  | 'collect'
  | 'deliver'
  | 'visit'
  | 'interact'
  | 'seal'
  | 'boss'
  | 'survive'
  | 'defend'
  | 'escort'
  | 'choice'
  | 'unlockBoundDegree'
  | 'infuseEssence'
  | 'insertGem'
  | 'insertRune'
  | 'completeRite';
```

## 75.2 Quest como tutorial sistêmico

A campanha inicial deve ensinar o sistema naturalmente:

```text
MAIN-01 → exploração e diálogo
MAIN-02 → combate e tracking
MAIN-03 → material/essência
MAIN-04 → combate humano/equipamento
MAIN-05 → viagem/desbloqueio
MAIN-06 → status e cura
MAIN-07 → runas/lore
MAIN-08 → miniboss
MAIN-09 → boss + essência rara
MAIN-10 → Vínculo/gancho de temporada
```

## 75.3 Missões de evolução do Vínculo

Criar linha sistêmica separada:

```text
BOND-01 — Ritual do Vínculo        → Grau I
BOND-02 — Primeira Essência        → Grau II
BOND-03 — Lapidação                → Grau III
BOND-04 — Primeira Inscrição       → Grau IV
BOND-05 — Convergência             → Grau V
BOND-06 — Runa Superior            → Grau VI
BOND-07 — Unificação da Alma       → Grau VII
```

As missões podem usar NPCs já existentes:

- Talia para Joias;
- Edran/Valmira para Runas;
- Feril para reservas de runas;
- Eldrin/Toren para Entropia;
- Mireya/Torvan para vínculo defensivo;
- NPC final do Grau VII: `OWNER_DECISION`.

---

# 76. RUÍNAS — CONTEÚDO JOGÁVEL

## 76.1 Ruína 1 — Câmaras Fúngicas de Astravél

Criaturas documentadas:

| Criatura | Nv | HP | Defesa | XP |
|---|---:|---:|---:|---:|
| Fungorro Rastejante | 1 | 8 | 6 | 15 |
| Semeador de Esporos | 2 | 8 | 6 | 25 |
| Bola de Gosma Fúngica | 3 | 12 | 7 | 50 |
| Horror Esporulante | 4 | 15 | 8 | 100 |
| Titan Raiz-Negra | 5 | 20 | 10 | 250 |

Fraquezas principais registradas: Luz e Fogo.

Boss geral da dungeon: Colosso Micélio.

## 76.2 Ruínas 2–5

### Catacumbas das Runas Esquecidas
- runas instáveis;
- subterrâneos de Terran;
- boss Lorian, o Gravador Renegado.

### Templo das Estrelas Quebradas
- Montanhas de Korduun;
- astronomia sombria;
- boss Orbe de Valerian.

### Poço das Almas Perdidas
- Floresta de Astravél;
- maldição ancestral;
- boss O Sem-Rosto.

### Vale das Engrenagens Corrompidas
- Ruínas de Keth'Zar;
- tecnomagia perdida;
- boss Engrenagem Maldita.

## 76.3 Ruínas 6–10

Reservadas. Não inventar automaticamente conteúdo definitivo.

---

# 77. LOOT E PROGRESSÃO DE VÍNCULO

Cada loot table pode conceder:

```text
ouro
consumível
material
arma/armadura
joia
runa
fragmento de essência
quest item
artefato
```

## 77.1 Regras de Essência por boss

Bosses devem possuir chance alta ou garantida de um Fragmento de Essência único/importante para incentivar progressão da Skill Tree.

## 77.2 Preview de componente

Antes de inserir Essência, Joia ou Runa, mostrar:

- status adicionados;
- nodes que serão revelados;
- incompatibilidades;
- visual tags;
- se a ação é reversível.

A regra de remoção/substituição ainda é `OWNER_DECISION`.

---

# 78. SAVE ATUALIZADO

O save deve incluir Item Vinculado integralmente.

```ts
type Character = {
  // campos anteriores
  boundItemIds: string[];
  activeBoundItemId: string | null;
};
```

```ts
type SaveGame = {
  schemaVersion: number;
  gameVersion: string;
  characters: Character[];
  itemInstances: ItemInstance[];
  boundItems: BoundItemInstance[];
  world: WorldProgress;
  quests: QuestProgress[];
  discoveredNpcs: string[];
  settings: PlayerSettings;
};
```

Eventos críticos que exigem autosave:

- criar vínculo;
- inserir componente;
- avançar Grau;
- desbloquear node;
- unificação;
- completar quest;
- receber item único;
- terminar boss;
- alterar decisão narrativa irreversível.

---

# 79. EVENTOS DE DOMÍNIO — EXPANSÃO

Adicionar:

```text
BoundItemCreated
BoundItemResonanceGained
BoundItemNodeUnlocked
BoundItemDegreeReady
BoundItemDegreeAdvanced
EssenceInfused
GemInserted
RuneInserted
SuperiorRuneInserted
BoundItemMemoryCreated
BoundItemScarCreated
BoundItemUnified
EpicSoulCoreCreated
```

Quests, achievements futuros, UI e save devem reagir a esses eventos.

---

# 80. ESTRUTURA ATUALIZADA DO REPOSITÓRIO

```text
terrunia-app/
├─ README.md
├─ package.json
├─ docs/
│  ├─ TERRUNIA_GAME_APP_MASTER_SPEC_v0.3.md
│  ├─ CANON_DECISIONS.md
│  ├─ GAME_BALANCE.md
│  ├─ ASSET_GUIDE.md
│  └─ CHANGELOG_CONTENT.md
├─ public/
│  └─ assets/
│     ├─ placeholders/
│     ├─ player/
│     ├─ enemies/
│     ├─ npcs/
│     ├─ weapons/
│     ├─ items/
│     ├─ gems/
│     ├─ runes/
│     ├─ essences/
│     ├─ biomes/
│     ├─ buildings/
│     ├─ ui/
│     ├─ vfx/
│     └─ audio/
├─ src/
│  ├─ app/
│  ├─ domain/
│  │  ├─ character/
│  │  ├─ combat/
│  │  ├─ inventory/
│  │  ├─ boundItems/
│  │  ├─ skillTrees/
│  │  ├─ quests/
│  │  ├─ progression/
│  │  ├─ exploration/
│  │  └─ economy/
│  ├─ content/
│  │  ├─ clans.json
│  │  ├─ classes.json
│  │  ├─ classSkills.json
│  │  ├─ weaponArchetypes.json
│  │  ├─ weaponSkillTrees.json
│  │  ├─ skillTreeNodes.json
│  │  ├─ items.json
│  │  ├─ essences.json
│  │  ├─ gems.json
│  │  ├─ runes.json
│  │  ├─ superiorRunes.json
│  │  ├─ enemies.json
│  │  ├─ bosses.json
│  │  ├─ dungeons.json
│  │  ├─ biomes.json
│  │  ├─ settlements.json
│  │  ├─ npcs.json
│  │  ├─ quests.json
│  │  ├─ mainCampaign.json
│  │  ├─ lootTables.json
│  │  └─ assetRegistry.json
│  ├─ rules/
│  │  ├─ ruleset.ts
│  │  ├─ stats.ts
│  │  ├─ damage.ts
│  │  ├─ xp.ts
│  │  ├─ resonance.ts
│  │  ├─ boundDegree.ts
│  │  ├─ skillTree.ts
│  │  ├─ infusion.ts
│  │  ├─ unification.ts
│  │  └─ absorption.ts
│  ├─ state/
│  │  ├─ characterStore.ts
│  │  ├─ inventoryStore.ts
│  │  ├─ boundItemStore.ts
│  │  ├─ questStore.ts
│  │  ├─ worldStore.ts
│  │  ├─ combatStore.ts
│  │  └─ uiStore.ts
│  ├─ persistence/
│  ├─ ui/
│  │  ├─ components/
│  │  ├─ screens/
│  │  ├─ battle/
│  │  ├─ skillTree/
│  │  └─ theme/
│  └─ main.tsx
└─ tests/
   ├─ unit/
   ├─ integration/
   └─ e2e/
```

---

# 81. CONTENT LOADER E VALIDAÇÃO

Usar schemas para validar JSON em desenvolvimento.

Sugestão técnica:

- Zod, Valibot ou schema equivalente;
- não acoplar domínio à biblioteca escolhida;
- falhar cedo em dev;
- em produção, mostrar erro amigável e fallback quando possível.

Novas validações:

- Bound Item com Grau inválido;
- número de componentes superior ao permitido;
- node apontando para predecessor inexistente;
- node de Grau V liberado em Grau III;
- Joia inexistente;
- Runa Superior inexistente;
- condição de sinergia inválida;
- sprite registry quebrado;
- quest referenciando NPC ausente;
- componente final do Grau VII incompleto.

---

# 82. EXEMPLO JSON — ITEM VINCULADO

```json
{
  "instanceId": "bound_001",
  "baseItemId": "arco_longo",
  "ownerCharacterId": "char_001",
  "soulSignatureId": "soul_char_001",
  "customName": "Arco Vinculado de Aron",
  "degree": 4,
  "resonance": 980,
  "resonancePoints": 2,
  "components": {
    "essences": ["essinst_tempest_01"],
    "gems": ["geminst_topazio_01"],
    "rune": "runeinst_velocidade_01",
    "superiorRune": null
  },
  "skillTree": {
    "treeId": "tree_bow_base",
    "unlockedNodeIds": [
      "bond_core",
      "mastery_1",
      "essence_channel_1",
      "gem_focus_1",
      "synergy_tempest_topaz",
      "rune_rule_1"
    ],
    "activeNodeIds": [],
    "spentPoints": 6,
    "generatedBranchIds": ["branch_lightning"]
  },
  "memories": [],
  "scars": [],
  "visualEvolution": {
    "stage": 4,
    "vfxTags": ["lightning", "runic"]
  }
}
```

---

# 83. EXEMPLO JSON — SKILL TREE NODE

```json
{
  "id": "synergy_tempest_topaz",
  "name": "Condutor da Tempestade",
  "description": "A ressonância elétrica da essência é estabilizada pelo Topázio do Relâmpago.",
  "category": "synergy",
  "cost": 1,
  "degreeRequired": 3,
  "prerequisites": ["essence_channel_1", "gem_focus_1"],
  "conditions": [
    { "type": "hasEssenceTag", "value": "lightning" },
    { "type": "hasGemId", "value": "topazio_relampago" }
  ],
  "effects": [
    { "type": "statModifier", "stat": "rangedPower", "mode": "flat", "value": 1 },
    { "type": "chanceOnHit", "effectId": "shock", "chance": 0.10 }
  ],
  "tags": ["bow", "lightning", "synergy"]
}
```

Valores: `BALANCE_DRAFT`.

---

# 84. EXEMPLO JSON — ESSÊNCIA

```json
{
  "id": "essence_fungorro_spore",
  "name": "Essência Esporulante",
  "tier": 1,
  "affinity": ["fungal", "poison"],
  "sourceTags": ["fungorro"],
  "modifiers": [
    { "stat": "poisonResistance", "mode": "flat", "value": 1 }
  ],
  "skillTreeHooks": [
    "branch_fungal",
    "node_spore_strike"
  ],
  "visualTags": ["spores", "fungal"]
}
```

---

# 85. EXEMPLO JSON — NPC

```json
{
  "id": "npc_talia_crystal_master",
  "name": "Talia",
  "title": "Mestra do Cristal",
  "settlementId": "terran",
  "roles": ["questGiver", "trainer", "vendor"],
  "questIds": ["bond_03_lapidacao"],
  "shopId": "shop_talia_gems",
  "portraitAsset": "npc_talia_portrait",
  "tags": ["gem", "craft", "terran"]
}
```

---

# 86. EXEMPLO JSON — QUEST DE EVOLUÇÃO

```json
{
  "id": "bond_03_lapidacao",
  "title": "Lapidação da Alma",
  "giverNpcId": "npc_talia_crystal_master",
  "prerequisites": [
    { "type": "activeBoundDegree", "value": 2 },
    { "type": "activeBoundResonanceAtLeast", "value": 300 },
    { "type": "inventoryHasTag", "value": "gem" }
  ],
  "objectives": [
    { "id": "talk_talia", "type": "talk", "targetId": "npc_talia_crystal_master", "required": 1 },
    { "id": "perform_rite", "type": "completeRite", "targetId": "rite_gem_lapidation", "required": 1 }
  ],
  "rewards": [
    { "type": "unlockBoundDegree", "degree": 3 }
  ],
  "repeatable": true,
  "repeatPolicy": "oncePerBoundItem"
}
```

---

# 87. LÓGICA — AVANÇO DE GRAU

```ts
function canAdvanceDegree(item: BoundItemInstance, ctx: GameContext): Result {
  const target = item.degree + 1;
  if (target > 7) return fail('MAX_DEGREE');

  const rule = ctx.rules.boundItems.degreeRules[target];

  if (item.resonance < rule.minResonance) return fail('LOW_RESONANCE');
  if (!conditionsPass(rule.conditions, ctx, item)) return fail('CONDITIONS');
  if (!ctx.rites.isCompletedForItem(rule.riteId, item.instanceId)) return fail('RITE_REQUIRED');

  return ok();
}
```

## 87.1 Inserção de componente

```ts
function insertBoundComponent(item, component, slotType, ctx) {
  validateOwner(item, ctx.character.id);
  validateDegreeSlot(item.degree, slotType);
  validateFreeSlot(item, slotType);
  validateCompatibility(item, component);

  consumeInventoryInstance(component.instanceId);
  attachToBoundItem(item.instanceId, component.instanceId, slotType);
  generateSkillTreeBranches(item.instanceId, component);
  recalculateBoundItem(item.instanceId);
  emit('BoundItemComponentInserted');
  autosave();
}
```

## 87.2 Unificação

```ts
function unifyBoundItem(item, ctx) {
  assert(item.degree === 6);
  assert(canAdvanceDegree(item, ctx).ok);
  assert(item.components.essences.length === 2);
  assert(item.components.gems.length === 2);
  assert(item.components.rune);
  assert(item.components.superiorRune);

  const core = buildEpicSoulCore(item, ctx);

  item.degree = 7;
  item.finalCore = core;
  item.components = {
    essences: [],
    gems: [],
    rune: null,
    superiorRune: null
  };

  unlockNode(item, 'unification');
  resolveEpicManifestation(item, core, ctx);
  emit('BoundItemUnified');
  autosave();
}
```

---

# 88. LÓGICA — TURNO DE COMBATE

```ts
function resolvePlayerCommand(command: BattleCommand, state: BattleState): BattleState {
  assert(state.phase === 'AwaitCommand');
  validateCommand(command, state);

  state = spendCosts(command, state);
  state = resolvePrimaryEffects(command, state);
  state = resolveBoundItemEffects(command, state);
  state = resolveClassAndClanEffects(command, state);
  state = resolveReactions(state);
  state = tickStatuses(state);
  state = resolveDeaths(state);
  state = dispatchBattleDomainEvents(state);

  return advanceBattleState(state);
}
```

O resolver deve ser independente de React.

---

# 89. FLUXO DE GAMEPLAY COMPLETO

```text
BOOT
↓
NOVO JOGO / CONTINUAR
↓
CRIAÇÃO DE PERSONAGEM
↓
ARMA INICIAL
↓
RITUAL DE VÍNCULO
↓
TERRAN
├─ NPCs
├─ Quests
├─ Lojas
├─ Craft/Runas/Joias
├─ Skill Tree
└─ Preparação
↓
MAPA
↓
TRILHA / RUÍNA
├─ Combate
├─ Evento
├─ NPC
├─ Baú
├─ Acampamento
└─ Boss
↓
LOOT
├─ Item
├─ Ouro
├─ Essência
├─ Joia
└─ Runa
↓
TERRAN
↓
RESSONÂNCIA / RITO / EVOLUÇÃO
↓
NOVO GRAU / NOVOS NODES
↺
```

---

# 90. WORK — ORDEM DE IMPLEMENTAÇÃO RECOMENDADA

## Fase A — Fundação executável

- Vite/React/TypeScript;
- roteamento;
- stores;
- schemas;
- IndexedDB;
- asset registry;
- placeholders;
- content loader;
- testes.

## Fase B — Personagem

- criação;
- quatro clãs;
- doze classes;
- atributos;
- perícias;
- status derivados;
- save.

## Fase C — Item Vinculado

- item instance;
- vínculo Grau I;
- Ressonância;
- Skill Tree graph;
- desbloqueio de node;
- interface da árvore.

## Fase D — Terran

- tela hub;
- edifícios;
- NPCs;
- diálogo básico;
- quest list;
- lojas.

## Fase E — Combate

- state machine;
- inimigos;
- timeline;
- comandos;
- IA;
- skills;
- status;
- log;
- rewards.

## Fase F — Exploração

- Astravél;
- trilha;
- encontros;
- Câmaras Fúngicas;
- loot.

## Fase G — Evolução completa do Vínculo

- Grau II Essência;
- Grau III Joia;
- Grau IV Runa;
- Grau V Convergência;
- Grau VI Runa Superior;
- Grau VII Unificação.

## Fase H — Campanha

- MAIN-01 a MAIN-10;
- sidequests;
- NPC states;
- flags narrativas.

## Fase I — Polimento

- sprites finais;
- VFX;
- áudio;
- responsividade;
- acessibilidade;
- balanceamento.

---

# 91. CRITÉRIOS DE ACEITE — JOGO JOGÁVEL

O projeto não deve ser considerado jogável apenas por carregar telas.

Deve cumprir:

1. novo jogo funciona;
2. criação de personagem termina sem estado inválido;
3. quatro clãs e doze classes existem;
4. arma inicial pode ser escolhida/recebida;
5. Vínculo Grau I pode ser criado;
6. Skill Tree abre e desbloqueia node;
7. Terran pode ser navegado;
8. NPC pode iniciar diálogo;
9. quest pode ser aceita;
10. inventário funciona;
11. lojas funcionam;
12. sprite ausente usa placeholder;
13. sprite colocado manualmente aparece sem alterar lógica;
14. exploração de Astravél inicia;
15. trilha possui encontros;
16. combate suporta 1–3 inimigos;
17. iniciativa funciona;
18. ataque básico funciona;
19. habilidade de classe funciona;
20. habilidade de arma funciona;
21. item consumível funciona;
22. inimigo executa turno;
23. status temporários funcionam;
24. vitória concede recompensa;
25. derrota retorna de forma válida;
26. Fungorro pode soltar Essência;
27. Essência pode ser infundida no Grau II;
28. Joia pode ser inserida no Grau III;
29. Runa pode ser inserida no Grau IV;
30. segundo par Essência/Joia funciona no Grau V;
31. Runa Superior funciona no Grau VI;
32. Unificação funciona no Grau VII;
33. status de todos os componentes permanecem no core final;
34. nova Skill Épica é registrada;
35. save/reload preserva Skill Tree e componentes;
36. MAIN-01 pode ser concluída;
37. uma sidequest pode ser concluída;
38. boss da primeira dungeon funciona;
39. conteúdo é editável por JSON/config;
40. testes principais passam.

---

# 92. MODO DE DESENVOLVIMENTO / CONTENT LAB

Criar uma tela disponível apenas em dev:

```text
/dev/content
```

Funções úteis:

- dar XP;
- dar ouro;
- adicionar item;
- adicionar Essência;
- adicionar Joia;
- adicionar Runa;
- alterar Grau em ambiente de teste;
- testar Unificação;
- iniciar batalha;
- iniciar quest;
- teleportar para local;
- validar todos os JSON;
- preview de sprites;
- mostrar IDs.

Não disponibilizar esse painel no build de produção por padrão.

---

# 93. TESTES NOVOS PRIORITÁRIOS

## Bound Item

- Grau I não aceita Essência;
- Grau II aceita exatamente 1 Essência;
- Grau III aceita exatamente 1 Joia;
- Grau IV aceita exatamente 1 Runa;
- Grau V aceita exatamente 2 Essências e 2 Joias;
- Grau VI aceita exatamente 1 Runa Superior;
- Grau VII remove slots ativos e cria core;
- Unificação preserva modificadores;
- node não abre sem pré-requisitos;
- node dinâmico aparece com componente correto;
- componente incompatível é rejeitado;
- autosave após inserção.

## Combat

- ação inválida não altera estado;
- custo de MP não pode ficar negativo;
- reação ocorre uma vez quando limitada;
- inimigo morto não recebe turno;
- batalha encerra corretamente;
- seeded RNG reproduz combate.

## Quest

- evento de kill atualiza objetivo correto;
- item coletado atualiza collect;
- choice registra flag;
- quest de Grau responde a BoundItem events.

## Assets

- arquivo ausente usa placeholder;
- asset ID inexistente é reportado;
- troca de sprite não muda save.

---

# 94. LISTA DO QUE AINDA FALTA — CRIADOR / OWNER

Esta seção deve ser mantida atualizada e usada pelo Work como backlog de conteúdo.

## 94.1 Sistema — prioridade alta

- [ ] confirmar 3 ou 5 pontos iniciais de atributo;
- [ ] confirmar 3 ou 12 pontos iniciais de perícia;
- [ ] fechar custos divergentes das perícias;
- [ ] fechar fórmula final de acerto;
- [ ] decidir esquiva separada de defesa;
- [ ] definir crítico/falha crítica;
- [ ] confirmar iniciativa fixa ou rolada;
- [ ] fechar custos de MP das skills;
- [ ] fechar regra final de Absorção Direta;
- [ ] definir punição por derrota;
- [ ] definir regra de remoção/substituição de Essência antes do Grau VII;
- [ ] definir regra de remoção/substituição de Joia;
- [ ] definir regra de remoção/substituição de Runa;
- [ ] confirmar se Infusão sempre consome o Fragmento;
- [ ] definir incompatibilidades de Essência;
- [ ] definir como Runas Superiores são obtidas;
- [ ] definir catálogo de Runas Superiores;
- [ ] revisar thresholds de Ressonância dos 7 Graus;
- [ ] decidir custos em Pontos de Ressonância por node;
- [ ] decidir quantos Item Vinculados simultâneos um personagem pode manter.

## 94.2 Skill Trees — prioridade alta

- [ ] finalizar tree de Espada/Lâmina;
- [ ] finalizar tree de Machado;
- [ ] finalizar tree de Arco;
- [ ] finalizar tree de Adaga;
- [ ] finalizar tree de Cajado;
- [ ] finalizar tree de Grimório;
- [ ] finalizar tree de Cetro/Foco Arcano;
- [ ] finalizar tree de Escudo;
- [ ] criar nodes exclusivos de cada Clã;
- [ ] criar nodes exclusivos de cada Classe;
- [ ] criar matrizes de sinergia Essência × Joia;
- [ ] criar matrizes de sinergia Essência × Essência;
- [ ] definir regras da Propriedade Épica do Grau VII;
- [ ] decidir se nome final da arma é escolhido ou gerado.

## 94.3 Itens — prioridade alta

- [ ] revisar nomes genéricos das armas iniciais para lore;
- [ ] revisar Armadura de Couro/Malha/Placas;
- [ ] revisar Arco Élfico do protótipo;
- [ ] revisar Peitoral Dragônico;
- [ ] revisar Botas Ágis;
- [ ] consolidar ItemDB canônico;
- [ ] atribuir status finais a cada item;
- [ ] definir preços;
- [ ] definir peso final;
- [ ] definir origem/bioma/drop;
- [ ] definir quais itens são absorvíveis;
- [ ] definir quais itens podem iniciar Vínculo.

## 94.4 Joias e Runas

- [ ] reconciliar efeitos diferentes entre Manual e Universo;
- [ ] fechar números finais das 10 Joias;
- [ ] fechar números finais das 10 Runas básicas;
- [ ] decidir papel de Runa de Preservação;
- [ ] decidir papel de Runa de Selamento;
- [ ] decidir raridade da Runa do Vento Sussurrante;
- [ ] criar Runas Superiores.

## 94.5 NPCs e lore

- [ ] resolver Maelis × Maelis;
- [ ] resolver Lorian NPC × Lorian boss;
- [ ] revisar múltiplos Kael;
- [ ] formalizar relação entre 4 clãs jogáveis, Anci Da, antigas linhagens e 10 famílias civis;
- [ ] completar os 10 NPCs normais faltantes prometidos pelo documento;
- [ ] definir localização/edifício de cada NPC de Terran;
- [ ] criar retratos/sprites dos NPCs prioritários;
- [ ] escrever falas/árvores de diálogo.

## 94.6 Missões

- [ ] fechar objetivos numéricos de MAIN-01 a MAIN-10;
- [ ] fechar recompensa mecânica da Bênção de Celestáris;
- [ ] nomear item da Rainha Fungorra;
- [ ] definir encontros contra Argareth;
- [ ] definir o que significa “1 vez por dia” para o Grifo;
- [ ] detalhar cada uma das sidequests existentes;
- [ ] criar escolhas/consequências para Syrel;
- [ ] decidir reputação/facções;
- [ ] decidir se quests podem falhar.

## 94.7 Inimigos e Dungeons

- [ ] fechar stats do Colosso Micélio;
- [ ] criar enemies completos das Ruínas 2–5;
- [ ] criar fases dos bosses;
- [ ] definir essências de cada boss;
- [ ] definir Ruínas 6–10;
- [ ] decidir quais Caveira/Espectro/Carniçal/Lobo Sombrio etc. do HTML são canon;
- [ ] criar inimigos de Argareth.

## 94.8 Mundo

- [ ] mapas/arte de Terran;
- [ ] mapa de Astravél;
- [ ] mapa do Cerrado Místico;
- [ ] mapa de Elduran;
- [ ] mapa do Deserto Glacial;
- [ ] mapa de Korduun;
- [ ] localização de Haldar;
- [ ] localização de Varash;
- [ ] localização de Skjold;
- [ ] localização do Vale de Korduun;
- [ ] viagens/desbloqueios entre regiões.

## 94.9 Arte e sprites

- [ ] sprite player base Terrírian;
- [ ] variações de classe;
- [ ] animação idle;
- [ ] animação ataque;
- [ ] animação hit;
- [ ] animação defeat;
- [ ] sprites Fungorros;
- [ ] sprites bosses;
- [ ] portraits NPCs;
- [ ] sprites de armas Grau I–VII;
- [ ] ícones de itens;
- [ ] ícones de Essências;
- [ ] ícones de Joias;
- [ ] ícones de Runas;
- [ ] VFX de elementos;
- [ ] UI final.

## 94.10 Áudio

- [ ] música Terran;
- [ ] música Astravél;
- [ ] música batalha;
- [ ] música boss;
- [ ] SFX ataque;
- [ ] SFX runas;
- [ ] SFX joias;
- [ ] SFX evolução de Grau;
- [ ] SFX Unificação.

Nada desta lista deve bloquear a construção do **framework**, desde que placeholders e configs sejam usados.

---

# 95. PRIORIDADE DE DECISÕES DO CRIADOR

## P0 — necessárias para balanceamento final

- regras de acerto/dano;
- pontos de criação;
- custos das skills;
- Absorção Direta;
- regras de componentes do Vínculo;
- Skill Trees de cada arma;
- stats dos itens.

## P1 — necessárias para campanha completa

- diálogos;
- objetivos detalhados;
- bosses;
- inimigos das Ruínas 2–5;
- recompensas;
- economia.

## P2 — necessárias para apresentação final

- sprites;
- mapas;
- VFX;
- áudio;
- UI final.

---

# 96. REGRAS PARA O WORK NÃO TOMAR DECISÕES DE CANON

O Work pode:

- estruturar código;
- criar placeholders;
- criar dados de desenvolvimento;
- parametrizar regras;
- criar testes;
- sugerir alternativas.

O Work não deve, sem aprovação:

- apagar conteúdo existente;
- renomear personagens canônicos;
- fundir clãs/famílias;
- definir novas Ruínas 6–10 como canon;
- substituir as 7 etapas de Vínculo;
- alterar slots de cada Grau;
- remover Absorção de Essência;
- transformar a Runa-Joia Épica em loot comum;
- fazer arma vinculada perder seus status no Grau VII.

---

# 97. PROMPT DIRETO PARA CHATGPT WORK

Use o texto abaixo como instrução operacional inicial ao importar este documento:

```text
Construa Terrúnia App como um RPG web single-player jogável, modular e data-driven usando esta especificação como fonte técnica principal.

Prioridades:
1. Não hardcode conteúdo na UI.
2. Separe engine, rules, content, state, persistence e assets.
3. Implemente combate em turnos por máquina de estados.
4. Implemente o Item Vinculado como sistema central dos Terrírians.
5. Implemente os 7 Graus exatamente com estes slots:
   G1 vínculo/tree base;
   G2 +1 Essência;
   G3 +1 Joia;
   G4 +1 Runa;
   G5 +1 Essência e +1 Joia adicionais;
   G6 +1 Runa Superior;
   G7 Unificação total em Runa-Joia Épica da Alma, preservando todos os status.
6. Skill Tree deve ser um grafo data-driven e capaz de ganhar ramos dinamicamente por Essência, Joia e Runa.
7. Use placeholders quando sprites não existirem. Sprites devem poder ser adicionados manualmente por assetRegistry sem alterar lógica.
8. Use Terran como hub e O Despertar das Sombras como primeira campanha.
9. Cadastre os NPCs e sidequests descritos no documento.
10. Primeiro entregue uma vertical slice completa e testável: criação → vínculo → Terran → quest → Astravél → combate → loot → Essência → evolução → save.
11. Todos os OWNER_DECISION e BALANCE_DRAFT devem ficar configuráveis, não ser tratados como canon definitivo.
12. Crie testes unitários para regras e E2E para o fluxo principal.

Antes de expandir conteúdo, faça o build atual rodar e mantenha o jogo sempre executável.
```

---

# 98. DEFINIÇÃO FINAL v0.3

Terrúnia App é um RPG digital de turnos em que a principal identidade dos Terrírians é o **Vínculo da Alma com seus equipamentos**.

O personagem progride em nível, clã e classe, enquanto sua arma progride de maneira independente através de sete Graus. Essências, Joias, Runas e experiências vividas alteram a Skill Tree e transformam fisicamente o Item Vinculado. No Grau VII, todas as partes são unificadas em uma Runa-Joia Épica da Alma, preservando os status e criando um artefato único ligado à história daquele jogador.

Terran funciona como hub. A exploração ocorre por regiões, trilhas e Ruínas. O combate é por turnos. NPCs, quests e a campanha O Despertar das Sombras conectam lore e mecânica. Todo conteúdo deve ser data-driven, todos os sprites devem ser substituíveis manualmente e o motor deve permanecer expansível para novos povos, histórias, jogos e mídias de Terrúnia.

**Este documento é a base técnica recomendada para o próximo build do GitHub.**


# 96. MIGRAÇÃO v0.3 — ALTERAÇÕES OBRIGATÓRIAS NO APP

## 96.1 Remover da criação de personagem

Remover da tela de criação:

- seleção de Clã;
- seleção de Classe;
- qualquer seleção de NPC/herói/personagem pronto.

Nova sequência:

```text
Nome
→ Aparência/identidade
→ Atributos neutros
→ Perícias neutras
→ Vantagens/Desvantagens, se mantidas no ruleset
→ Revisão
→ Confirmar
→ Prólogo em Terran
```

## 96.2 Nova campanha de onboarding

O prólogo deve ensinar o sistema gradualmente:

```text
P00 Criar personagem cru
P01 Receber/obter equipamento básico
P02 Aprender combate
P03 Conhecer Terran
P04 Conhecer os Clãs
P05 Completar provas de iniciação opcionais
P06 Ingressar em um Clã
P07 Desbloquear Árvore do Clã
P08 Criar primeiro Vínculo
P09 Começar treino de Classe
P10 Escolher/desbloquear primeira disciplina de Classe
```

A campanha "O Despertar das Sombras" pode começar em paralelo após P03 ou após a filiação, conforme pacing final.

## 96.3 Novo schema de Character

```ts
type Character = {
  id: string;
  name: string;
  raceId: 'terririan';

  clan: {
    clanId: string | null;
    rank: number;
    reputation: number;
    initiationQuestId?: string;
    joinedAt?: string;
  };

  classProgression: {
    classId: string | null;
    masteryLevel: number;
    masteryXp: number;
    unlockedNodes: string[];
  };

  level: number;
  xp: number;
  attributes: Record<string, AttributeValue>;
  skills: Record<string, SkillValue>;

  bondedEquipment: {
    weapon: string | null;
    shield: string | null;
    armor: string | null;
    necklace: string | null;
    bracelet: string | null;
  };

  relationships: Record<string, NPCRelationshipState>;
  quests: QuestProgress[];
};
```

## 96.4 Relationship System

Como o personagem é o elo central com NPCs, adicionar estado de relacionamento:

```ts
type NPCRelationshipState = {
  npcId: string;
  discovered: boolean;
  affinity: number;
  trust: number;
  reputationFlags: string[];
  completedQuestIds: string[];
  dialogueFlags: string[];
};
```

Isso permitirá que NPCs sejam importantes para:

- recrutamento em Clã;
- promoção;
- treino de Classe;
- acesso a ritos de equipamentos;
- lojas especiais;
- escolhas narrativas;
- rivalidades e alianças.

## 96.5 BoundEquipment schema genérico

```ts
type BoundSlot = 'weapon' | 'shield' | 'armor' | 'necklace' | 'bracelet';

type BoundEquipmentInstance = {
  id: string;
  baseItemId: string;
  ownerCharacterId: string;
  slot: BoundSlot;

  bond: {
    grade: 1 | 2 | 3 | 4 | 5 | 6 | 7;
    resonanceXp: number;
    resonanceLevel: number;
  };

  components: {
    essences: string[];      // max 2 antes da unificação
    gems: string[];          // max 2 antes da unificação
    runeId: string | null;
    superiorRuneId: string | null;
    epicSoulRuneGemId: string | null;
  };

  skillTree: {
    unlockedNodeIds: string[];
    spentResonancePoints: number;
  };

  memories: ItemMemory[];
  scars: ItemScar[];
  visualStage: number;
  customName?: string;
};
```

## 96.6 Regras específicas por slot

Embora todos usem os mesmos 7 Graus, cada slot deve possuir famílias de nodes diferentes.

### Arma

Foco em:

- dano;
- precisão;
- alcance;
- tipo de ataque;
- elemento;
- reações ofensivas;
- skills de Classe ofensivas.

### Escudo / Protetor

Foco em:

- bloqueio;
- barreira;
- proteção elemental;
- contra-ataque;
- defesa de status;
- proteção de aliados.

### Armadura

Foco em:

- mitigação;
- resistência;
- Vida;
- mobilidade defensiva;
- imunidades condicionais;
- reação ao sofrer dano.

### Colar

Foco em:

- Espírito;
- Mana;
- percepção arcana;
- vínculo com NPCs/rituais;
- amplificação de Essência;
- habilidades utilitárias.

### Pulseira

Foco em:

- Agilidade;
- conjuração rápida;
- cooldown;
- manipulação de Runas;
- interação com itens;
- reação e iniciativa.

Esses focos são defaults de design e podem ser expandidos por conteúdo.

## 96.7 Clã como gate de evolução

Adicionar `ClanProgressionService`.

Responsabilidades:

```text
checkJoinRequirements()
joinClan()
checkRankPromotion()
promoteClanRank()
unlockClassPath()
checkClassMasteryGate()
requestBondRite()
requestEquipmentGradeRite()
resolveClanQuestReward()
```

O Clã não deve hardcodar upgrades. Cada Clã aponta para dados:

```json
{
  "id": "dunavar",
  "rankTableId": "dunavar_ranks_v1",
  "initiationQuestIds": ["dunavar_trial_01"],
  "classPathIds": [
    "sentinela_luz",
    "gladiador_barreira",
    "batedor_vigilia"
  ],
  "bondMasterNpcIds": [],
  "trainerNpcIds": []
}
```

## 96.8 Nova tela principal de progressão

Criar tela `CharacterNexusScreen`.

Layout recomendado:

```text
┌──────────────────────────────────────────────────────────────┐
│ PERSONAGEM        Nível | XP | Clã | Rank | Classe | Maestria│
├──────────────────────────────────────────────────────────────┤
│                          [CLÃ]                               │
│                            │                                 │
│                         [CLASSE]                             │
│                            │                                 │
│ [ARMA] [ESCUDO]      [PERSONAGEM]      [ARMADURA]            │
│                            │                                 │
│                    [COLAR] [PULSEIRA]                        │
├──────────────────────────────────────────────────────────────┤
│ Painel selecionado: árvore, Grau, Ressonância, requisitos    │
└──────────────────────────────────────────────────────────────┘
```

Essa será a principal visualização da progressão do jogo.

## 96.9 Nova lógica de desbloqueio de Classe

```ts
function canUnlockClassPath(character, classDef, world) {
  return (
    character.clan.clanId === classDef.clanId &&
    character.clan.rank >= classDef.requiredClanRank &&
    character.level >= classDef.requiredCharacterLevel &&
    satisfiesConditions(character, classDef.requirements, world)
  );
}
```

O desbloqueio deve exigir interação com um `classTrainer` ou missão do Clã, salvo exceção narrativa declarada.

## 96.10 Critérios de aceite adicionais v0.3

O build v0.3 só é considerado coerente se:

1. novo jogo não pedir Clã nem Classe;
2. nenhum NPC for apresentado como personagem jogável na criação;
3. personagem começar com `clanId=null` e `classId=null`;
4. o jogador puder conhecer Clãs através de NPCs e quests;
5. filiação ao Clã persistir no save;
6. Classe só puder ser desbloqueada após filiação;
7. existir progressão de Rank do Clã;
8. existir progressão de Maestria de Classe;
9. Arma, Escudo, Armadura, Colar e Pulseira possuírem instâncias vinculáveis;
10. cada uma das cinco peças suportar independentemente Graus I–VII;
11. cada peça possuir Ressonância e Skill Tree próprias;
12. a UI exibir o personagem como centro da progressão;
13. NPCs poderem agir como recrutadores, mestres e treinadores;
14. a progressão de Classe aceitar requisitos cruzados de personagem, Clã e equipamentos;
15. sprites de cada equipamento/Grau poderem ser substituídos manualmente via asset registry.

# 97. OWNER DECISIONS NOVAS — v0.3

Além das decisões já listadas, o criador ainda precisa fechar:

1. O personagem começa com o conjunto básico ou conquista cada peça no prólogo?
2. Qual NPC apresenta cada Clã?
3. A entrada em um Clã é escolha livre após prova ou depende de afinidade/ações?
4. É possível trocar de Clã? Se sim, quais consequências?
5. É possível abandonar uma Classe e iniciar outra do mesmo Clã?
6. É possível dominar mais de uma Classe do mesmo Clã?
7. Qual Rank de Clã libera cada caminho de Classe?
8. Quais ritos de Clã são exigidos para Graus I–VII dos equipamentos?
9. Todos os cinco equipamentos podem alcançar Grau VII em uma única campanha?
10. Existe limite global de Ressonância para forçar especialização?
11. Escudo é sempre físico ou pode começar como Protetor Arcano para determinadas builds?
12. Colar e Pulseira começam comuns, familiares ou cerimoniais?
13. A Runa-Joia Épica final de cada peça recebe nome automaticamente, pelo jogador ou pelo Clã?
14. A promoção de Classe depende de feitos específicos com determinados slots?
15. Relações com NPCs podem bloquear/liberar caminhos de Classe?
16. O Clã concede um equipamento próprio ou apenas ensina a evoluir o equipamento pessoal?
17. Quais NPCs existentes serão `clanRecruiter`, `clanMaster`, `classTrainer` e `bondMaster` de cada Clã?
18. Qual o primeiro Clã disponibilizado ao jogador no onboarding — todos simultaneamente ou apresentados gradualmente?

# 98. NOVA DEFINIÇÃO DO JOGO

Terrúnia App é um RPG single-player em que o jogador **não escolhe um herói pronto**. Ele cria um Terrírian cru e constrói sua identidade dentro do mundo.

O personagem é o elo central da experiência. Ele conhece pessoas, cria relações, entra em um Clã, recebe treinamento, desenvolve uma Classe e vincula sua alma a cinco equipamentos pessoais — Arma, Escudo, Armadura, Colar e Pulseira.

Cada uma dessas peças cresce através de sete Graus, recebe Essências, Joias e Runas, desenvolve uma Skill Tree própria e pode culminar em uma Runa-Joia Épica única.

A Classe não é um botão da criação. **É uma conquista social, narrativa e mecânica dentro do Clã.**

O Clã não é apenas bônus de status. **É a instituição responsável por ensinar, testar, graduar e reconhecer a evolução do personagem.**

NPCs não substituem o protagonista. **Eles formam a rede viva que transforma o personagem criado pelo jogador em alguém pertencente a Terrúnia.**


---

# 101. NOTA DE IMPLEMENTAÇÃO v0.4 — WORK / CODEX / GITHUB

Para desenvolvimento do repositório, usar o documento `TERRUNIA_WORK_GITHUB_MASTER_PROMPT_v0.4.md` como instrução operacional e este arquivo como regra/canon técnico.

A ordem de leitura recomendada para agentes é:

```text
1. TERRUNIA_WORK_GITHUB_MASTER_PROMPT_v0.4.md
2. TERRUNIA_GAME_APP_MASTER_SPEC_v0.4.md — principalmente seções 0B e 0A
3. WORK_ATTACHMENTS_MANIFEST_v0.4.md
4. docs/reference/ui-terrunia-main-v0.4.png
5. fontes de lore selecionadas
6. código existente do repositório
```

Arquivos de versões anteriores não devem prevalecer sobre v0.4.
