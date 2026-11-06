# Terrúnia v0.5.7 — Feedback de jogadores e justiça do combate

Status: implementação parcial na branch `feature/v057-combat-clarity-expedition-progression`, aguardando validação e reconciliação com PR #56 (alterações paralelas sobre os mesmos sistemas).

## Feedback literal e causa verificada

- “Rolei 6, tenho +2 de poder, alvo com 1 armadura, e só dei 4.” Causa: a face exibida era puramente visual, não usada na conta. A fórmula antiga ignorava o resultado real do dado.
- “Selecionei golpe mas me arrependi.” A animação do dado era uma prévia determinística não persistida, mas a interface não oferecia cancelar.
- “Não consigo ver a ficha em Astravél nem usar poção.” A floresta mostrava apenas Trilha/Mochila/Missões e o inventário era somente de consulta.
- “Autoataque e skill ambos d6.” A diferença matemática existia em `powerBonus`/Mana, porém não era comunicada; faltava cooldown para uso tático.
- “XP lento e não ganho pontos úteis.” Os limiares iniciais eram altos e cada nível concedia 1 ponto quando subir o dado exige 2.

## Correções implementadas (BALANCE_DRAFT)

1. O motor de dano agora usa **face real + Poder de Ataque + Bônus da Técnica − Mitigação**. Registra componentes e dano aplicados, sem rolagem cosmética.
2. O RNG começa de semente baseada no ID de cada batalha, não de uma mesma constante em todas as partidas. O estado da semente permanece no save, permitindo repetir/testar determinísticamente.
3. Defesa bloqueia **um golpe recebido** (0 dano), depois se desfaz; os demais monstros continuam atacando.
4. Skills têm cooldown parametrizável (padrão 2 turnos do jogador), com salvamento opcional para não quebrar combates antigos; exibem bônus da técnica, MP e cooldown. Ataque básico permanece sem cooldown.
5. Ação ainda não lançada pode ser **cancelada antes de soltar o dado** e selecionada novamente sem gastar HP/MP/item/turno.
6. Em Astravél, o painel **Personagem** mostra o Nexo; a Mochila permite consumir poções restauradoras sem entrar em combate, respeitando limite de HP/MP e quantidade, sem ativar itens ofensivos.
7. XP de batalha x1,5 na entrega da recompensa; limiares de nível mais baixos e **2 Pontos de Atributo por nível**, suficientes para uma evolução de dado. **Pontos de Essência continuam exclusivamente pela barra de Essência**. Progresso anterior preservado.

## OWNER_DECISION

- Os valores numéricos acima são propostas de balanceamento **BALANCE_DRAFT**, não canon imutável: cooldown, níveis, XP, dano e defesa podem ser ajustados após playtest.
- Futuras skills podem definir cooldown individual; suas fórmulas de status não mudaram.
- Ação cancelável **somente antes de rolar/confirmar o dado**, não após a resolução.

## QA necessário

- Revisar cálculos d4–d12, mitigação/defesa e bloqueios com múltiplos inimigos.
- Verificar recarga real, custo em Mana e save/reload durante o combate.
- Abrir ficha e usar poções na floresta, verificar persistência e impossibilidade de cura duplicada.
- Jogar os 15 combates de Astravél e testar curva de nível, XP e dificuldade, inclusive personagens existentes.
- Não publicar até CI verde, revisão das mudanças concorrentes e Vercel produção READY.
