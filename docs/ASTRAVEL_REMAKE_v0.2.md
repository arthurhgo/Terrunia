# Astravél — remake da rota do Portal v0.2

Direção do criador, 2026-10-30: refazer o caminho do Portal na Floresta de Astravél com **15 nós de combate**, ampliar a base visual existente e interligar monstros, drops, missões e progressão.

Esta versão substitui a rota técnica de seis marcos descrita em `ASTRAVEL_PIXEL_EXPEDITION_v0.1.md`. O Portal de chegada é o marco 0; os marcos 1–15 possuem encontros. O confronto 15 acontece no Núcleo das Câmaras Fúngicas, preservando a dungeon existente.

A quantidade de encontros e a ampliação são autorizadas. Topografia, nomes de marcos, redação e objetivos são `CONTENT_DRAFT`/`VISUAL_DRAFT`; números, preços, suprimentos e recuperação são `BALANCE_DRAFT`. Não constituem fechamento silencioso das decisões pendentes do master spec.

## Rota jogável

| Nó | Marco | Grupo | Papel |
|---:|---|---|---|
| 1 | Presença Fungorra | Fungorro Rastejante | Primeiro Rastro de Eldamar; material para a primeira evolução |
| 2 | Clareira Luminescente | Dois Limuscos Luminescentes | Foco de alvo; Tônico de Campo |
| 3 | Travessia das Mariposas | Mariposa e Fungorro | Uso de habilidade e Éter |
| 4 | Margem dos Esporos | Semeador e Gosma | Veneno e Antídoto |
| 5 | Acampamento Abandonado | Louva-Esporos e Limusco | Recuperar refúgio; suprimentos; +10 PV/+6 PM uma vez |
| 6 | Rastros dos Caçadores | Louva-Esporos e Mariposa | Primeiro vestígio da busca de Vorren; Emblema protegido |
| 7 | Jardim Contaminado | Semeador, Gosma e Mariposa | Pressão de três alvos |
| 8 | Emboscada de Esporos | Dois Fungorros e Semeador | Segundo vestígio; neutralizar a fonte dos esporos |
| 9 | Brejo Esporulante | Horror e Gosma | Habilidades contra mitigação |
| 10 | Refúgio dos Caçadores | Louva-Esporos e Horror | Terceiro vestígio; +12 PV/+8 PM uma vez; retornar a Vorren |
| 11 | Vigília das Ruínas | Sentinela e Mariposa | Investigação de Lithwynn; combate contra defesa |
| 12 | Galeria de Micélio | Horror, Semeador e Gosma | Controle de recursos e grupo |
| 13 | Guardião Raiz-Negra | Titan Raiz-Negra e Semeador | Minichefe; Esmagamento das Raízes |
| 14 | Limiar da Ruína | Sentinela e Horror | Vitória abre as Câmaras; suprimentos finais |
| 15 | Câmaras Fúngicas | Colosso Micélio | Chefe, Memória, Fragmento Micelial e Esmeralda |

## Missões e gates

- `vs_astravel_first_contact` continua sendo oferecida por Eldamar e ensinando o primeiro combate. A entrega libera o contato de Vorren, além da cadeia urbana já existente.
- `main_astravel_lost_hunters` precisa ser **aceita explicitamente** com Vorren antes dos combates 6–10. Os três vestígios são registrados **após** as vitórias nos nós 6, 8 e 10. A entrega é em Vorren.
- `main_astravel_corruption` aparece depois da entrega a Vorren e precisa ser **aceita explicitamente** com Lithwynn antes dos combates 11–15. Seus objetivos são as vitórias nos nós 11, 14 e 15. A entrega é em Lithwynn.
- O limite global de três missões não mudou. Nenhuma missão entra automaticamente no Journal. Missões só pagam recompensas durante a entrega ao NPC correto.
- O jogador pode retornar ao Portal, repousar na Base, negociar no Mercado, comprar nodes e retomar a rota. O Modo Ondas e as três caçadas repetíveis permanecem acessíveis depois do primeiro combate.
- O painel de missões da expedição usa os mesmos seletores do Journal e apresenta todas as missões aceitas. Cada encontro informa grupo, dica, materiais e recursos possíveis.

## Drops e progressão

O catálogo dos monstros é a fonte dos materiais garantidos. A lista de recompensas de cada encontro é construída somando os monstros participantes; suprimentos e flags do marco são dados adicionais, sem regras de recompensa em JSX.

- Gosma → Gel Fúngico Denso; Horror → Fibra Micelial; Titan → Cerne Raiz-Negra.
- Fungorro, Semeador, Limusco, Mariposa, Louva-Esporos e Sentinela conservam seus materiais identificáveis.
- Materiais são convertíveis/vendáveis. O Emblema dos Caçadores é protegido. Fragmento e Esmeralda continuam reservados aos ritos.
- A coleta é visual e manual no combate. Confirmar paga uma única vez; continuar na expedição e revisitar não repetem loot, XP, recuperação ou Ressonância.
- Cada refúgio só recupera recursos na primeira vitória, respeitando os máximos derivados. Não é uma fonte repetível de cura.
- XP de personagem, Ressonância e Essência permanecem separados. Abates e níveis não dão Pontos de Essência. Os pontos só surgem ao completar barras com conversões ou recompensas explícitas de Essência bruta.
- Os cinco equipamentos permanentes, seus sete Graus e seus ritos não mudam.

## Visual e navegação

- Mundo **768×512 pixels**, quatro vezes a área anterior; viewport **384×256**, câmera seguindo o ator, malha de 8 px.
- Três ambientes: Borda Luminescente (1–5), Território dos Esporos (6–10), Raízes da Ruína (11–15). Vegetação, cores, trilhas, aura, escala e perspectiva reaproveitam a identidade existente.
- Minimap mostra sequência, posição, enquadramento e marcos concluídos; **Seguir objetivo** executa caminhada pelo pathfinding e dispara o encontro ao chegar.
- Monstros usam `assetRegistry`, PNGs nativos e fallback. Titan usa 32×32; novos recursos usam 16×16. A lógica depende dos IDs, nunca do arquivo de imagem.
- Mochila, missões e trilha ficam sobre a cena existente. A rota unificada `/play` e a transição para combate são preservadas.
- Regenerar apenas os recursos desta rodada: `python scripts/build_pixel_assets.py --astravel-only`. O processo preserva sprites existentes e atualiza manifest/atlas; também recupera PNGs corrompidos pelo desenho-fonte existente.

## Save 11 → 12

- Saves novos geram estados a partir do catálogo, em vez de uma lista fixa de seis nós.
- Uma campanha parcial conserva os marcos já concluídos e recebe exatamente o primeiro novo marco pendente. A engine pula marcos antigos já concluídos sem repetir recompensas.
- Um combate em andamento conserva seu snapshot inteiro (Vida, Mana, turnos, drops e estado de reclamação). Os marcos anteriores são reconciliados como concluídos para não interromper esse combate.
- Quem já venceu o Colosso conserva a rota concluída, sem receber novos drops/recuperação pela migração.
- As novas missões são cadastradas e disponibilizadas por pré-requisitos. A aceitação continua manual; marcos permanentes já concluídos contam como evidência depois do aceite, evitando exigir repetição de um combate único.
- Carteira, inventário, equipamentos, memórias, árvores e recompensas antigas são preservados. O mesmo save pode ser lido novamente sem nova migração.

## Verificação

`npm run check` cobre lint, TypeScript, testes e build. A integração percorre os 15 combates pelo motor real, usa descanso, distribui atributos e converte drops, testa os dois gates, entrega as missões, executa os ritos II/III e recarrega o save. Testes adicionais cobrem referências, progressão entre trechos, recuperação sem repetição e migração parcial/em combate/concluída.

Validação local em 2026-10-30: **233 testes em 59 arquivos**, lint, TypeScript e build aprovados. Três cenários de navegador foram validados (fluxo de dois combates/reload, gate de missão e layout em cinco resoluções); a execução local usou Chromium isolado por cenário.

Os E2E de Astravél verificam caminhada com câmera, dois combates, coleta manual, continuação, painel com 15 encontros, desktop/mobile, reload e recusa do próximo setor sem aceite.

## OWNER_DECISION

Permanecem abertos o balanceamento final de cada grupo, os números de cura e de recompensa, fases adicionais do Colosso, posição final dos marcos, arte final e consequência narrativa definitiva dos caçadores. Nada adiciona novas Ruínas 6–10 ou substitui capítulos canônicos da campanha completa.
