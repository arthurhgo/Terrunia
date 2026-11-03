# Terrúnia — Aceite direto nas missões dos NPCs v0.22

Data: 2026-11-03. Autoridade: `TERRUNIA_GAME_APP_MASTER_SPEC_v0.4.md`.

## Objetivo

Eliminar o clique redundante **Ouvir a oferta** na mesma janela onde já estão visíveis objetivo, progresso, recompensas e lista das missões do NPC. A missão atualmente selecionada agora exibe **dois botões de decisão no próprio painel**:

- **Agora não:** fecha a oferta. Quando ainda está `available`, não altera save nem impõe recusa; quando já está `offered` (saves anteriores), aplica o mesmo `declineQuest` existente e devolve a `available`.
- **Aceitar missão:** aceita diretamente a missão selecionada e fecha a conversa. Se estava `available`, o store chama `offerQuestDomain` e `acceptQuestDomain` em memória, validando pré-requisitos, limite de missões e condições existentes, e persiste **uma única atualização atômica**. Para `offered`, mantém o fluxo atual.

## Comportamentos preservados

- A lista de missões principais e secundárias continua selecionável; a confirmação age **somente na missão aberta**, nunca aceita as duas missões da lista de uma vez.
- Aceitar marca somente aquela missão como `active` e `tracked`, conforme a regra existente de rastreamento exclusivo.
- O jogador continua vendo requisitos, objetivo, quantidade, observações e XP/Ouro/Essência antes de decidir.
- Missões `active` mantêm seu fluxo de progresso; `ready_to_turn_in` mantém **Entregar missão**. Nenhuma recompensa é antecipada.
- Diálogo, retrato, falas e respostas dos NPCs continuam intactos; nenhum sistema de combate, drops ou save schema 17 muda.

## UI

Ações lado a lado, com **Aceitar missão** destacado em dourado/verde e **Agora não** secundário. Telas estreitas usam uma coluna. Rótulo acessível do grupo: `Confirmar missão: <título>`.

## Testes

Cobertura em `DialogueWindow.test.tsx`: opção direta para missão disponível, sem etapa extra, aceitação de fato no store, rastreamento, confirmação da missão correta, adiar uma `available` sem alterar o save, recusa de ofertas `offered` de saves anteriores.

Sem novas decisões canônicas: usa apenas os estados e regras existentes.
