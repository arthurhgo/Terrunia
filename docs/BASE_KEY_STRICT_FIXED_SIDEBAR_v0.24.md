# Terrúnia v0.24 — Base com chave obrigatória e HUD lateral permanente

Atualizado: 2026-11-03. Autoridade técnica: `TERRUNIA_GAME_APP_MASTER_SPEC_v0.4.md`. Este ajuste corrige a entrada indevida em saves migrados e a organização da interface de Terran, sem alterar atributos, Vínculos ou a progressão de Essência.

## Porta da Base — bloqueio real

**Causa:** a migração anterior reconhecia a porta como aberta quando um save estava dentro da Base com a missão concluída, mesmo sem ter usado a Chave de Daeryn. Isso permitia entrar novamente sem a chave.

**Regra efetiva:**
- A missão `main_terran_first_home` concluída entrega a **Chave de Daeryn** à mochila. A conclusão isolada **não** libera a Base.
- Para abrir pela primeira vez, o player precisa chegar à porta e confirmar **Usar chave na porta** com a instância real na mochila.
- O motor consome a chave, registra `DaerynKeyUsedOnHomeDoor` e grava as flags `player_home_door_opened` e `player_home_key_used`, na mesma transação de entrada.
- Entradas posteriores continuam livres somente **após** o primeiro uso da chave. A consumição da chave não obriga reaquisição para cada entrada.
- A validação de `enterPlayerBase` exige missão concluída e as duas marcas de abertura; não abre apenas por estar na localização `location_terran_base`.
- Na migração de saves, a única prova confiável para reconciliar o desbloqueio é o evento `DaerynKeyUsedOnHomeDoor`. Marcas antigas `player_home_door_opened` e `LegacyHomeDoorRecognized` sem esse evento não autorizam acesso.
- Se um save legado está dentro da Base sem a prova, o personagem retorna à Praça do Portal; caso a missão esteja concluída, recebe ou recupera a chave na mochila, sem apagar progresso, materiais, ouro ou equipamentos.
- Se a chave já foi usada de verdade e o evento existe, o carregamento restaura as marcas atuais sem criar chaves duplicadas.
- Antes da primeira abertura, derrotas continuam reaparecendo na Praça, fora da Base.

O schema persistente segue v17; as migrações não introduzem um estado fictício de missão concluída.

## Organização fixa à esquerda de Terran

A navegação lateral de quatro botões (Local / Inventário / Missões / Menu) foi removida. **Menu e Local seguem acessíveis pelo Menu superior**. No espaço esquerdo há uma única coluna, sempre visível, dividida verticalmente:

**Parte superior: MISSÕES**
- um card principal e um secundário (ou outro tipo opcional caso não haja secundária), com status e próximo objetivo;
- botões para rastrear/remover rastreamento, mantendo as rotas dourada e azul no mundo e nos interiores;
- paginação para outras missões sem criar barra de rolagem;
- link para o Diário completo (`/quests`) no menu principal.

**Parte inferior: MOCHILA**
- itens realmente não equipados, sem o painel duplicado `No que estou me tornando`, sem `Itens Vinculados` ou barra de `Ressonância`;
- 12 slots por página com filtro, paginação e tooltip de status por hover;
- armadura simples equipada permanece fora da mochila; ação Equipar continua acessível;
- sem rolagem na lateral, nem efeitos no save ao apenas inspecionar.

**Painéis contextuais** de NPC/loja/forja e baú permanecem abrindo por cima do dock enquanto estão ativos, sem criar rotas falsas nem remover os itens da mochila.

## Critérios de validação

Testes de domínio: tentativa de abrir sem chave, migração com falso unlock, migração com uso comprovado, entrega de Daeryn e uso único da chave, reentrada após abertura.
Testes de UI: dock sempre renderizado, Missões sobre Inventário, ausência de quatro abas redundantes, não repetir Vínculos/Ressonância, rastreamento no exterior e interiores, paginação para 13+ itens.

`npm run check`: lint, typecheck, Vitest e build. Verificação visual em resoluções reais e confirmação do deploy devem ser feitas separadamente.
