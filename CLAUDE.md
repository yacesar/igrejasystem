# MCA Igrejas — guia do repositório

Sistema de gestão para igrejas (piloto: ADEMAN, Assembleia de Deus em Mangueiras). Planejamento completo em `docs/PLANEJAMENTO.md`; setup em `docs/SETUP.md`.

## Estrutura

- `apps/web` — Next.js 16 (App Router, Turbopack), Tailwind v4, Supabase Auth. Rotas em português (`/entrar`, `/app/pessoas`).
- `packages/ui` — design system "MCA UI": tokens em `src/styles/tokens.css` (OKLCH, cor da marca via `--brand-h`), componentes acessíveis.
- `packages/db` — Drizzle ORM + migrações SQL (`drizzle/`). RLS do Postgres é a segunda camada de autorização.
- `packages/core` — regras de domínio sem I/O: papéis/permissões (`auth/`), presets por tradição (`presets/`).
- `packages/validators` — schemas zod compartilhados entre formulários e server actions.
- `packages/config` — tsconfigs base.

## Regras que não se negociam

1. **Toda consulta de usuário passa por `runAsUser`/`withUser`** (RLS ativa). A conexão administrativa (`getDb()` direto) só em migrações, seeds, jobs e no onboarding.
2. **Toda tabela de domínio tem `church_id`** e política de RLS. Novo módulo = schema + migração de RLS + teste em `packages/db/src/rls.test.ts`.
3. **Permissões vivem em `@mca/core` e nas funções `app.*` do SQL**, e devem ser mantidas em sincronia. A UI checa com `hasPermission`; o banco impõe.
4. **Nada de vocabulário eclesiástico fixo na UI.** Use `ctx.preset.vocabulary` (`v.campus`, `v.memberRoll`...). Tudo específico da Assembleia de Deus fica em `packages/core/src/presets/assembleia-de-deus.ts`.
5. **Dados sensíveis** (disciplina, notas pastorais) são `is_restricted` e exigem `pessoas.sensivel.*`.
6. **Soft delete** (`deleted_at`) para pessoas; eventos de membresia e auditoria nunca são editados ou apagados.
7. **Interface em português do Brasil**, mobile-first, toque mínimo 44px, estados vazios com orientação, tema claro e escuro.
8. Server actions validam com zod (`@mca/validators`) e devolvem `ActionResult`; nunca lançam para o cliente.

## Fluxo de trabalho

```bash
pnpm lint && pnpm typecheck && pnpm test && pnpm build   # o que a CI exige
pnpm db:generate   # após alterar packages/db/src/schema
```

Commits em português, no imperativo ("Adiciona…", "Corrige…"). Migrações aplicadas não são editadas.
