# Terrúnia — Implementação UX / Gameplay v0.5 (2026-11-04)

## Status
Implementação incremental na branch `feature/ux-missions-dice-backpacks-v05`. Não altera o canon dos cinco Vínculos, nem as regras de progressão por Essência.

## UX — missões e entrega
- Centralizar o diálogo do NPC e preservar a área de ações quando o conteúdo for longo.
- Separar visualmente missões prontas para entrega (estado de domínio `ready_to_turn_in`) das missões encerradas (`completed`).
- Fornecer botão de rastreio para cada missão pronta; quando não houver rastreio ativo, escolher uma entrega pronta como orientação padrão.
- Caminhos até o NPC responsável em verde fluorescente `#62FF9B`; Rosetta mantém orientação e estilo anteriores nas ofertas.
- Identificar materiais **possuídos**, distinguindo-os daqueles efetivamente **entregues**.

## UI — exploração
- Mochila abre e recolhe em camada sobre o cenário, sem ocupar a coluna fixa esquerda.
- Coluna esquerda permanece dedicada às missões.
- Edifícios recebem nomes legíveis no minimapa SVG; navegação continua por IDs de local.

## Mercado / economia
- `BALANCE_DRAFT`: Armadura de Couro Simples 60 Ouro; Guarda de Terran 135 Ouro; Colete Leve 25; Túnica Gasta 22; Túnica de Aprendiz 28.
- `BALANCE_DRAFT`: mochila inicial 12 pilhas, Reforçada 18 / 95 Ouro; Viajante 24 / 210 Ouro; Arcana 36 / 420 Ouro.
- Mochilas são **melhorias permanentes de capacidade**, não novo slot vinculado nem equipamentos substituíveis.
- Cada compra exige pré-requisito da mochila anterior e é persistida em `world.worldFlags` sem alterar schema.
- Excedentes **novos** movidos ao baú da Base ao persistir, preservando saves legados com mais itens que o novo limite. Reavaliar UX de aviso de recebimento no baú.

## Combate — dados
- Cada ação que efetivamente causa dano registra a face e o tipo de dado no motor de combate e no log persistido.
- O jogador usa o dado do atributo de escala da arma vinculada (`d4–d12`).
- Inimigos utilizam `d4` como **BALANCE_DRAFT**, até receberem dados por monstro/ação no catálogo.
- Animações apresentam jogador e inimigos na sequência registrada pelo motor; respeitam redução de movimento.
- **OWNER_DECISION:** vínculo da face à fórmula final de dano, duração final de suspense, ordem de revelação dos turnos inimigos. No estado atual, dados são rolagens verdadeiras e reproduzíveis de apresentação, e **não alteram a fórmula de dano atual**.
- A resolução do motor continua síncrona. Exibir a rolagem **antes do dano ser computado** requer fase adicional explícita de combate e não deve ser representado como concluído nesta versão.

## Validação obrigatória
- `npm run check` via GitHub Actions CI.
- Testar diálogo curto/alto em 1366×768 e 1920×1080.
- Testar rotas internas e externas, NPC entregador e prioridade verde.
- Testar mochilas, capacidade, compras repetidas e recompensas em baú.
- Testar ataques do Terrírian, monstros, multi-inimigo, dano e saves antigos.
- Não realizar merge ou deploy enquanto a validação não concluir.
