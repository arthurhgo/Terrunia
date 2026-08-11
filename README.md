# Terrúnia — Resquícios das Ruínas

Vertical slice jogável do RPG de progressão permanente de Terrúnia. O projeto transforma a especificação v0.4 em uma base React/TypeScript orientada a dados, com trilhas sequenciais, combate tático em turnos, primeira Ruína, Vínculos, Infusão, Lapidação de Joias, Skill Tree e save local-first.

## O que já é jogável

O fluxo atual cobre:

1. login com Google/Firebase ou convidado de desenvolvimento;
2. criação de um Terrírian sem Clã e sem Classe;
3. Vínculo da primeira arma permanente no prólogo;
4. conversa com Eldamar em Terran;
5. aceitação da missão técnica `O Primeiro Rastro`;
6. entrada na trilha de Astravél;
7. combate por turnos contra um Fungorro;
8. recebimento de drop sem substituir o item vinculado;
9. conversão do drop em Essência ou venda por ouro;
10. obtenção de 1 Ponto de Essência e desbloqueio do primeiro node da arma;
11. liberação de `Golpe Ressonante` pelo efeito data-driven do node;
12. progressão pelo acampamento abandonado e obtenção de um consumível;
13. combate contra três Fungorros com alvos independentes, Mana e status temporários;
14. descoberta do limiar das Câmaras Fúngicas;
15. confronto contra o Colosso Micélio;
16. Fragmento de Essência preservado para Infusão, sem conversão ou venda;
17. retorno a Terran e Rito de Evolução atômico;
18. arma vinculada elevada ao Grau II com Essência Micelial;
19. memória do boss e ramo micelial revelado na Skill Tree;
20. obtenção da Esmeralda do Crescimento como recompensa técnica do slice;
21. Rito de Lapidação com preview de efeito, compatibilidade e permanência;
22. arma vinculada elevada ao Grau III com exatamente uma Joia;
23. efeito próprio da Joia aplicado ao combate;
24. três nodes de Joia/sinergia revelados na Skill Tree;
25. persistência em IndexedDB e sincronização opcional com Firestore.

## Regras canônicas preservadas

- O personagem nasce sem Clã, sem Classe e sem build pronta.
- Arma, protetor, armadura, colar e pulseira são permanentes depois do Vínculo.
- Drops não substituem esses cinco itens.
- Uma barra completa concede exatamente 1 Ponto de Essência; excedente é preservado.
- Pontos de Essência não são concedidos diretamente por abates ou níveis.
- A Skill Tree tem domínios separados para Nexo, Clã, Classe e os cinco Vínculos.
- Itens vinculados usam exatamente sete Graus.
- O motor de combate é uma máquina de estados pura, fora do React.
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

Em conflito, a precedência adotada é: `0B > 0A > seções novas > lore > legado`. Consulte [`docs/CANON_DECISIONS.md`](./docs/CANON_DECISIONS.md) antes de alterar regras de jogo e [`docs/ARCHITECTURE.md`](./docs/ARCHITECTURE.md) antes de ampliar sistemas.

Valores provisórios estão explicitamente marcados como `BALANCE_DRAFT`, `CONTENT_DRAFT`, `VISUAL_DRAFT` ou `OWNER_DECISION` no código e na documentação.
