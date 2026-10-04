# MCA Igrejas

Sistema de gestão para igrejas (antes "IgrejaSystem") que cuida de pessoas, não só de cadastros: secretaria, finanças com PIX conciliado, cultos e presença, ministérios e escalas, células, ensino e discipulado, planejamento de pregação, cuidado pastoral, eventos, comunicação e app do membro — mobile‑first, acessível e bonito.

## Documentação

- [Documento de Planejamento](docs/PLANEJAMENTO.md) — visão, personas, papéis, módulos, diferenciais, UX/design system, stack, arquitetura, modelo de dados, segurança e roadmap.

- [Ambiente de desenvolvimento](docs/SETUP.md) — como rodar localmente, migrações, testes e seed.
- [Guia do repositório](CLAUDE.md) — estrutura, regras e fluxo de trabalho.

## Status

**Fase 0 (fundação) em andamento.** Monorepo, design system, autenticação, multi-tenant com RLS testada, onboarding e módulo de Pessoas funcionando. Próximos itens da fase: famílias, importação de planilha e convite de equipe.

## Stack

TypeScript · pnpm + Turborepo · Next.js 16 · Tailwind CSS 4 · Supabase (Postgres, Auth, Storage) · Drizzle ORM · zod · Vitest · GitHub Actions

```bash
pnpm install && cp .env.example .env   # preencha com o projeto Supabase
pnpm db:migrate && pnpm dev
```

## Decisões fechadas

| Decisão             | Escolha                                                            |
| ------------------- | ------------------------------------------------------------------ |
| Nome                | MCA Igrejas                                                        |
| Plataforma de dados | Supabase (Postgres + Auth + Storage + Realtime)                    |
| Pagamentos / PIX    | Asaas                                                              |
| Versão bíblica      | Almeida Revista e Atualizada (licença SBB a negociar)              |
| Preço               | Gratuito durante o piloto                                          |
| Piloto              | ADEMAN — Assembleia de Deus em Mangueiras (matriz + 1 congregação) |
