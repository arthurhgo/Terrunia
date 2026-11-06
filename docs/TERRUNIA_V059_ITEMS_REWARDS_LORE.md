# TERRÚNIA v0.5.9 — Itens, recompensas e estrutura de lore

**Estado:** implementação incremental de UX + proposta de conteúdo (VISUAL_DRAFT / CONTENT_DRAFT / BALANCE_DRAFT).  
**Data:** 2026-11-06. **Branch:** `feat/gameplay-v0.5.9`; **PR:** #60 (draft).  
**Escopo autorizado:** melhorar a utilidade percebida dos materiais, transparência das recompensas e organização da crônica pessoal; não mudar o cânone ou valores sem aprovação.

## Autoridade e conflitos conhecidos

Seguir `AGENTS.md`, `docs/TERRUNIA_GAME_APP_MASTER_SPEC_v0.4.md` (0B antes de material histórico), `docs/CANON_DECISIONS.md`, `docs/NEXUS_AND_QUEST_JOURNAL.md`, `docs/GAMEPLAY_RECRUITMENT_AND_RESET.md` e `docs/TERRAN_CITY_STRUCTURE.md`.

Documentos narrativos antigos (`Universo Terrúnia.txt`, `Introdução Terrúnia.txt`, `A Ascensão da Ruína Crescente*.txt`, `terrunia resquicios da ruinas.txt` etc.) são **fontes de lore histórico**: não importam novas mecânicas nem fatos da campanha atual automaticamente.

**Conflitos a preservar como OWNER_DECISION:** as MAIN-01 a MAIN-10 antigas citam recompensas de novas armas/escudos, montaria por dia e bênção de Celestáris. Não conceder peças substitutas, habilidade de montaria ou efeito da bênção antes de resolver compatibilidade com Vínculos, serviços e progression. Não trocar silenciosamente o significado de MAIN-01 pelo tutorial/vertical slice atual.

## 1. Mudanças de gameplay/UI que este incremento registra

1. **Diário:** `getQuestRewardPreview` compõe, a partir da definição de cada missão, XP, Ouro, Essência Bruta, itens, escolha de um item e resultados explícitos de progressão. A prévia **não entrega** recompensas.
2. **NPC:** a mesma prévia aparece no painel da missão; não duplicar contagens e textos narrativos no diálogo.
3. **Base — Registros:** seções recolhíveis de Crônica principal, Provas de Clã, Caminho da Classe e Relatos de Terran/Astravél. Apenas missões `completed` e memórias realmente armazenadas no save aparecem; nada é descoberto artificialmente, e não há segundo sistema de save.
4. **Mochila:** item mostra usos atuais baseados em flags reais (equipamento simples, consumível, infusão, Joia, venda, conversão, proteção de quest). Antes de vender/converter um material usado em entrega ativa, o diálogo avisa o risco. **Aviso não é bloqueio**: manter as proteções já implementadas por item de quest, favorito e item equipado.
5. **Missão “Abrir a Base”:** a definição expõe `rewardNote` para que o benefício real — acesso à Base após usar a chave — apareça sem inventar Ouro, XP ou outro drop.
6. **Testes:** cobertura de escolha da proteção de Rosetta, chave/acesso à Base, elegibilidade de Clã sem filiação automática e material com entrega ativa, sem revelar missão bloqueada.

## 2. Princípios de economia de itens (sem mudança de valores)

**Fluxo:** origem identificável → item coletado → finalidade explícita → escolha ou uso → progressão percebida.

| Família de item existente | Origem/uso técnico já existente | Próxima oportunidade (proposta, não implementada) |
|---|---|---|
| Drop fungorro (`drop_fungal_nucleus`, `drop_spore_cluster`) | Essência Bruta/Ouro; encomendas de coleta existentes | Mostrar em loja/contrato vínculo `onde obter` sem spoiler de missão bloqueada |
| Resíduos especiais (`drop_mycelial_fiber`, `drop_fungal_gel`, `drop_ruin_shard`) | Venda/conversão e pedidos de NPCs definidos | Marcar materiais exigidos pela missão rastreada e evitar compras/saídas sem necessidade |
| `fragment_echo_crystal` | Contratos de Eldamar e Nara, não componente de Infusão | Não confundir com Fragmento do Rito do Grau II |
| `material_linen_thread` | Aprimoramento +1 de proteção simples em tutorial | Destacar objetivo contextual com Durnan e necessidade de Ouro |
| `fragment_mycelial_essence` | Progresso reservado para Vínculo, sem livre descarte | Explicar Grau II e requisito de rito sem alterar custo |
| `quest_daeryn_home_key` | Progresso de Base protegido | Exibir estado da porta/chave; sem vender, converter ou conceder novamente |
| Componentes de forja | Receitas existentes ligadas ao Vínculo | Auditoria de receita, fonte e consumo antes de qualquer rebalance |

**Regra de projeto:** cada material precisa ter pelo menos uma saída legível (comércio, conversão, missão, produção ou evolução expressamente permitida). Material sem uso aprovado deve permanecer como draft, não ganhar receita improvisada.

## 3. Direção para recompensas de missão

Prioridade canônica segundo a MASTER SPEC, 0B.16: XP do personagem, Essência Bruta, Ouro, reputação de Clã, maestria de Classe, Ressonância, Fragmentos, Joias, Runas, serviços/NPCs e lore/memórias/títulos.

- **Tutorial**: recompensar aprendizagem e preparação. Escolhas de Rosetta concedem **uma** proteção simples; suprimentos aceitos e recompensas entregues são coisas diferentes.
- **Principal — Terran**: recompensas que abrem ações concretas (Base, Bestiário, locais), sem item melhor de troca.
- **Principal — Astravél**: progressão por confronto, relato, Essência Bruta e marcos narrativos. Nenhuma recompensa automática de Ponto de Essência.
- **Secundárias/contratos**: Ouro proporcional ao material entregue, com valor definido nas tabelas `BALANCE_DRAFT`; verificar se a venda direta canibaliza ou é canibalizada pela entrega. Não criar repetições infinitas de recompensa única.
- **Clã/Classe**: reputação, elegibilidade, provas e acesso; concluir prova não filia automaticamente.
- **Boss/ruína**: componente para o Vínculo, Ressonância e Memória quando a definição autorizar; não inventar Runa Superior no drop.

### Auditoria antes de rebalance

Para cada missão/contrato: `questId`, acesso, NPC, custo de tempo, itens consumidos, XP, Ouro, Essência, acesso/flag, efeito da recompensa no inventário, risco de duplicidade e fonte do material. Ajustes numéricos exigem teste de progressão 0→tutorial→Astravél→Base e aprovação do autor; por enquanto **nenhum valor numérico foi alterado** por este incremento.

## 4. Arquitetura de lore — proposta não canônica até aprovação

Organizar a experiência em **quatro camadas independentes**, usando IDs e fontes explícitas.

1. **Crônica do Terrírian:** fatos que este save já realizou, agrupados por missão principal, Clã, Classe e relatos secundários. A Base já pode derivá-los de `save.quests` e `boundItems.memories`.
2. **Registros do mundo descobertos:** observações verificadas em NPCs, locais, ruínas e bestiário; desbloqueio por eventos reais; implementar um catálogo data-driven somente após aprovar gatilhos.
3. **Memórias dos Vínculos:** lembranças/cicatrizes da peça permanente, vinculadas à instância do equipamento; jamais transformar em loot que substitui o Vínculo.
4. **Arquivo histórico (referencial):** textos existentes sobre Celestáris, Ruína Crescente, famílias/linhagens, Vyltranos e Lunakaris, biomas e crônicas. Não publicar como evento visto pelo jogador nem como verdade mecânica até conciliação com canon.

### Esquema futuro proposto — não implementado

```ts
type LoreRecordDraft = {
  id: string
  title: string
  category: 'world' | 'terran' | 'astravel' | 'clan' | 'class' | 'bond' | 'history'
  sourceDocument: string
  sourceSection?: string
  summary: string
  revealWhen: { type: 'questCompleted' | 'worldFlag' | 'npcDiscovered' | 'memory'; id: string }
  status: 'CONTENT_DRAFT' | 'CANON'
  spoilerLevel: 0 | 1 | 2
}
```

Este tipo não será conectado ao save nem à UI antes de haver um inventário real de registros e uma decisão para `revealWhen`. Revelações **nunca** devem acontecer por mero hover, por abrir diálogo sem escolha ou por ler conteúdo que ainda não foi descoberto.

## 5. Mapa de conteúdo inicial, respeitando estado atual

- **Terran / formação do Nexo:** Rosetta, Daeryn, Eldamar, Vorren, Durnan, Lithwynn; mostrar primeiro os registros das missões efetivamente concluídas.
- **Astravél / primeiro ciclo:** `vs_astravel_first_contact`, `main_astravel_lost_hunters`, `main_astravel_corruption`. Ligação narrativa sugerida apenas conforme os resumos existentes; não incorporar automaticamente capítulos antigos.
- **Clãs:** três provas de entrada e rito por Clã; arcos próprios da experiência de quem ingressou, nunca escolha na criação.
- **Classes:** conhecimento pela experiência com o Clã ativo, prova e confirmação; variantes narrativas com `classVariants`.
- **História antiga:** MASTER SPEC seção 72 descreve “O Despertar das Sombras” e esboço MAIN-01–MAIN-10. A integração e a substituição de recompensas históricas são `OWNER_DECISION`, especialmente Arco de Vorren, Escudo de Luz, grifo e Bênção de Celestáris.
- **Conflitos editoriais do acervo:** Maelis × Maelis; Lorian alquimista × Lorian boss; Kael; linhagens civis × Clãs jogáveis. Preservar IDs estáveis e exigir resolução antes de escrever narrativa in-game definitiva.

## 6. Próximos sprints recomendados

**P0** — cobertura de testes da prévia, avisos de itens e Base; `npm run check`; revisão visual do Diário e do tooltip.  
**P1** — auditoria data-driven origem→uso para todos os itens; balanceamento guiado por economia existente, com relatório de orfandade e preço equivalente.  
**P1** — esboço de catálogo de lore descobrível usando apenas entradas verificadas; exigir `OWNER_DECISION` para fontes conflitantes.  
**P2** — ícones/sprites específicos de material, recompensa, descoberta e memória conforme plano de polish; não amarrar a dados de domínio.  
**P0 release** — QA completo, Playwright, save antigo, aceitação/entrega/continuidade e aprovação explícita antes de merge/deploy.

**Gates:** registrar teste real e PR com evidências. Não declarar este incremento aprovado ou publicado só porque o plano existe.
