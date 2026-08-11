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

## OWNER_DECISION pendente

- Distribuição inicial dos cinco dados de atributo.
- Curva final da barra de Essência e recompensas do encontro.
- Conteúdo definitivo da primeira missão e da rota de Astravél.
- Kit final da primeira habilidade, consumível e cadência das skills inimigas.
- Stats/fases finais do Colosso Micélio e definição definitiva do Fragmento Micelial.
- NPC, edifício, custo e reversibilidade do primeiro Rito de Evolução.
- Política de resolução e recuperação de conflitos entre saves local e nuvem.
- Liberação ou não de modo convidado local no build público; o corte atual exige Google Login.
- Artes finais, tipografia licenciada, áudio e identidade dos retratos.
