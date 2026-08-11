# Balanceamento provisório

Todos os números abaixo são `BALANCE_DRAFT`. Eles existem para tornar o fluxo testável e devem ser substituídos sem alterar os motores de domínio.

| Parâmetro | Valor atual | Motivo técnico |
|---|---:|---|
| Atributos iniciais | d6, bônus 0 | Baseline neutra; `OWNER_DECISION`. |
| Primeira barra de Essência | 100 | Um drop do primeiro encontro demonstra um ciclo completo. |
| Barras seguintes | 125, 150, 180, 215, 255, 300, 350, 405, 465 | Curva provisória crescente. |
| Crescimento após a tabela | ×1,15 | Evita limite fixo durante testes longos. |
| Drop Fungorro | 100 Essência ou 32 ouro | Força uma decisão legível no tutorial. |
| Recompensa do combate | 15 XP, 8 ouro | Feedback de progressão sem conceder Ponto de Essência direto. |
| Ressonância da arma | 12 | Demonstra progresso do item separado da moeda da Skill Tree. |
| Primeiro node | 1 Ponto de Essência | Fecha o loop do vertical slice. |
| Vida base | 8 + Vigor × 2 | Mantém o combate inicial legível. |
| Mana base | 5 + Espírito × 1 | Permite três usos da primeira habilidade; multiplicador final é `OWNER_DECISION`. |
| Golpe Ressonante | 3 MP, +2 poder, Fratura por 2 turnos | Demonstra skill e status vindos do node. |
| Fratura Ressonante | −1 mitigação | Valida modificador temporário sem fixar fórmula final. |
| Esporos Nocivos | 1 dano por 2 turnos | Valida efeito no início do turno. |
| Tônico de Campo | +8 Vida | Consumível técnico da trilha, não item canônico final. |
| Emboscada de Esporos | 3 inimigos; 55 XP, 20 ouro, 32 Ressonância | Valida alvo, timeline e IA multi-inimigo. |
| Aglomerado de Esporos | 55 Essência ou 20 ouro | Segundo dilema econômico do protótipo. |
| Colosso Micélio | Nv 6, 24 Vida, 2 mitigação, 4 ataque | Boss técnico vencível com o kit atual; stats finais são `OWNER_DECISION`. |
| Recompensa do Colosso | 120 XP, 60 ouro, 256 Ressonância | Fecha o percurso completo em 300 de Ressonância e evita grind antes do Grau III. |
| Fragmento Micelial | 1 garantido; sem venda/conversão | Garante que o componente necessário ao Grau II não seja destruído pelo loop de loot. |
| Rito Grau II | 100 Ressonância + 1 Fragmento + retorno a Terran | Usa threshold da especificação; NPC, edifício e custos adicionais permanecem `OWNER_DECISION`. |
| Esmeralda do Crescimento | +2 Vida máxima; sem venda/conversão | Demonstra efeito próprio de Joia. Valor e origem no Colosso são drafts. |
| Rito Grau III | 300 Ressonância + Grau II + Joia compatível + retorno a Terran | Usa threshold da especificação; NPC, edifício, custo e rito narrativo permanecem `OWNER_DECISION`. |

As fontes ficam em `src/content/balance.ts`, `src/content/combat.ts`, `src/content/items.ts`, `src/content/enemies.ts` e `src/content/skillTrees.ts`.
