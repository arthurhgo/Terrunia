# TERRÚNIA — LOGIN GOOGLE, SAVE LOCAL E NUVEM v0.4

## 1. Objetivo

O app deve associar o progresso do jogador à Conta Google por meio do Firebase Authentication e sincronizar saves com Firestore, mantendo IndexedDB para cache/local-first.

## 2. Componentes

```text
Firebase Authentication — identidade
Google provider — login
Firestore — profile/save cloud
IndexedDB — save/cache local
```

## 3. Fluxo

```text
/login
→ Sign in with Google
→ Firebase retorna User
→ garantir /users/{uid}
→ consultar save local
→ consultar save cloud
→ migrar schema
→ resolver versão mais nova
→ se existe Terrírian: perguntar Continuar ou Criar outro
→ carregar jogo ou invalidar a geração anterior antes da nova criação
```

Cada `uid` mantém exatamente um `activeSaveId` e um Terrírian ativo. Um novo acesso inicia em `/character/access`; escolher **Continuar** libera o save carregado. Escolher **Criar outro** reutiliza o fluxo crítico `CampaignReset`, com duas confirmações e a palavra `RESETAR`, antes de abrir `/character/create`.

## 4. Variáveis de ambiente

Criar `.env.local` a partir de `.env.example`.

```text
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

Não incluir client secret OAuth no frontend.

## 5. Estrutura Firestore

```text
/users/{uid}
  displayName
  email
  photoURL
  createdAt
  lastLoginAt
  activeSaveId

/users/{uid}/saves/{saveId}
  schemaVersion
  gameVersion
  createdAt
  updatedAt
  payload

/users/{uid}/meta/settings
```

## 6. Firestore Rules — princípio

Somente `request.auth.uid == uid` pode ler/escrever o caminho do usuário.

## 7. Sync

Cada save deve ter:

```text
schemaVersion
revision
updatedAt
clientId
checksum opcional
```

Estratégia draft:

1. sem cloud → subir local;
2. sem local → baixar cloud;
3. ambos iguais → continuar;
4. revisions diferentes → usar `updatedAt` e manter backup do perdedor;
5. schema antigo → migrar antes de carregar.

Na mesma `campaignGeneration`, o Firestore rejeita uma gravação cujo `saveId` seja diferente do `activeSaveId` já registrado. Um novo personagem só pode assumir a conta após o reset incrementar a geração, invalidar o save anterior e limpar a referência ativa.

A política final de conflito é `OWNER_DECISION`.

## 8. Logout

Logout remove sessão Firebase, mas não apaga automaticamente o save local. A tela deve oferecer ação explícita para remover dados locais daquele dispositivo.

## 9. Desenvolvimento

Pode existir `VITE_ALLOW_DEV_GUEST=true` somente em desenvolvimento/teste automatizado para evitar bloquear testes E2E. Produção deve usar login conforme decisão do criador.

## 10. GitHub

Commitar:

- `.env.example`
- `firestore.rules`
- código Firebase/Auth

Nunca commitar:

- `.env.local`
- credenciais privadas
- chaves de serviço/admin

## 11. UI

A tela `/login` deve manter identidade Terrúnia, mas o controle de login Google deve seguir o fluxo oficial do provider. Não criar um botão falso que coleta email/senha Google.

Após autenticação e sincronização, `/character/access` sempre apresenta o Terrírian da conta em um novo carregamento da aplicação. A escolha vale apenas para a sessão atual; reload ou novo login exige nova decisão.
