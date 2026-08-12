# Nexo e Quest Journal — direção oficial

**Status:** decisão do criador aprovada em 2026-08-12. Prevalece sobre interpretações anteriores no domínio de Nexo, Personagem e missões.

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
- marcadores `!` e `✓` dos NPCs.

Não criar listas paralelas de missões na UI.

## Journal e Tracker

O Journal possui: Principal, Clã, Classe, Secundárias, Caça/Contratos e Concluídas.

O Tracker exibe apenas missões `ACTIVE` ou `READY_TO_TURN_IN` marcadas como `tracked`. Desativar o Tracker também remove o destaque correspondente do minimapa, sem alterar o estado da missão.
