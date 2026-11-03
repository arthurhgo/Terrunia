# Terrúnia — Combate, iniciativa e espólios v0.17

Atualizado em 2026-11-03. Base de autoridade: `TERRUNIA_GAME_APP_MASTER_SPEC_v0.4.md`. Escopo: ajustes de interface, comunicação de turnos e inventário de drops, sem introduzir novas regras de dano, iniciativa, Classe ou Vínculos.

## Problema corrigido
A batalha estava configurada com altura mínima de 900px dentro do `GameShell` imersivo e do `world-scene` com `overflow: hidden`. Em monitores menores, o painel inferior de ações ficava recortado. A nova apresentação ocupa **100% da altura disponível**, reserva espaço para o rodapé e permite rolagem apenas nos painéis necessários, sem esconder os botões. Em telas pequenas, a própria cena pode rolar.

## Comandos
O bloco central tem uma ação principal **Ataque · Magias · Habilidades** que abre a mesma lista para o ataque básico (0 MP), habilidades e magias realmente desbloqueadas. Suas habilidades são lidas do combatente, e a classificação textual magia/habilidade é baseada na convenção preexistente de IDs (`VISUAL_DRAFT`), não cria skills novas.

Botões de arremessáveis, runas, essências e poções **só ficam ativos quando existir um item de uso efetivo**, considerando efeitos, vida/mana atuais e status. Outras ações ficam cinza e indisponíveis. **Fugir** é exibido em cinza porque a própria máquina de combate ainda responde `FLEE_NOT_IMPLEMENTED`. Não simular funcionalidade inexistente. Defender e ataque básico ficam ativos no turno do jogador.

## Turno e iniciativa
A máquina de estados existente em `src/domain/combat/engine.ts` continua sendo a autoridade. A ordem dos atores já é calculada por iniciativa, em ordem decrescente, com desempate estável por ID. A interface passa a exibir o valor numérico em cada ícone, sinalizar o combatente atual e anunciar o começo do turno; cada início de turno é registrado no log (`system`). IA continua resolvida pelo domínio, não por temporizadores React. O banner não altera a duração nem a ordem de turnos. Respeita `reducedMotion`.

## Espólios: coleta única e empilhamento
Ao vencer, a apresentação agrupa itens repetidos como `Núcleo Fúngico ×2`, sem seleção individual. O botão **Recolher todos os espólios** executa uma única transação de recompensa no store, com a validação de vitória e `claimed` preexistentes, prevenindo resgate duplicado.

`addBattleLootToInventory` agrupa recursos fungíveis de mesmo `definitionId` e raridade em pilhas anteriores **desbloqueadas, não favoritas e sem refino**, ou cria uma nova pilha. Categorias empilháveis: drop, material, fragmento, joia, consumível, comércio. Equipamentos simples, itens de missão e lore continuam separados para preservar individualidade. O `instanceId` original de uma pilha é preservado; o inventário anterior não é mutado. Ritos e consumos existentes operam pela quantidade da pilha, sem perder o excedente. XP/Ouro/objetivos de coleta continuam proporcionais à quantidade real de drops, independentemente do número de slots exibidos.

## Cobertura e limites
Testes validam: empilhamento em pilha antiga, materiais com repetição, bloqueios de itens únicos, menu de combate e botões cinza, anúncio de iniciativa e coleta em um único clique. Sem alteração do schema do save ou do sistema de Vínculos.

**OWNER_DECISION:** eventual fórmula nova de iniciativa, tempos de animação dos turnos inimigos e mecânica real de fuga; esta entrega não inventa regras. O layout em navegador real/Playwright e deploy Vercel exigem verificação separada.
