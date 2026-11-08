# Terrúnia v0.5.11 — escopo aprovado de UX, equipamentos, Portal e formação de combate

**Base técnica:** `TERRUNIA_GAME_APP_MASTER_SPEC_v0.4.md`; versão anterior publicada: **v0.5.10.2**.  
**Estado deste documento:** especificação para implementação; não representa gameplay já publicado.  
**Diretriz:** modificar apresentação e operações dos sistemas existentes sem reescrever ou ampliar silenciosamente o canon dos cinco equipamentos vinculados.

## 1. Cabeçalho e minimapa

- Retirar os controles atuais **Salvo / livro / Menu** que ocupam a faixa superior direita sobre o personagem.
- Exibir **um único botão de três traços (hambúrguer)**, posicionado no extremo superior direito, para abrir o menu geral.
- Não perder o estado de salvamento: continuar salvando e informando o status dentro do menu geral, sem controles duplicados.
- Remover **Menu / Local** da frente do minimapa. O minimapa permanece legível e funcional, sem obstruções.

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

## 6. Critérios de aceite da v0.5.11

- Apenas **um botão hambúrguer** à direita no topo, sem Menu/Local cobrindo minimapa.
- Botão **Equipamentos** abaixo do retrato alterna entre barras e grade; slots vazios exibem placeholder, com itens equipáveis sem afetar os cinco vinculados.
- Ícones de missão **à esquerda da plaqueta**; estados **abaixo da plaqueta**, sem colisões.
- Portal abre todas as escolhas **na própria Praça do Portal** sem navegação duplicada.
- Inimigos ficam **distribuídos para a direita em profundidade**, primeiro alinhado aos pés do jogador, sem sobreposição nem cortes de tela.
- Testes unitários de formação e slots; Playwright E2E para responsividade, NPCs, portal, combate e save; lint, types, build e testes do domínio aprovados.
- Documentar decisões ainda não canonizadas como `OWNER_DECISION`, apenas no código e na documentação — nunca exibi-las para o jogador.

**Não confundir registro de escopo com implementação:** é necessário um PR de código e QA antes de incorporar esta versão à `main`.
