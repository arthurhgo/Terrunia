# Autenticação e save

## Fluxo

1. `authStore` inicializa o Firebase Auth quando as variáveis `VITE_FIREBASE_*` existem.
2. Em desenvolvimento, `dev-guest` permite validar o jogo sem infraestrutura externa.
3. O jogo carrega primeiro o save local versionado em IndexedDB.
4. Com Firebase configurado, compara o save local com `users/{uid}/saves/{saveId}`.
5. A maior `revision` vence; em empate, vence o `updatedAt` mais recente.
6. Cada mutação entra numa fila de gravação para preservar a ordem.

## Segurança

- Nenhuma credencial é versionada.
- As regras de Firestore isolam os dados pelo UID autenticado.
- O `ownerId` do documento deve coincidir com o UID da rota.
- O schema Zod rejeita payloads incompatíveis antes de colocá-los no estado.

## Versionamento

O save possui `schemaVersion`, `gameVersion`, `revision`, `createdAt` e `updatedAt`. O carregador atual aceita apenas a versão conhecida. Migrações devem ser explícitas e cobertas por fixtures antes de incrementar o schema.

## Pendência

A preservação automática da versão perdedora em conflitos de nuvem é `OWNER_DECISION`. O slice usa a política determinística descrita acima.
