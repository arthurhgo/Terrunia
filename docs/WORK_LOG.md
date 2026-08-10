# Registro de implementação

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
