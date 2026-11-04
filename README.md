# Terrúnia — Resquícios das Ruínas

Vertical slice jogável do RPG de progressão permanente de Terrúnia. O projeto transforma a especificação v0.4 em uma base React/TypeScript orientada a dados, com trilhas sequenciais, combate tático em turnos, primeira Ruína, Vínculos, Infusão, Lapidação de Joias, Skill Tree e save local-first.

## Personagem e plaquetas de NPCs v0.20

O menu reúne **Nexo, Personagem e Inventário** em uma tela **Personagem** com Status, Itens equipados, Mochila e Histórico recolhível. A mochila lateral não duplica os Vínculos nem mostra “No que estou me tornando”. NPCs em ruas e casas exibem nome e título/função em duas linhas. [Contrato UI v0.20](docs/CHARACTER_HUB_NPC_NAMEPLATES_v0.20.md).

## Equipamento vestido fora da mochila — save v17

A proteção simples equipada agora é transferida da mochila para um **slot persistente de equipamento**. Ela aparece na seção **Itens**, com **Retirar proteção** para voltar à mochila; saves antigos são migrados sem perda de instância ou refinamento. [Contrato técnico](docs/EQUIPPED_GEAR_SEPARATE_SLOT_v0.17.md).

## Interiores, equipamento vestido e NPCs v0.18

A proteção simples equipada deixa de ocupar espaço visual na grade da mochila (sem apagar a instância salva). Missões rastreadas e caminhos de Rosetta continuam dentro das casas, até NPCs ou saídas, com linhas douradas e azuis de sidequests. NPCs exibem título/função em linha itálica menor sob o nome. [Documento v0.18](docs/INTERIOR_QUEST_PATHS_EQUIPPED_NPC_LABELS_v0.18.md).

## Interações físicas e registro seguro de objetivos v0.26

A **Cama** da Base passou a exigir aproximação do personagem antes do descanso; o minigame só fecha após a gravação bem-sucedida do objetivo no save. [Detalhes](docs/TERRAN_OBJECT_INTERACTION_HARDENING_v0.26.md).

## Objetos interativos, minigames e diálogo de NPC v0.25

As missões de Terran de interação local passaram a depender de móveis clicáveis e de uma atividade resolvida (poções na estante de Daeryn, bestiário em livros de Vorren, marca investigativa de Astravél e ecos no Salão dos Clãs). A janela de NPC apresenta **missões primeiro** e **Conversar** na mesma lista. A cama mostra o subtítulo `descansar e recuperar`. [Contrato v0.25](docs/QUEST_OBJECT_MINIGAMES_NPC_DIALOG_v0.25.md).

## Base com chave obrigatória e lateral fixa v0.24

O acesso à Base foi corrigido para exigir **uso comprovado da Chave de Daeryn na porta**, revogando desbloqueios automáticos de saves legados. A lateral de Terran agora mostra **Missões fixas acima da Mochila**, paginadas e sem rolagem, sem as abas redundantes Menu/Local. [Contrato v0.24](docs/BASE_KEY_STRICT_FIXED_SIDEBAR_v0.24.md).

## Chave de Daeryn e portas clicáveis v0.23

A Base fica trancada até receber a Chave de Daeryn ao entregar **Um Lugar em Terran**. A chave permanece na mochila e é consumida em **Usar chave na porta**, deixando a casa permanentemente acessível. Todas as sete casas têm controles clicáveis em suas portas; saves antigos e respawn respeitam o bloqueio. [Detalhes técnicos](docs/DAERYN_KEY_AND_CITY_DOORS_v0.23.md).

## Confirmação direta de missões v0.22

Nos diálogos das missões dos NPCs, o botão intermediário **Ouvir a oferta** foi substituído por **Agora não** e **Aceitar missão** na própria missão selecionada. O aceite valida os requisitos e persiste em uma ação, sem recompensar antecipadamente. [Contrato v0.22](docs/QUEST_DIRECT_CONFIRMATION_v0.22.md).

## HUD de equipamentos em combate v0.21

A batalha agora lê os **cinco itens realmente equipados**, cinza os slots vazios e abre atributos por hover, foco ou toque; distingue proteção simples (Tier/refinamento) dos Vínculos (Grau/Ressonância) e resume apenas bônus diretamente atribuíveis ao equipamento. [Especificação e critérios](docs/BATTLE_EQUIPMENT_HUD_v0.21.md).

## Combate e espólios v0.17

A janela de combate agora se adapta à altura disponível. Ataque, Magias e Habilidades dividem um menu único; comandos sem recurso ficam cinza; ordem de iniciativa e começo de turno aparecem explicitamente. Os espólios podem ser recolhidos com uma ação, empilhando recursos repetidos sem fundir equipamentos únicos. [Regras e limites](docs/BATTLE_TURNS_LOOT_UI_v0.17.md).

## Rastreamento visual de missões v0.16

A aba **Missões** em Terran revela automaticamente a rota pontilhada da **única missão rastreada**: dourado para principal e azul claro a 20% para secundárias e caçadas. O jogador alterna o foco com Rastrear/Remover rastreamento. Rotas de Rosetta seguem separadas; saves antigos com múltiplas marcas são reconciliados. [Especificação v0.16](docs/QUEST_TRACKING_PATHS_v0.16.md).

## Observações contextuais nas missões

Orientações secundárias (como o destino de peças de reserva com Lorian/Feril) saem dos cards do inventário e passam ao campo opcional `contextNote` das missões, com apresentação cinza, itálica e discreta nos detalhes do Diário e nos diálogos dos NPCs. Não há alteração do save ou do gameplay. [Padrão UI](docs/QUEST_CONTEXT_NOTES_UI_v0.15.md).

## Equipamentos Tier I–III e inventário v0.15

A primeira missão de Rosetta agora visita o Mercado e, na entrega, o jogador escolhe **uma única proteção Tier I**. A próxima lição ensina a equipar e comprar; a última ensina a reforçar. O inventário suporta seleção única, tooltip de atributos no hover/foco e botão Equipar; os Tiers II/III são desbloqueados com a campanha. Saves migrados ao schema 16 preservam conquistas. [Direção e limites](docs/STARTER_GEAR_TIERS_REWARD_CHOICE_v0.15.md).

## Remake do fluxo de missões v0.14

O caminho inicial de Rosetta agora mantém a **túnica escolhida até o reforço**: equipar → comprar Tônico → aprimorar em Durnan. O couro é uma missão secundária opcional, e proteções simples reservas podem ser vendidas ou convertidas em Essência no Mercado, sem afetar Vínculos. O Diário e Rosetta compartilham o **Próximo passo**, incluindo hierarquia mais clara na aba lateral. Saves schema 15 são reconciliados sem reset de progresso. Detalhes: [remake v0.14](docs/QUEST_FLOW_REMAKE_v0.14.md).

## Tutorial de Rosetta v0.13

Rosetta ensina **equipar, comprar e aprimorar** em quatro missões: entrega duas túnicas na Mochila, orienta a compra de um Tônico e uma armadura simples com Neris e apresenta o reforço +1 de Durnan. Proteções simples têm bônus reais e usam o eixo Armadura antes do Vínculo permanente. Passar o cursor ou focar Rosetta mostra caminhos dourados para as principais e secundárias elegíveis; no celular, a orientação pode ser fixada pelo diálogo. O diário inicia as **Concluídas recolhidas**, com contador e expansão. Save 15, com migração preservando a campanha e aceite manual. Detalhes: [tutorial e orientação](docs/ROSETTA_TUTORIAL_v0.13.md).

## Conversas, diário e inventário v0.12

Missões aceitas usam marcadores cinza; entregas prontas recuperam destaque. Os diálogos têm uma única fala, retrato lateral e escolhas entre assuntos próprios dos **51 personagens**, além de perguntas sobre objetivos, materiais e recompensas. Diário e seletor do NPC usam linhas empilhadas, com a missão principal destacada acima das secundárias. O **Inventário abre na Mochila**; os status ficam no Nexo e no HUD. Saves continuam no schema 14. Detalhes: [conversas e organização dos painéis](docs/DIALOGUE_JOURNAL_INVENTORY_v0.12.md).

## Terran explorável e contratos v0.11

Terran agora ocupa **768×512**, com câmera acompanhando o jogador, minimapa, construções maiores e seis pontos interativos. Os NPCs ficaram 12,5% menores: apenas Rosetta mantém `?` vermelho, missões usam `!` amarelo e sidequests usam losangos azuis. Há **12 novas encomendas de drops e fragmentos**, com entrega real dos materiais e pagamento de 150% do valor comum de venda. Detalhes: [cidade e contratos](docs/TERRAN_EXPLORATION_AND_CONTRACTS_v0.11.md).

## Personagens, diálogos e forja v0.10

O sprite do jogador usa a imagem escolhida na criação; 51 aparências de NPCs têm o mesmo desenho no mapa e nos diálogos. A composição de conversa desta versão foi refinada na v0.12. O combate mostra a arma vinculada na mão e o jogador voltado para os inimigos. Não há limite de missões simultâneas. Neris vende materiais no Mercado, e Durnan produz componentes e aprimora a arma na nova Casa do Ferreiro, revelando dois nodes na Skill Tree. Detalhes: [personagens e forja](docs/CHARACTERS_DIALOGUE_FORGE_v0.10.md).

## Astravél v0.9

A rota do Portal agora tem **15 encontros de combate** em três trechos interligados a Eldamar, Vorren e Lithwynn, com monstros e materiais próprios, dois refúgios conquistados, minichefe e Colosso Micélio. Mundo pixelado 768×512 com câmera, minimapa, caminhada até objetivo e preservação dos saves anteriores. Detalhes: [remake de Astravél](docs/ASTRAVEL_REMAKE_v0.2.md).

## O que já é jogável

O fluxo atual cobre:

1. login com Google/Firebase ou convidado de desenvolvimento;
2. criação de um Terrírian sem Clã e sem Classe;
3. Vínculo da primeira arma permanente no prólogo;
4. Terran como Home jogável, com sete instituições ao redor da Praça do Portal;
5. interfaces próprias, minimapa persistente, serviços e NPCs para cada área da cidade;
6. conversa com Eldamar na Casa de Eldamar e aceitação da missão técnica `O Primeiro Rastro`;
7. validação da missão na Praça do Portal e entrada na trilha de Astravél;
8. combate por turnos contra um Fungorro;
9. recebimento de drop sem substituir o item vinculado;
10. conversão do drop em Essência ou venda por ouro;
11. obtenção de 1 Ponto de Essência e desbloqueio do primeiro node da arma;
12. liberação de `Golpe Ressonante` pelo efeito data-driven do node;
13. recuperação do acampamento em combate, suprimentos e repouso único;
14. progressão por 15 combates e grupos variados, com alvos independentes, Mana e status temporários;
15. missões dos caçadores/corrupção e abertura do limiar das Câmaras após vitória;
16. confronto contra o Colosso Micélio;
17. Fragmento de Essência preservado para Infusão, sem conversão ou venda;
18. retorno pela Praça do Portal e Rito de Evolução atômico na Oficina dos Vínculos;
19. arma vinculada elevada ao Grau II com Essência Micelial;
20. memória do boss e ramo micelial revelado na Skill Tree;
21. obtenção da Esmeralda do Crescimento como recompensa técnica do slice;
22. Rito de Lapidação com preview de efeito, compatibilidade e permanência;
23. arma vinculada elevada ao Grau III com exatamente uma Joia;
24. efeito próprio da Joia aplicado ao combate;
25. três nodes de Joia/sinergia revelados na Skill Tree;
26. persistência em IndexedDB e sincronização opcional com Firestore.
27. recrutamento data-driven dos quatro Clãs por três provas e confirmação explícita;
28. doze provas de Classe liberadas somente após o Vínculo do Clã;
29. missões simultâneas sem limite, com aceite e entrega explícitos em todas as categorias;
30. Main Lore adaptada por contexto de Clã e variante de Classe;
31. reset de campanha em duas etapas, com invalidação cloud e preservação da conta;
32. Mercado com nova vendedora e forja de materiais/aprimoramentos integrada à Skill Tree.

## Regras canônicas preservadas

- O personagem nasce sem Clã, sem Classe e sem build pronta.
- Arma, protetor, armadura, colar e pulseira são permanentes depois do Vínculo.
- Drops não substituem esses cinco itens.
- Uma barra completa concede exatamente 1 Ponto de Essência; excedente é preservado.
- Pontos de Essência não são concedidos diretamente por abates ou níveis.
- A Skill Tree tem domínios separados para Nexo, Clã, Classe e os cinco Vínculos.
- Itens vinculados usam exatamente sete Graus.
- O motor de combate é uma máquina de estados pura, fora do React.
- Missões existem no mundo antes do Journal e só entram após aceitação explícita do jogador.
- Clã e Classe exigem recrutamento, provas, elegibilidade e confirmação — não são seleções de menu.
- Habilidades, consumíveis, status, encontros e nós de trilha são conteúdo, não condicionais de UI.

## Executar

Requer Node.js 22+ e npm.

```bash
npm ci
cp .env.example .env.local
npm run dev
```

Sem configuração Firebase, o modo convidado de desenvolvimento permanece disponível e salva localmente. Para autenticação Google e nuvem, preencha as variáveis `VITE_FIREBASE_*` em `.env.local` e publique as regras de [`firestore.rules`](./firestore.rules).

## Publicar para jogar no navegador

O repositório inclui [`vercel.json`](./vercel.json) para preservar as rotas do aplicativo no deploy. O projeto Firebase associado é `terrunia-bf637`; Google Authentication, Firestore e as regras privadas por usuário estão ativos. A versão pública está em [terrunia.vercel.app](https://terrunia.vercel.app).

O roteiro completo e os testes de aceite estão em [`docs/DEPLOYMENT_FIREBASE_VERCEL.md`](./docs/DEPLOYMENT_FIREBASE_VERCEL.md).

## Validação

```bash
npm run check       # lint + tipos + testes unitários/integração + build
npm run e2e         # fluxo completo em navegador (requer Chromium do Playwright)
```

## Estrutura

```text
src/content/        catálogos e valores marcados como draft
src/domain/         regras puras de Vínculo, Essência, trilha, inventário, missões e combate
src/persistence/    schema versionado e IndexedDB
src/services/       Firebase, autenticação e sincronização
src/state/          coordenação de sessão e jogo
src/ui/             telas e componentes
public/assets/      registro visual substituível e placeholders
docs/               especificações, decisões e lacunas de conteúdo
```

## Autoridade documental

Em conflito, a precedência adotada é: decisões recentes do criador > `0B` > `0A` > seções novas > lore > legado. Consulte [`docs/GAMEPLAY_RECRUITMENT_AND_RESET.md`](./docs/GAMEPLAY_RECRUITMENT_AND_RESET.md), [`docs/CANON_DECISIONS.md`](./docs/CANON_DECISIONS.md), [`docs/TERRAN_CITY_STRUCTURE.md`](./docs/TERRAN_CITY_STRUCTURE.md) e [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) antes de ampliar sistemas.

Valores provisórios estão explicitamente marcados como `BALANCE_DRAFT`, `CONTENT_DRAFT`, `VISUAL_DRAFT` ou `OWNER_DECISION` no código e na documentação.
