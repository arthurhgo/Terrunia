# Terrúnia v0.5.11 — ESPECIFICAÇÃO CONSOLIDADA DE IMPLEMENTAÇÃO

**Base técnica:** `TERRUNIA_GAME_APP_MASTER_SPEC_v0.4.md`; versão anterior publicada: **v0.5.10.2**.  
**Estado deste documento:** escopo funcional consolidado para execução em PR de código; **não implementado nem publicado**. Os parâmetros não aprovados permanecem explicitamente em `OWNER_DECISION`/`VISUAL_DRAFT`.  
**Diretriz:** modificar apresentação e operações dos sistemas existentes sem reescrever ou ampliar silenciosamente o canon dos cinco equipamentos vinculados.

## 1. Cabeçalho e minimapa

- Retirar os controles atuais **Salvo / livro / Menu** que ocupam a faixa superior direita sobre o personagem.
- Exibir **um único botão de três traços (hambúrguer)**, posicionado no extremo superior direito, para abrir o menu geral.
- Não perder o estado de salvamento: continuar salvando e informando o status dentro do menu geral, sem controles duplicados.
- Remover **Menu / Local** da frente do minimapa de **Terran**. O minimapa **de Terran permanece** legível e funcional. O minimapa **das trilhas**, tratado na seção 7, será removido.

## 2. HUD do personagem e aba Equipamentos

- Abaixo do retrato do jogador, incluir botão **Equipamentos**.
- Ao acionar, substituir a área das barras **Vida / Mana / Essência / XP** por uma grade visual de slots. Retornar ao status deve ser possível na própria aba, sem abrir tela separada ou esconder recursos definitivamente.
- Referência visual: grade de ícones ornamentados e sprite do player adjacente, com slots vazios e placeholders para assets faltantes.
- Slots visuais solicitados: **Capacete, Acessório, Arma, Peitoral/Túnica, Escudo/Protetor, Calça, Bota, Acessório**. Colar e Pulseira existentes devem permanecer acessíveis, sem desaparecer devido à reorganização.
- Os **cinco vinculados centrais** são preservados: Arma, Escudo/Protetor, Armadura, Colar e Pulseira.
- Acrescentar definições data-driven de **capacete, calça, bota e acessórios complementares**, com `id`, `assetId`, placeholders, posição no sprite e equipar/desequipar pela UI e store, sem se tornarem itens vinculados centrais automaticamente.
- **OWNER_DECISION:** quantidade final de slots de acessórios comuns, modo de obtenção, restrições e bônus de combate dos novos itens. Até aprovação, novos bônus não são atribuídos silenciosamente; manter `BALANCE_DRAFT` quando aplicável. Verificar convivência com armadura simples versus armadura vinculada antes de mudar regras de equipamento.

## 3. Marcadores e placar dos NPCs

- Ícone que indica missão/sidequest/entrega deve aparecer **à esquerda do box/plaqueta do NPC**, não sobre o nome e não acima do sprite.
- Indicadores quantitativos ou estado das missões (**para aceitar, secundária, em andamento, pronta para entregar**) devem ocupar **uma linha abaixo da plaqueta**.
- A plaqueta principal contém **nome e função**; nenhum badge deve se sobrepor ao texto. Dimensões e offsets devem ser responsivos aos diversos tamanhos de NPC.
- Reduzir texto redundante; missão ativa permanece visualmente distinta de missão oferecida ou pronta para entrega.

## 4. Portal sem menu intermediário

- Remover o passo **“Escolher destino do Portal” → outra página/menu com atividades** no fluxo da interação com o Portal.
- Mostrar as ações existentes de **jornadas, desafios, caçadas, ondas (quando liberadas), destinos e entradas** diretamente na aba/painel **Praça do Portal** já aberta pela interação.
- Preservar desbloqueios e requisitos reais; entrada na instância ainda exige clique consciente do jogador. A área deve caber no viewport do navegador sem scroll de fluxo principal (detalhes opcionais podem usar expansão contextual).
- Nunca duplicar cards, progresso ou CTA entre a aba local e a tela de seleção antiga. Garantir que saves já existentes mantenham o acesso.

## 5. Combate: formação diagonal escalonada de inimigos — acréscimo solicitado

**Problema observado:** múltiplos inimigos aparecem empilhados na mesma posição ou na mesma linha rígida, com sprites e barras de vida sobrepostos.  
**Referência visual:** exemplo com criaturas distribuídas em profundidade, separadas uma da outra, como RPG clássico de monstros.

### Comportamento desejado

1. O **primeiro inimigo, mais acima na composição**, fica com a **linha de apoio dos pés** alinhada visualmente à linha de apoio do personagem do jogador.
2. Cada inimigo seguinte é distribuído progressivamente **para a direita** e em uma **linha escalonada de profundidade (diagonal)**, não na mesma coordenada X e nem numa fila horizontal rígida.
3. **Nenhum sprite, barra de vida ou marcador de alvo pode se sobrepor** a outro. O posicionamento considera largura/altura do sprite, quantidade de inimigos e espaço útil da arena.
4. Todos permanecem **apoiados no chão da arena**; não usar `translateY` de animação idle que simule levitação para criaturas terrestres.
5. Cada inimigo continua clicável, com barra individual, animação de dano e marcador de alvo destacado. A nova formação **não altera** iniciativa, ordem de turno, hitbox lógica, IA, drops ou máquina de estados.
6. Durante a morte e/ou remoção de inimigos, slots devem preservar identidade estável por `combatant.id`; reposicionamento visual, se existir, não pode trocar os alvos nem causar saltos bruscos.
7. **Responsividade:** compor de 1 a N inimigos em 1366×768, 1920×1080, 1024×768 e 390×844, dentro da arena, com espaçamento mínimo escalável. Quando faltar largura, reduzir escala/espaçamento ou usar formação em grupos, nunca cortar inimigos fora da arena.

### Diretriz de implementação

- Separar **algoritmo visual de formação** da engine de combate, idealmente em módulo puro e testável (`src/ui/battle/enemyFormation.ts`).
- Inputs: índices estáveis, quantidade, dimensão útil da arena e dimensões visuais dos combatentes.
- Outputs: `x`, `groundY`, `zIndex` e escala visual. O primeiro combatente ancora no piso alinhado ao jogador; os demais usam incrementos para a direita e deslocamentos de profundidade, com clamp ao espaço.
- `VISUAL_DRAFT`: valores concretos de espaçamento, escala e limites de ocupação são ajustes artísticos, **não** regras de mundo/canon.
- Conferir layout com **1, 2, 3, 4 e 5 inimigos**, incluindo sprites com proporções diferentes; evitar repetição do empilhamento visto na primeira captura.
- Referências do usuário: captura 1 (empilhamento indesejado) e captura 2 (disposição escalonada desejada).

## 6. Combate — HP legível, barras maiores e valor numérico

**Problema comprovado no código:** a v0.5.10.2 aplica `filter: blur(3px)` ao texto de `.pixel-battle__meter > span` em `battleCinematic.css` durante `.pixel-battle--dice-pending`, e `filter: blur(4px)` ao texto em `.pixel-battle__stats label span` em `battleRemake.css`. Há também redução de opacidade do preenchimento durante a rolagem.

**Regra de interface:**

- Remover o desfoque de **Vida e Mana do personagem**, da **Vida do alvo** e das informações numéricas de **todos os inimigos**. Números e rótulos permanecem legíveis em `AwaitingInitiative`, `AwaitingAction` e `dice-pending`.
- **Não revelar HP previsto** antes de o dado resolver. Mostrar continuamente o último valor **confirmado no save** até a máquina de estados finalizar a ação e, então, atualizar o HP visível. Retirar o blur não autoriza antecipar dano ou curas do preview.
- Aumentar a largura/altura úteis da barra **sobre cada monstro na arena** (`.pixel-battle__enemy-bar`) e renderizar **HP atual / HP máximo dentro dela**, com contraste, contorno e fonte pixel legível. Não se limitar à barra do painel **ALVO**.
- A barra do **ALVO** deve continuar mostrando `HP atual / máximo`. Alvo destacado, dano crítico, movimento e morte não podem ocultar números, cortar o preenchimento nem confundir valores de monstros distintos.
- Em formações com 1–5 monstros, a barra individual não pode se sobrepor a outro sprite, barra ou marcador; comprimento responsivo e visual proporcional ao monstro.
- Acessibilidade: `role="progressbar"`, `aria-label` por combatente, `aria-valuenow` e `aria-valuemax` corretos. O contraste do texto independe da porcentagem de preenchimento.
- Evitar `backdrop-filter` ou `opacity` de overlays que prejudiquem a legibilidade das barras do combate.

**Critério mensurável:** durante a espera pelo dado, o valor textual fica nítido e estável; após o commit, muda para o valor real. Em cada barra individual, texto como `32 / 45` é visível sem hover.

## 7. Trilhas externas — retirar botão superior e minimapa

**Remover exclusivamente na exploração de biomas/trilhas:**

1. O botão sobreposto `Trilha / 0 Entrada`, renderizado em `ExpeditionScreen.tsx` com a classe `.expedition-game__route-open`.
2. O minimapa `.astravel-minimap` renderizado em `AstravelPixelCanvas.tsx`, incluindo SVG, contorno de viewport e legenda.

**Preservar:**

- Cenário explorável, câmera, WASD/setas, toque, `Seguir objetivo`, interação com marcos, combate, saque, retorno a Terran e estados de progressão.
- Lista/identidade de marcos da trilha, se necessária, em uma superfície já existente (jornal/aba de Missões ou detalhes de objetivo), **sem criar outro botão flutuante ou tela intermediária**.
- **Minimapa de Terran** permanece na cidade. A remoção vale apenas para **Trilhas/Expedições**; não remover minimapa da praça ou mapa do mundo por consequência de um seletor CSS amplo.

**QA:** nas trilhas de Astravél, Cerrado Místico e Deserto de Elduran, os dois overlays somem e os marcos continuam acessíveis sem regressão de navegação ou combate.

## 8. Escopo fechado e limites de implementação

| Sistema | Entrega obrigatória | Não alterar sem decisão explícita |
| --- | --- | --- |
| Cabeçalho | Um único botão hambúrguer à extrema direita; menu geral com ações/salvamento | Não remover persistência de save nem rotas internas válidas |
| Terran/minimapa | Retirar `Menu / Local` que encobre o minimapa; mapa da cidade continua | Não remover o minimapa de Terran |
| HUD | Alternância **Status ↔ Equipamentos** abaixo do retrato; barras à direita do retrato apenas em Status; grade em Equipamentos | Não perder HP, Mana, Essência ou XP do save |
| Equipamentos | Criar suporte data-driven para Capacete, Calça, Bota e Acessórios; placeholders, equipamento/desequipamento, persistência e UI visual em slots | Não substituir os cinco vinculados centrais, nem inventar bônus e economia |
| NPCs | Ícone fora e à **esquerda da plaqueta**; nome/cargo dentro; indicadores de ofertas/ativas/entregas **abaixo da plaqueta** | Não mudar quest status, ids, recompensas ou diálogos |
| Portal | Integrar Jornadas/Desafios, Caçadas, Ondas e destinos no painel da **Praça do Portal** | Não ignorar gates nem iniciar atividades ao simplesmente abrir painel |
| Batalha — formação | Personagens apoiados no chão, primeiro monstro alinhado ao player e demais escalonados em profundidade à direita | Não alterar iniciativa/turnos/IA/dano/drops |
| Batalha — HP | Números de HP sem blur, barra individual maior e numerada em cada monstro | Não expor resultado previsto antes de confirmar o dado |
| Trilhas | Remover botão `Trilha / 0 Entrada` e minimapa da expedição | Não prejudicar navegação, marcos e mapa de Terran |

**Regras de escopo:** fantasia arcana em pixel art, HUD dentro do viewport, sem scroll obrigatório para decisão principal, sem textos internos (`OWNER_DECISION`, `BALANCE_DRAFT`) apresentados ao jogador, sprites substituíveis por `assetRegistry`/IDs. Telas compactas podem trocar duas colunas por abas sobrepostas **sem perder comandos**. A Skill Tree segue independente.

## 9. OWNER_DECISION — decisões pendentes e parâmetros seguros

- **OD-511-01 — Acessórios comuns:** dois slots visuais `Acessório A/B` são a hipótese operacional para corresponder à referência de 8 espaços. Precisam de aprovação para nomenclatura final, exclusividade com Colar/Pulseira e possíveis limites de equipar. Até aprovação, manter a grade visual parametrizada e **sem bônus presumidos**.
- **OD-511-02 — Capacete, Calça e Bota:** categoria complementar, sem criação de sexto vínculo; confirmar aquisição (loja, NPC, crafting, quests), materiais, preços, raridade, restrições de uso, bônus, refinamento e ordem de tutorial. **Não conceder estatísticas arbitrárias.**
- **OD-511-03 — Peitoral/Túnica versus Armadura vinculada:** manter a compatibilidade atual e impedir que uma peça comum substitua a Armadura vinculada permanente. Qualquer regra de substituição, acúmulo ou aparência é decisão separada.
- **OD-511-04 — Organização exata da grade:** proposta de **3 colunas** com 8 células equipáveis e espaço auxiliar; Colar e Pulseira existentes permanecem acessíveis na visão Equipamentos ou em detalhes de vínculo, sem remoção de seus IDs. Layout final ajustável sem migração destrutiva.
- **VISUAL_DRAFT-511-01 — Formação:** offsets, escala relativa, `zIndex`, mínimo entre barras e direção vertical de profundidade são puramente visuais; iterar com screenshots sem converter coordenadas em regras de combate.

**Não bloqueia a preparação da UI:** todos os slots podem existir como placeholders data-driven enquanto bônus, economia e regras de progressão aguardam decisão. **Bloqueia efeitos não autorizados:** nenhum novo item recebe poder, status, drop ou requisito inventado para parecer funcional.

## 10. Ordem de implementação e arquivos impactados

**Fase 0 — Baseline e segurança**
- Confirmar `main` da v0.5.10.2, CI/Playwright green e branch reversível; fotografar os estados atuais do HUD, Portal, combate e NPCs.
- Mapear dependências em `src/domain/game/types.ts`, `src/state/gameStore.ts`, `src/content/items.ts` e `src/assets/assetRegistry`. Persistência deve migrar saves existentes sem zerar equipamentos/atributos.

**Fase 1 — Legibilidade e combate (prioridade alta)**
- HP sem blur: `src/ui/screens/battleRemake.css`, `battleCinematic.css`, `BattleScreen.tsx`; manter último valor consolidado.
- Formação: `BattleScreen.tsx` e estilos da arena; criar módulo puro de apresentação `src/ui/battle/enemyFormation.ts` e testes. Barra individual larga/numerada, sem colisão.
- Validar 1–5 inimigos e resolução real do dado. Nada de alterações à engine.

**Fase 2 — Cabeçalho, HUD e equipamento**
- `src/ui/components/GameShell.tsx`, `src/ui/screens/TerranScreen.tsx`, `src/ui/terran/TerranCharacterHud.tsx`, CSS responsivo.
- Componente `EquipmentGrid` com slots por ID; conteúdos em `src/content/items.ts`, regras complementares no domínio + store, `assetRegistry` e fallback. Expor colar/pulseira sem duplicar vínculo.

**Fase 3 — NPCs e Portal**
- `src/ui/terran/NpcNameplate.tsx`, `NpcMarker.tsx`, `npcNameplate.css` e presença na cidade/interiores.
- `src/ui/dashboard/PortalPanel.tsx`, `src/ui/screens/TerranScreen.tsx` e lógica de `getPortalActivities` já existente. Transformar `PortalHubScreen` em rota compatível/redirecionamento seguro, em vez de manter segundo fluxo visual.

**Fase 4 — Trilhas**
- `src/ui/screens/ExpeditionScreen.tsx`: retirar botão da rota sobreposto.
- `src/ui/expedition/AstravelPixelCanvas.tsx`: retirar minimapa de trilhas, respeitando outras biomas. `expeditionStatusHud.css` e CSS relacionado: eliminar regras mortas.
- Confirmar acesso a objetivo/marcos via recursos existentes sem recriar overlays.

**Fase 5 — QA, documentação e integração**
- Testes unitários de slots, migrador/save, formação e HP. E2E de menu, NPC, equipamentos, Portal, trilha e combate; lint, typecheck e build.
- Commits pequenos por subsistema; um PR de implementação rastreável; merge `main` apenas após CI + Playwright verde, com deploy Vercel confirmado.

## 11. Checklist de aceitação final

- [ ] **1366×768 / 1920×1080 / 1024×768 / 390×844:** sem elementos cortados, sem overflow horizontal e sem scroll obrigatório em ações principais.
- [ ] Topo direito contém **um** botão hambúrguer; menu geral abre, permite navegar e consultar salvamento; `Menu / Local` não aparece sobre o minimapa de Terran.
- [ ] Botão **Equipamentos** logo abaixo do retrato alterna por clique/teclado entre quatro barras visíveis e uma grade de oito espaços; slots vazios legíveis; Colar/Pulseira sempre acessíveis.
- [ ] Novos equipamentos mantêm IDs/ícones/fallbacks e podem ser equipados/desequipados com save persistente, sem estatísticas fictícias ou alteração dos cinco vínculos.
- [ ] Marcador de missão aparece **fora, à esquerda do box** de cada NPC, e contagens/estados **abaixo**; sem texto encoberto em NPCs próximos.
- [ ] Painel **Praça do Portal** oferece todas as atividades liberadas e bloqueadas com requisitos claros, sem abrir segunda página; escolha não inicia automaticamente a instância.
- [ ] Na arena, 1–5 inimigos terrestres ficam no chão, em escalonamento à direita, o primeiro alinhado com o player, sem imagens/barras/seleções sobrepostas.
- [ ] Vida do jogador, Mana, vida do alvo e HP `atual/máximo` sobre cada monstro permanecem **nítidos mesmo aguardando dado**. Preview não vaza dano antes da resolução.
- [ ] Nas três trilhas, **não existe** `Trilha / 0 Entrada` nem minimapa de expedição; movimento, seguimento de objetivo, combate e retorno continuam funcionando.
- [ ] NPCs, quests, progresso, saves antigos, itens vinculados, drops e Skill Tree não sofrem regressões.
- [ ] `npm run check` e Playwright completos aprovados; QA visual e deploy de produção confirmados após merge.

---

**Referência visual prioritária:** capturas do proprietário de 2026-11-08 (HUD/menu/equipamentos/NPC/Portal, formação dos monstros, barras HP embaçadas e minimapa de trilha).  
**Regra de publicação:** este arquivo fecha o **escopo**, não constitui implementação; registrar alterações no PR de código e documentar pendências após QA.
