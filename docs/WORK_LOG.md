# Registro de implementação

## Terran v0.12 — conversas, diário e inventário (2026-10-30)

- tornados cinza o marcador e a notificação de missão aceita, com prioridade de entrega pronta sobre aceita e nova oferta;
- substituídos retratos grandes e texto duplicado por retrato lateral, caixa única de fala e respostas interativas, mantendo foco, Escape e layout móvel;
- escritas 51 vozes com três assuntos exclusivos cada e 25 apresentações de missão na voz do NPC; perguntas sobre objetivo, drops e recompensa usam os dados reais;
- reorganizados diário e seletor do NPC em linhas de largura inteira, principal destacada acima das secundárias e histórico no fim;
- separado o Nexo do Inventário, que abre na Mochila e exibe os Vínculos depois, preservando o HUD;
- cobertos ramos de conversa, ausência de mutações, ordenação, foco, cores, filtros, inventário e fluxo de navegador com fixtures explícitas;
- versão do app 0.12.0, mantendo schema 14 e compatibilidade com saves anteriores; detalhes em `DIALOGUE_JOURNAL_INVENTORY_v0.12.md`.

## Terran v0.11 — cidade ampliada e encomendas de materiais (2026-10-30)

- ampliado o mundo de Terran para 768×512 com câmera 384×256 seguindo o jogador, minimapa com viewport e navegação física até destinos;
- aumentadas as construções, separados os moradores pelas ruas e adicionados seis pontos de exploração com colisão, inspeção e descoberta persistida;
- reduzidos os NPCs a 28 px, mantendo a arte de retrato e diferenciando `?` vermelho de Rosetta, `!` amarelo das missões e losangos azuis das sidequests;
- criados 12 contratos de entrega com ouro proporcional, seleção entre missões do mesmo NPC, quadro de encomendas e indicação dos materiais na mochila;
- criado Fragmento de Eco comercial com drop em Astravél, Vigília da Ruína e Ondas, sem consumir o componente de Infusão;
- implementado consumo atômico, proteção dos materiais e recálculo de contratos concorrentes após qualquer mudança de inventário;
- corrigida a revenda lucrativa dos materiais de Neris e introduzida migração 13→14 sem recompensas ou aceite automático;
- ampliados testes de contratos, migração, marcadores, câmera, colisão, descoberta e fluxo real de combate → coleta → entrega → reload;
- detalhes em `TERRAN_EXPLORATION_AND_CONTRACTS_v0.11.md`.

## Terran v0.10 — elenco, diálogos, missões e forja (2026-10-30)

- usada a imagem escolhida do jogador como sprite na cidade, interiores e instâncias; combate e diálogo compõem a arma vinculada na mão;
- criadas 51 aparências pixeladas distintas com registro único para sprite e retrato, incluindo Rosetta, Neris e Durnan;
- padronizada a janela vermelha com interrogação acima dos NPCs e implementado diálogo com dois personagens e caixa inferior;
- removido o limite de três missões do domínio, UI e validação, mantendo aceite manual, pré-requisitos e entrega;
- adicionada Neris ao Mercado e criada Casa do Ferreiro com fachada, interior, fornalha, bigorna e Durnan residente;
- criados três materiais, cinco receitas e dois aprimoramentos permanentes da mesma arma, revelando dois nodes pagos com Pontos de Essência;
- criado save 13 com migração que preserva campanha e introduz os novos NPCs sem distribuir recompensas;
- atualizadas as decisões de cânone para a autorização mais recente do criador; detalhes em `CHARACTERS_DIALOGUE_FORGE_v0.10.md`.

## Astravél v0.9 — remake de quinze combates (2026-10-30)

- substituída a rota de seis marcos por chegada + 15 nós com combate, três trechos e grupos de até três inimigos;
- ligadas as investigações de Vorren e Lithwynn a vitórias, aceite manual, gates, entrega e Journal existente;
- ampliado mundo para 768×512, com câmera 384×256, minimapa, caminhada até objetivo e sprites dos grupos no terreno;
- adicionados Titan Raiz-Negra, três materiais, Emblema protegido e dois refúgios com recuperação/suprimentos após vitória única;
- recompensas derivadas dos monstros e proteção contra combate iniciado fora da instância ou durante outro combate;
- criado save 12 com migração de campanhas parciais, em combate e concluídas, sem perder Vínculos, recursos ou snapshots;
- atualizados manifest/atlas e reparados cinco PNGs de NPCs corrompidos a partir dos desenhos-fonte existentes;
- criada integração dos 15 encontros, entregas, conversões, ritos II/III e reload; ampliados testes de migração e referências;
- documentação detalhada e limites em `ASTRAVEL_REMAKE_v0.2.md`.

## Terran v0.8 — cadeia inicial, alojamento e comércio

- adicionadas três etapas progressivas após Eldamar: Daeryn (casa), Vorren (bestiário) e Lithwynn (inscrições), com objetivo, aceite, entrega e recompensas declarativas;
- preservadas as seis instituições e a Praça; o quarto do jogador é propriedade privada mostrada na mesma viewport, sem rota/instituição extra;
- criada persistência de PV/MP atuais com schema 8, migração de saves existentes e atualização durante os turnos;
- implementados repouso gratuito fora de combate, socorro emergencial após derrota e bloqueio de novas batalhas com PV zero;
- montado o Balcão de Sylwen dentro de Daeryn com quatro produtos e economia validada no domínio;
- criados sprites nativos 16×16 e painel da casa em grade 20×12, com fallback por registro central;
- adicionados seleção de consumível e efeitos de restauração de Mana/antídoto, sem mudar os cinco Vínculos;
- registrados limites, drafts e próximas missões em `docs/TERRAN_PROGRESSION_AND_SERVICES_v0.1.md`.

## Conta v0.6 — personagem único e retomada explícita

- adicionada tela obrigatória de acesso para contas com Terrírian salvo;
- exibidos identidade, nível, Clã, Classe, localização, horário e modo de persistência antes de entrar;
- adicionada escolha entre continuar a campanha e criar outro personagem;
- reutilizado `CampaignReset` com duas confirmações e texto `RESETAR` para substituir o Terrírian;
- bloqueada criação direta enquanto existe personagem ativo no store;
- bloqueado no Firestore um segundo `saveId` ativo na mesma conta e geração;
- feito o primeiro save aguardar a persistência antes de avançar ao prólogo;
- preservados Conta Google, autenticação e preferências ao criar nova campanha;
- adicionados testes de boot, liberação da sessão, bloqueio de duplicidade e confirmação de substituição.

## Terran v0.5 — escala, livre navegação e combate contextual

- igualada a escala do Terrírian à dos NPCs em 16×16 em Terran, Astravél, Câmaras e combate;
- adicionada aura amarela pixelada compartilhada para identificação do jogador sem alterar atributos ou colisão;
- liberado o deslocamento por toda a área de Astravél, com colisão determinística nas bordas e árvores visíveis e progressão ainda exclusiva dos marcos;
- transformado o shell imersivo em viewport `100dvh`, sem rolagem vertical do documento e com rolagem interna nos drawers;
- adicionado percurso persistente da base até o contexto atual no cabeçalho;
- mantido o mapa da instância como fundo do combate por turnos, sem desmontar `/play`;
- incluído fallback UUID v4 para origens locais sem `crypto.randomUUID`, preservando Web Crypto;
- validado em navegador o fluxo Terran → Portal → Astravél → batalha → retorno à instância, incluindo um turno real, recompensa e ausência de scroll;
- ampliados testes de escala, navegação livre, colisão visível e percurso da viewport unificada.

## Terran v0.4 — viewport única de exploração e combate

- criada rota persistente `/play` para Terran, Astravél, Câmaras Fúngicas e combate;
- centralizada a seleção da cena em função pura com prioridade para batalha ativa;
- mantido o `GameShell` montado durante Portal, deslocamento, encontro, vitória e retorno;
- adaptado o combate para a mesma moldura 384×256, HUD sobre o cenário e painel lateral da cidade;
- adicionadas transições visuais entre exploração, dungeon e combate com suporte a movimento reduzido;
- mantidos pathfinding, nodes urbanos, NPCs, painéis e canvas de Terran já implementados;
- preservada a máquina de estados de combate e toda a persistência local/cloud;
- adicionados testes para seleção de cena e troca exploração→combate sem mudança de rota.

## Hotfix — Firestore e carregamento de batalha

- identificado erro público de `Transaction.set()` provocado por `battle.combatants.*.aiSkillEveryRounds: undefined` em saves com Fungorro Rastejante;
- corrigida a criação do combatente para omitir a propriedade opcional quando a definição do inimigo não possui cadência de skill;
- protegidos os caminhos de gravação e invalidação de campanhas no Firestore por sanitização recursiva de dados JSON, mantendo o save local intacto;
- adicionados testes para o caso real de save legado, operação de transação simulada, comportamento de IA e estruturas aninhadas;
- preservadas autenticação, identidade da campanha, inventário, progressão e arquivos locais; nenhuma exclusão ou reset foi necessário.

## Terran — Home e sete áreas jogáveis

- substituído o dashboard que tratava Portal como painel principal por `/terran` como mapa/Home;
- cadastradas as seis instituições e a Praça do Portal com IDs, funções, serviços, NPCs e estados de presença;
- criada rota `/terran/:locationId` com interface específica para cada área;
- adicionados minimapa persistente, posição do jogador, destino de missão e progresso de descoberta 0/7–7/7;
- tornada obrigatória a Praça do Portal para acessar Astravél e definido o retorno de instância à Praça;
- movidos Vínculos, inventário e Ritos para a Oficina dos Vínculos;
- mantida a missão técnica atual no fluxo Eldamar → Portal → Astravél, sem inventar visitas obrigatórias a outras instituições;
- adicionados motor puro, validação de conteúdo, testes unitários, integração e E2E da cidade;
- registradas as substituições de cânone em `TERRAN_CITY_STRUCTURE.md`.

## v0.4 — Grau III e sistema de Joias

- cadastrado banco tipado com as dez Joias registradas pela especificação v0.4;
- mantidos efeitos, compatibilidades e origens do slice como `BALANCE_DRAFT`/`CONTENT_DRAFT`;
- adicionada Esmeralda do Crescimento como componente jogável sem permitir venda ou conversão;
- implementado avaliador data-driven de compatibilidade entre Essência e Joia;
- implementado Rito de Grau III atômico com validação de Terran, 300 de Ressonância, proteção, compatibilidade e slot;
- aplicada a propriedade própria da Joia ao cálculo de combate independentemente da compra de nodes;
- revelados `Foco Lapidado`, `Amplificação Lapidada` e `Convergência Micelial` por hooks de conteúdo;
- alterada a recompensa provisória do Colosso para fechar exatamente 300 de Ressonância no percurso completo;
- criada migração v3→v4 que reconcilia Ressonância e Esmeralda para saves que já derrotaram o Colosso;
- endurecida validação de save para capacidade de slots, componentes cadastrados e composição exata dos Graus II–III;
- adicionados preview, confirmação de permanência, inventário reservado e representação visual do Grau III;
- ampliados testes de domínio, schema, integração e E2E até Lapidação → Skill Tree → reload;
- revisadas telas do rito e do Grau III em desktop/mobile.

## v0.3.1 — preparação Firebase e deploy público

- registrado o projeto Firebase `terrunia-bf637` sem versionar chaves ou credenciais;
- registrado o aplicativo Web `Terrunia Web`, ativado o login Google e publicado o Firestore em modo de produção com regras privadas por usuário;
- isolado o ambiente de testes para impedir conexões acidentais com o Firebase real;
- criado perfil privado por usuário com `activeSaveId`;
- corrigida a descoberta do save em um novo navegador/dispositivo;
- tornado atômico o batch que grava save e referência ativa;
- endurecidas as regras para perfil, IDs, tipos e campos permitidos;
- adicionados testes de sincronização local-first e recuperação cross-device;
- adicionado rewrite SPA para Vercel;
- documentado o checklist Firebase, Vercel e validação pública;
- mantido o convidado em produção como `OWNER_DECISION`.

## v0.3 — Câmaras Fúngicas e Grau II

- integrado o PR v0.2 à `main` após CI aprovado;
- transformado o nó final das Câmaras Fúngicas em encontro de boss acessível somente após o limiar;
- cadastrado Colosso Micélio como boss canônico com stats e habilidade marcados `BALANCE_DRAFT`;
- adicionadas localização e mensagens de vitória data-driven aos encontros;
- concedido Fragmento de Essência Micelial protegido de venda/conversão e preparado para Infusão;
- registradas memória do boss e flags de mundo como recompensas declarativas;
- implementado Rito de Grau II atômico com validação de Terran, Ressonância, componente, proteção e slot;
- removido o Fragmento somente no mesmo commit que avança Grau, insere Essência e grava Memória;
- revelado o ramo micelial existente da Skill Tree pelo componente, sem condição de UI;
- criada migração de save v2→v3 que distingue boss bloqueado de boss atual;
- corrigida colisão de IDs de loot entre encontros sob UUID determinístico;
- ampliados testes unitários, integração e E2E até boss → Infusão → reload;
- revisados Portal, boss, modal do rito e tela do Grau II em desktop/mobile.

## v0.2 — trilha e combate tático

- integrada a fundação v0.1 na `main` após CI aprovado;
- criada progressão sequencial data-driven para seis nós de Astravél;
- implementados acampamento, recompensa de consumível e limiar da primeira Ruína;
- ampliado combate para 1–3 inimigos com seleção independente de alvo e timeline;
- adicionados Mana, habilidade desbloqueada por node, consumível e status temporários;
- adicionada IA determinística que usa Explosão de Esporos em cadência configurável;
- criada migração de save v1→v2 sem perda de progresso permanente;
- ampliadas validações de referências de conteúdo;
- ampliados testes unitários, integração e E2E até o limiar das Câmaras Fúngicas;
- revisados Portal e combate em desktop/mobile com placeholders substituíveis.

## v0.1 — vertical slice fundacional

- auditadas as especificações 0B/0A, documentos auxiliares, lore e referência visual;
- registrada a precedência do cânone e as decisões provisórias;
- criada a aplicação React 19 + TypeScript + Vite;
- implementados catálogos orientados a dados;
- implementados motores puros de Essência, inventário, Vínculo, Skill Tree, missão e combate;
- criado save versionado local-first com IndexedDB e Firestore opcional;
- criado login Google/Firebase e convidado de desenvolvimento;
- construído o loop Terran → Eldamar → Astravél → Fungorro → drop → Essência → node;
- criada interface responsiva inspirada no painel arcano da referência, sem transformar placeholders em cânone;
- adicionados registro de assets, fallbacks e SVGs temporários;
- adicionados testes unitários, integração do vertical slice e roteiro E2E;
- validado o fluxo completo em Chromium, incluindo persistência após reload;
- conferidos dashboard desktop, dashboard mobile, login e Skill Tree por screenshots headless;
- adicionadas regras de Firestore, CI e documentação operacional.
