# Terrúnia — Interiores com objetos e residência própria v0.2

**VISUAL_DRAFT**, 29/10/2026. Continuação de `TERRAN_INTERIORS_v0.1.md`.

## Evolução das seis instituições
Cada sala apresenta cores, mobiliário e pontos de inspeção diferentes:
- Casa de Eldamar: arquivo e mesa de pesquisa.
- Posto de Vorren: mapa de trilhas e bestiário.
- Oficina dos Vínculos: bigorna rúnica e bancada.
- Quartel de Zareth: arsenal e relatórios.
- Salão dos Clãs: estandartes e mesa de representantes.
- Casa de Daeryn: ervas e balcão de Sylwen.

As interações são declaradas em `roomContent.ts` com **ID, nome, posição, comportamento e descrição**, sem usar pixels como gatilhos. Inspecionar abre uma caixa contextual no mesmo cenário. Serviços abrem o painel existente ao lado. Não se criam recursos, itens ou recompensas.

## Casa do Terrírian
- Novo edifício privado no mapa pixelado, na área ao norte da Praça do Portal, sem inclusão no array das **seis instituições + Praça**.
- Antes de completar `main_terran_first_home`, fachada é visível mas a porta não abre; o painel da casa orienta o jogador.
- Após a flag `player_home_unlocked`, a residência pode ser acessada pelo mapa, com interior de 384×256 e circulação por teclado/toque.
- A cama chama a ação `restAtHome` existente: recuperação de Vida/Mana, sem custo de Ouro, sem introdução de regra de Essência.
- O botão de descanso do HUD da cidade é bloqueado fora do interior. O jogador pode consultar as informações do alojamento em qualquer lugar de Terran.
- A mesa de memórias fornece somente texto de ambientação, sem criar novas memórias canônicas.
- IDs de instituição e schema de save não são alterados: o interior residencial é estado temporário de apresentação. Retorna à rua junto à fachada.

## NPCs nas ruas
A lista explícita `STREET_SIDEQUEST_PRESENCE_IDS` permanece vazia nesta etapa. Não foram criados NPCs nem sidequests exteriores; isso fica para uma próxima decisão de conteúdo.

## Próximas versões
Sprites finais de móveis, rotinas dos NPCs internos, objetos vinculados a quests aprovadas, sidequests com NPCs exclusivos das ruas e interiores de duas ou mais salas.

**OWNER_DECISION**: conteúdo e recompensas de futuras sidequests exteriores, expansão/upgrade da residência, guardar itens no baú e propriedades especiais de mobiliário.
