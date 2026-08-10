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

As fontes ficam em `src/content/balance.ts`, `src/content/items.ts`, `src/content/enemies.ts` e `src/content/skillTrees.ts`.
