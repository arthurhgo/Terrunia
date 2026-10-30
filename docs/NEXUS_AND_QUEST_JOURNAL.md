# Nexo e Quest Journal — direção oficial

**Status:** decisão do criador aprovada em 2026-08-12, com capacidade e representação dos NPCs atualizadas pelo criador em 2026-10-30. Prevalece sobre interpretações anteriores no domínio de Nexo, Personagem e missões.

## Nexo

`/nexus` é a visão integrada principal da build. Deve apresentar:

- retrato, nome, nível, XP, Clã/Rank e Classe/Maestria;
- Astúcia, Agilidade, Força, Vigor e Espírito;
- Vida, Mana, Defesa, Ataque físico e Ataque mágico;
- Essência atual e Pontos de Essência;
- bônus relevantes e, quando possível, a origem dos atributos derivados;
- exatamente Arma, Escudo/Protetor, Armadura, Colar e Pulseira.

Os cinco Vínculos são permanentes. Não adicionar slots tradicionais substituíveis.

## Personagem

`/character` é ficha detalhada e histórico, não uma cópia do Nexo. Contém identidade, progressão geral, títulos, Memórias, estatísticas, conquistas e crônica do Terrírian.

## Estado de missão

Fluxo oficial:

```text
LOCKED → AVAILABLE → OFFERED → ACTIVE → READY_TO_TURN_IN → COMPLETED
```

- `OFFERED` ainda não pertence ao Journal.
- somente o clique em **Aceitar missão** transforma `OFFERED` em `ACTIVE`;
- **Agora não** devolve a missão a `AVAILABLE`;
- objetivos completos transformam `ACTIVE` em `READY_TO_TURN_IN`;
- recompensas são aplicadas somente ao concluir a entrega no NPC correto;
- autosave ocorre em todas as transições relevantes.

## Uma única fonte de verdade

`GameSave.quests` é a fonte de verdade. Seletores puros derivam:

- Quest Journal;
- Quest Tracker;
- destino do minimapa;
- estados dos marcadores dos NPCs: `?` vermelho exclusivo de Rosetta; `!` amarelo para missões principais, de Clã ou Classe disponíveis/em andamento; `◇` azul para sidequests e `◆` azul para entrega pronta. NPC sem missão disponível, oferecida, ativa ou pronta não recebe marcador. Esta decisão posterior da v0.11 substitui a padronização vermelha da v0.10.

Não criar listas paralelas de missões na UI.

## Journal e Tracker

O Journal possui: Principal, Clã, Classe, Secundárias, Caça/Contratos e Concluídas.

O Tracker exibe apenas missões `ACTIVE` ou `READY_TO_TURN_IN` marcadas como `tracked`. Desativar o Tracker também remove o destaque correspondente do minimapa, sem alterar o estado da missão.

## Capacidade global

**Decisão do criador de 2026-10-30:** não há limite de missões simultâneas. Esta direção substitui `MAX_ACTIVE_QUESTS = 3`, inclusive na validação de saves. O Journal mostra a quantidade em andamento, sem denominador nem bloqueio de capacidade. Nenhuma missão deve ser descartada ou substituída automaticamente.

Provas de Clã e Classe usam o mesmo motor, também sem limite de capacidade. Pré-requisitos, aceite explícito e entrega ao NPC correto continuam obrigatórios. As três provas necessárias ao recrutamento de Clã permanecem uma regra independente. Abandono de Main Quest, Clã ou Classe permanece `OWNER_DECISION` e não é oferecido pela interface.

## Encomendas de materiais — decisão de 2026-10-30, v0.11

Sidequests de entrega usam `turnInItems` e objetivos de coleta ligados à mochila atual. Vender, converter, forjar, guardar ou proteger itens recalcula a prontidão. Aceitar uma encomenda reconhece materiais já existentes; eventos cumulativos de coleta não substituem sua posse. A entrega valida e consome quantidades exatas antes de pagar uma única recompensa, respeitando favoritos, itens trancados e componentes reservados à progressão. O quadro da cidade informa ofertas, mas o aceite e a entrega continuam com o NPC.
