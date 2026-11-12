# Terrúnia v0.5.16 — seis melhorias na experiência do jogador
Status: UX_DRAFT / QA_DRAFT; PR #80 permanece em draft. Autoridade: TERRUNIA_GAME_APP_MASTER_SPEC_v0.4.md.
1. HUD: orientações contextuais recolhidas, mantendo o próximo passo rastreado e capítulo visíveis.
2. Rota: HUD abre a aba Rota com os 15 marcos reais (1–5, 6–10, 11–15), sem alterar desbloqueios.
3. Vitória: balanço de XP, Ouro, Ressonância, loot e recuperação só após reivindicar espólios; missão entregue separadamente.
4. Rosetta: ajuda para proteção, refino, filiação de Clã e materiais de missões; sem autoaceite.
5. Inventário: prévia de saldo de material após troca, faltas e NPC de entrega; sem consumir por prévia.
6. Balanceamento: auditoria de 15 marcos para pressão de ataque bruta, HP, quantidade de inimigos, XP, Ouro, cura de campo e consumíveis; flags de saltos para revisão. Os testes existentes de builds reais e seeds dos primeiros cinco marcos permanecem. Não rebalancear automaticamente.
OWNER_DECISION: aprovação humana de balanceamento; divergência Colosso Micélio/Sentinela Corrompida e arte final.
Validar CI (lint, TypeScript, Vitest, build), Playwright e 1366×768/1920×1080 antes do merge. Save schema inalterado; não publicar produção sem aprovação.
