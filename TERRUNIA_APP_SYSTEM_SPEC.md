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

# 1. VISÃO DO PRODUTO

Terrúnia é um universo de fantasia mágica em que biomas, povos, artefatos, runas e fenômenos entrópicos coexistem em uma malha arcana viva. A aplicação deve traduzir esse universo para um RPG digital no qual o jogador cria um personagem, desenvolve uma build, circula por Terran, recebe missões, equipa artefatos, explora trilhas e Ruínas, combate criaturas e progride até ameaças maiores ligadas à Entropia e à Ruína Crescente.

## 1.1 Pilares de gameplay

- **Identidade:** clã + classe + atributos + perícias + vantagens/desvantagens.
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

- criação de personagem;
- 4 clãs jogáveis principais;
- 12 classes iniciais;
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
2. os quatro clãs e doze classes estão selecionáveis;
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

**Terrúnia App** deve começar como um RPG web single-player, modular, data-driven e local-first. Terran é o hub; trilhas e Ruínas formam o eixo de exploração; clãs/classes definem identidade mecânica; equipamentos, runas e joias definem construção de build; Absorção de Essência diferencia os Terrírians; quests e NPCs conectam a mecânica à narrativa; e o banco de conteúdo deve ser independente do motor para permitir que Terrúnia cresça para múltiplas mídias sem reescrever sua fundação técnica.

**Este documento deve entrar no repositório como:**

```text
/docs/TERRUNIA_APP_SYSTEM_SPEC.md
```

**Próximo artefato técnico recomendado:** `CANON_DECISIONS.md`, usado somente para registrar decisões aprovadas pelo criador e substituir gradualmente os marcadores `OWNER_DECISION` deste documento.
