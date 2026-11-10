# Terrúnia v0.5.15.2 — Balanceamento de Neris e linhas exclusivas

**Estado:** `BALANCE_DRAFT` / revisão funcional — **NÃO publicar, NÃO integrar na main**.
**Autoridade:** `TERRUNIA_GAME_APP_MASTER_SPEC_v0.4.md` + decisão explícita de diversificar atributos de Neris sem requisitos de Clã/Classe.
**Branch de trabalho:** `balance/v0.5.15.2-neris-gear-stats-draft`.

## Problema corrigido

A v0.5.15.1 tinha 12 conjuntos comuns Tier I em Neris, mas quase todos davam a mesma sequência de Vida, Mana, Defesa, Ataque universal e Iniciativa. Nomes e paletas diferentes não se traduziam em escolhas úteis.

A v0.5.15.2 mantém os **mesmos 120 SKUs comerciais comuns** (12 perfis × 10 peças), mas distribui bônus distintos **principal + secundário** por item e perfis de uso real. **Não remove IDs**, não altera o tipo de Vínculo e não invalida saves existentes. Como os bônus são dados do catálogo, os atributos de peças já adquiridas se atualizam ao carregar a nova versão.

## Status realmente suportados

| Status do equipamento | Aplicação |
|---|---|
| Vida (`maxHp`) | Vida máxima derivada |
| Mana (`maxMp`) | Mana máxima derivada |
| Ataque geral (`attackPower`) | Bônus em ataques físicos e mágicos; valor ajustado para 75% da força de especialização |
| Ataque físico (`physicalAttack`) | Ataque físico derivado; contribui para o dano primário quando o Vínculo de arma é físico |
| Ataque mágico (`magicalAttack`) | Ataque mágico derivado; contribui para o dano primário quando o Vínculo de arma é mágico |
| Defesa (`mitigation`) | Mitigação real no combate |
| Iniciativa (`initiative`) | Valor da ordem dos turnos |

**Não introduz** evasão, crítico por item, precisão, regeneração de Mana ou Resistências elementais ainda não definidas. Os dados d4–d12 de Força, Vigor, Astúcia, Agilidade e Espírito **não são alterados por roupas ou revestimentos**.

## Doze especialidades neutras de Neris

Estes **não são nomes de Classe nem pré-requisitos**. A antiga chave de catálogo `recommendedClassId` é mantida somente por compatibilidade dos IDs de saves.

| Perfil do comércio | Arma — bônus principal | Arma — bônus secundário | Papel |
|---|---|---|---|
| Guarda | Ataque físico | Defesa | combate seguro |
| Vanguarda | Ataque físico | Vida | agressão resistente |
| Agilidade | Ataque físico | Iniciativa | prioridade de turno |
| Versatilidade | Ataque geral | Defesa | arma física ou mágica |
| Proteção arcana | Ataque mágico | Defesa | magia com proteção |
| Magia veloz | Ataque mágico | Iniciativa | ofensiva mágica antecipada |
| Conjurador | Ataque mágico | Mana | sustentação de habilidades |
| Mago resistente | Ataque mágico | Vida | sobrevivência de conjurador |
| Caçador | Ataque físico | Mana | ataques e habilidades |
| Híbrido arcano | Ataque geral | Mana | rotatividade de recursos |
| Contra-ataque | Ataque geral | Iniciativa | iniciativa com versatilidade |
| Dano híbrido | Ataque mágico | Ataque físico | alternativas de arma |

Cada slot possui função própria: armaduras priorizam Defesa, botas Iniciativa, colares Mana, calças Vida, enquanto armas e acessórios atendem ao foco/especialização. São **12 assinaturas diferentes de arma**, não 12 ícones com o mesmo efeito.

## Valores propostos (BALANCE_DRAFT)

Atributo **principal** utiliza o valor-base do slot/Tier da v0.5.15, com ajustes de canal. Atributo **secundário** tem progressão de Tier independente. Os graus G1, G2 e G3 adicionam +0, +1 e +2 em ambos.

- Comum de Neris: bônus de canal **+0 principal, +0 secundário**.
- Exclusivo do Clã: **+3 principal, +3 secundário**.
- Exclusivo da Classe: **+5 principal, +5 secundário**.
- Quando o principal é `attackPower` (universal), seu valor-base total é arredondado a **75%** antes do aprimoramento, porque beneficia os dois tipos de arma.
- Secundário G1 por Tier I–V: **1 / 4 / 7 / 10 / 13**, antes dos bônus de exclusividade.
- Os itens comercializados são sempre G1. **Durnan** evolui a peça até G3, mantendo o Tier; a evolução dos Vínculos permanentes I–VII permanece separada.
- Preços e custos de forja anteriores são mantidos, sujeitos a balanceamento posterior.

**Exemplo, arma física Tier I G1:**

| Origem | Ataque físico | Bônus secundário |
|---|---:|---:|
| Neris | +3 | +1 |
| Neris após forja G3 | +5 | +3 |
| Castelo do Clã G1 | +6 | +4 |
| Castelo da Classe G1 | +8 | +6 |

As linhas de Clã e Classe possuem uma vantagem mensurável mesmo quando comparadas à peça comum do mesmo Tier já refinada até G3. Os canais ainda são exclusivos, com validação real de Clã, Classe, localização, nível e Ouro.

## Integração

- `equipmentProfilesV05152.ts`: os 12 perfis neutros, os sete status suportados e o mapeamento por slot.
- `equipmentV0515.ts`: dois bônus para cada SKU, três versões de grau, peso do ataque universal e exclusividade.
- `equipmentV0515.ts` (domínio): soma os dois bônus, sem duplicar Defesa da armadura básica.
- `derivedStats.ts`: aplica ataque físico, mágico e universal conforme o Vínculo.
- `GearShopV0515.tsx`: apresenta função neutra e três prévias de status.
- `GearForgeV0515.tsx`: apresenta valores atuais e do próximo Grau.
- `InventoryPanel.tsx`: mostra ambos os bônus na mochila e detalhes.
- `battleEquipment.ts` / `BattleEquipmentHud.tsx`: expõem tipo de ataque e bônus dos revestimentos e dos acessórios no resumo de combate.
- Testes de perfis, progressão de Tier/Grau, personagem, combate, HUD, saves e loja.

## Segurança de progresso

Nenhum Vínculo ou memória é substituído. Não altera aquisição de Clã/Classe, preço/estoque de Neris, níveis, Slots de Vínculo, Skill Tree, moedas ou schema de save. Peças existentes mantêm seu `definitionId`, `instanceId`, `refinementLevel` e os dados persistidos.

## Decisões e QA ainda pendentes

- **OWNER_DECISION:** aprovação numérica final após testes de combate com vários builds, inclusive contra chefes.
- **OWNER_DECISION:** se magia de Classe deve futuramente usar um ataque mágico separado da arma vinculada, em vez do ataque primário atual do combate.
- **OWNER_DECISION:** Resistências, crítico, precisão, esquiva, regeneração, distribuição de pontos via item e outros atributos não devem ser adicionados silenciosamente.
- **BALANCE_DRAFT:** preços e multiplicadores de especialização.
- **PUBLICAÇÃO:** proibida neste estágio. A branch não deve ser integrada à main nem receber deploy de produção sem autorização posterior.

**Critério de aceite:** 12 armas com bônus realmente distintos, cobertura dos 7 canais, G1→G3 com melhora de ambas as propriedades, superiores exclusivos, aplicação real em derivados e HUD, e nenhum reset de save.
