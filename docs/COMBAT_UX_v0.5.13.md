# TERRÚNIA v0.5.13 — Habilidades e iniciativa

**Base:** `main` em `ca40977d` (v0.5.12.1). Implementação na branch `feat/combat-ux-v0.5.13`.

## Escopo implementado
- Iniciativa numérica revelada somente após a animação individual do dado (face/total vindos da prévia determinística do motor). Retratos não exibem números nem texto acessível antecipado. Ordem reordena quando o comando efetivo conclui.
- Título `locationLabel: name` em linha única com truncamento responsivo; exemplo `Raízes da Ruína: Galeria de Micélio`.
- Cards de habilidades e magias em proporção 1:1 com ícones cadastrados, custo MP, dado real e dano estimado para o alvo atual.
- Tooltip acessível com descrição do catálogo, dado, dano, cura/status, cooldown total/restante e ação contextual.
- Cooldown visual por setores radiais com relógio e turnos restantes, sem timers de gameplay: apenas o motor modifica `skillCooldowns`.
- 28 ícones PNG RGBA nativos 16×16 (fontes SVG editáveis em pixel-grid 32×32), individuais e substituíveis; nenhum nome embutido nas imagens, sem alteração de balanceamento.

## Regras preservadas
- V0.5.12: dano, animação e HP somente quando o dado sai do foco.
- `calculateRolledDamage`, `selectDamageDie` e RNG do motor determinam dados e dano.
- `cooldownTurns` dos arquivos existentes preservado; valor mockup não vira regra.
- Save schema inalterado. Ícones são apresentação por `assetRegistry`, não objetos de inventário.

## Assets
Caminhos: `public/assets/skills/skill_*.png` com fontes SVG homônimas, IDs `skill.skill_*`.
Substituição de arte: atualizar `path` no `assetRegistry` para PNG transparente na grade nativa de 16×16 e manter ID.
Fallback: `public/assets/placeholders/skill.svg`.

## Verificações
`npm run check` (lint, typecheck, Vitest e build), Playwright/CI. Validar manualmente rolagem, mouse, teclado, toque e viewport pequeno.

## OWNER_DECISION (não alterou regra)
- Aprovar versão artística final dos 28 sprites ou substituí-los por PNGs feitos manualmente.
- Se deseja exibir *dano bruto* além do dano líquido estimado, decidir em atualização posterior.
- Tamanho definitivo dos cards por breakpoint após teste visual no app real.
