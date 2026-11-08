# Terrúnia v0.5.12 — implementação de UX/UI e combate

**Base:** v0.5.11 na `main`, especificação-mestre v0.4 e decisões atuais de Terran/Nexo.
**Status:** implementação em branch e pull request #68; somente considerar publicada após CI + E2E e merge.
**Natureza:** refinamento de interface, interação e cadência visual. **Nenhuma regra nova de lore, progressão, dano, itens vinculados, drops ou salvamento.**

## 1. NPCs — etiquetas de missão
- A plaqueta existente conserva nome e cargo do NPC, sem barras horizontais longas.
- O ícone da missão continua externo e à esquerda do nome, como na v0.5.11.
- Etiquetas compactas aparecem à esquerda, visualmente encaixadas atrás da placa, somente nas categorias que têm missões.
- **Principal (dourado):** missões principais, Clã ou Classe oferecidas/disponíveis.
- **Secundária (azul-claro):** secundárias/contratos oferecidos/disponíveis.
- **Aceita (cinza):** missões ativas.
- **Entrega (verde):** missões prontas para entregar ao NPC.
- Contagens provêm exclusivamente do status real de `save.quests` e definições `giverNpcId`/`turnInNpcId`.
- Rosetta preserva a orientação e interações de tutorial; nenhuma missão é aceita automaticamente.

## 2. Cama da Base
- Clique/E aproxima o jogador da cama como antes.
- Ao chegar, mostra `Descansar na cama` com **Descansar** ou **Fechar**.
- Abrir/fechar não recupera Vida/Mana. Somente clicar Descansar invoca o método atual `restAtHome()`.
- A lógica e os valores já existentes de recuperação permanecem intactos.

## 3. Combate — fases visuais
- A engine de domínio continua como fonte de verdade; `submitBattleCommand` só é chamado após toda a fila visual da jogada.
- `focus`: dado entra em foco e mostra a face/resultado. HP confirmado permanece legível; não há ataque, `strikeFx`, número de dano nem mutação visual.
- `impact`: após sair o foco do dado, executar visual de ataque/recebimento, revelar número e aplicar HP encenado na UI.
- Em seguida encerrar VFX e avançar ao próximo dado real; após o último, persistir a resolução do domínio e manter a ordem dos turnos.
- `Voltar` antes de arremessar descarta preview sem gastar Mana, dano, itens ou turno.
- `VISUAL_DRAFT`: cadência da animação usa a configuração compartilhada `BATTLE_PRESENTATION`, sem impacto nas regras de combate.

## 4. Nexo — UI principal
- O botão de Menu da janela imersiva da cidade passa a **27 × 27 px** e fica no canto superior direito do Nexo, substituindo a dimensão anterior de 42 px apenas neste contexto.
- Sob o retrato ficam dois botões verticais: **Equipamentos** (linha única, fonte reduzida) e **Atributos**.
- O painel à direita do retrato compartilha a mesma área entre `status`, `equipment` e `attributes`, sem modal ou tela extra.
- Os atributos exibem dados originais, ataque/defesa e `AttributeAllocator` quando há pontos; os números do save não são recalculados artificialmente.
- O botão ativo retorna a Status. Skill Tree continua independente.

## 5. Aceite e validação
- [ ] CI: lint, TypeScript, Vitest, build verdes no head final.
- [ ] Playwright desktop com navegação, NPCs, cama, batalha e HUD.
- [ ] Na janela da cama, Fechar não muda PV/MP.
- [ ] Dado permanece sozinho em foco; após saída ocorre golpe/HP, sem sobreposição da próxima jogada.
- [ ] Quatro categorias de etiqueta derivadas corretamente, ocultando vazias.
- [ ] Botões Equipamentos/Atributos alternam conteúdos, nenhum atributo distribuído fora da ação explícita.
- [ ] Validar responsividade e ausência de overflow no HUD e NPCs.
- [ ] Mesclar branch reversível e verificar deploy.

**OWNER_DECISION:** nenhuma regra canônica nova. Valores visuais/tempos de transição são configuráveis, não cânon.
