# Terrúnia v0.5.15.2 — Balanceamento de equipamentos e monstros

**Estado:** `BALANCE_DRAFT` · **NÃO publicar nem integrar na `main` sem aprovação.**
Branch: `balance/v0.5.15.2-neris-gear-stats-draft`.
Autoridade: `TERRUNIA_GAME_APP_MASTER_SPEC_v0.4.md`, preservando os cinco Vínculos permanentes e o comércio exclusivo.

## 1. Escopo e compatibilidade

- Permanecem **140 conjuntos e 1.400 SKUs**: 600 comuns, 200 exclusivos de Clã, 600 de Classe. Os IDs, as artes e os saves são preservados; **nenhum item usado por um save é apagado**.
- Neris continua vendendo **somente 120 peças comuns Tier I/Grau I**, sem requisito de Clã ou Classe. Tiers II–V comuns seguem `OWNER_DECISION` sobre aquisição.
- Cada castelo conserva **um Intendente específico** com o inventário do seu Clã e três Classes, sujeito aos requisitos de filiação, Classe, nível, local e Ouro.
- A aparência e o revestimento comercial não substituem arma/escudo/armadura/colar/pulseira vinculados nem seus sete Graus, Memórias, Joias, Ressonância ou Runas.
- Bônus físicos, mágicos, universais, de Vida, Mana, Defesa e Iniciativa afetam as **fórmulas reais** do personagem. Não foram adicionadas chances de crítico, esquiva, regeneração, resistências ou atributos sem aprovação.

## 2. Redundância eliminada por função

Cada um dos **10 slots** tem **12 pares de atributos diferentes** no estoque de Neris; são 120 combinações distintas quando consideradas por slot. Cada **conjunto de 10 peças possui 10 pares diferentes**, incluindo os conjuntos de Clã e Classe. O emparelhamento é determinístico e busca minimizar o afastamento do estilo (ataque físico, mágico, híbrido, Vida, Mana, proteção ou agilidade).

Um slot conserva sua finalidade: armaduras e escudos têm **Defesa** como atributo principal **ou secundário**; capacetes/calças fornecem Vida; colares/pulseiras, Mana; botas, Iniciativa. Armas neutralizadas não são convertidas em novos Vínculos: o bônus vem de um revestimento da arma vinculada.

As 12 armas comerciais atendem aos papéis:
Guarda (Físico + Defesa), Vanguarda (Físico + Vida), Agilidade (Físico + Iniciativa), Versatilidade (Geral + Defesa), Proteção Arcana (Mágico + Defesa), Magia Veloz (Mágico + Iniciativa), Conjurador (Mágico + Mana), Mago Resistente (Mágico + Vida), Caçador (Físico + Mana), Híbrido Arcano (Geral + Mana), Contra-ataque (Geral + Iniciativa) e Dano Híbrido (Mágico + Físico). São **perfis neutros**: nomes de Classe podem existir internamente como IDs históricos, mas não restringem compras em Neris.

## 3. Orçamento de atributos (`BALANCE_DRAFT`)

| Faixa | Bônus principal | Bônus secundário | Observações |
|---|---:|---:|---|
| Comum Tier I G1 | +1 (arma +2) | +0 ou +1 | Especialização pela combinação; arma universal é reduzida |
| Comum Tier I G2 | principal sem alteração | secundário +1 | Primeiro aprimoramento da forja |
| Comum Tier I G3 | principal +1 | secundário mantém G2 | Segundo aprimoramento |
| Exclusivo de Clã G1 | principal comum +1 | secundário comum | Superior ao comum de mesmo Tier/Grau |
| Exclusivo de Classe G1 | principal comum +2 | secundário comum +1 | Superior ao Clã em orçamento total do mesmo Tier/Grau |

O valor-base do atributo principal progride conforme o Tier (I–V: +1/+2/+3/+4/+5), com apoio adicional em Tiers II e IV; armas partem de +2 e o ataque universal recebe desconto de 30% antes da bonificação exclusiva. O secundário pode iniciar em zero, com função desbloqueada na forja G2; armaduras mantêm Defesa positiva desde G1. Os tiers superiores exigem os níveis existentes **1/4/7/10/13**.

**Importante:** a hierarquia proposta é avaliada em **mesmo Tier e Grau**. Um item comum G3 pode superar um exclusivo G1 em um atributo individual, pois o investimento na forja tem valor. Não se deve aplicar o antigo +3/+5 em ambos os atributos a cada peça; isso gerava invulnerabilidade ou abates instantâneos.

Custo de compra e forja permanece configurável; a aquisição de materiais adicionais G2/G3 é `OWNER_DECISION`.

## 4. Inimigos e chefes — dados separados

`src/content/enemyBalanceV05152.ts` define Vida, Defesa e Ataque para **25 inimigos existentes**. Não muda a identidade nem cria espécies novas, efeitos, IA, magias, recompensas, drops ou regras de iniciativa.

| Faixa | Inimigos exemplares | HP | DEF | ATQ |
|---|---|---:|---:|---:|
| Tutorial | Fungorro Rastejante | 8 | 1 | 3 |
| Início | Semeador de Esporos | 12 | 1 | 3 |
| Transição | Casco de Esporos | 21 | 3 | 4 |
| Meio | Horror Esporulante | 24 | 2 | 6 |
| Pré-chefe | Vigia do Limiar | 35 | 4 | 7 |
| Minichefe | Titan Raiz-Negra | 48 | 4 | 8 |
| Chefe | Colosso Micélio | 68 | 4 | 9 |
| Chefe protegido | Sentinela Corrompida | 86 | 5 | 9 |
| Cerrado | Serpente-Tempestade | 82 | 4 | 10 |
| Elduran | Golem de Areia | 105 | 6 | 12 |

O Golem de Granito mantém seu comportamento prévio de espelhar/elevar atributos do jogador; evitar Defesa multiplicada por dezenas de pontos reduz travamentos nessa luta. Os **15 encontros de Astravél** preservam a ordem e missões; os níveis recomendados passam a 1–6. Câmaras Fúngicas seguem com quatro salas, ondas, guardiões e invocações originais.

**Alcance:** a maior dificuldade foi projetada para a vertical slice atual. O conteúdo de Tier V/nível 13 deve passar por avaliação de inimigos e progressão futura — não é canon fechado.

## 5. Regressões e simulações

- Confirma 120 ofertas Tier I sem locks de Clã/Classe e nenhuma oferta duplicada por *slot + par de status*.
- Confirma 10 papéis distintos por conjunto, mantendo **todos os IDs**; testes de duas melhorias de forja.
- Confirma bônus de combate reais, armadura simples sem duplicar Defesa, equipamento complementar, HUD, compatibilidade de save e bloqueios de comércio.
- Exercita o motor de estados real com ataques em inimigos, minichefes e chefes (`balanceScenariosV05152.test.ts`).
- Executar `npm run check` pela workflow isolada `balance-draft-v05152.yml`, sem PR nem deploy.

## Decisões em aberto

`OWNER_DECISION`: valores finais após avaliação em jogo com builds de equipamento completo; economia e progressão de aquisição dos Tiers comuns II–V; futuras resistências e atributos; requisitos e materiais de forja; aprovação de PvE no nível 13+. Até decisão do proprietário, todos os números desta revisão são **`BALANCE_DRAFT`**.

**Regra operacional:** não abrir PR para `main`, não fazer merge nem criar deploy da Vercel nesta fase.
