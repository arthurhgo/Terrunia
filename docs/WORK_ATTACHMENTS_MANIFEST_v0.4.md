# TERRÚNIA — MANIFESTO DE ARQUIVOS PARA ANEXAR AO WORK v0.4

Este arquivo define o conjunto recomendado de contexto para uma nova conversa do ChatGPT Work responsável por construir/revisar o app de Terrúnia.

## A. ANEXE SEMPRE — NÚCLEO DE IMPLEMENTAÇÃO

1. `TERRUNIA_WORK_GITHUB_MASTER_PROMPT_v0.4.md`
   - instrução operacional do agente.

2. `TERRUNIA_GAME_APP_MASTER_SPEC_v0.4.md`
   - regra técnica/canônica principal.

3. `ui-terrunia-main-v0.4.png`
   - referência visual atual aprovada: inventário limpo, itens vinculados vazios/placeholder e Skill Tree em aba separada.

4. `WORK_ATTACHMENTS_MANIFEST_v0.4.md`
   - informa precedência e quais fontes consultar.

5. `AUTH_AND_SAVE_FIREBASE_v0.4.md`
   - login Google, Firestore, IndexedDB e regras de segurança.

## B. ANEXE PARA LORE + CONTEÚDO JOGÁVEL

Prioridade alta:

6. `Introdução Terrúnia.txt`
7. `Universo Terrúnia.txt`
8. `Clãs de Terran.txt`
9. `SISTEMA CLASSES E CLÃS.txt`
10. `NPCS TERRÚNIA.txt`
11. `🌿 Terran_ O Despertar das Sombras (SEASON 1).txt`
12. `Ruínas Perdidas de Terran_ As Dungeons da Entropia.txt`
13. `Terrúnia_ Bioma e Ecosistema.txt`
14. `Manual Criação v2.2.txt`
15. `Terrúnia - Manual de criação do Player.txt`

Esses arquivos dão nomes, personagens, missões, inimigos, regiões e versões de regras históricas. Quando conflitarem com v0.4, a v0.4 vence mecanicamente.

## C. ANEXE SOMENTE QUANDO FOR TRABALHAR A NARRATIVA/HISTÓRIA

16. `A Ascensão da Ruína Crescente.txt`
17. `A Ascensão da Ruína Crescente_ Crônicas de Aelior Thamorel.txt`
18. `Relato de Um Eco – Primeira Presença em Terrúnia Transmissão de Vex'Al-Nyr.txt`
19. `Vyltranos e Lunakaris.txt`
20. `Familias de Vyltran.txt`

## D. LEGACY — NÃO ANEXAR NO PRIMEIRO TURNO, A MENOS QUE O WORK PRECISE MIGRAR CÓDIGO

21. `Terrunia - O Início das Ruínas.html`
22. `terrunia resquicios da ruinas.txt`
23. `📜 Terrúnia - RPG (Baseado em Savage Worlds).txt`
24. `TERRUNIA_APP_SYSTEM_SPEC.md` antigo
25. pacotes v0.2/v0.3 anteriores

Motivo: eles contêm arquiteturas/regras antigas que podem fazer o agente regredir para item trocável, criação com Clã/Classe, fórmulas legacy ou estrutura monolítica.

Se forem anexados, diga explicitamente:

> “Use estes arquivos apenas para extrair conteúdo ou comportamento histórico. Não use suas regras quando divergirem da v0.4.”

## E. SE O WORK ESTIVER CONECTADO AO GITHUB

Não é necessário reanexar arquivos que já estejam versionados no repositório e acessíveis ao agente, desde que o prompt diga os caminhos exatos.

Coloque no repo:

```text
docs/TERRUNIA_GAME_APP_MASTER_SPEC_v0.4.md
docs/TERRUNIA_WORK_GITHUB_MASTER_PROMPT_v0.4.md
docs/WORK_ATTACHMENTS_MANIFEST_v0.4.md
docs/AUTH_AND_SAVE_FIREBASE_v0.4.md
docs/reference/ui-terrunia-main-v0.4.png
```

Fontes de lore podem ficar em:

```text
/docs/lore-source/
```

## F. ORDEM DE LEITURA QUE DEVE APARECER NO PROMPT

```text
1. Prompt mestre v0.4
2. Master Spec v0.4 — seção 0B
3. Master Spec v0.4 — seção 0A
4. UI de referência
5. Auth/Save
6. Conteúdo/lore
7. Código atual do repo
8. Legacy apenas se necessário
```

## G. NÃO ANEXE TODAS AS VERSÕES DO MESMO DOCUMENTO

Para evitar conflito, não entregue simultaneamente v0.1, v0.2, v0.3 e v0.4 como se tivessem mesma autoridade.

A v0.4 deve ser a fonte técnica principal.
