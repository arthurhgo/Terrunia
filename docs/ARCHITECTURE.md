# Arquitetura

## Fronteiras

```mermaid
flowchart TD
    UI["React UI"] --> Store["Zustand orchestration"]
    Store --> Domain["Pure domain engines"]
    Store --> Sync["Local-first sync"]
    Domain --> Content["Typed content catalogs"]
    Sync --> IDB["IndexedDB"]
    Sync --> Firestore["Firestore optional"]
```

- `content`: definições imutáveis e tipadas; IDs estáveis.
- `domain`: regras puras, resultados explícitos e nenhum conhecimento de React.
- `state`: transforma ações da interface em eventos de domínio e commits de save.
- `persistence/services`: schema, armazenamento e integrações externas.
- `ui`: apresenta estado e envia comandos; não calcula recompensas.

## Combate e exploração

A trilha resolve um nó atual por vez. Entradas, acampamentos e eventos usam o mesmo motor de progressão; batalhas apontam para `EncounterDefinition`, que declara 1–3 instâncias inimigas e recompensas sem acoplamento à tela. Chefes mantêm o tipo de nó `boss`, mas o save diferencia `boss` bloqueado de `bossCurrent` acessível.

A batalha usa uma máquina de estados determinística e uma timeline de iniciativa:

```mermaid
stateDiagram-v2
    [*] --> TurnStart
    TurnStart --> AwaitingAction: ator jogador
    TurnStart --> ResolvingAction: ator inimigo
    AwaitingAction --> ResolvingAction: comando válido
    ResolvingAction --> ApplyingStatuses
    ApplyingStatuses --> Victory: inimigos derrotados
    ApplyingStatuses --> Defeat: jogador derrotado
    ApplyingStatuses --> TurnEnd: combate continua
    TurnEnd --> TurnStart: próximo ator
```

O estado inclui cursor de iniciativa, HP/MP, guarda, skills, status com duração, itens consumidos, log, recompensa calculada e flag de reivindicação. RNG passa pelo seed da batalha. A UI nunca salta transições.

## Essência e Vínculo

Ressonância pertence a cada item vinculado e governa seu progresso. Essência bruta alimenta uma barra global; cada limiar completo acrescenta exatamente um Ponto de Essência ao pool compartilhado. Nodes validam domínio, pré-requisitos, Grau e saldo antes do commit atômico.

O Rito do Grau II também é atômico: valida localização, Ressonância, Fragmento, proteção e capacidade; somente então consome a instância do inventário, avança o Grau, insere a definição de Essência, registra Memória/flag e agenda autosave. A árvore revela nodes consultando as tags do componente inserido.

## Persistência

Cada mudança cria uma nova revisão do `GameSave`. Escritas são serializadas localmente; a sincronização de nuvem é opcional. Regras de domínio podem ser testadas sem navegador, IndexedDB ou Firebase.

O schema v3 migra saves v1/v2, preserva progresso permanente e libera o Colosso apenas quando o limiar já foi concluído. Batalhas antigas continuam válidas porque as novas recompensas de Memória/flags são opcionais.
