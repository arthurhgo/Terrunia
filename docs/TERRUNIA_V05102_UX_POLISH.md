# Terrúnia v0.5.10.2 — apresentação de combate, NPCs e Portal

**Autoridade:** GAME_APP_MASTER_SPEC v0.4 + aprovações do proprietário de 2026-11-07.
**Objetivo:** polimento player-facing, mantendo save, IDs, turnos e regras de Vínculo intactos.

## Combate
- Herói e criaturas não voadoras fixos ao chão no mesmo eixo-base; somente golpes e impactos produzem deslocamento temporário. Corrigido `position: relative` legada no herói.
- Hotbar com oito botões quadrados por função: Ataque, Habilidades, Magias, Defender, Poções, Arremessáveis, Runas e Essências. Ausentes continuam cinzas, sem ação falsa de Fuga.
- Ataque vai diretamente ao dado; habilidades e magias abrem grade de skills com custos/recarga reais. Defesa abre confirmação reversível, sem criar rolagem fictícia.
- Durante o dado preparado para ataque/skill, o botão Voltar descarta o *preview* puro, o timer visual e o estado transitório antes de qualquer commit; não altera HP, MP, turno, drop ou save.
- Vida/Mana do herói e Vida do alvo: número e rótulo dentro da própria barra. Equipamentos e batalha mantêm os cinco slots reais.

## HUD e Terran
- Retrato do player orientado para cima com arma vinculada guardada visível sobre as costas. Quatro barras Vida/Mana/Essência/XP com percentual e valor **dentro**, lado a lado com o sprite.
- Interrogação, exclamação, sidequest e conclusão do NPC formam ícone à esquerda do nome, na mesma plaqueta; nenhum marcador flutuando acima.

## NPCs
- Janela de missão compacta: resumo e até dois objetivos; recompensas em uma linha; Analisar missão opcional abre detalhes dentro da janela.
- Agora não, Aceitar, Entregar e prova ficam em faixa fixa acessível sem rolar o conteúdo padrão.
- Voz e falas integrais continuam acessíveis no tópico **Conversar**; a compactação de cartões não altera o diálogo canônico.
- Mais missões podem ser lidas no seletor; apenas o texto longo opcional expande/rola em área contida.

## Portal e texto público
- Jornada e desafios **à esquerda**, Caçadas do Portal **à direita**, sem seção de capítulos redundantes.
- Mobile mantém as duas categorias acessíveis por abas; nenhum CTA é perdido por overflow.
- Marcadores internos `OWNER_DECISION`, `BALANCE_DRAFT`, `CONTENT_DRAFT` e `VISUAL_DRAFT` permanecem no código/documentação, mas saem de textos de interface; texto técnico da inscrição e do estoque de desenvolvimento removido.

## Verificação
- `npm run check` (lint, types, unit/integration, build).
- `npm run e2e` Playwright (criação → Vínculo → Terran/Portal → exploração/combat → drop/save).
- QA manual recomendado em 1366×768, 1920×1080, 1024×768, 390×844.
- Não ativar drops raros, runas pendentes, regras sem aprovação.
