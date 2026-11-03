# Terrúnia v0.23 — Chave de Daeryn, Base trancada e portas clicáveis

Atualizado: 2026-11-03. Documento de referência: `TERRUNIA_GAME_APP_MASTER_SPEC_v0.4.md`. Esta alteração atende à decisão explícita do responsável sobre o bloqueio da Base.

## Fluxo canônico da chave

1. A Base do Terrírian começa **trancada**, não acessível por clique, tecla E, minimapa ou chamada direta ao motor sem autorização.
2. Na missão principal **Um Lugar em Terran**, Daeryn orienta a preparação do alojamento. O objetivo segue sendo realizado na Casa de Daeryn.
3. **Na entrega concluída da missão**, o jogador recebe exatamente **1 Chave de Daeryn** (`quest_daeryn_home_key`), além de XP e Ouro já cadastrados. O item pertence à categoria `quest`, é único, não vendável, não conversível e está bloqueado para armazenamento comercial. Fica na mochila até o primeiro uso.
4. Na porta da Base, uma interação mostra **Usar chave na porta** e **Agora não**. Sem a chave, a porta informa qual missão desbloqueia o acesso.
5. Confirmar o uso consome a instância do inventário, grava `player_home_door_opened`, entra na Base e registra o evento no save em uma transação. **A porta fica destrancada permanentemente**, sem exigir nova chave em entradas posteriores.
6. A Base continua possuindo cama e baú de recursos sem interferir nos cinco Vínculos permanentes.

## Regras e proteção contra atalhos

- O motor `enterPlayerBase` exige a flag permanente da porta aberta, exceto quando o jogador já está na Base. A presença da chave por si só não abre a casa: requer a ação explícita na porta.
- `unlockPlayerBaseWithDaerynKey` valida missão concluída, chave na mochila, ausência de bloqueio de cena/batalha e localização válida em Terran. Nunca consome o item em operação inválida.
- O recebimento está em `QuestDefinition.itemRewards`, configurável/data-driven e concedido apenas em `turnInQuest`; não é bônus silencioso de kill ou level.
- `PLAYER_HOME_FLAG` continua representando o progresso de Daeryn, enquanto `player_home_door_opened` representa o uso físico da chave. Não são a mesma ação.
- Se houver derrota **antes** de destrancar a Base, o personagem reaparece na **Praça do Portal** com 1 PV e 0 MP, em vez de atravessar a porta trancada. Depois do desbloqueio, reaparece na Base. Não há perda de Ouro, itens, progresso ou equipamento.

## Portas clicáveis da cidade

- Todas as **sete instituições que possuem interior** têm um botão interativo sobre a posição da porta no cenário pixelado. A **Base** também possui seu próprio botão, com estado trancado/destrancado.
- Clicar sobre uma porta navega até o limiar pela malha de colisão e **só então** executa a entrada. Permanecem os comandos WASD/setas, tecla E, o minimapa e os nomes/placas dos locais.
- O **Portal** mantém a interação própria, pois não é uma casa com interior.
- Os botões usam IDs dos locais, com sprites e arte independentes da lógica, rotulados para mouse, toque e teclado.

## Saves antigos e migração de conteúdo

O schema permanece na versão 17; o carregamento reconcilia o estado antigo sem apagar conteúdo:
- Missão concluída e porta ainda não aberta: disponibiliza uma chave caso não exista na mochila ou no baú.
- Se a chave estava no baú de um save anterior, move-a para a mochila para evitar bloqueio.
- Se o personagem já estava dentro da Base com a missão concluída, registra a porta como aberta e consome eventual chave que tenha restado.
- Se estava dentro da Base sem concluir a missão de Daeryn, retorna de forma segura à Praça; nenhuma missão ou recompensa é removida.
- Recarregar o mesmo save não duplica chave nem destrava a Base indevidamente.

## Verificações

Testes automatizados de domínio: missão, recompensa, uso único, falhas, persistência, respawn, migração e reentrada. Testes de UI: botão em cada uma das sete portas e da Base, clique com personagem no limiar e estado de cadeado. Executar `npm run check` (lint/TypeScript/Vitest/build). Validação visual em navegador e publicação do Vercel são etapas distintas.

## OWNER_DECISION
A lógica de posse permanente após a primeira abertura foi escolhida para evitar exigir novas chaves de Daeryn a cada entrada, mantendo a instrução de consumo único na primeira interação. Caso a intenção seja chave exigida sempre, essa regra deverá ser revista explicitamente.
