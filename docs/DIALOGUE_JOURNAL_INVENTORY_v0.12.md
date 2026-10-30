# Conversas, diário e inventário — v0.12

Implementação do pedido posterior do criador em 2026-10-30. A nova referência de diálogo substitui a composição de dois retratos grandes da v0.10; o cinza de missões aceitas refina a sinalização da v0.11.

## Conversas

- Um cabeçalho com nome e função, retrato lateral do NPC e uma única caixa para a fala atual. A resposta escolhida fica junto da imagem do jogador abaixo.
- Removidos os blocos duplicados de nome, minirretrato, primeira fala e resumo narrativo nos detalhes de missão e no Mercado.
- Os 51 perfis existentes têm perguntas e respostas próprias sobre trabalho, acontecimentos locais e conselhos: 153 respostas distintas. Não são criados novos NPCs, poderes ou relações automáticas.
- 25 missões de história, ruas e materiais têm apresentações em primeira pessoa, separadas do resumo do diário. Os demais perfis mantêm o contexto de sua definição de missão.
- A missão selecionada oferece três respostas iniciais: orientação/onde obter materiais, recompensa e voltar aos outros assuntos. Fontes de drops e valores vêm do catálogo real; missões concluídas informam que o pagamento já foi registrado.
- A conversa é um grafo puro, reconstruído a partir do save. Escolher uma resposta não oferece, aceita, progride ou conclui missões e não gasta recursos.
- As ações de aceitar, recusar, entregar, comprar e forjar permanecem explícitas. Objetivos, contagens e materiais continuam na área de missão, sem repetir a prosa da caixa de fala.
- Foco permanece no diálogo, Escape fecha e o controle anterior recupera foco. Textos e detalhes têm rolagem própria para acomodar telas pequenas.

As falas adicionais são `CONTENT_DRAFT`. Os desenhos existentes e o registro central de identidade são preservados.

## Sinalização

| Estado | Principal/Clã/Classe | Secundária/contrato |
|---|---|---|
| Disponível ou oferecida | `!` amarelo | `◇` azul |
| Aceita e em andamento | `!` cinza | `◇` cinza |
| Pronta para entrega | `!` amarelo | `◆` azul |
| Sem missão acionável | Sem marcador | Sem marcador |

Rosetta continua com `?` vermelho. Quando há várias missões do mesmo NPC, entrega pronta tem prioridade, depois aceita e depois oferta. Assim, o aceite fica claramente cinza mesmo se houver outra encomenda disponível. O jogador ainda pode selecionar qualquer missão acionável na conversa. A notificação de aceite usa tom neutro, e o minimapa acompanha o estado.

## Missões em linhas

O diário usa uma linha horizontal de largura inteira por missão, empilhando principal, secundárias, Clã, Classe, caça/contratos e histórico concluído. A principal tem título de grupo e borda dourada. Entregas prontas vêm primeiro dentro do grupo. A faixa de filtros permite rolagem horizontal; os detalhes abrem e fecham por clique/teclado abaixo da missão, sem abrir automaticamente ao passar o cursor.

O seletor do NPC segue o mesmo princípio: principal destacada acima das secundárias e provas sociais depois. Trocar a missão reinicia a conversa no assunto correto. Não há limite de missões aceitas.

## Inventário e status

O atalho da cidade e `/inventory` se chamam Inventário. A primeira caixa é Mochila; os cinco Vínculos vêm depois. A ficha de status foi retirada dessa área. `/nexus` possui página própria para atributos e combate, acessível pelo menu; o HUD permanente continua mostrando os indicadores durante a exploração.

App e novos saves identificam a versão 0.12.0. O schema continua 14: não há campos novos, migração adicional, reset ou concessão de recompensas.

## Validação

- `npm run check`: lint, TypeScript, 259 testes e build de produção.
- Novo E2E cobre respostas, ajuda contextual, aceite explícito e cinza mesmo com outra oferta, ordenação visual, filtros/detalhes do diário, Mochila primeiro, Nexo separado e diálogo em 390×844.
- As condições de campanha, entradas adicionais do diário, item e avanço final do objetivo desse E2E são fixtures de UI; ele não substitui o teste real de combate/coleta/entrega da v0.11.
- Regressões de navegador verificam Rosetta, quatro missões simultâneas, compra, forja, persistência e arma em combate, além da exploração e dos painéis da cidade.
- Build emite aviso não bloqueante de chunk JavaScript acima de 500 kB; não há falha de compilação.
