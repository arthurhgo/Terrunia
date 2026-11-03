# Terrúnia — transferência real de equipamento vestido (save v17)

Data: 2026-11-03. Autoridade: `TERRUNIA_GAME_APP_MASTER_SPEC_v0.4.md`.

## Regra implementada
A proteção simples temporária passa de `save.inventory` para `save.equippedBasicArmor` **na mesma transação** de Equipar. A mochila contém exclusivamente itens não vestidos. A área **Itens Vinculados** mostra a proteção simples no slot Armadura, identificada como temporária, e oferece **Retirar proteção**, que retorna a exata instância à mochila. A troca por outra peça devolve a antiga e equipa a nova, sem duplicar item. `instanceId`, Grau de refinamento, atributos e histórico são preservados.

A proteção simples **não** é um dos cinco Vínculos permanentes e não aumenta o contador de Vínculos. O sistema de Grau I–VII continua exclusivo dos cinco itens vinculados. A peça temporária mantém a função de tutorial e pode ser aprimorada na forja mesmo enquanto está equipada.

## Estado persistido
- `GameSave.equippedBasicArmor: InventoryItemInstance | null`: propriedade canônica para a instância vestida
- `character.basicArmorInstanceId`: ponteiro de compatibilidade para o slot; ambos devem apontar ao mesmo ID, ou ambos ser nulos
- `inventory`: somente recursos e equipamentos **não equipados**
- Validação rejeita ID duplicado entre o slot, a mochila e o baú, quantidade diferente de 1, item não-arma­dura e Vínculo de Armadura simultâneo

## Migração não destrutiva
Save schema `16 → 17`: localiza a instância anteriormente vestida na mochila e a transfere para o novo slot, sem copiar nem apagar os outros itens. Mantém XP, Ouro, Essência, quests, refinamento, NPCs, drop e saves antigos. Invalidade de ponteiro rejeitada em vez de inventar um item.

## UI
- O botão **Equipar** permanece nos detalhes do item na mochila.
- O item vestido aparece no painel **Itens** (como peça simples), com botão **Retirar proteção**.
- A grade da mochila não exibe peça vestida e não cria uma segunda cópia visual.
- A forja reconhece a peça no slot como alvo de aprimoramento; a missão de Rosetta reconhece a ação de equipar/refinar.
- No baú, a proteção em uso permanece protegida e não é negociável até ser retirada.

## Testes
A suíte precisa confirmar transferência, troca, retorno, migração v16, refinamento da peça equipada, proteção do baú e restauração sem duplicações. `npm run check` integra TypeScript, lint, Vitest e build. Teste de navegador/produção exige verificação à parte.
