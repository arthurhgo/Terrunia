# Terrúnia v0.26 — Correções de interação no mundo

Data: 2026-11-04. Referência técnica: `TERRUNIA_GAME_APP_MASTER_SPEC_v0.4.md`.

Este ajuste é um patch da vertical slice v0.25. Não cria mecânicas, recompensas ou itens novos; apenas elimina dois caminhos em que a interface poderia divergir do gameplay.

## Cama da Base
- O rótulo **Cama** / *descansar e recuperar* continua no interior.
- O botão agora usa `walkTo(plan.service, 'services')` na Base. Assim, um clique distante inicia o deslocamento e o descanso só é ativado ao chegar perto da cama.
- A cama continua acessível pela tecla **E** e por interação no cenário; o botão de móvel redundante foi removido, deixando um único alvo visual para a cama. O móvel permanece em `roomFurniture`, sem mudar IDs e sprites.
- Os botões dos serviços de outras instituições permanecem inalterados.

## Minigames e salvamento
- `performTerranQuestTask` retorna sucesso/falha booleano. Continua validando no domínio: missão ativa, localização, móvel e sequência correta.
- A UI só fecha o minigame ao confirmar que o save realmente registrou o objetivo. Em caso de save desatualizado, mudança de local ou missão inválida, mantém as etapas resolvidas abertas e apresenta feedback.
- Não adiciona Pontos de Essência, itens, Clã, Classe ou qualquer nova recompensa.

## Verificação
- Testes regressivos para clique remoto na cama, único alvo visual, serviços de outra casa, minigame que permanece aberto quando a gravação é recusada.
- `npm run check`: lint, tipagem, testes, build.
- Verificação visual e testes manuais da animação permanecem complementares.

## OWNER_DECISION
Nenhuma nova regra pendente. A semântica de repouso e conclusão de missão preserva a especificação v0.4.
