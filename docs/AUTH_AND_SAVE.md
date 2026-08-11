# Autenticação e save

## Fluxo

1. `authStore` inicializa o Firebase Auth quando as variáveis `VITE_FIREBASE_*` existem.
2. O login Google garante o perfil privado `users/{uid}` com `activeSaveId`.
3. Em desenvolvimento, `dev-guest` permite validar o jogo sem infraestrutura externa.
4. O jogo carrega primeiro o save local versionado em IndexedDB.
5. Sem save local, consulta `activeSaveId` para recuperar a campanha em outro dispositivo.
6. Com Firebase configurado, compara o save local com `users/{uid}/saves/{saveId}`.
7. A maior `revision` vence; em empate, vence o `updatedAt` mais recente.
8. Cada mutação entra numa fila de gravação para preservar a ordem.
9. Save e alteração de `activeSaveId` são enviados no mesmo batch do Firestore.

## Segurança

- Nenhuma credencial é versionada.
- Testes automatizados ignoram a configuração local e nunca acessam o projeto Firebase real.
- As regras de Firestore isolam os dados pelo UID autenticado.
- O perfil aceita somente os campos declarados e não permite alterar `createdAt`.
- O `ownerId` do documento deve coincidir com o UID da rota.
- O `saveId` do payload deve coincidir com o ID do documento.
- O schema Zod rejeita payloads incompatíveis antes de colocá-los no estado.

## Versionamento

O save possui `schemaVersion`, `gameVersion`, `revision`, `createdAt` e `updatedAt`. O carregador atual aceita apenas a versão conhecida. Migrações devem ser explícitas e cobertas por fixtures antes de incrementar o schema.

## Pendência

A preservação automática da versão perdedora em conflitos de nuvem é `OWNER_DECISION`. O slice usa a política determinística descrita acima.

O modo convidado no build público também permanece `OWNER_DECISION`. Hoje ele existe apenas em desenvolvimento e testes.
