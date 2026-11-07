# Terrúnia v0.5.10 — pacote incremental de implementação

**Base:** v0.5.9, main `17de5fc`. **Branch alvo:** `feat/v0.5.10-immersive-ui`.
**Autoridade:** `AGENTS.md`, `TERRUNIA_GAME_APP_MASTER_SPEC_v0.4.md`, decisões aprovadas de Terrúnia.
**Não publicar em produção** antes de validação e aprovação. Itens com `BALANCE_DRAFT`, `CONTENT_DRAFT` ou `VISUAL_DRAFT` não se tornam cânone.

## Alterações funcionais neste pacote

- GameShell: header permanente removido **somente** da exploração e do combate; controles compactos flutuantes para Menu, Missões e status de save. Navegação de outras telas preservada.
- WorldViewport: câmera única, parametrizada e redimensionada por `ResizeObserver`. Abertura inicial do campo de visão em até 30% por dimensão, limitada às bordas reais do mapa. Canvas, minimapa, posições dos NPCs, marcadores, cliques e hit tests usam **o mesmo viewport**.
- Terran/Astravél: ator do jogador com 28 px visuais, harmonizado com os NPCs. A âncora dos pés e as colisões são preservadas. A arma fica guardada na exploração via `getVisualEquipment(save, true)`, e permanece empunhada no combate.
- Astravél: HUD compacto no canto inferior esquerdo e cena dominante, sem deslocar o mapa quando abre o painel.
- Combate: arena maior, controles inferiores sempre acessíveis, timeline compacta, inimigos menores organizados verticalmente e cue visual do ator que está atuando. A execução determinística e o commit de dano após apresentação da sequência de dado já existentes na v0.5.9 foram preservados; **não há nova máquina de estados**.
- Criaturas: quatro atlas nativos já existentes e dez perfis de movimento CSS específicos (`idle/attack/hit/defeat`) para os inimigos restantes. Os dez atlas desenhados quadro a quadro ainda dependem de produção artística.
- Armas: 14 habilidades de combate adicionais, duas por família, liberadas nos Graus II e III dos sete equipamentos de arma existentes. Todas marcadas `BALANCE_DRAFT`. Não concede habilidades antes do Grau.
- Clãs: quatro habilidades únicas `BALANCE_DRAFT`, disponibilizadas somente se `save.character.clan.clanId` estiver definido. Clã não é escolhido na criação; provas e filiação existentes permanecem obrigatórias.
- Rosetta: orientação de iniciação de Clãs após o nível 3, vinculada às missões de Clã existentes. Não cria filiação automática nem nova quest silenciosa.
- NPCs: nome maior, função menor, placa mais estreita; números de disponíveis/ativas/entregáveis alinhados abaixo à esquerda. Rosetta, que apresenta orientação e não aceita quests pela placa, não exibe falso contador de oferta.
- Base: entra diretamente no interior; modal orientativo somente na primeira entrada após desbloqueio. Confirmação grava `base_intro_viewed_v0510` em `worldFlags`, sem migrar schema. Cama, baú e estante continuam interativos.
- Portal: destinos e atividades na coluna esquerda em desktop; a atividade Astravél usa `enterAstravel` e o marco `astravel_entry` (0), sem inventar mapas navegáveis.
- `biomeRegistry`: cinco biomas referenciados. **Estado anterior à expansão:** apenas Astravél era jogável. A continuação abaixo introduz Cerrado Místico e Elduran; Glacial e Korduun permanecem fechados. Ordem pós-Astravél = `OWNER_DECISION`.

## Conteúdo preparado, **não ativado** por segurança de canon e save

- 25 fontes de drops raros, chances provisórias de 0,15% a 1,50%; `getLiveRareDrops()` retorna vazio até aprovação explícita e conexão com o loot determinístico por batalha.
- 13 runas vinculadas com exemplos de efeitos distintos em arma/armadura, requisitos mínimos de **Grau IV**. Nenhuma inscrição permanente foi habilitada: regras de runa superior e unificação Grau VII mantidas.
- Novos monstros e missões dos biomas ainda fechados, contratos exclusivos do Quartel de Zareth, e disponibilidade final dos ritos permanecem `OWNER_DECISION`. Não modificamos recompensas, histórias ou saves já aceitos.
- Não conceder drops de equipamentos vinculados substitutos, Runa-Joia Épica da Alma, Joias exclusivas do boss ou Pontos de Essência diretamente por kills.

## Gates de validação

- [x] `npm run check`: lint + TypeScript + Vitest + build (`5541a8e`, [CI aprovado](https://github.com/arthurhgo/Terrunia/actions/runs/42383264465)).
- [x] Playwright na branch: [E2E aprovado](https://github.com/arthurhgo/Terrunia/actions/runs/42383264484) em `5541a8e`; cobertura de criação, Base, inventário, NPCs, Portal, Astravél, combate e save/load.
- [ ] Revisão visual 1366×768, 1920×1080, 1440×900, 1024×768, 2560×1080, 844×390 e 390×844.
- [ ] Arte final: atlas de movimento das dez espécies sem folha nativa, cama/baú/estante e fauna adicional.
- [ ] Revisão de balanceamento das novas habilidades, runas e probabilidades com o proprietário.
- [ ] Merge/deploy de produção somente após aprovação explícita.

**Processo:** nenhum segredo adicionado; commits em branch isolada e reversível; evitar builds repetidas no Vercel.

## Continuação de QA pós-merge (2026-11-07)

- A PR #61 foi integrada à `main` em `79b23c1` por operação externa a esta revisão; a indicação anterior de DRAFT não bloqueou o merge.
- Correção: o rodapé institucional não deve ser montado dentro do `GameShell` imersivo. A cena retém a altura total do viewport e deixa o rodapé somente nas páginas de menu/status.
- E2E de Terran agora valida posicionamento do canvas e controles nas sete dimensões da lista e salva sete capturas PNG por execução; as evidências são arquivadas no GitHub Actions inclusive quando o teste passa.
- A captura automatizada NÃO equivale a aprovação estética: inspecionar as sete imagens antes de aprovar a interface.
- Chance de drops raros, efeitos das runas, Glacial, Korduun e dez atlas de animação final permanecem bloqueados ou em produção como `OWNER_DECISION` / `BALANCE_DRAFT` / `CONTENT_DRAFT`.

## Continuação: dois biomas jogáveis (branch feat/v0510-cerrado-elduran)

**Conteúdo solicitado:** Cerrado Místico e Deserto de Elduran. Cada um recebeu 0 Entrada + 4 encontros progressivos (incluindo uma batalha final), 9 espécies compartilhadas pelos dois biomas e 8 materiais comuns. Os nomes das espécies seguem o documento de biomas de Terrúnia.

- Exploração pixelada: visuais distintos (cactos/vegetação seca no Cerrado; dunas e estruturas soterradas em Elduran), câmera e hitboxes do motor de Astravél.
- Portal: ações separadas por ID; entrada voluntária sem batalha automática.
- Combate: máquina de estados existente, com o mesmo fluxo de loot/claim/save, sem novos equipamentos vinculados.
- Progressão provisória: Colosso de Astravél concluído → Cerrado; chefe da rota do Cerrado concluído → Elduran. **OWNER_DECISION** quanto à ordem e gates finais.
- Acesso de saves v0.5.9/v0.5.10: os novos nós são inicializados apenas na primeira entrada, sem alterar save schema nem resetar progresso antigo.
- **BALANCE_DRAFT:** HP, ataque, XP, Ouro, Ressonância, valores de venda/conversão de materiais, níveis e seleção de guardiões finais.
- **Não ativado:** 25 fontes de drops raros, 13 runas, regiões Glacial e Korduun, novas missões de NPC e sprites finais.
- Sprites futuros são mapeados por asset IDs; a ausência de PNG usa placeholder.

**QA automatizado:** CI, 98 suítes unitárias, e Playwright 11/11 testes aprovados no commit `9779b24` da expansão. **QA pendente:** inspeção estética manual em desktop/mobile, sprites finais e balanceamento com o proprietário. Integração condicionada à autorização explícita do proprietário.
