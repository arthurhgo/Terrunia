# Terrúnia — notas contextuais de missão (ajuste UI v0.15)

## Escopo
Apoio de UX ao sistema de missões, sem novas mecânicas, regras de itens, progressão ou mudanças no save schema 16.

## Regra de apresentação
- A mochila exibe nome, atributos do item, Tier/refinamento, descrição e ação Equipar/Retirar. Não exibe instruções narrativas sobre destinos econômicos do item, sobre NPCs, ou sobre o papel do item em missões.
- Textos secundários de orientação (ex.: "Peças simples não equipadas podem ser convertidas em Essência com Lorian ou vendidas por Ouro a Feril, no Mercado.") pertencem à **definição de missão**, em `QuestDefinition.contextNote?: string`.
- O campo é opcional, escrito por missão no catálogo. Nunca inferir ou gerar instruções de economia/loot automaticamente a partir de sprites, raridade, ou nome.
- Quando presente, o componente compartilhado `QuestContextNote` mostra a observação abaixo dos objetivos e antes das recompensas no Diário, no painel da missão de NPC e na lição de Rosetta.
- Estilo: cinza neutro `#9ea4a7`, itálico, `font-size: .69rem`, `line-height: 1.45`, sem moldura, sem nova caixa e com quebra de texto; ausente = nenhum espaço reservado.
- As grades compactas e o rastreador continuam resumidos; as notas aparecem nos **detalhes expandidos** para não poluir o layout da lateral.

## Primeiros exemplos
- `rosetta_tutorial_armor`: informação sobre proteger a escolha original e vender/converter peças simples reservas no Mercado (Lorian/Feril).
- `rosetta_tutorial_refine`: orientação de que a peça escolhida pode ser reforçada sem comprar outra.

## Compatibilidade e validação
- Não alterar o `GameSave`, a progressão dos cinco itens vinculados, recompensas, inventário, quests concluídas, ou os sistemas de venda/conversão.
- O inventário mantém as ações reais de equipar e, no NPC correspondente, de vender/converter — apenas a instrução textual foi movida.
- Novas notas são adicionadas a outras quests somente quando o conteúdo correspondente já estiver explicitamente definido.
- Testes verificam a ausência da dica na mochila e a presença/ausência condicional da observação nas telas de missão.
