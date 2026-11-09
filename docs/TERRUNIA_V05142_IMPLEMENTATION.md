# Terrúnia v0.5.14.2 — Rosetta, Clãs e Golem de Granito

**Estado:** implementação experimental em `feat/clan-ritual-granite-v0.5.14.2`; aprovar em CI + regressão antes de integrar `main`.

## Fluxo jogável

1. Nível 4: Rosetta oferece **Os Quatro Caminhos**, apresentando os quatro Clãs e a afinidade informativa da arma vinculada. Entrar no Salão dos Clãs conclui automaticamente essa missão, sem retorno à Praça.
2. Ao entrar no Salão, inicia-se no Diário a missão principal **Aceitar um Clã**. Ela fica ativa até a confirmação do rito de filiação.
3. Cada líder apresenta a sua própria missão **O Primeiro Juramento**, aceita por diálogo direto com o representante. O primeiro aceite registra a candidatura e bloqueia candidaturas rivais.
4. O jogador caminha até a **Mesa de Iniciação** dentro do Salão, interage com o objeto real, executa a atividade de ecos e retorna ao mesmo NPC para entregar a tarefa.
5. Mantêm-se **três provas de cada Clã, três ondas de combate por prova**, com registros persistidos e reconhecimento de vitórias únicas. Somente depois do rito ocorre a filiação; o personagem segue sem classe até adquiri-la.
6. **Nível 7** e três provas concluídas, após confirmar filiação: o líder oferece **O Coração de Granito**. O jogador enfrenta o Golem de Granito (Korduun), combate por turnos, iniciativa por dado, ataque pesado a cada terceira rodada com alerta na rodada anterior, efeitos de status e ausência de fuga. Depois recebe loot e entrega a missão ao líder.

## Implementação técnica

- Conteúdo em `src/content/clanProgressionV05142.ts` + `quests.ts`, `enemies.ts`, `combat.ts`.
- Regras de candidatura exclusivas em `src/domain/quests/questEngine.ts` e persistência de clã já existente.
- Interação física da mesa em `src/ui/terran/roomContent.ts`, `src/domain/terran/questActivities.ts`, `src/ui/screens/TerranScreen.tsx`.
- Golem ligado à máquina de estados existente, com flag opcional `clanBossQuestId` validada pelo schema do save.
- Sprites via `assetRegistry`, Golem e golpe usando placeholder configurável até arte final. Sem lógica de dano acoplada ao PNG.
- Compatibilidade aditiva de novas quests através da rotina existente `migrateAndValidateSave`, sem resetar saves v0.5.14.1.

## Decisões em aberto

- **OWNER_DECISION / BALANCE_DRAFT:** atributos, dano, mitigação, XP, Ouro, durações e recompensas do Golem; números atuais são temporários e precisam de playtest com personagem nível 7.
- **OWNER_DECISION:** possibilidade de trocar candidatura já iniciada. A versão bloqueia troca.
- **OWNER_DECISION:** se as três provas de três ondas devem ter gates intermediários de nível 5 e 6. Por compatibilidade, preservamos as provas disponíveis por sequência de missões; o desafio do Golem abre no nível 7.
- **CONTENT_DRAFT:** a atividade da mesa reutiliza a interpretação dos Ecos do Nexo. Texto, sprites e rito específico de cada Clã podem ser diferenciados sem mudar a regra-base.
- Não altera o cânone dos cinco equipamentos vinculados, pontos de Essência, Classe adquirida no Clã e seleção exclusiva de filiação.

## Regressão prioritária

- Rosetta nível 3 vs 4; conclusão no Salão; geração do objetivo principal Aceitar um Clã.
- Aceite apenas pelo líder correspondente; bloqueio dos outros Clãs; tarefa de objeto e entrega.
- Progressão nas 9 ondas, save/reload, refazer ondas sem crédito duplicado.
- Confirmar rito, primeira magia, persistência e ausência de Classe na criação.
- Missão do Golem bloqueada antes do nível 7; combate com aviso, status, drops e retorno ao NPC.
- Save v0.5.14.1 já afiliado, candidato ou com prova ativa, sem perda de progressão.

**Não integrar ao `main` antes da validação do GitHub Actions e Playwright.**
