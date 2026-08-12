# Terrúnia — Resquícios das Ruínas

Vertical slice jogável do RPG de progressão permanente de Terrúnia. O projeto transforma a especificação v0.4 em uma base React/TypeScript orientada a dados, com trilhas sequenciais, combate tático em turnos, primeira Ruína, Vínculos, Infusão, Lapidação de Joias, Skill Tree e save local-first.

## O que já é jogável

O fluxo atual cobre:

1. login com Google/Firebase ou convidado de desenvolvimento;
2. criação de um Terrírian sem Clã e sem Classe;
3. Vínculo da primeira arma permanente no prólogo;
4. Terran como Home jogável, com seis instituições ao redor da Praça do Portal;
5. interfaces próprias, minimapa persistente, serviços e NPCs para cada área da cidade;
6. conversa com Eldamar na Casa de Eldamar e aceitação da missão técnica `O Primeiro Rastro`;
7. validação da missão na Praça do Portal e entrada na trilha de Astravél;
8. combate por turnos contra um Fungorro;
9. recebimento de drop sem substituir o item vinculado;
10. conversão do drop em Essência ou venda por ouro;
11. obtenção de 1 Ponto de Essência e desbloqueio do primeiro node da arma;
12. liberação de `Golpe Ressonante` pelo efeito data-driven do node;
13. progressão pelo acampamento abandonado e obtenção de um consumível;
14. combate contra três Fungorros com alvos independentes, Mana e status temporários;
15. descoberta do limiar das Câmaras Fúngicas;
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
29. limite global de três missões aceitas, compartilhado por todas as categorias;
30. Main Lore adaptada por contexto de Clã e variante de Classe;
31. reset de campanha em duas etapas, com invalidação cloud e preservação da conta.

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
