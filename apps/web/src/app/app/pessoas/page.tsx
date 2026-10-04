import { schema, eq, and, isNull, ilike, or, desc, sql } from "@mca/db";
import { Avatar, Button, Card, EmptyState, Input, Select } from "@mca/ui";
import { PERSON_STATUSES, type PersonStatus } from "@mca/validators";
import { Search, UserPlus, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { STATUS_LABELS, StatusBadge } from "@/components/status-badge";
import { getChurchContext } from "@/lib/auth";
import { runAsUser } from "@/lib/db";
import { formatPhone } from "@/lib/format";

export const metadata: Metadata = { title: "Pessoas" };

const PAGE_SIZE = 50;

export default async function PeoplePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; campus?: string; p?: string }>;
}) {
  const ctx = await getChurchContext();
  const v = ctx.preset.vocabulary;
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const status = PERSON_STATUSES.includes(sp.status as PersonStatus)
    ? (sp.status as PersonStatus)
    : undefined;
  const campusId = ctx.campuses.some((c) => c.id === sp.campus) ? sp.campus : undefined;
  const page = Math.max(1, Number(sp.p ?? 1) || 1);

  const where = and(
    eq(schema.people.churchId, ctx.church.id),
    isNull(schema.people.deletedAt),
    status ? eq(schema.people.status, status) : undefined,
    campusId ? eq(schema.people.campusId, campusId) : undefined,
    q
      ? or(
          ilike(schema.people.fullName, `%${q}%`),
          ilike(schema.people.preferredName, `%${q}%`),
          ilike(schema.people.email, `%${q}%`),
          sql`${schema.people.whatsapp} like ${"%" + q.replace(/\D/g, "") + "%"} and ${q.replace(/\D/g, "").length} >= 4`,
        )
      : undefined,
  );

  const { rows, total } = await runAsUser(async (tx) => {
    const rows = await tx
      .select({
        id: schema.people.id,
        fullName: schema.people.fullName,
        preferredName: schema.people.preferredName,
        status: schema.people.status,
        whatsapp: schema.people.whatsapp,
        photoUrl: schema.people.photoUrl,
        memberNumber: schema.people.memberNumber,
        campusName: schema.campuses.name,
      })
      .from(schema.people)
      .innerJoin(schema.campuses, eq(schema.campuses.id, schema.people.campusId))
      .where(where)
      .orderBy(desc(schema.people.createdAt))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE);
    const [c] = await tx
      .select({ n: sql<number>`count(*)::int` })
      .from(schema.people)
      .where(where);
    return { rows, total: c?.n ?? 0 };
  });

  const hasFilters = Boolean(q || status || campusId);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Pessoas</h1>
          <p className="mt-1 text-sm text-fg-muted">
            {total} {total === 1 ? "pessoa" : "pessoas"}
            {hasFilters ? " encontradas" : " cadastradas"}
          </p>
        </div>
        <Button asChild>
          <Link href="/app/pessoas/nova">
            <UserPlus aria-hidden /> Nova pessoa
          </Link>
        </Button>
      </header>

      <form className="grid gap-2 sm:grid-cols-[1fr_auto_auto_auto]" role="search">
        <div className="relative">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-fg-subtle"
            aria-hidden
          />
          <Input
            name="q"
            defaultValue={q}
            placeholder="Buscar por nome, e-mail ou WhatsApp"
            className="pl-9"
            aria-label="Buscar pessoas"
          />
        </div>
        <Select name="status" defaultValue={status ?? ""} aria-label="Situação" className="sm:w-44">
          <option value="">Todas as situações</option>
          {PERSON_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </Select>
        {ctx.campuses.length > 1 ? (
          <Select
            name="campus"
            defaultValue={campusId ?? ""}
            aria-label={v.campus}
            className="sm:w-52"
          >
            <option value="">Todas as {v.campusPlural.toLowerCase()}</option>
            {ctx.campuses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </Select>
        ) : null}
        <Button type="submit" variant="secondary">
          Filtrar
        </Button>
      </form>

      {rows.length === 0 ? (
        hasFilters ? (
          <EmptyState
            icon={Search}
            title="Nenhuma pessoa encontrada"
            description="Tente outro nome ou limpe os filtros."
            action={
              <Button asChild variant="secondary">
                <Link href="/app/pessoas">Limpar filtros</Link>
              </Button>
            }
          />
        ) : (
          <EmptyState
            icon={Users}
            title="Ainda não há pessoas cadastradas"
            description={`Cadastre a primeira pessoa do ${v.memberRoll.toLowerCase()}.`}
            action={
              <Button asChild size="lg">
                <Link href="/app/pessoas/nova">
                  <UserPlus aria-hidden /> Cadastrar pessoa
                </Link>
              </Button>
            }
          />
        )
      ) : (
        <Card className="overflow-hidden">
          <ul className="divide-y divide-border">
            {rows.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/app/pessoas/${p.id}` as never}
                  className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-bg-muted"
                >
                  <Avatar name={p.fullName} src={p.photoUrl} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">
                      {p.fullName}
                      {p.preferredName ? (
                        <span className="text-fg-muted"> · {p.preferredName}</span>
                      ) : null}
                    </p>
                    <p className="truncate text-sm text-fg-muted">
                      {p.campusName}
                      {p.memberNumber ? ` · Rol nº ${p.memberNumber}` : ""}
                      <span className="hidden sm:inline"> · {formatPhone(p.whatsapp)}</span>
                    </p>
                  </div>
                  <StatusBadge status={p.status} />
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {pages > 1 ? (
        <nav className="flex items-center justify-between text-sm" aria-label="Paginação">
          <span className="text-fg-muted">
            Página {page} de {pages}
          </span>
          <div className="flex gap-2">
            {page > 1 ? (
              <Button asChild variant="secondary" size="sm">
                <Link
                  href={
                    `/app/pessoas?${new URLSearchParams({ ...sp, p: String(page - 1) })}` as never
                  }
                >
                  Anterior
                </Link>
              </Button>
            ) : null}
            {page < pages ? (
              <Button asChild variant="secondary" size="sm">
                <Link
                  href={
                    `/app/pessoas?${new URLSearchParams({ ...sp, p: String(page + 1) })}` as never
                  }
                >
                  Próxima
                </Link>
              </Button>
            ) : null}
          </div>
        </nav>
      ) : null}
    </div>
  );
}
