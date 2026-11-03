# Terrúnia — interior de casas, itens vestidos e identificação dos NPCs (v0.18)

Data: 2026-11-03. Referência principal: `TERRUNIA_GAME_APP_MASTER_SPEC_v0.4.md`. Ajuste de UI / UX sobre os sistemas existentes. **Não cria regras, Clãs, Classes, equipamentos novos, nem altera save schema 16.**

## 1. Equipamento vestido e mochila

- Ao equipar a proteção simples, ela **desaparece apenas da grade "Itens coletados"**, sendo exibida exclusivamente em **Proteção simples equipada** com nome e botão **Retirar**.
- A instância original **permanece em `GameSave.inventory`** e seu `instanceId` permanece em `character.basicArmorInstanceId`, preservando bônus, refinamento, atributos, vínculo de quest e integridade de saves anteriores.
- Clicar **Retirar** limpa o slot e devolve visualmente a peça à grade da mochila. Se o jogador trocar por outra peça, a anterior volta a aparecer no grid.
- Em modos Venda/Conversão, o item vestido não aparece como selecionável. A proteção equipada continua protegida pelas validações do domínio.
- Os **cinco itens vinculados** e seus sete Graus são independentes das proteções simples.

## 2. Rotas de missões continuam no interior

- A aba **Missões** permanece aberta ao entrar/sair de casas. A rota rastreada segue automaticamente na nova cena.
- No interior, uma única missão rastreada desenha linha pontilhada **da posição do personagem até o NPC responsável dentro da sala**. Se o objetivo estiver fora da casa, a linha aponta para a **saída**, sem inventar um NPC interno. Se o objetivo se refere ao serviço da casa, aponta para seu balcão/local cadastrado.
- As linhas são construídas com o **mesmo mapa de colisão** usado pelo personagem, por `findInteriorPath`, evitando atravessar móveis/obstáculos. A geometria se atualiza quando o jogador se move.
- Missões principais: **dourado #EDC87C, 100%**; secundárias e caçadas: **azul claro #A8E6FF, 20%**. A prévia de Rosetta, quando fixada, também continua dentro das casas; prévias secundárias adotam a mesma paleta.
- Marcadores dos NPCs continuam sendo renderizados pelos dados oficiais `getNpcQuestNotice` e `NpcMarker`. O NPC que recebe entrega (`turnInNpcId`) agora também recebe a marca e pode receber a entrega mesmo se for diferente do NPC que ofereceu a missão.
- Objetivos de equipar itens **não geram rota física inventada**.

## 3. Subtítulos dos NPCs

- Abaixo do nome, uma linha **menor, cinza suave e itálica** exibe o título cadastrado (`NPCDefinition.title`) e/ou a função contextual (`TerranNpcPresence.roleLabel`).
- Quando os dois textos são iguais, mostra uma vez. NPCs sem título próprio usam a função presente no local.
- O texto de cada NPC vem somente do catálogo e dos dados da presença. Não acrescentar títulos fictícios silenciosamente. Os ícones `!`, `◇`, `◆`, `?` permanecem acima do nome.

## Testes e limites

- Testes unitários do caminho no interior e dados de NPCs; regressão de UI de mochila/slot e de travessia cidade→casa mantendo rastreamento.
- Interior sem NPC correspondente usa a saída como destino seguro. Rotas de dungeons e outros mundos continuam limitadas ao Portal; waypoints entre instâncias são `OWNER_DECISION`.
- Validar no navegador em viewport pequeno e com movimento real em separado da suíte unitária. A lógica do save e gameplay permanece intacta.
