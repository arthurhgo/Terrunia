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

## OWNER_DECISION pendente

- Distribuição inicial dos cinco dados de atributo.
- Curva final da barra de Essência e recompensas do encontro.
- Conteúdo definitivo da primeira missão e da rota de Astravél.
- Política de resolução e recuperação de conflitos entre saves local e nuvem.
- Artes finais, tipografia licenciada, áudio e identidade dos retratos.
