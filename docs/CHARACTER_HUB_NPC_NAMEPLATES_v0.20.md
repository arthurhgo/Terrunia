# Terrúnia — Personagem unificado e plaquetas de NPCs v0.20

Data: 2026-11-03. Autoridade: `TERRUNIA_GAME_APP_MASTER_SPEC_v0.4.md`. Mudança de organização UI; nenhuma regra de Clã, Classe, Vínculos, combate, inventário ou save é alterada.

## Menu: um único destino Personagem

Antes: três entradas equivalentes (`/nexus`, `/character` e `/inventory`) exibiam telas que repetiam identidade, níveis, Clã/Classe, status e Vínculos. Agora há somente **Personagem** na navegação. O endereço canônico é `/nexus`. Links antigos `/character` e `/inventory` redirecionam para ele em vez de expor telas duplicadas.

A página consolida:
- **Status**: identidade, XP, nível, Clã, Classe, atributos, pontos, stats derivados e Essência, usando `NexusOverview` uma vez.
- **Itens equipados**: os cinco slots do personagem, incluindo proteção simples temporária no slot da armadura sem transformá-la em Vínculo. Ações de retirada e evolução permanecem.
- **Mochila**: apenas itens não equipados, ação Equipar, informações do item no hover, comércio e conversão permanecem em seus contextos.
- **Histórico e memórias**: dados anteriormente exclusivos da ficha de Personagem continuam disponíveis em uma seção recolhível, não competindo com as ações cotidianas.

Uma pequena navegação interna usa âncoras Status / Itens / Mochila / Histórico na **mesma tela**, e não multiplica páginas.

## Inventário da cidade

O botão **Inventário** em Terran continua abrindo a mochila no painel lateral. Removemos o segundo painel de Vínculos e a linha “No que estou me tornando” (bem como o resumo de ressonância duplicado). Equipamentos estão acessíveis no menu Personagem; a mochila não replica os cinco slots. A `BoundItemsPanel` foi mantida apenas onde o contexto é equipamentos e seu título tornou-se **Itens equipados**.

## NPCs nas ruas e dentro das casas

O componente único `NpcNameplate` continua servindo o mundo externo e interiores, com duas linhas visuais: **Nome** em dourado, **Título/Função** diretamente abaixo em corpo menor, itálico e cinza claro. Exemplo:
- Rosetta
- *Guardiã do Portal*

A fonte dos textos é sempre `NPCDefinition.title`, quando há NPC cadastrado, ou `TerranNpcPresence.roleLabel` caso contrário, sem inventar títulos. A plaqueta pode expandir até 230px para reduzir cortes de funções longas; os marcadores de missões continuam acima dela. O painel lateral de moradores usa a mesma função para evitar nomes e profissões contraditórios.

## Compatibilidade e limites

- Save schema 17, status, itens, Vínculos, progressão e diálogos permanecem intactos.
- A Skill Tree é uma tela independente (`/menu`) e a seção Nexo da árvore não foi removida.
- Rotas antigas podem ser acessadas por links já existentes, mas redirecionam para Personagem.
- Testes: menu com uma entrada, página única sem status duplicado, equipamento vestido uma vez, histórico recolhível, títulos de NPCs de rua e interior, mochila lateral sem Vínculos redundantes.
- Revisão real no navegador, incluindo áreas com NPCs próximos, é uma verificação visual adicional e não deve ser presumida pelo CI.
