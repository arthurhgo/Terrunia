# Terran — progressão, alojamento e loja v0.1

**Estado:** primeira etapa jogável; `CONTENT_DRAFT`, `BALANCE_DRAFT` e `VISUAL_DRAFT`. Valores e textos podem ser revistos pelo criador.

## Preservação do cânone

- Terran continua com **seis instituições oficiais e a Praça do Portal**. O alojamento é **residência privada**, anexa à região da Casa de Daeryn; não é sétima instituição.
- Os cinco equipamentos vinculados permanecem permanentes. Nenhum produto da loja é equipável.
- `GameSave.quests` permanece fonte única; não existe entrega automática, e o teto de três missões ativas continua.
- NPCs abrem diálogos e serviços no painel lateral da cidade, sem mudar o canvas.

## Primeira cadeia jogável

| Etapa | ID | NPC responsável | Objetivo | Recompensa ao entregar |
|---|---|---|---|---|
| P01 | `vs_astravel_first_contact` | Eldamar | Investigar Astravél e derrotar Fungorro | 20 XP (já existente) |
| P02 | `main_terran_first_home` | Daeryn | Preparar alojamento em sua casa | 30 XP, 10 ouro, `player_home_unlocked` |
| P03 | `main_vorren_bestiary` | Vorren | Consultar livro de campo no Posto | 40 XP, 20 ouro, `bestiary_unlocked` |
| P04 | `main_lithwynn_signs` | Lithwynn | Examinar marca na Oficina | 55 XP, 25 ouro, 40 Essência Bruta |

`P02 → P03 → P04` são liberadas por conclusão explícita da anterior. Os três novos objetivos são interações curtas `CONTENT_DRAFT`; versões futuras podem substituí-las por trilhas, coleta, escolhas e combate sem alterar o estado de missão.

## Casa do Terrírian

- Acesso no HUD por **Alojamento**, inicialmente bloqueado.
- Quando `player_home_unlocked` existe, descansar em Terran (fora de combate) restaura PV e MP aos máximos derivados, gratuitamente.
- Cutscene de conquista `home_claimed`, registrada uma única vez no `eventLog`.
- Interior visualizado por matriz de pixels **20 × 12**, ainda `VISUAL_DRAFT`; posicionamento e colisão da fachada no mapa são etapa futura.
- Estado persistente `GameSave.vitals` com **valores atuais**, sem gravar máximos ou status derivados. Vida e Mana não reiniciam mais entre combates.
- Derrota permite retorno à cidade com 0 PV; Daeryn oferece socorro emergencial parcial e gratuito para evitar *softlock* antes da conquista da casa.
- Status negativos continuam limitados ao combate na versão atual; limpeza de estados persistentes aguarda sistema de aflições de campanha.

## Balcão de Sylwen — Casa de Daeryn

| Item | Preço (`BALANCE_DRAFT`) | Efeito de combate |
|---|---:|---|
| Tônico de Campo | 20 ouro | +8 PV |
| Éter Simples | 18 ouro | +6 MP |
| Antídoto | 16 ouro | Remove efeitos prejudiciais |
| Compressa de Campo | 8 ouro | +4 PV |

Compra só no local, com saldo e quantidade válidos; salvamento automático. O estoque é data-driven e cada produto tem ID e PNG nativo 16×16. Revenda continua sujeita às regras existentes de inventário (`sellable`, proteção, item de missão), sem loja secundária.

## Save v8

- Migração `7→8` inicializa PV/MP pelos máximos derivados ou pelo combate ativo, preservando XP, Clã, Classe, Vínculos e itens.
- Inclui no save antigo as novas missões e relações de NPCs sem recomeçar a campanha.
- A batalha recebe PV/MP do save; a cada comando persiste o estado atual.
- O sistema bloqueia iniciar combate com PV zero; os botões de consumíveis selecionam por instância e respeitam o recurso/estado que o item trata.
- Testes cobrem progressão, loja, recuperação, consumo, migração e vertical slice com descanso entre combates.

## Próximas etapas planejadas — não implementadas nesta entrega

1. P05 Vigília de Zareth: combate, autorização e acesso contextual.
2. P06 Raiz de Astravél e consequências persistentes da derrota do Colosso.
3. P07 Vozes dos Quatro Clãs, preservando o rito de três provas.
4. Missões secundárias de Briana, Torvynn, Sylwen, Draelis, Edran e Kaedin.
5. Contratos de caça repetíveis sem repetir recompensas de encontros únicos.
6. Fachada/caminho pixelado até a casa, baú, upgrades e cutscenes adicionais.

Nenhum desses seis itens foi marcado como jogável nem concede recompensas antecipadas.
