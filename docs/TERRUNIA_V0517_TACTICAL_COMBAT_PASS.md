# Terrúnia v0.5.17 — Remake tático consolidado

Estado: UX_DRAFT / CONTENT_DRAFT / BALANCE_DRAFT / VISUAL_DRAFT.
Autoridade: TERRUNIA_GAME_APP_MASTER_SPEC_v0.4.md. PR #82 permanece Draft. Sem merge ou deploy de produção.

## Canon preservado
- Terrírian não escolhe Clã nem Classe na criação. Bloqueio, Aparar, Esquiva e Contragolpe são habilidades universais, com rolagens.
- Apenas 5 Vínculos permanentes; Aljava, Escudo e Protetor Arcano são manifestações do mesmo slot de mão secundária, e não itens de troca tradicional.
- Iniciativa e dano usam RNG persistido. Sprites não determinam regras, e abrir a Mochila não consome poções.
- Próximos Passos permanece em um rodapé fixo dentro da Vitória central.

## Oito frentes implementadas nesta rodada

1. Pressão da Guarda: Investida Rompe-Escudo aplica status temporário Guarda Pressionada, reduzindo ESC em 2 pontos por dois turnos. Dano físico precisa superar ARM e ESC antes de afetar HP; não há perda permanente de grau do Vínculo.
2. Intenção inimiga: seletor único, usado tanto pelo motor quanto pelo HUD, indica ação declarada, rodada e tipo de dano. Golem mantém preparação de rocha e Sentinela mantém mecânica dos guardas. Não revela dados futuros ou críticos antecipadamente.
3. Defesas por perfil: escudeiro com escudo recebe bônus de Bloqueio; duelista com espada/adaga recebe +1 em Aparar e Contragolpe; arqueiro com Aljava recebe +1 em Esquiva; mago conjura ARC; Dûn'Avar conjura ARC somente após filiação. Não concede Classe automaticamente.
4. Arco e cetro: Flecha Ígnea no Grau II e Flecha Tóxica no Grau III; Centelha Ígnea no Grau II e Dissipação Arcana no Grau III. Cada habilidade tem Mana, cooldown, dado, status e assetId próprios. Flechas não consomem uma munição comum a cada disparo.
5. Resistências: campo opcional damageResistances por inimigo para physical, arcane, fire, poison e ruin. Valores positivos são resistências e negativos vulnerabilidades; limite ±50%. ARM física, afinidade, ESC ou ARC, então HP. Preview e logs compartilham esse cálculo.
6. Feedback visual: exibe ESC/ARM/ARC e dano real na Vida após a rolagem. Golpes sem dano aparecem como ESCUDO, ARMADURA ou ABSORVIDO conforme a camada. Sem re-rolar para efeitos gráficos.
7. IA por arquétipo: breaker usa pressão quando ainda faz sentido, controller preserva Explosão de Esporos e o envenenamento histórico com Lentidão adicional, caster pressiona ARC e brute/skirmisher usam perfis de dado ou mitigação. Chefes originais preservam ciclos e recompensas.
8. Iniciativa: primeira rolagem é a única autoritativa do encontro. Status podem mudar valores e previsão da próxima rodada na barra de retratos, sem vazamento de resultados ainda não revelados, sem RNG extra e sem turnos extras.

## Design visual
41 ícones pixel art transparentes VISUAL_DRAFT: 14 ataques por família, 12 habilidades, 5 estados e Aljava anteriores, mais 7 habilidades e 2 estados desta rodada. Arquivos SVG 16×16 (Aljava 32×32), IDs intercambiáveis em assetRegistry. Assets definitivos poderão substituir os ícones sem alterar o motor.

## Valores provisórios
Guarda Pressionada: −2 ESC, 2 turnos. Flecha Tóxica: 65% de aplicar veneno, 1 dano no início do turno por 2 turnos. Flechas Ígnea e Tóxica: 3 MP, CDs 2/3; Centelha Ígnea e Dissipação Arcana: 3 MP, CDs 2/3. Criaturas selecionadas: resistências/vulnerabilidades entre 10 e 20%. BALANCE_DRAFT: validar builds, confrontos, bosses, dificuldades, críticos e recursos.

## Regressões protegidas
- Não remover a Explosão de Esporos do Semeador nem seu status de veneno existente.
- Chefes continuam protegidos por guardiões antes de poderem ser atacados.
- Comando Ataque Duplo continua removido.
- Dado de iniciativa inicial oculto até sua revelação, dano contabilizado no motor e animado depois do foco.
- Sem regressão no rodapé VITÓRIA ou fluxo da campanha, dungeon, Portal ou ondas.

## Testes e gates
Lint, TypeScript, Vitest, build, Playwright E2E 16 fluxos, revisão do combate e visual em 1366×768 e resoluções menores. O teste de layout de prólogo usa redução de movimento para estabilizar a verificação geométrica.

## OWNER_DECISION não implementadas automaticamente
- Rito de obtenção da Aljava; resistências finais por espécie; distribuição final de habilidades de Classe; balanceamento aprovado e artes finais.
- Arena de Treinamento: testar habilidades sem XP nem drops, sem substituir progressão.
- Compêndio Tático: registrar somente afinidades e técnicas realmente descobertas pelo personagem.
- Relatório de Batalha: total de ESC/ARM/ARC absorvido e sucesso/falha das reações, sem afetar recompensas.
