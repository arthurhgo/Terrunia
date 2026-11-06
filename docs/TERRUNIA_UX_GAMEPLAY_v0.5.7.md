# Terrúnia v0.5.7 — Gameplay integrado (candidato a release)

**Origem:** branch `feat/gameplay-v0.5.7`, PR #58, baseline `main` v0.5.6 (`82f0099`).
**Status:** implementação em branch isolada; **não considerar publicado** até CI, revisão, merge e verificação do Vercel.
**Canon:** `TERRUNIA_GAME_APP_MASTER_SPEC_v0.4.md`, `AGENTS.md`, `docs/CANON_DECISIONS.md` continuam vigentes. As regras abaixo identificadas como draft não são canon definitivo.

## 1. Dano por face real (BALANCE_DRAFT)

`src/domain/combat/engine.ts` passa a calcular dano com a rolagem determinística que também é usada na animação e no log. Não rola dados de exibição independentes. A fórmula temporária é:

```text
ajuste = face - floor((lados_do_dado + 1) / 2)
dano = max(1, ataque_base + bonus_skill + ajuste - defesa_efetiva - bonus_guarda)
```

O log registra `dN=face`, ajuste, ATQ, bônus da skill, mitigação, proteção e dano evitado; `CombatRoll.damageBreakdown` persiste no save. `BALANCE.combatDieCentered` controla provisoriamente o ajuste. A fórmula final, multiplicadores, críticos e mitigação total são `OWNER_DECISION`.

## 2. Habilidades e cooldown (BALANCE_DRAFT)

`CombatSkillDefinition` suporta `cooldownTurns` e `damageDieSteps` opcionais. Um passo de dado corresponde ao próximo dado do eixo d4→d6→d8→d10→d12, limitado em d12. O estado opcional `skillCooldowns` pertence a cada combatente, é validado/preservado pelo schema e recua ao encerrar o turno próprio. O uso é bloqueado durante cooldown sem consumir Mana nem turno. Números atuais de cada skill são **BALANCE_DRAFT**. Não houve mudança nos gates de Vínculo, Clã e Classe.

## 3. Confirmar/Voltar no combate

Seleção de ataque, skill, item e alvo permanece em estado visual provisório; **CONFIRMAR AÇÃO** inicia prévia determinística, lançamento e commit. **VOLTAR** descarta a escolha sem mutar battle, HP, MP, item ou RNG. `Defender` também é selecionado como rascunho de ação; somente após **CONFIRMAR AÇÃO** o motor aplica mitigação provisória +2, discriminada no registro quando bloqueia dano. **VOLTAR** antes da confirmação não consome o turno. Fuga permanece indisponível como antes.

## 4. XP e atributos (BALANCE_DRAFT / OWNER_DECISION)

`characterCreationAttributePoints=6`, custo por avanço de dado `=2`, e d4→d6→d8→d10→d12 mantidos. Alterações provisórias:
- `attributePointsPerLevel=2` (antes 1)
- `xpThresholds=[0,180,540,1080,1800,2880,4320,6120,8280,10800,13680,17280,21600,26640]`

Antes de usar XP novo, o ganho atualiza `xpRequired` em saves antigos sem subtrair XP, reinicializar personagem ou alterar nível para baixo. XP, Pontos de Atributo e Pontos de Essência permanecem recursos separados. Kills e níveis **nunca** geram Essence Points diretamente.

## 5. Astravél

Uma aba de **Personagem** mostra aparência real, nível/XP, Clã/Classe, Vida/Mana e dados de atributos sem abandonar a cena. Mochila mostra consumíveis de campo, quantidades, efeitos e botão **Usar → Confirmar uso / Voltar**.

`useFieldConsumable` é função pura que somente permite, por enquanto, **consumíveis com efeitos exclusivamente restauradores** (Vida/Mana), se o jogador estiver na trilha de Astravél, fora de combate, tiver item elegível e recurso a recuperar. Exclui items de missão, material e efeitos ofensivos. Não muda posição nem consome itens quando falha; modifica uma unidade, vitals, revision e autosave quando tem sucesso. Política final de itens de campo é `OWNER_DECISION`.

## 6. UI e equipamentos

Localização e progresso de descoberta de Terran agora estão no compacto **MENU / LOCAL**, não sobre a viewport. A cena concentra-se em mapa/NPCs e HUD existente. As armas são redimensionadas proporcionalmente à área nativa 32×32 e seguem anchors direcionais já compartilhados entre React e canvas (`VISUAL_DRAFT`).

Armadura vestida usa **pixels de silhueta 32×32** e paleta por Tier/Grau, usando as mesmas geometrias em React e canvas; os ícones do inventário permanecem nos cards. Não cria item nem modifica fórmula de status ou save. As artes finais por porte, espécie, direção e tier devem ser fornecidas por `assetRegistry`; a silhueta é placeholder `VISUAL_DRAFT`.

## 7. Segurança, migração e testes

- Salvar cooldown/damageBreakdown como **opcionais**, sem incrementar schema v17 e sem perder combates legados.
- Testes novos para dano em faces distintas, determinismo, cooldown e cancelamento de ação; consumíveis de campo e regressão da vertical slice.
- CI: `npm run check` (lint, tipos, Vitest e build). Smoke 1366×768 / 1920×1080 / mobile, teclado, toque e `prefers-reduced-motion` ainda dependem de QA em navegador.
- Manter branch/PR isolados enquanto balanceamento e arte final forem revisados. Não publicar na `main` ou Vercel sem validação e autorização.

## OWNER_DECISION (não presumir canon)

1. Fórmula final de dano e crítico; mínimo quando Defender bloquear totalmente.
2. Cooldowns, tabela de dados de skills e critério de tick definitivo.
3. Curva final de XP, pontos por nível, itens permitidos fora de batalha.
4. Sprites definitivos de armaduras, âncoras/limites por arma e animações próprias.
