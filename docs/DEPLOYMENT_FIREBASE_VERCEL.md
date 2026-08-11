# Deploy público — Firebase + Vercel

## Estado

- Projeto Firebase criado: `terrunia-bf637`.
- Aplicativo Web `Terrunia Web` registrado.
- O frontend já lê as seis variáveis públicas `VITE_FIREBASE_*`.
- O login Google cria/atualiza `users/{uid}`.
- Cada gravação de nuvem atualiza o save e `activeSaveId` no mesmo batch.
- `vercel.json` redireciona rotas do `BrowserRouter` para `index.html`.
- Google Authentication está ativo.
- Firestore foi criado em modo de produção e as regras privadas por usuário foram publicadas em 2026-08-11.
- O deploy e as variáveis públicas da Vercel ainda precisam ser configurados.

Nenhum client secret, service account ou token administrativo deve ser usado no frontend.

## 1. Firebase Console

Concluído em 2026-08-11. O roteiro abaixo permanece como referência operacional.

No projeto `terrunia-bf637`:

1. Cadastre um aplicativo Web chamado `Terrunia Web`.
2. Copie os seis valores exibidos para uso posterior na Vercel:

```text
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```

3. Em Authentication, ative somente o provider Google para este corte.
4. Configure o e-mail de suporte solicitado pelo Google.
5. Crie o Firestore em modo de produção.
6. Na aba de regras do Firestore, substitua o conteúdo pelo arquivo `firestore.rules` deste repositório e publique.

As regras permitem que cada conta leia e escreva apenas seu próprio perfil, saves e configurações. Exclusão de perfil e save permanece bloqueada.

## 2. Vercel

1. Importe `arthurhgo/Terrunia`.
2. Use o diretório raiz do repositório.
3. Confirme:

```text
Framework: Vite
Install Command: npm ci
Build Command: npm run build
Output Directory: dist
```

4. Cadastre as seis variáveis `VITE_FIREBASE_*` nos ambientes Production e Preview.
5. Faça o deploy.

Não cadastrar `VITE_ALLOW_DEV_GUEST` na Vercel. O convidado atual é restrito a desenvolvimento e testes.

## 3. Domínio autorizado

Depois que a Vercel criar o endereço público:

1. copie somente o domínio, sem `https://` e sem caminho;
2. abra Firebase Authentication → Settings → Authorized domains;
3. adicione o domínio da Vercel;
4. repita o teste de login no endereço público.

## 4. Aceite antes de divulgar

- login Google abre e retorna ao Terrúnia;
- uma conta cria um Terrírian e gera `users/{uid}/saves/{saveId}`;
- `users/{uid}.activeSaveId` aponta para esse save;
- logout e novo login recuperam a campanha;
- outro navegador com a mesma conta recupera a campanha da nuvem;
- outra conta não consegue ler o primeiro usuário;
- atualizar diretamente `/terran`, `/battle` e `/skill-tree` não produz 404;
- nenhuma variável privada aparece no repositório.

## OWNER_DECISION

O build público atual exige Google Login. Liberar “Jogar sem conta” em produção continua pendente; se aprovado, deve ser implementado como sessão local separada e nunca fingir sincronização de nuvem.
