# Terrúnia v0.5.14 — Câmaras Fúngicas jogáveis

**Status:** implementação em revisão, `BALANCE_DRAFT` / `OWNER_DECISION` para parâmetros ainda sem aprovação. **Base:** v0.5.13.1 (PR #71). **Escopo de autoridade:** `TERRUNIA_GAME_APP_V0.5.14_IMPLEMENTATION_SPEC.md` (documento de trabalho) + `TERRUNIA_GAME_APP_MASTER_SPEC_v0.4.md`.

## Jogabilidade e progressão

- Quatro salas existentes (`fungal_vestibule`, `fungal_spore_gallery`, `fungal_root_sanctum`, `fungal_core`).
- Cada sala: três estágios com composições distintas de inimigos cadastrados; total de **12 estágios mais um confronto separado com o chefe**.
- `dungeonRun` isola avanço, estágio, sala, drops resgatados, missão principal e `runId`. Nenhuma descoberta global antiga libera estágios; cada recompensa só pode ser resgatada no estágio ativo.
- Ao sair voluntariamente, retornar a Terran ou ressuscitar, apenas o estado da tentativa é descartado. Novo ingresso sempre recomeça na primeira sala/primeiro estágio.
- Reload dentro da dungeon mantém tentativa, encontro, RNG, rolagens, cooldowns e HP/MP; o save schema 17 foi ampliado *aditivamente* com campos opcionais, sem migrar ou invalidar saves antigos.
- A vitória da Sentinela conclui o nó da trilha Astravél apenas após a conclusão dos 12 estágios; visitar o interior não conclui a missão.

## Sentinela Corrompida: Núcleo da Ruína

- Novo constructo arcano, **totem mágico não biológico**, sprite independente e movimento em pulsos.
- Três guardiões fúngicos vivos na abertura do boss. Enquanto existir um guardião vivo, o boss **não é alvo válido e não recebe dano**, inclusive por splash, ataque em área, status hostil ou consumível.
- A cada **5 rodadas completas**, ressuscita um guardião morto, até três vivos. A cada **2 rodadas completas**, cura cada guardião vivo em **5% da Vida máxima**, limitado a HP máximo.
- Fortalece os fungos e desfere golpes arcanos com logs; seus contadores não andam no hover, na apresentação do dado ou ao usar poção gratuita.
- A memória única e os componentes de Vínculo são concedidos uma vez; reentradas podem gerar XP, Ouro e recursos comuns conforme parâmetros de balanceamento. Personagens que já derrotaram o antigo Colosso mantêm suas recompensas.
- O `enemy_colossus_mycelium` histórico não foi apagado do repositório; seu uso narrativo futuro está como `OWNER_DECISION`.

## Combate

- `skill_resonant_strike`: preserva MP 3, cooldown 2 e Fratura no alvo principal; adiciona 5% do dano final principal a cada outro inimigo elegível, com VFX de pulso e logs por alvo. A Fratura não é propagada.
- `skill_basic_area_attack`: técnica básica sem custo de mana, com 60% do dano de ataque em cada inimigo elegível, calculado por alvo e com VFX próprio.
- Poção Restauradora: consumível real, comprado na Casa de Daeryn; **não encerra a ação** do jogador. Recupera exatamente `ceil(maxHp × 0.10)` PV distribuídos nos próximos dois inícios de turno do jogador, sem exceder HP máximo. Cooldown dois turnos, sem empilhar; requer item real, 1 item consumido por uso. Tonico/Éter/Antídoto antigos continuam com regras anteriores.
- Ataque de arma com bônus cadastrado: soma rolagem de dado separado do atributo + bônus da arma. Números e faces registrados no motor, no log, no card e na apresentação de foco. Uma arma sem bônus mantém o cálculo original.

## Parâmetros de balanceamento — **não canônicos**

| Variável | Protótipo atual | Pendência |
|---|---|---|
| Grupos por estágio | 2–3 inimigos existentes | `OWNER_DECISION` quantidade, distribuição e dificuldade |
| Vida / ATQ / mitigação da Sentinela | 42 HP / 5 / 3 | `OWNER_DECISION` |
| Cadência da IA | 5 rodadas respawn; 2 rodadas cura; 3 rodadas buff | 5 e 2 aprovados, unidade `round` provisória; buff pendente |
| Buff micótico | +1 ATQ e +1 mitigação / 2 turnos | `OWNER_DECISION` |
| Golpe arcano boss | dado d4 e `powerBonus=1` | `OWNER_DECISION` |
| Golpe Ressonante AoE | 5% arredondado para cima; mínimo 1 | `OWNER_DECISION` arredondamento |
| Ataque simples AoE | 60% sem MP e sem cooldown | `OWNER_DECISION` |
| Poção | 1 uso por 2 turnos, cura 10% total | `OWNER_DECISION` catálogo de poções e preço |
| Dado da arma | d4 adicional em sete famílias atuais | `OWNER_DECISION` dados individuais/Graus e escopo |

## Segurança e qualidade

- O servidor de conteúdo e o motor de combate são autoridade para hits, timers, item consumption e progressão. UI usa apenas IDs e `assetRegistry`; PNGs nativos têm fallback.
- O save é único por conta; campos de dungeon e boss são opcionais para saves antigos. Zero alteração de Firebase ou credenciais.
- Testes: progressão 12+boss, reset, boss inalvejável e proteção AoE, cura/respawn, poção gratuita e HoT, dado adicional, integração de quests e Playwright.
- **Condição de merge:** `npm run check` e `browser-regression` aprovados; nunca mesclar PR vermelho.

## Próximas decisões do criador

Todas as propostas de percentuais **não explícitos** e a seleção de monstros da tabela permanecem `OWNER_DECISION`. A especificação do usuário permanece fonte de autoridade; balanceamento poderá ser refinado sem reescrever motor nem migrar equipamento vinculado.
