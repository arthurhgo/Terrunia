# Rosetta: aprender pela ação — v0.13

Direção posterior do criador em 2026-10-30: histórico recolhido, Rosetta como tutorial, túnicas simples na mochila, compras/equipamento/reforço e orientação dourada para todas as principais e secundárias acionáveis.

## Quatro lições encadeadas

| Lição | Ação do jogador | Suprimento ao aceitar | Pagamento na entrega |
|---|---|---|---|
| Uma Primeira Proteção | Abrir Inventário, selecionar e equipar uma túnica | Túnica de Linho Gasta e Túnica de Aprendiz | 10 XP + 70 Ouro |
| Comprar para se Preparar | Comprar Tônico de Campo com Neris no Mercado | — | 10 XP |
| Proteção para a Estrada | Comprar e equipar Armadura de Couro Simples | — | 15 XP + 10 Ouro |
| O Primeiro Aprimoramento | Levar uma peça simples a Durnan e reforçar para +1 | Linha de Linho | 20 XP + 10 Ouro |

O diálogo informa o objetivo e o que será entregue antes do aceite. Aceitar registra a oferta e a missão, com entrega única dos suprimentos; recusar e apenas conversar não concedem itens. O jogo verifica compras registradas, peça vestida e reforço real. A próxima lição é desbloqueada após entregar a anterior a Rosetta na Praça. Pagamentos e itens não podem ser repetidos.

Ações realizadas antes do aceite são reconhecidas por evidência real, evitando obrigar uma segunda compra. Um jogador que já possui Armadura permanentemente vinculada não precisa removê-la para demonstrar proteção; a peça permanece intacta. O tutorial é uma preparação paralela e não bloqueia uma campanha existente.

## Proteção simples na Mochila

O pedido novo autoriza uma exceção à restrição histórica de equipamento comum no inventário: túnicas e couro de treino podem ser vestidos/trocados antes do Vínculo permanente da Armadura. O eixo continua sendo Armadura; não há sexto slot e nenhuma peça vinculada é substituída.

Selecionar um equipamento na Mochila mostra sua imagem, descrição, Defesa/Iniciativa e botão Equipar/Retirar. A peça vestida recebe marca, aparece no eixo Armadura do HUD e nos detalhes de equipamento, e seu bônus integra os atributos usados pelo combate. Trocas exigem estar fora de batalha. Guardar no baú exige retirar antes; a instância e seu reforço são preservados. As peças não são fontes de venda/conversão.

As duas túnicas oferecem +1 Defesa ou +1 Iniciativa; couro oferece +2 Defesa. Neris vende as três peças e Linha de Linho. Durnan reforça qualquer proteção simples uma vez, por 8 Ouro e uma linha, acrescentando +1 Defesa. Materiais/peças protegidos ou favoritos são respeitados. Toda validação ocorre antes de gastar recursos. Isso não é evolução de Grau dos Vínculos e não concede Pontos de Essência.

## Caminhos dourados

O hover ou foco por teclado em Rosetta ativa linhas finas douradas, traçadas pela mesma malha caminhável da cidade. Elas mostram a próxima ação de todas as principais/secundárias disponíveis, oferecidas, em andamento ou prontas para entregar, incluindo as não rastreadas. Missões bloqueadas e concluídas são excluídas.

- Ofertas e entregas apontam ao NPC responsável; se ele está dentro de uma instituição, o caminho chega à entrada.
- Equipamento do tutorial aponta ao jogador/mochila; compra aponta ao Mercado/Neris e reforço à Casa do Ferreiro/Durnan.
- Combate/coleta externa aponta ao Portal; ações locais usam o destino definido pela missão.
- Destinos compartilhados são reunidos, preservando os IDs/títulos das missões; ofertas/entregas da própria Rosetta já estão na origem.
- A câmera mantém o recorte correto, e o minimapa exibe os caminhos no mundo inteiro. Linhas não capturam cliques nem movem o jogador.
- No diálogo é possível fixar a orientação e depois ocultá-la pelo mapa, permitindo uso no celular. Movimento reduzido desativa a animação.

O seletor é leitura do mesmo save usado pelo Journal. Não cria uma lista independente de missões nem altera aceite, progresso ou recompensas.

## Histórico e persistência

Concluídas ficam recolhidas inicialmente, com quantidade e botão acessível para expandir/recolher. A expansão é estado local da interface; não modifica a campanha nem o rastreamento.

App 0.13.0, schema 15. A migração 14→15 cadastra as lições e inicia `basicArmorInstanceId` em `null`, preservando Vínculos, mochila, moedas e missões antigas. Não entrega túnicas, equipa ou aceita missões automaticamente. A validação protege a referência equipada e restringe reforços a peças simples individuais.

## Arte e validação

Quatro ícones novos usam a matriz nativa 16×16, contorno e paleta do projeto: duas túnicas, couro e carretel de linha. O registro central, atlas e manifest têm 133 entradas (70 itens). Regeneração isolada: `python scripts/build_pixel_assets.py --tutorial-only`. Arte, texto e números permanecem `VISUAL_DRAFT`, `CONTENT_DRAFT` e `BALANCE_DRAFT`.

Testes cobrem o percurso integral com orçamento real, recebimento/pagamento únicos, progressão por ações reais, preservação do Vínculo, baú, validações sem gastos parciais, migração/roundtrip e elegibilidade dos caminhos. O E2E executa as quatro lições pelas telas reais, verifica histórico, hover/foco, uso móvel e persistência após reload. Somente a oferta secundária adicional usada no fim para visualizar um caminho é fixture de UI; a progressão do tutorial não é simulada.

`npm run check`: lint, TypeScript, 267 testes e build aprovados. Quatro fluxos de navegador aprovados: tutorial completo, diálogos/diário/inventário, Rosetta/mercado/forja/combate e encomenda com combate/coleta/entrega real. Capturas de desktop e 390×844 foram revisadas. O build mantém o aviso não bloqueante de chunk JavaScript acima de 500 kB.
