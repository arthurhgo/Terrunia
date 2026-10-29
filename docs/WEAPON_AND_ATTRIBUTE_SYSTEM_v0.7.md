# Arsenal livre e atributos — v0.7

## Regra de identidade

- O Terrírian possui exatamente cinco Vínculos permanentes: Arma, Escudo, Armadura, Colar e Pulseira.
- Drops não substituem Vínculos.
- Qualquer Terrírian pode vincular qualquer tipo de Arma, independentemente de Clã ou Classe.
- Nível e atributos são os únicos bloqueios de uso.
- Clãs já podem contribuir para o cálculo de ataque; Classes terão afinidades e bônus futuros, sem trava rígida.

## Atributos

| Atributo | Escala principal |
|---|---|
| Astúcia | Cetros, grimórios e análise arcana |
| Agilidade | Arcos, adagas e iniciativa |
| Força | Espadas, machados e armamento pesado |
| Vigor | Vida, escudos e armaduras |
| Espírito | Mana, cajados e canalização |

Todos começam em d4. A criação concede três Pontos de Atributo. Um ponto avança um passo na sequência `d4 → d6 → d8 → d10 → d12`. Antes do primeiro Vínculo, a distribuição pode ser refeita; depois, somente novos pontos podem ser investidos. Cada nível concede um ponto.

## Fundações de Arma iniciais

| Arma | Poder | Escala | Pré-requisito | Técnica Grau I |
|---|---:|---|---|---|
| Espada Longa | 3 | Força | Força d6 | Arco da Lâmina |
| Machado de Guerra | 4 | Força | Força d8, Vigor d6 | Ruptura do Machado |
| Arco Longo | 2 | Agilidade | Agilidade d6 | Disparo Perfurante |
| Adaga | 2 | Agilidade | Agilidade d6 | Incisão Veloz |
| Cetro Arcano | 2 | Astúcia | Astúcia d6 | Pulso do Cetro |
| Livro de Magias — Projéteis | 4 | Astúcia | Astúcia d8, Espírito d6 | Projéteis Inscritos |
| Cajado de Conjuração | 2 | Espírito | Espírito d6, Vigor d6 | Onda de Convergência |

Todos os requisitos podem ser alcançados com os três pontos iniciais. Os números permanecem `BALANCE_DRAFT`.

## Fórmulas expostas

`Ataque principal = poder-base da Arma + metade do dado efetivo do atributo de escala + bônus de Skill Tree + bônus aplicável do Clã`

`Poder projetado da técnica = ataque principal + bônus de dano da técnica`

A interface expõe as parcelas no Nexo, Arsenal, primeiro Vínculo e detalhe do item. O combate consome a mesma derivação; não existe cópia persistida desses totais no save.

## Rank e Grau

- **Rank I–VII:** faixa de acesso da fundação, associada aos pré-requisitos.
- **Grau I–VII:** evolução do Vínculo individual por Ressonância e ritos.
- As sete Armas iniciais são Rank I para preservar a escolha livre na criação.
- As fundações futuras de proteção possuem Ranks II–V conforme o nível mínimo atual.
