# Personagens, diálogos e forja — v0.10

Direção do criador de 2026-10-30: usar a imagem do personagem como sprite; diferenciar todos os NPCs em pixel art; remover o limite de missões; mostrar a arma na mão em combate; criar vendedor e Casa do Ferreiro; unificar a interrogação vermelha; compor diálogos com dois personagens acima da caixa inferior.

## Identidade visual

- O retrato escolhido na criação é também a imagem desenhada em Terran, interiores, Astravél e Câmaras. Caminhar para a esquerda espelha a mesma imagem; uma spritesheet direcional cadastrada continua suportada.
- `npcVisuals.json` define 51 aparências com roupas, cabelo, pele, silhueta e acessórios próprios. São 31 NPCs do catálogo e 20 presenças nomeadas. O sprite em jogo e o retrato de diálogo resolvem o mesmo asset pelo registro central.
- Rosetta usa cabelo castanho, traje violeta e cajado. Durnan tem avental e martelo; Neris tem paleta de mercadora e bolsa. Artes permanecem `VISUAL_DRAFT`.
- `scripts/build_character_cast.py` reproduz retratos nativos 32×32 e três ícones de material 16×16. O pipeline `build_pixel_assets.py` incorpora o elenco aos atlas e manifest sem substituir os retratos por modelos genéricos.
- Todos os NPCs usam `NpcMarker`: janela vermelha com `?`, inclusive Rosetta. Oferta, entrega e conversa continuam distintos no estado e texto acessível.

## Diálogo e combate

`DialogueWindow` mantém dois retratos grandes acima de uma caixa inferior, como na composição da referência enviada. Falas paginadas, nomes e ações ficam na mesma janela; listas extensas têm rolagem interna. A arte permanece em pixel, com cores e moldura de Terrúnia. Escape, retenção de foco e restauração do foco funcionam em todas as conversas que usam a janela.

`EquippedCharacter` compõe a imagem do jogador com o sprite da arma vinculada e seu Grau atual. O ponto de empunhadura vem do registro das sete armas. O protagonista fica à esquerda dos inimigos, voltado para a direita. O acabamento da forja acrescenta brilho à arma sem substituir sua identidade.

## Missões sem limite

O antigo limite global de três missões foi removido do domínio, das telas e da validação de save. Aceite, pré-requisitos e entrega continuam explícitos; o Journal mantém uma única fonte de verdade. As três provas necessárias para um Clã permanecem obrigatórias. Nenhuma missão é automaticamente aceita pela mudança.

## Mercado e Casa do Ferreiro

Neris vende Lasca da Ruína (28 Ouro), Fibra Micelial (32), Cerne da Raiz-Negra (52) e Tônico Menor (18), apenas no Mercado. Os comerciantes existentes continuam oferecendo seus serviços.

A Casa do Ferreiro é a sétima instituição de Terran, além da Praça. Tem fachada, caminho transitável, interior, fornalha, bigorna e Durnan residente. Números abaixo são `BALANCE_DRAFT`; nomes e falas novos são `CONTENT_DRAFT`.

| Receita | Materiais | Ouro | Resultado |
|---|---|---:|---|
| Liga Rúnica | 2 Lascas da Ruína + 1 Cerne da Raiz-Negra | 20 | 1 Liga Rúnica |
| Núcleo de Arma | 1 Liga Rúnica + 1 Fibra Micelial | 25 | 1 Núcleo de Arma |
| Resina Micelial Tratada | 2 Fibras Miceliais + 1 Gel Fúngico Denso | 15 | 1 Resina Micelial Tratada |
| Aplicar Têmpera à Arma | 1 Núcleo de Arma | 40 | +1 Ataque; revela Fio Temperado |
| Aplicar Acabamento Micelial | 1 Resina Micelial Tratada; exige Têmpera | 60 | +1 Ataque, +4 Vida máxima; revela Trama da Forja |

As receitas consomem materiais e ouro de forma atômica, respeitando itens trancados, favoritos e de missão. As duas melhorias são aplicadas uma única vez à mesma arma, com Memória e flag próprias. ID, Grau, componentes e cinco slots permanentes são preservados. Aumento da Vida máxima não cura a Vida atual.

Na árvore, Fio Temperado concede +1 Ataque e exige o node central; Trama da Forja concede +1 mitigação e exige Fio Temperado. Cada node custa 1 Ponto de Essência. Forjar revela os nodes, sem comprá-los ou conceder Pontos de Essência diretamente.

## Persistência e verificação

Save 13 / versão 0.10.0 migra saves 12, cadastra relações e missões dos novos NPCs e preserva o restante da campanha. Aprimoramentos ficam no item vinculado e persistem após reload. Migração não concede materiais, ouro, recompensas ou melhorias.

Validação cobre receitas, consumo, custo, proteção, aplicação duplicada, efeitos em atributos, pagamento da árvore, migração, missões acima do antigo limite e resolução única das 51 artes. O fluxo de navegador passa por Rosetta, quatro missões simultâneas, compra com Neris, cinco receitas, reload e combate com a arma correta; o diálogo também é verificado em viewport móvel. Autenticação e sincronização reais dependem da configuração Firebase já existente e não são substituídas pelos testes locais.
