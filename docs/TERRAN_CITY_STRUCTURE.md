# Estrutura oficial da cidade de Terran

Status: decisão do criador aprovada em 2026-08-12; expansão do Mercado e nova Casa do Ferreiro autorizadas em 2026-10-30; conversas refinadas na v0.12 e tutorial prático de Rosetta autorizado posteriormente na v0.13.

Este documento é o adendo mais recente para Terran. Ele substitui representações anteriores que tratavam o Portal como Home/tela principal. A matriz inicial de seis instituições foi ampliada pelo criador em 2026-10-30 para incluir a Casa do Ferreiro e um novo vendedor no Mercado.

## Regra central

**TERRAN É A HOME/CIDADE BASE DO JOGADOR. O PORTAL É UMA ÁREA NO CENTRO DE TERRAN E SERVE COMO ACESSO ÀS INSTÂNCIAS.**

Terran possui sete instituições jogáveis ao redor da Praça do Portal:

| ID | Instituição | Verbo | Função |
|---|---|---|---|
| `location_terran_eldamar_house` | Casa de Eldamar | Compreender | conhecimento, história, investigação, prólogo, Lore e Codex |
| `location_terran_vorren_post` | Posto de Vorren | Descobrir | caça, exploração, rastreamento, bestiário, mapas e materiais de criaturas |
| `location_terran_bond_workshop` | Mercado | Evoluir e negociar | comerciantes, materiais, cinco itens vinculados, Ressonância, Graus, Essências, Joias, Runas, Memórias e Cicatrizes |
| `location_terran_zareth_barracks` | Quartel de Zareth | Proteger | segurança, patrulhas, defesa, treinamento, contratos, bounties e ameaças |
| `location_terran_clan_hall` | Salão dos Clãs | Tornar-se | Clã, Classe, reputação, provas, ritos, mestres e Main Lore |
| `location_terran_daeryn_house` | Casa de Daeryn | Preparar-se | cura, alquimia, poções, antídotos, herbalismo, purificação e resistências temporárias |
| `location_terran_forge` | Casa do Ferreiro | Produzir e aprimorar | materiais novos, reforços permanentes da mesma arma e novos ramos na Skill Tree |
| `location_terran_portal_plaza` | Praça do Portal | Partir | validação, despacho e registro de expedições para instâncias externas |

## Distribuição de NPCs

- Casa de Eldamar: Eldamar, Torvynn, Gethin e Elvira condicional.
- Posto de Vorren: Vorren, Elric, Draelis, Keldron condicional e Nerion visitante.
- Mercado: Lithwynn, Valmira, Talia, Edran, Feril, Lorian e Neris, nova vendedora de materiais.
- Casa do Ferreiro: Durnan como ferreiro residente; substitui sua presença condicional no Mercado.
- Quartel de Zareth: Capitão Zareth, Kaedin, Torvan, Dremor e Mireya.
- Salão dos Clãs: representantes Dûn’Avar, Rustal, Cebios Esti e Estres do Ét; mestres de Classe progressivos; Conselho da Main Lore.
- Casa de Daeryn: Daeryn, Sylwen, Briana e Orlan condicional.
- Praça do Portal: Rosetta, Guardiã do Portal na representação atual (`CONTENT_DRAFT`).

Na v0.13 Rosetta também conduz quatro lições de preparação: vestir uma das duas túnicas entregues na mochila, comprar um Tônico com Neris, comprar/equipar uma proteção de couro e reforçar uma peça simples em +1 com Durnan. As lições não bloqueiam a campanha antiga nem distribuem equipamentos ao carregar o save. As ações e entregas são manuais.

Neris, as falas, a distribuição visual e os números das receitas permanecem `CONTENT_DRAFT`/`VISUAL_DRAFT`/`BALANCE_DRAFT`. A autorização da nova casa não transforma armas de loot em equipamentos substituíveis. Durnan reforça o Vínculo existente e produz componentes, mantendo os sete Graus e o custo em Pontos de Essência para comprar nodes da árvore.

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
- sete instituições;
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
- Ritos e gestão dos cinco Vínculos continuam na instituição de ID `location_terran_bond_workshop`, apresentada como Mercado; NPC, custo e cerimônia final dos ritos continuam `OWNER_DECISION`.
- A Casa do Ferreiro possui interior, acesso pelas ruas, produção de materiais e aprimoramentos da mesma arma. Receitas e bônus ficam em dados, e novas sinergias exigem compra normal na Skill Tree.
- Sprites de NPCs e retratos de diálogo resolvem a mesma identidade visual no registro central. `?` vermelho permanece exclusivo de Rosetta. Ofertas usam `!` amarelo ou `◇` azul; a decisão posterior da v0.12 torna o marcador cinza após o aceite. Entregas prontas usam `!` amarelo ou `◆` azul, com prioridade sobre os demais estados. NPCs sem missão não têm marcador.
- Diálogos usam um retrato do NPC à esquerda de uma única caixa de fala, com respostas do jogador abaixo. Não repetir nome, retrato e primeira fala dentro dos detalhes da missão. Os 51 perfis visuais têm assuntos próprios; a conversa permite perguntar sobre trabalho, acontecimentos locais, conselhos e a missão selecionada. As falas adicionais são `CONTENT_DRAFT`, sem conceder progresso, recompensas ou vínculos sociais automaticamente.
- Missões do mesmo NPC aparecem em linhas horizontais empilhadas, principal destacada acima das secundárias. O Inventário abre na Mochila e não contém a ficha de status; esta permanece no Nexo e no HUD.
- Ao passar o cursor sobre Rosetta ou focá-la, caminhos dourados acompanham a geometria caminhável até os destinos das missões principais e secundárias acionáveis. A câmera recorta a cena e o minimapa mostra os caminhos no mundo completo. Destinos compartilhados são reunidos; ofertas bloqueadas e histórico concluído são excluídos. A opção de fixar/ocultar pelo diálogo atende toque. Animação respeita movimento reduzido e as linhas não capturam cliques.
- Proteções simples de preparação podem ocupar o eixo Armadura antes do Vínculo permanente, com ícone no HUD e ações na mochila. Neris vende as peças e Linha de Linho; Durnan aplica um único reforço +1. Não substituem um Vínculo existente.
- Terran é um mundo 768×512 observado por uma câmera 384×256 que acompanha o personagem e respeita as bordas, como em Astravél. Casas maiores, ruas, pátios e seis objetos exploráveis usam geometria compartilhada com colisão e pathfinding; NPCs são desenhados em 28 px, preservando seus arquivos nativos de 32 px.
- Fonte, quadro de encomendas, jardim, marco das ruínas, cargas do Mercado e pátio da Guarda são pontos de exploração, não instituições adicionais. Descobri-los registra uma flag, sem aceitar missões ou distribuir recompensas.
- coordenadas do minimapa são `VISUAL_DRAFT` e não definem escala, distância ou geografia canônica.
- NPCs condicionais/visitantes/progressivos não devem aparecer como residentes permanentes desbloqueados.
