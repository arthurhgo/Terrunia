# Terrúnia v0.5.2 — Missões, Atributos e Combate

Status: implementação incremental, criada a partir de main após v0.5.1. Nenhuma mudança de canon silenciosa.

## Interface e missões

- Mochila agora é botão **quadrado, só com ícone** (com aria-label e tooltip para acessibilidade). Fica acima do seletor **Explorar Terran** e abre painel acima do botão.
- Rosetta não exibe mais o cartão da **Biblioteca de Eldamar**; a biblioteca permanece no mundo.
- **Aceitar missão** no painel do NPC e no diálogo de Eldamar não fecha a janela; o jogador pode escolher outros assuntos/missões no mesmo NPC.
- Caminhos **brancos** da Rosetta para ofertas não aceitas: **opacidade 40%**; trajetos de secundárias aceitas (**azuis**): **opacidade 40%**; entregas (**verdes**) permanecem em 100%.
- Prioridade de rotas, condições e compatibilidade com saves antigos permanecem.

## Progressão de dados (aprovada pelo proprietário neste pedido)

- Evolução somente em d4 → d6 → d8 → d10 → d12.
- Cada avanço consome **2 Pontos de Atributo**; não é possível avançar com saldo 1.
- Antes do primeiro Vínculo, cada recuo devolve os mesmos 2 pontos. Depois de vincular a arma, restituições continuam proibidas.
- Progressão de XP e pontos por nível não muda: o jogo fica mais exigente pois dois pontos são necessários.
- Constante configurável: `BALANCE.attributePointsPerDieUpgrade` (2).

## Combate: iniciativa e rolagem com clique

- Combates novos iniciados pelo store agora aguardam comando explícito `rollInitiative` na fase `AwaitingInitiative`.
- UI mostra **TURNO 1** → **ROLAGEM DE INICIATIVA**; o jogador precisa clicar no dado de iniciativa para continuar.
- Os valores são registrados no motor com RNG determinístico antes de aparecerem no save; nenhum dado pode ser rolado duas vezes.
- **BALANCE_DRAFT:** iniciativa total = valor base de iniciativa + face do dado. O jogador usa o dado de Agilidade (d4–d12), inimigos usam d4 até catálogo definir seus dados; os resultados reordenam turnos de verdade.
- Cada vez que uma ação ofensiva requer dado do jogador, a plataforma o apresenta parado com o texto **Clique no dado para rolar**. A animação só começa após clique. Os dados inimigos rolam automaticamente.
- A prévia do comando é pura; a sequência de rolagens ocorre antes de confirmar o comando e persistir dano. Saves já iniciados com fase anterior continuam válidos.
- Rolagens de dano não alteram a fórmula atual: são amostras reais do RNG registradas e mostradas pela interface até uma decisão futura de vínculo de dano ao resultado.

## Monstros

- Hover ou foco no sprite mostra tooltip com Vida/Mana, Ataque, Defesa, Iniciativa, Dado e condições atuais, todos lidos de `battle.combatants`.
- Ao morrer, o sprite ganha animação pixelada de queda, dessaturação e desaparecimento gradual; `prefers-reduced-motion` desativa a animação. Não há nova regra de morte, XP ou drop.

## Verificações

- Testes de progressão 2 pontos, iniciativa determinística e fase de abertura, clique nos dados, tooltip inimigo e transição de morte.
- `npm run check` no CI deve validar TypeScript, vitest e build.
- Testes manuais em viewport 1366×768 / 1920×1080 / mobile, início da batalha, wave e save antigo, NPCs com múltiplas missões.

## OWNER_DECISION

- Dado de iniciativa próprio por espécie de monstro (atualmente d4 parametrizável).
- Pesos e modificadores adicionais para iniciativa, probabilidade de crítico e influência direta da face do dado no dano (não especificados).
- Texturas ou sprites definitivos para morte; efeito atual é CSS temporário e substituível via asset registry.
