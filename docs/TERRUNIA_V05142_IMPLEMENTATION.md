# Terrúnia v0.5.14.2 — Recrutamento por Onda 14, Coração de Granito e Castelo de Clã

**Branch:** `feat/clan-ritual-granite-v0.5.14.2` · **PR #74 (draft)**  
**Status:** CONTENT_DRAFT / BALANCE_DRAFT onde indicado. A especificação master v0.4 continua soberana.

## Fluxo ativo

1. No nível 4, Rosetta encaminha o Terrírian ao Salão dos Clãs e encerra a missão **Os Quatro Caminhos** ao entrar no Salão.
2. A missão principal **Aceitar um Clã** entra no Diário. O jogador escolhe entre os quatro líderes disponíveis, aceitando com o NPC a missão **O Primeiro Juramento**.
3. Interage fisicamente com a **Mesa de Iniciação** do Salão, conclui o puzzle e entrega a missão ao mesmo líder.
4. No **Modo Ondas infinito do Portal de Astravél**, vence e recolhe a recompensa da **onda 14**. O save registra `world.portalWaveBest >= 14`. **Não é nível de personagem**; o personagem pode ter nível 4, 7 ou outro.
5. De volta ao Salão, o NPC do Clã escolhido oferece **O Coração de Granito**. Ao aceitar e conversar com ele, o jogador é transportado à instância do Golem.
6. Vence o **Golem de Granito**, recolhe o **Emblema de Clã** (drop garantido, exatamente 1) e retorna ao líder. O combate possui iniciativa em dados, turno do boss com ataque telegrafado e status.
7. O NPC valida a missão e consome o Emblema do inventário; a mesma transação salva o recrutamento exclusivo, encerra **Aceitar um Clã** e libera a primeira magia de Clã.
8. Surge um **miniportal no Salão dos Clãs**. Interagir com ele leva ao castelo do Clã associado à conta. O portal de retorno conduz ao Salão, sem criar uma segunda Base do Terrírian.

## Segurança de progressão e saves

- A filiação não pode ser antecipada com as antigas três provas: para novos candidatos, a sequência é **Mesa → Onda 14 → Boss → Emblema → Líder**.
- Os três conjuntos históricos de três ondas por Clã continuam no catálogo, para compatibilidade com saves/combates antigos. Não são mais oferecidos a novos candidatos nem obrigatórios para recrutamento.
- `Emblema de Clã` é item de missão protegido: não pode ser vendido, convertido em Essência ou substituído por equipamento vinculado.
- Apenas o líder do Clã candidato recebe a missão e o Emblema. Não é possível entregar a um NPC de outro Clã.
- Recompensas e vínculo são processados uma única vez. Ao reabrir o jogo, portal, personagem, missão e progresso permanecem com IDs estáveis.
- Saves v0.5.14.1 já filiados continuam filiados (sem desfazer conquistas), e também têm acesso à base de seu Clã; esta exceção histórica preserva o progresso.

## Castelos — fundação explorável

| Clã | Interior | Paleta de referência (VISUAL_DRAFT) |
| --- | --- | --- |
| Dûn'Avar | `interior_clan_dunavar_castle` | Verde ardósia `#3E655C` e ouro `#D4B26B` |
| Rustal | `interior_clan_rustal_castle` | Vinho `#633B48` e cobre `#D38F62` |
| Cebios Esti | `interior_clan_cebios_esti_castle` | Azul celeste `#304D7B` e prata `#C1D2E6` |
| Estres do Ét | `interior_clan_estres_do_et_castle` | Violeta `#5A3C77` e verde-água `#A3D8C8` |

Os interiores têm silhueta de castelo com muralhas, torres, salão e pontos de interação de referência. NPCs, missões exclusivas, comércio, treinamento e serviços **não são implementados nesta versão**. Todos os interiores ficam fora do catálogo de ruas de Terran e usam o mesmo personagem/estado de save; sprites e parâmetros visuais continuam substituíveis.


## Golem de Korduun — identidade visual e combate tático

**+10% aprovado para este encontro:** na criação da luta, o motor calcula `HP máximo do Golem = ceil(1.1 × HP máximo do jogador)` e `Ataque do Golem = ceil(1.1 × Ataque do jogador)`. A Defesa do Golem permanece igual à Defesa do jogador, evitando aumentos desproporcionais provocados por arredondamento em valores baixos. O cálculo é um snapshot de entrada da instância; não se ajusta após danos, cura, poções ou efeitos para impedir exploits. Não afeta outros monstros.

**Counterplay obrigatoriamente real:**
- **Poção Restauradora:** ação gratuita já existente, recupera 10% de Vida ao longo de dois turnos e respeita cooldown/inventário, sem alterar a regra geral.
- **Defender:** o Golem passa a **preparar a rocha na segunda rodada** de cada ciclo de três, sem causar dano naquele turno. O jogador tem uma oportunidade de defender antes do arremesso na terceira rodada, independentemente da iniciativa. A defesa adiciona mais 2 de mitigação, além dos 2 normais, apenas contra a pedra, e bloqueia `Abalado pelo Granito`.
- **Crítico real:** ao atacar o Golem, o jogador tem uma rolagem determinística de chance de crítico (20%, `BALANCE_DRAFT`) com dano final ×1,5 arredondado para cima (`BALANCE_DRAFT`). O dano efetivo e a mensagem **ACERTO CRÍTICO** vêm da máquina de estados, não do componente React. O dano crítico não se aplica a combates comuns.

**Visual:** sprite provisório em `public/assets/enemies/bosses/enemy_granite_golem_idle.svg`, registrado por `enemy.granite-golem`; silhueta grande de pedra rachada, musgo, sigilos e olhos azul-cintilante. O lançamento de rocha recebe animação CSS `terrunia-granite-rock-flight` e VFX de projétil atrelados ao evento de ataque. Mantém `prefers-reduced-motion` e permite substituir o sprite sem alterar gameplay. Uma animação referencial em 8 quadros foi gerada separadamente e poderá originar um atlas definitivo 4×4; a prévia GIF ainda não é asset nativo do repositório.

**OWNER_DECISION / BALANCE_DRAFT:** chance e multiplicador do crítico, número de poções previsto para cada build, defesa adicional e duração/telegraph precisam de playtest real do duelo com builds variadas, sem alterar o compromisso de HP/ATQ +10%.

## OWNER_DECISION / a validar

- Paleta oficial e arquitetura final de cada castelo: cores e estruturas acima são placeholders visuais, não cânone definitivo.
- Balanceamento do Golem, quedas secundárias e recompensas de XP/Ouro: `BALANCE_DRAFT`.
- Regras futuras de base: NPCs exclusivos, roteiros de missão, classes, serviços e expansão do castelo **não estão especificados**.
- Mudança de candidatura após iniciar uma missão permanece bloqueada, sem definir uma regra futura.

## Checklist

- [x] Requisito de **onda 14 vencida**, não nível 14 de personagem
- [x] Drop garantido e entrega consumível de Emblema de Clã
- [x] Transporte ao Golem pelo diálogo do NPC no Salão
- [x] Filiação apenas após entrega, com bloqueio cruzado de Clã
- [x] Miniportal + quatro castelos modulares e retorno ao Salão
- [x] Preservação da autenticação, dos cinco Vínculos, inventário e saves antigos
- [ ] CI de revisão e teste de navegador do último commit
- [ ] Revisão visual e playtest da onda 14 e do Golem

**Não realizar merge no `main` enquanto os checks e a regressão visual não forem revisados.**
