# Decisões de cânone e precedência

Registro das ambiguidades encontradas durante a implementação do vertical slice v0.1.

| Tema | Conflito encontrado | Decisão aplicada |
|---|---|---|
| Criação | Material anterior permite escolher Clã e Classe na criação. | 0B/0A prevalecem: o Terrírian nasce sem ambos e os conquista em jogo. |
| Progressão | Texto antigo trata Ressonância como moeda da Skill Tree. | Ressonância mede a evolução individual do Vínculo; a moeda compartilhada da árvore é Ponto de Essência. |
| Loot | Telas e trechos antigos sugerem trocar equipamento. | Drops entram no inventário para conversão, venda ou usos explicitamente definidos; nunca substituem os cinco Vínculos. |
| Primeiro equipamento | O mockup mostra os cinco slots ocupados. | O save inicia com todos vazios; somente a arma é vinculada no prólogo deste slice. |
| Atributos | O mockup exibe seis atributos de RPG genéricos. | A implementação usa Astúcia, Agilidade, Força, Vigor e Espírito, expressos como dados d4–d12. |
| Identidade visual | O mockup traz Cael, nível 27 e Planícies de Aurion. | Esses valores são tratados como placeholders visuais, não como identidade ou estado inicial canônico. |
| Missão inicial | `MAIN-01` pertence ao cânone, mas seus detalhes finais não estão fechados. | O slice usa `vs_astravel_first_contact`, explicitamente `CONTENT_DRAFT`, sem reescrever `MAIN-01`. |
| Crescimento inicial | Não há valores finais para atributos, barra e recompensas. | Valores ficam centralizados e marcados `BALANCE_DRAFT`; não são apresentados como cânone. |
| Combate tático v0.2 | A especificação exige skills, consumíveis e status, mas não fecha nomes/custos do primeiro kit. | O motor foi implementado de forma declarativa; `Golpe Ressonante`, Tônico e números são drafts substituíveis, não cânone novo. |
| Continuação de Astravél | A fonte define Fungorros e Câmaras, mas não fecha a ordem exata dos nós do tutorial. | Acampamento, emboscada e limiar formam uma rota `CONTENT_DRAFT`; o boss ficou bloqueado na v0.2 e foi liberado na v0.3 com encontro técnico explicitamente draft. |
| Boss das Câmaras v0.3 | Colosso Micélio é canônico, mas stats, habilidades e formato do primeiro confronto não estão fechados. | O ID/nome do boss são preservados; números e uso de Explosão de Esporos ficam `BALANCE_DRAFT`/`CONTENT_DRAFT`. |
| Primeiro Fragmento | A progressão exige Fragmento no Grau II, mas nome, efeitos e drop final do Colosso não estão fechados. | `Fragmento de Essência Micelial` e `Essência Micelial` são conteúdo técnico substituível; venda e conversão ficam bloqueadas para não destruir progressão. |
| Rito do Grau II | O rito deve ocorrer em Terran, porém NPC, edifício e custo final são `OWNER_DECISION`. | O build executa um serviço técnico em Terran com confirmação explícita; nenhuma instituição ou personagem é fixado como cânone. |
| Estado do boss | `boss` era usado simultaneamente como tipo visual e estado, deixando acessibilidade ambígua. | Save v3 preserva `boss` como chefe bloqueado e usa `bossCurrent` somente após concluir o limiar. |
| Primeira Joia v0.4 | Grau III exige uma Joia, mas a origem e a combinação inicial não estão fechadas. | O slice usa Esmeralda do Crescimento × Essência Micelial como `CONTENT_DRAFT`; catálogo, compatibilidade e recompensa são substituíveis por dados. |
| Limiar do Grau III | O percurso v0.3 terminava com 104 de Ressonância, abaixo das 300 exigidas. | A recompensa provisória do Colosso foi elevada para 256, fechando 12 + 32 + 256 = 300 sem grind. Valor permanece `BALANCE_DRAFT`. |
| Rito do Grau III | NPC, edifício, custo e forma narrativa da Lapidação são indefinidos. | Terran executa um serviço técnico com confirmação; nenhuma instituição ou personagem foi tornado cânone. |
| Permanência da Joia | Remoção, troca e respec estão marcados como `OWNER_DECISION`. | O build informa a incerteza antes da Lapidação e não oferece remoção/troca; o schema continua extensível. |
| Home de Terran | O mockup v0.4 e o dashboard anterior faziam o Portal ocupar o painel principal; seções históricas listavam prédios legados. | Terran é a Home/cidade-base. A matriz oficial inicial contém seis instituições ao redor da Praça do Portal, conforme `TERRAN_CITY_STRUCTURE.md`. |
| Papel do Portal | A leitura anterior aproximava Portal, Mundo e tela principal. | O Portal é somente uma área central de Terran, valida missões e dá acesso às instâncias externas. Retornos chegam à Praça. |
| Ritos dos Vínculos | Grau II–III exigiam Terran, mas o edifício estava `OWNER_DECISION`. | A Oficina dos Vínculos é a instituição responsável pelos cinco Vínculos e seus componentes. NPC, custo e cerimônia final continuam `OWNER_DECISION`. |
| Geografia da cidade | As casas eram menus sem posição persistente. | `/terran` é mapa/Home; `/terran/:locationId` são áreas. O minimapa registra posição, descoberta e objetivo. Coordenadas são `VISUAL_DRAFT`. |
| Nexo e Personagem | A revisão v0.4 separava STATUS e Vínculos, enquanto a direção mais recente exige uma leitura integrada sem tornar Personagem uma cópia. | `/nexus` reúne status principais, origem dos derivados e exatamente os cinco Vínculos; `/character` preserva ficha detalhada, Memórias, títulos, progressão e crônica. |
| Aceitação de missões | O vertical slice anterior adicionava a missão diretamente ao estado `active` e concluía/recompensava ao fechar objetivos. | O fluxo oficial é `AVAILABLE → OFFERED → ACTIVE → READY_TO_TURN_IN → COMPLETED`. O Journal deriva apenas de `ACTIVE`, `READY_TO_TURN_IN` e `COMPLETED`; recompensas são aplicadas somente na entrega ao NPC correto. |
| Estado compartilhado de quests | Tracker, minimapa, Journal e ícones de NPC possuíam leituras parcialmente independentes. | Todas as superfícies derivam de `GameSave.quests` por seletores puros. `tracked` seleciona objetivos do HUD; não existe lista paralela de missões na UI. |

## OWNER_DECISION pendente

- Distribuição inicial dos cinco dados de atributo.
- Curva final da barra de Essência e recompensas do encontro.
- Conteúdo definitivo da primeira missão e da rota de Astravél.
- Kit final da primeira habilidade, consumível e cadência das skills inimigas.
- Stats/fases finais do Colosso Micélio e definição definitiva do Fragmento Micelial.
- NPC, custo e reversibilidade do primeiro Rito de Evolução na Oficina dos Vínculos.
- Origem definitiva da primeira Joia e matriz final de sinergias Essência × Joia.
- NPC, custo, remoção e substituição no Rito de Lapidação do Grau III na Oficina dos Vínculos.
- Nome definitivo do Guardião do Portal.
- Diálogos, requisitos e estados finais dos NPCs condicionais, visitantes e progressivos de Terran.
- Política de resolução e recuperação de conflitos entre saves local e nuvem.
- Liberação ou não de modo convidado local no build público; o corte atual exige Google Login.
- Artes finais, tipografia licenciada, áudio e identidade dos retratos.
