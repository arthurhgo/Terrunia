# Terrúnia — Reconciliação da PR #17 com a main

**29/10/2026 · CONTENT_DRAFT / BALANCE_DRAFT / VISUAL_DRAFT**

A PR #17 foi iniciada antes das PRs #18–#23 e possui **27 commits de defasagem**. Ela não deve ser mesclada diretamente porque reintroduziria o save v8 e interfaces incompatíveis com o save v11 e a Base.

## Funcionalidades já na main antes desta integração
- Combate por turnos em tela separada, personagem em primeiro plano, inimigos, animações de dano e derrota, drops clicáveis.
- Modo Ondas crescente, retorno a Terran, missões secundárias para NPCs, atlas pixel art e sprites substituíveis.
- Saves isolados por conta, Base com baú e descanso, interiores e NPCs de Terran.

## Conteúdo recuperado da PR #17
- **4 monstros inéditos**: Limusco Luminescente, Mariposa do Vazio, Louva-Esporos e Sentinela da Ruína.
- **4 drops/materialidades temporárias**: Gel Luminescente, Pó do Vazio, Quitina de Esporos e Lasca da Ruína. Não substituem os cinco equipamentos vinculados.
- **3 caçadas repetíveis**: Ninho Luminescente, Caçada de Esporos, Vigília da Ruína, disponíveis no Portal após o primeiro Fungorro. Não alteram os nós ou recompensas de história.
- **3 consumíveis especializados**: Frasco de Ressonância (arremessável), Runa de Guarda (proteção temporária), Essência Vital Instável (cura). Disponíveis no balcão de Sylwen como valores BALANCE_DRAFT.
- **Comandos de combate acionáveis** para arremessáveis, runas, essências e magias desbloqueadas; respeitam alvo válido e consomem o item real.
- **Ondas com desafio de chefe a cada 5**, usando a Sentinela da Ruína; o Colosso Micélio da história não é reutilizado e seus fragmentos/joias únicos não podem ser farmados por ondas.
- **Recorde pessoal de ondas**, persistido como campo opcional `world.portalWaveBest` no save v11. Sem reset, sem migração destrutiva.

## Identidade dos assets
Novos IDs em `src/assets/assetRegistry.ts` e `public/assets/manifests/terrunia-sprites-v0.1.json`; quatro PNGs RGBA32 para monstros foram convertidos de concepts visuais existentes na PR #17; sete PNGs RGBA16 para itens reutilizados da mesma branch. São **VISUAL_DRAFT** substituíveis, sem lógica acoplada.

## Decisões pendentes
- **OWNER_DECISION**: stats finais de monstros e consumíveis, frequência dos chefes das ondas, preços, probabilidades de drops, missões adicionais por caçada.
- Não alterar o Grau dos Vínculos, XP por kill fora da regra existente, ou a progressão única por conta.
- O conteúdo recuperado não torna canon definitivo nenhum aspecto `CONTENT_DRAFT`/ `BALANCE_DRAFT`.

A PR #17 deve ser encerrada como **substituída** após a integração e os testes desta reconciliação, preservando seu histórico e sua branch.
