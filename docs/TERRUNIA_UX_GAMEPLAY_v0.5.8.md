# Terrúnia v0.5.8 — iniciativa, mochila, progressão e forja

**Status:** implementação experimental em branch isolada; não publicada. **Base:** release v0.5.7 `455e710`.
**Autoridade:** `AGENTS.md`, MASTER SPEC v0.4 e decisões canônicas mais recentes.

## Combate e timeline

- A iniciativa do domínio determina `initiativeOrder` por total decrescente, com desempate estável. O personagem rola seu dado visualmente antes dos inimigos, **sem receber prioridade de ataque por essa animação**.
- A rolagem usa PRNG determinístico por batalha, com semente derivada do UUID da batalha em vez de fixa para todos os encontros. Isso mantém replay/save/preview coerentes e varia de um encontro a outro. Não é um RNG criptográfico para resultados de combate.
- A timeline identifica o combatente em ação com seta vermelha e etiqueta `VEZ`. O ator recebe destaque dourado, o alvo real destaque vermelho. Dados e resultados vêm do log do motor, com `roll.targetId` opcional para saves legados.
- Os impactos são exibidos progressivamente sobre HP de apresentação, com número de dano antes do próximo lançamento. Mortes são mostradas antes da próxima ação. O motor ainda resolve transições de domínio atomicamente; a apresentação reproduz o mesmo log em etapas sem criar sorteios adicionais.
- Selecionar ataque/habilidade abre opções e mantém `VOLTAR`. O comando executa com `ATACAR`/`USAR HABILIDADE`, sem o texto redundante `CONFIRMAR AÇÃO`. Resultados e durações da apresentação são `VISUAL_DRAFT`.
- Empates, ritmo em dispositivos lentos, efeitos sem rolagem de dano e timing definitivo: `OWNER_DECISION`.

## Portal e equipamentos na cidade

- Cada acesso de Terran à trilha de Astravél define `currentLocationId='astravel_entry'`, inclusive ao reentrar. Marcos, missões e vitórias anteriores não são resetados.
- No canvas de Terran e retrato lateral o Vínculo de Arma aparece guardado nas costas. Em combate o personagem continua empunhando a mesma arma. Visual sem efeitos de gameplay.
- O painel direito PERSONAGEM contém Mochila expansível, capacidade real, equipamento, opção de desequipar proteção simples e investimentos em atributos. Arma, escudo, colar, pulseira e armadura **vinculados permanecem permanentes**, sem equip/unequip arbitrário. A troca de outros tipos dependerá de aprovação específica `OWNER_DECISION`.

## Atributos

- A criação mantém 6 pontos disponíveis; os atributos d4/d6/d8/d10/d12 seguem o cânone técnico. Cada clique consome **1 ponto**. Exemplo d4, após 1 ponto exibe d4+1, após segundo exibe d6.
- O ponto intermediário integra o score efetivo. Ao retirar pontos antes do primeiro Vínculo, o investimento retorna um por vez. Após Vínculo, não é possível reembolsar, mas é possível investir pontos novos.
- `attributePointsPerLevel=1` por decisão do criador, substituindo o draft 2/nivel da v0.5.7. Os Pontos de Essência permanecem sistema distinto.

## Mercado e Ferreiro

- Mercado mostra estoque, preço em Ouro, hover com propriedades e, para armaduras simples, diferença de Defesa/Iniciativa diante da peça de preparação equipada. A compra real continua pelo sistema de NPC/Gold e não cria Vínculos substitutos.
- Durnan possui melhorias premium consumindo Ouro, associadas ao **mesmo** item vinculado. Serviços não empilham nem concedem um novo Grau. Seus bônus entram na derivação de stats, geram Memória e preservam o equipamento permanente.
- Preços e bônus premium, definidos em `src/content/forge.ts`, são **BALANCE_DRAFT**. Slots vinculados ainda não adquiridos permanecem inelegíveis.

## Restrições

- Sem novas classes/clãs, trocas ou slots. Assets futuros usam ids configuráveis.
- Os saves existentes aceitam o `targetId` opcional sem migração de schema.
- Revisar UX com mouse/teclado/mobile, e validar CI integral antes do merge.
