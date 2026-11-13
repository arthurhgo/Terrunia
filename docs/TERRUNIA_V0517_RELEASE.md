# Terrúnia v0.5.17 — Release de combate (13/11/2026)

**Autoridade:** TERRUNIA_GAME_APP_MASTER_SPEC_v0.4.md. Documento de consolidação das alterações de combate aprovadas no chat.

## Decisões de gameplay aprovadas
- Nexo começa como Terrírian sem Classe/Clã, ambos conquistados durante o jogo por NPCs, missões e provas.
- Cinco Vínculos permanentes; Escudo, Protetor Arcano e Aljava são manifestações do mesmo slot de mão secundária. Nunca se troca um Vínculo existente por outro.
- Ataque Duplo removido. Cada família de arma recebe golpes coerentes.
- Bloqueio, Aparar, Esquiva e Contragolpe são reações com dados e chance de falha. Não existe botão Defender garantido.
- Dûn'Avar combina defesa física e conjuração arcana após filiação.
- Iniciativa por atributos/status, com rolagem autoritativa e previsão de ordem somente após resultado real.
- Dano físico enfrenta ARM e limiar ESC; mágico/elemental enfrenta reserva ARC; logs e animações mostram dano realmente absorvido.
- Próximos Passos fixos no centro da Vitória, mochila e poções opcionais à direita.

## Mecânicas concluídas na branch
1. Sete armas com ataques próprios, técnicas por Grau e cooldown. Arco, cetro e machado têm identidade distinta.
2. Rito inicial de Escudaria com Ed'ran na oficina existente, sem permitir reconversão/troca de Vínculo. Requisitos, preço e NPC podem ser parametrizados.
3. Perfis: escudo favorece Bloqueio, duelista Aparar/Contragolpe, arqueiro com Aljava Esquiva, mago Proteção Arcana.
4. Doze disciplinas exclusivas de Classe, liberadas por Clã correto, Classe obtida, maestria e prova do mestre concluída. Seus nomes/valores são CONTENT_DRAFT.
5. Intenção inimiga usa seletor compartilhado com motor; IA por arquétipo, pressão de guarda, resistências e status respeitam os chefes e as missões existentes.
6. UI mostra ESC/ARM/ARC/HP, resistência, efeito de status e próxima ordem de turno sem rerolagem de dados.
7. Vitória mantém navegação fixa e cura opcional, protegida contra overflow.

## Arte funcional e substituição manual
- 41 sprites SVG anteriores de golpes, habilidades, status e Aljava.
- 26 novos SVGs 16×16: doze disciplinas de Classe, oito drops de biomas, cinco equipamentos complementares e Emblema do Clã.
- PNGs existentes de consumíveis, runas, joias e materiais preservados. Sprites de equipamentos comerciais gerados pelo pipeline de assets do projeto.
- Todos os ícones usam IDs assetRegistry e não influenciam o motor. VISUAL_DRAFT significa que a aprovação artística final do proprietário ainda não ocorreu.

## Balanceamento, gate de qualidade e pendências
- ESC/ARC, ritos, CDs, MP, resistências, IA e duração de status permanecem BALANCE_DRAFT ajustáveis em código/configuração.
- Tests exigidos: npm run check + Playwright E2E, revisão da campanha, bosses, Portal, ondas infinitas, saves e Vitória em 1366×768.
- Integridade automatizada não substitui playtest humano de todas as quinze etapas de Astravél.
- OWNER_DECISION: números finais após playtest, NPC/rito definitivo da Aljava na lore, aprovação dos nomes das 12 habilidades de Classe e arte final.
- Arena de Treinamento, Compêndio Tático e Relatório de Combate são ideias futuras fora do escopo fechado desta versão.
- Não fazer merge ou publicação quando algum check obrigatório estiver vermelho. Após checks verdes, fazer revisão do diff, merge do PR #82 e confirmar a implantação real na Vercel.

**Segurança:** não adicionar segredos ao repositório; manter alterações pequenas, testadas e reversíveis; não alterar o canon silenciosamente.
