# Terran explorável e contratos — v0.11

Decisão posterior do criador, 2026-10-30: interrogação apenas em Rosetta; exclamação amarela em NPCs com missões; símbolo próprio para sidequests; NPCs menores; cidade maior com câmera como Astravél; várias sidequests de drops/fragmentos com ouro proporcional.

## Cidade e exploração

Terran cresceu de 384×256 para 768×512, quatro vezes a área anterior. A câmera mantém a viewport 384×256 e acompanha o personagem, limitada às bordas. Mouse/toque convertem coordenadas da tela para o mundo com o deslocamento da câmera; teclado e controle de direção continuam disponíveis. Navegar pelo minimapa ou seletor move o personagem fisicamente até o destino, sem teleporte.

As sete instituições e a residência continuam acessíveis, com construções 50% maiores, pátios e ruas. Os seis moradores de rua foram redistribuídos. A renderização ordena prédios, objetos e atores por profundidade; obstáculos, portas e pontos de aproximação compartilham a geometria usada no pathfinding. Os NPCs usam 28 px, 12,5% menores; seus retratos nativos de 32 px e identidades não mudam.

Há seis pontos exploráveis: Fonte das Memórias, Quadro de Encomendas, Jardim de Daeryn, Marco das Ruínas, Cargas do Mercado e Pátio da Guarda. Interagir abre uma inspeção e registra descoberta. O minimapa mostra a câmera, o jogador, locais e contagem de pontos descobertos. Essas interações não concedem recompensas nem aceitam contratos automaticamente. Bairros, posições, arte e textos são `VISUAL_DRAFT`/`CONTENT_DRAFT`.

## Marcadores

| Estado | Símbolo |
|---|---|
| Rosetta, orientação | `?` vermelho |
| Missão principal, Clã ou Classe disponível, oferecida, em andamento ou pronta | `!` amarelo |
| Sidequest/contrato disponível, oferecido ou em andamento | `◇` azul |
| Sidequest pronta para entrega | `◆` azul |
| Sem missão elegível, missão bloqueada ou concluída | Sem marcador |

Se um NPC tem várias missões, entregas prontas têm prioridade. As conversas permitem escolher entre as missões disponíveis do mesmo NPC. O Journal usa o mesmo losango para as secundárias. A distinção usa forma e texto, além de cor.

## Doze encomendas — CONTENT_DRAFT / BALANCE_DRAFT

| Responsável | Contrato | Materiais | Ouro |
|---|---|---|---:|
| Arlen | Matéria para as Entregas | 2 Núcleos Fúngicos | 96 |
| Liora | Esporos para o Herbário | 3 Aglomerados de Esporos | 90 |
| Garrik | Placas para a Vigília | 3 Quitinas de Esporos | 108 |
| Siven | Marcas no Mapa | 3 Lascas da Ruína | 171 |
| Nara | Fragmentos que Respondem | 3 Fragmentos de Eco | 72 |
| Ruven | Fibras para a Travessia | 2 Fibras Miceliais | 90 |
| Eldamar | Amostras do Eco | 2 Fragmentos de Eco + 1 Pó do Vazio | 75 |
| Daeryn | Reserva do Alambique | 3 Géis Luminescentes + 2 Géis Fúngicos Densos | 126 |
| Vorren | O Peso da Carapaça | 3 Quitinas de Esporos + 2 Pós do Vazio | 162 |
| Lithwynn | Pedras para as Inscrições | 4 Lascas da Ruína | 228 |
| Neris | Reposição Luminescente | 4 Géis Luminescentes | 72 |
| Durnan | Lote para a Fornalha | 2 Lascas da Ruína + 2 Fibras Miceliais | 204 |

Pagamento = 150% do valor comum de venda, arredondado para cima. Cada contrato exige aceite no NPC e paga uma única vez. O quadro apresenta responsável, local, materiais atuais, recompensa e pré-requisito; moradores de rua são identificados como externos às instituições. Os contratos antigos de abate permanecem disponíveis.

`turnInItems` identifica os materiais comerciais consumidos. A prontidão é derivada da mochila atual e atualizada em todas as ações do store. Vender, converter, forjar, guardar ou proteger uma pilha pode devolver uma missão pronta para em andamento. A entrega valida todos os ingredientes antes de consumir qualquer item; divide o consumo entre pilhas, preserva excedentes e reavalia contratos concorrentes. Eventos artificiais de coleta não substituem a posse. Itens favoritos, trancados, de missão ou de Infusão/Lapidação são preservados.

O novo Fragmento de Eco vem de Sentinelas em Astravél, na Vigília da Ruína e nas Ondas. É um fragmento comercial, separado do componente de Infusão do Colosso. Todos os ingredientes têm fontes repetíveis. Os preços de materiais de Neris foram ajustados para evitar comprar materiais e revendê-los com lucro ilimitado.

## Saves e verificação

Save 14 / versão 0.11.0 acrescenta os contratos a campanhas anteriores. Mantém missões existentes, Vínculos, materiais, ouro e progressão, sem aceite ou recompensa automática. Não há limite de missões simultâneas. Descobertas da cidade persistem como flags de mundo.

Testes cobrem a economia e fontes dos 12 contratos, aceite tardio, estoque real, consumo exato, proteção, pagamento duplicado, contratos concorrentes, migração, marcadores, câmera e caminhos para todos os edifícios/NPCs/pontos interativos. O fluxo de navegador percorre a cidade, aceita uma encomenda, consulta o quadro, verifica marcadores, combate em três ondas e numa caçada, recolhe os drops manualmente, entrega os materiais por ouro e confirma o save após reload. Telas são revisadas em desktop e celular. A validação de autenticação real e sincronização Firebase permanece dependente do ambiente configurado.
