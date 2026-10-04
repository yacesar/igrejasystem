# Ambiente de desenvolvimento

## Pré-requisitos

- Node 22 (`.nvmrc`) e pnpm 10 (`corepack enable`)
- Um projeto **Supabase** (gratuito) para autenticação e banco
- Opcional: Postgres 16 local só para rodar os testes de RLS sem o Supabase

## 1. Instalar

```bash
pnpm install
cp .env.example .env
```

## 2. Supabase

1. Crie um projeto em <https://supabase.com/dashboard> (região `sa-east-1`, São Paulo).
2. Em **Project Settings → API**, copie a URL e a chave pública (`anon` / `publishable`) para `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
3. Em **Project Settings → Database → Connection string**, copie a URI (modo _Session_, porta 5432) para `DATABASE_URL`.
4. Em **Authentication → URL Configuration**, adicione `http://localhost:3000/auth/callback` às _Redirect URLs_.
5. Em **Authentication → Providers → Email**, mantenha e-mail/senha ativo. Para o piloto, desative _Confirm email_ se quiser entrar sem confirmar.

## 3. Migrações

```bash
pnpm db:migrate
```

Aplica `packages/db/drizzle/*.sql`: tabelas, funções `app.*`, políticas de RLS e o trigger que cria `profiles` ao registrar um usuário no Supabase Auth.

## 4. Rodar

```bash
pnpm dev
```

Abra <http://localhost:3000>, crie uma conta em **Entrar** (ou crie o usuário no painel do Supabase) e siga o onboarding, que cria a igreja, a sede e a primeira congregação e torna você administrador.

### Seed da ADEMAN (opcional)

Com um usuário já criado no Supabase Auth, copie o UUID dele (Authentication → Users) e rode:

```bash
pnpm db:seed -- --user <uuid>
```

Cria "Assembleia de Deus em Mangueiras" com a Igreja Sede e a Congregação 1 e vincula o usuário como administrador.

## 5. Testes

```bash
pnpm test                 # unitários (validators, core, ui)
DATABASE_URL_TEST=postgresql://... pnpm --filter @mca/db test   # + testes de RLS
```

Os testes de RLS criam e apagam duas igrejas de teste; rodam contra qualquer Postgres com as migrações aplicadas. A CI sobe um Postgres 16 e os executa a cada PR.

### Postgres local (sem Supabase) para os testes

```bash
# exemplo com os binários do Postgres 16 instalados
initdb -D /tmp/mca-pg -U postgres --auth=trust
pg_ctl -D /tmp/mca-pg -o "-p 54329" start
createdb -h localhost -p 54329 -U postgres mca
DATABASE_URL=postgresql://postgres@localhost:54329/mca pnpm db:migrate
DATABASE_URL_TEST=postgresql://postgres@localhost:54329/mca pnpm --filter @mca/db test
```

## 6. Alterar o esquema

1. Edite `packages/db/src/schema/*.ts`.
2. `pnpm db:generate` gera o SQL em `packages/db/drizzle/`.
3. Para políticas de RLS, funções ou triggers, gere uma migração customizada:
   `pnpm --filter @mca/db exec drizzle-kit generate --custom --name <nome>` e escreva o SQL.
4. `pnpm db:migrate`. Nunca edite uma migração já aplicada em produção.

## Comandos úteis

| Comando                                                     | O que faz                                     |
| ----------------------------------------------------------- | --------------------------------------------- |
| `pnpm dev`                                                  | Sobe tudo em modo desenvolvimento (Turborepo) |
| `pnpm lint` / `pnpm typecheck` / `pnpm test` / `pnpm build` | O que a CI roda                               |
| `pnpm format`                                               | Prettier em todo o repositório                |
| `pnpm --filter @mca/db studio`                              | Drizzle Studio para inspecionar o banco       |
