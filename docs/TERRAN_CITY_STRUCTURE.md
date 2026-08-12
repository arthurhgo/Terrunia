# Estrutura oficial da cidade de Terran

Status: decisão do criador aprovada em 2026-08-12.

Este documento é o adendo mais recente para Terran. Ele substitui representações anteriores que tratavam o Portal como Home/tela principal ou que usavam Taverna, Ferreiro, Armeiro, Mercador e outros prédios legados como matriz inicial da cidade.

## Regra central

**TERRAN É A HOME/CIDADE BASE DO JOGADOR. O PORTAL É UMA ÁREA NO CENTRO DE TERRAN E SERVE COMO ACESSO ÀS INSTÂNCIAS.**

Terran possui exatamente seis instituições jogáveis ao redor da Praça do Portal:

| ID | Instituição | Verbo | Função |
|---|---|---|---|
| `location_terran_eldamar_house` | Casa de Eldamar | Compreender | conhecimento, história, investigação, prólogo, Lore e Codex |
| `location_terran_vorren_post` | Posto de Vorren | Descobrir | caça, exploração, rastreamento, bestiário, mapas e materiais de criaturas |
| `location_terran_bond_workshop` | Oficina dos Vínculos | Evoluir | cinco itens vinculados, Ressonância, Graus, Essências, Joias, Runas, Memórias e Cicatrizes |
| `location_terran_zareth_barracks` | Quartel de Zareth | Proteger | segurança, patrulhas, defesa, treinamento, contratos, bounties e ameaças |
| `location_terran_clan_hall` | Salão dos Clãs | Tornar-se | Clã, Classe, reputação, provas, ritos, mestres e Main Lore |
| `location_terran_daeryn_house` | Casa de Daeryn | Preparar-se | cura, alquimia, poções, antídotos, herbalismo, purificação e resistências temporárias |
| `location_terran_portal_plaza` | Praça do Portal | Partir | validação, despacho e registro de expedições para instâncias externas |

## Distribuição de NPCs

- Casa de Eldamar: Eldamar, Torvynn, Gethin e Elvira condicional.
- Posto de Vorren: Vorren, Elric, Draelis, Keldron condicional e Nerion visitante.
- Oficina dos Vínculos: Lithwynn, Valmira, Talia, Edran, Feril, Lorian e Durnan condicional.
- Quartel de Zareth: Capitão Zareth, Kaedin, Torvan, Dremor e Mireya.
- Salão dos Clãs: representantes Dûn’Avar, Rustal, Cebios Esti e Estres do Ét; mestres de Classe progressivos; Conselho da Main Lore.
- Casa de Daeryn: Daeryn, Sylwen, Briana e Orlan condicional.
- Praça do Portal: Guardião do Portal. Nome definitivo permanece `OWNER_DECISION`.

## Salão dos Clãs

Não é um seletor imediato. O jogador conhece representantes, ajuda Clãs, ganha reputação, realiza provas e participa de ritos. Clã e Classe continuam conquistas de gameplay. Depois da filiação, o Salão centraliza a Main Lore; cada Clã oferece uma perspectiva e cada Classe define uma forma de agir.

## Praça e Guardião do Portal

O Guardião possui os papéis técnicos:

```text
portalKeeper
instanceDispatcher
missionValidator
expeditionRegistrar
returnRegistrar
```

Ele verifica missão ativa, pré-requisitos, autorização e dificuldade; apresenta objetivo, perigo e recompensas conhecidas; registra partida e retorno. O Portal não distribui todas as missões.

## Minimapa e localização

Enquanto estiver em Terran, o jogador deve ver:

- posição atual;
- seis instituições;
- Praça do Portal;
- destino da missão;
- locais descobertos;
- serviços e presenças condicionais.

Formato de localização:

```text
TERRAN > NOME DO LOCAL
```

## Fluxo de missão

```text
NPC/Salão
→ missão aceita
→ instituições exigidas pela definição da missão
→ informação, recurso ou preparação
→ autorização da instância
→ Praça do Portal
→ Guardião
→ instância
→ objetivo
→ retorno à Praça
→ instituição responsável
→ recompensa/progresso
```

Uma missão não precisa visitar todas as casas. Cada etapa deve existir nos dados da própria missão; não inserir circulação fictícia apenas para aumentar duração.

## Regras de implementação

- `/terran` é a Home e mapa da cidade.
- `/terran/:locationId` abre uma área própria.
- localização e primeira descoberta persistem no save.
- o Portal é o único ponto de entrada em instâncias externas.
- retorno de instância ocorre na Praça do Portal.
- Ritos e gestão dos cinco Vínculos pertencem à Oficina dos Vínculos; NPC, custo e cerimônia final continuam `OWNER_DECISION`.
- coordenadas do minimapa são `VISUAL_DRAFT` e não definem escala, distância ou geografia canônica.
- NPCs condicionais/visitantes/progressivos não devem aparecer como residentes permanentes desbloqueados.
