# Nexo e Quest Journal — direção oficial

**Status:** decisão do criador aprovada em 2026-08-12, com capacidade, diálogos, marcadores, tutorial e organização dos painéis atualizados pelo criador em 2026-10-30 (v0.13). Prevalece sobre interpretações anteriores no domínio de Nexo, Personagem e missões.

## Nexo

`/nexus` é a visão própria dos status do personagem, separada do Inventário. Deve apresentar:

- retrato, nome, nível, XP, Clã/Rank e Classe/Maestria;
- Astúcia, Agilidade, Força, Vigor e Espírito;
- Vida, Mana, Defesa, Ataque físico e Ataque mágico;
- Essência atual e Pontos de Essência;
- bônus relevantes e, quando possível, a origem dos atributos derivados;
- exatamente Arma, Escudo/Protetor, Armadura, Colar e Pulseira.

Os cinco Vínculos são permanentes. Não adicionar slots tradicionais substituíveis.

## Inventário — decisão posterior de 2026-10-30, v0.12

O painel da cidade e `/inventory` se chamam **Inventário**. A **Mochila** é a primeira caixa, seguida pelos cinco Vínculos. Não repetir os status do Nexo nessa área. Eles continuam disponíveis no HUD permanente e na rota própria `/nexus`; abrir o inventário não deve exigir passar pela ficha do personagem.

## Personagem

`/character` é ficha detalhada e histórico, não uma cópia do Nexo. Contém identidade, progressão geral, títulos, Memórias, estatísticas, conquistas e crônica do Terrírian.

## Estado de missão

Fluxo oficial:

```text
LOCKED → AVAILABLE → OFFERED → ACTIVE → READY_TO_TURN_IN → COMPLETED
```

- `OFFERED` ainda não pertence ao Journal.
- somente o clique em **Aceitar missão** transforma `OFFERED` em `ACTIVE`;
- **Agora não** devolve a missão a `AVAILABLE`;
- objetivos completos transformam `ACTIVE` em `READY_TO_TURN_IN`;
- recompensas são aplicadas somente ao concluir a entrega no NPC correto;
- autosave ocorre em todas as transições relevantes.

## Uma única fonte de verdade

`GameSave.quests` é a fonte de verdade. Seletores puros derivam:

- Quest Journal;
- Quest Tracker;
- destino do minimapa;
- estados dos marcadores dos NPCs: `?` vermelho exclusivo de Rosetta; `!` amarelo para ofertas principais, de Clã ou Classe; `◇` azul para ofertas secundárias. Após o aceite, `!` e `◇` ficam **cinza**. Entrega pronta volta ao destaque, com `!` amarelo ou `◆` azul. NPC sem missão disponível, oferecida, ativa ou pronta não recebe marcador. Esta decisão posterior da v0.12 substitui a sinalização colorida de missões em andamento da v0.11.

Quando um NPC tem várias missões, a prioridade é entrega pronta, missão aceita e, depois, nova oferta. Assim, outra oferta não recolore imediatamente o marcador que acabou de ficar cinza. Todas as ofertas continuam acessíveis na conversa. A notificação de aceite também usa tom cinza.

Não criar listas paralelas de missões na UI.

## Journal e Tracker

O Journal apresenta uma missão por linha horizontal de largura inteira, empilhando **Missão principal**, **Secundárias**, Clã, Classe, Caça/Contratos e, por último, Concluídas. A principal tem destaque dourado; entregas prontas vêm primeiro dentro de cada grupo. Filtros ficam numa única faixa horizontal. Objetivos completos, destino e rastreamento abrem por clique, sem duplicar automaticamente o resumo em cada linha.

O seletor de missões de um NPC também usa linhas empilhadas: principal destacada acima das secundárias, seguida das provas de Clã/Classe. Narrativa aparece somente na caixa de fala; objetivos, contagens, materiais e ações de aceite/entrega ficam na área de missão. Escolhas de conversa não aceitam nem concluem missões.

O Tracker exibe apenas missões `ACTIVE` ou `READY_TO_TURN_IN` marcadas como `tracked`. Desativar o Tracker também remove o destaque correspondente do minimapa, sem alterar o estado da missão.

**Decisão posterior v0.13:** a lista de Concluídas inicia recolhida, mostrando apenas título, quantidade e botão para expandir/recolher. O histórico não desaparece e a expansão não muda estado, rastreamento ou recompensa. A regra vale para o painel da cidade e a página de missões.

## Rosetta como tutorial — decisão posterior v0.13

Rosetta ensina equipamento, compra de suprimento, compra/equipamento de armadura simples e primeiro reforço em quatro missões encadeadas. Cada lição exige aceite e entrega explícitos; a seguinte só é oferecida após concluir a anterior. As túnicas e a linha são entregues uma vez, ao aceitar a lição correspondente. Outras missões continuam com seus NPCs responsáveis.

Túnicas e Armadura de Couro Simples entram na Mochila, com seleção e ação Equipar. São proteções comuns de preparação, trocáveis antes do Vínculo permanente da Armadura. Usam o mesmo eixo de armadura, sem adicionar slot; uma peça já vinculada permanece protegida. O reforço +1 de Durnan melhora a peça simples, sem promover Grau ou conceder Pontos de Essência.

Passar o cursor sobre Rosetta ou focá-la pelo teclado exibe caminhos finos dourados até as principais e secundárias realmente disponíveis, oferecidas, em andamento ou prontas para entrega, incluindo as não rastreadas. O destino corresponde à próxima ação: NPC responsável, entrada da instituição, Portal ou jogador/mochila. Rosetta já é a origem para suas próprias ofertas e entregas. A opção de fixar os caminhos pelo diálogo permite o mesmo uso no celular. O hover é leitura e não aceita missões.

## Capacidade global

**Decisão do criador de 2026-10-30:** não há limite de missões simultâneas. Esta direção substitui `MAX_ACTIVE_QUESTS = 3`, inclusive na validação de saves. O Journal mostra a quantidade em andamento, sem denominador nem bloqueio de capacidade. Nenhuma missão deve ser descartada ou substituída automaticamente.

Provas de Clã e Classe usam o mesmo motor, também sem limite de capacidade. Pré-requisitos, aceite explícito e entrega ao NPC correto continuam obrigatórios. As três provas necessárias ao recrutamento de Clã permanecem uma regra independente. Abandono de Main Quest, Clã ou Classe permanece `OWNER_DECISION` e não é oferecido pela interface.

## Encomendas de materiais — decisão de 2026-10-30, v0.11

Sidequests de entrega usam `turnInItems` e objetivos de coleta ligados à mochila atual. Vender, converter, forjar, guardar ou proteger itens recalcula a prontidão. Aceitar uma encomenda reconhece materiais já existentes; eventos cumulativos de coleta não substituem sua posse. A entrega valida e consome quantidades exatas antes de pagar uma única recompensa, respeitando favoritos, itens trancados e componentes reservados à progressão. O quadro da cidade informa ofertas, mas o aceite e a entrega continuam com o NPC.
