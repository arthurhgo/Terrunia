# Terrúnia v0.5.16 — Pacote visual para aprovação (VISUAL_DRAFT)

**Importante:** isto é uma **revisão de direção e identidade**, não o remake gráfico completo da v0.6.0. Os sprites jogáveis que já estão no `assetRegistry` continuam no lugar. Não associar dano, Grau, raridade, Classe ou quest a um nome de arquivo; a fonte é sempre o catálogo por ID.

## 1. NPCs com nomes e papéis preservados

| ID persistente | Nome no protótipo | Função existente | Paleta prevista | Estado |
|---|---|---|---|---|
| `npc_rosetta` | Rosetta | Tutorial / Guardiã do Portal | branco, azul, dourado | Nome já existente; não mudar sem canon |
| `npc_eldamar` | Eldamar | Mestre dos Registros | verde de floresta, couro, ouro antigo | Conceito visual a revisar contra PNG atual |
| `npc_daeryn` | Daeryn | Curandeira | verde, creme, âmbar | Nome existente |
| `npc_vorren` | Vorren | Rastreador | couro, musgo, ossos | Nome existente |
| `npc_lithwynn` | Lithwynn | Analista dos Vínculos | índigo, azul-runa, bronze | Nome existente |
| `npc_neris` | Neris | Suprimentos | verde-azulado, dourado, poções | Nome existente |
| `npc_durnan` | Durnan | Forja | ferro, couro escuro, laranja-fornalha | Nome existente |
| `npc_mireya_dunavar` | Mireya Dûn’Avar | Barreira / Clã | azul heráldico, ouro | **Nome canônico, manter apóstrofo/acentuação** |
| `npc_terran_weaponsmith` | **Torvan** | Armeiro de Terran | aço azul-acinzentado e ouro | **OWNER_DECISION · CONTENT_DRAFT** |
| `npc_terran_armorer` | **Brenna** | Armadureira de Terran | couro castanho, bronze, escudo | **OWNER_DECISION · CONTENT_DRAFT** |
| `npc_terran_accessory_artisan` | **Ilyra** | Artesã de Acessórios | teal, violeta, joias | **OWNER_DECISION · CONTENT_DRAFT** |

Proposta de 3 nomes pessoais aplicada no conteúdo **como rascunho para inspeção**. Nenhum `npcId` ou `portraitAssetId` foi trocado; saves e quests continuam utilizando seus IDs antigos.

Os três novos SVGs abaixo são **pré-visualizações independentes, não registradas em runtime**:
- `public/assets/approval/v0516/torvan_idle_concept.svg`
- `public/assets/approval/v0516/brenna_idle_concept.svg`
- `public/assets/approval/v0516/ilyra_idle_concept.svg`

A arte final exige aprovação, sprite PNG RGBA quadrado conforme contrato do jogo, e incorporação ao atlas/manifesto para não quebrar os testes de pixel art. Os SVGs preservam desenho editável e identificam silhueta/paleta sem depender de mecânica.

## 2. Itens de treinamento: nome = silhueta = cor

O catálogo existente possui a referência `BASIC_ARMOR_MATERIAL_PALETTES` em `src/content/visualEquipment.ts`. A prévia desta versão respeita exatamente as cinco famílias abaixo:

| Item ID de jogo | Design/material | Cor base | Cor de luz | Protótipo |
|---|---|---|---|---|
| `equipment_worn_linen_tunic` | tecido rasgado, sem brilho mágico | `#8A806F` | `#C6B9A0` | `linen_worn_concept.svg` |
| `equipment_apprentice_tunic` | tecido de aprendiz, acabamento azul | `#50728D` | `#94B2C5` | `apprentice_tunic_concept.svg` |
| `equipment_light_leather_vest` | gibão leve com tiras de couro | `#885D3E` | `#B88C61` | `light_leather_vest_concept.svg` |
| `equipment_simple_leather_armor` | couro mais estruturado e reforços | `#966C48` | `#C79C70` | `simple_leather_armor_concept.svg` |
| `equipment_terran_guard_armor` | metal aço-azulado, heráldica dourada | `#72808A` | `#B9C8C8` | `terran_guard_armor_concept.svg` |

Os arquivos estão todos em `public/assets/approval/v0516/`. A diversidade visual não altera raridade, atributos nem propriedades.

## 3. Arsenal comercial e Vínculos

- **1.400 SKUs comerciais**, com sprites G1, G2 e G3, já derivam IDs e paletas de `src/content/equipmentV0515.ts` e continuam substituíveis manualmente.
- As cores por família e Grau são controladas por `GearPalette` (`base`, `trim`, `metallic`, `gradeThree`, `glow`). Não usar um tom genérico para todos os itens.
- Equipamento temporário não substitui os cinco Vínculos permanentes. Grau comercial I–III ≠ Grau de Vínculo I–VII.
- Espada, arco, bastão, escudo e protetor arcano precisam de **silhuetas específicas do slot e arma**, não apenas variações de cor.
- Itens raros, joias e runas exigem destaque visual coerente com a **raridade real no catálogo**; não atribuir raridade com base no brilho do sprite. `OWNER_DECISION` para acabamento final.

## 4. Estruturas e marcadores

Referências visuais para a revisão de cenas existentes — não criar instituições novas:

| Local | Linguagem arquitetônica proposta |
|---|---|
| Praça do Portal | portal azul, pedra escura, molduras douradas |
| Casa da Forja | fornalha âmbar, martelo, ferro escuro |
| Posto de Vorren | madeira, vigília, tendas, verde-mato |
| Mercado / Oficina dos Vínculos | balcão, runas, vitrine, pedra/cobre |
| Salão dos Clãs | pedra heráldica, estandartes individuais, ouro |
| Base do Terrírian | habitação funcional de Terran; nunca substituir pela fortaleza do concept sem aprovação |

**Atenção:** as artes de conceito anteriores continham abstrações como uma Base em forma de castelo e uma Oficina separada de Lithwynn. Não introduzi essas estruturas no mapa — o desenho é uma referência visual, não uma mudança silenciosa da geografia aprovada.

## 5. Pipeline e checklist

1. Confirmar nome e traços de Torvan, Brenna e Ilyra (**OWNER_DECISION**).
2. Avaliar SVGs da pasta `approval/v0516`; comparar com os sprites PNG **já usados** e aprovar/refazer.
3. Para converter em arte jogável, criar RGBA PNG nativo com silhueta e paleta coerentes, preservando `assetRegistry`, `npcId` e registros do atlas.
4. Fazer QA 1×, 2× e 3× em pixel-perfect; checar idle/diálogo/loja e contraste na UI escura.
5. Aprovar estado dos cinco itens iniciais sem mudar o vínculo, raridade ou escala do inventário.
6. Reavaliar artes detalhadas em múltiplos frames **somente na v0.6.0**.

**Até aprovação:** os conceitos não substituem arquivos em produção e não mudam stats, loot, saves ou animações.
