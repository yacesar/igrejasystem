import { schema, eq, and, isNull, sql } from "@mca/db";
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyState,
} from "@mca/ui";
import { Building2, UserPlus, Users } from "lucide-react";
import Link from "next/link";
import { getChurchContext } from "@/lib/auth";
import { runAsUser } from "@/lib/db";

const STATUS_LABEL: Record<string, string> = {
  visitante: "Visitantes",
  frequentador: "Frequentadores",
  membro: "Membros",
  inativo: "Inativos",
  transferido: "Transferidos",
  falecido: "Falecidos",
};

export default async function DashboardPage() {
  const ctx = await getChurchContext();
  const v = ctx.preset.vocabulary;

  const byStatus = await runAsUser((tx) =>
    tx
      .select({ status: schema.people.status, count: sql<number>`count(*)::int` })
      .from(schema.people)
      .where(and(eq(schema.people.churchId, ctx.church.id), isNull(schema.people.deletedAt)))
      .groupBy(schema.people.status),
  );
  const total = byStatus.reduce((acc, r) => acc + r.count, 0);
  const members = byStatus.find((r) => r.status === "membro")?.count ?? 0;

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Bom dia" : hour < 18 ? "Boa tarde" : "Boa noite";

  return (
    <div className="flex flex-col gap-8">
      <header>
        <p className="text-sm text-fg-muted">{greeting},</p>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{ctx.church.name}</h1>
      </header>

      {total === 0 ? (
        <EmptyState
          icon={Users}
          title="Ainda não há pessoas cadastradas"
          description={`Comece cadastrando o ${v.memberRoll.toLowerCase()} da ${v.sede.toLowerCase()} e das ${v.campusPlural.toLowerCase()}. Depois, a importação por planilha acelera o restante.`}
          action={
            <Button asChild size="lg">
              <Link href="/app/pessoas/nova">
                <UserPlus aria-hidden /> Cadastrar primeira pessoa
              </Link>
            </Button>
          }
        />
      ) : (
        <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Pessoas" value={total} />
          <Stat label={v.memberPlural} value={members} tone="primary" />
          {byStatus
            .filter((r) => r.status !== "membro")
            .sort((a, b) => b.count - a.count)
            .slice(0, 2)
            .map((r) => (
              <Stat key={r.status} label={STATUS_LABEL[r.status] ?? r.status} value={r.count} />
            ))}
        </section>
      )}

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="size-4 text-fg-muted" aria-hidden /> {v.campusPlural}
            </CardTitle>
            <CardDescription>
              {v.sede} e {v.campusPlural.toLowerCase()} deste {v.church.toLowerCase()}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-border">
              {ctx.campuses.map((c) => (
                <li key={c.id} className="flex items-center justify-between py-2.5">
                  <span className="text-sm font-medium">{c.name}</span>
                  <Badge tone={c.kind === "sede" ? "primary" : "neutral"}>
                    {c.kind === "sede" ? v.sede : v.campus}
                  </Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Próximos passos</CardTitle>
            <CardDescription>Checklist dos primeiros 30 dias.</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="flex flex-col gap-2 text-sm">
              <Step
                done={ctx.campuses.length > 1}
                label={`Cadastrar ${v.campusPlural.toLowerCase()}`}
                href="/app/configuracoes"
              />
              <Step done={total > 0} label="Cadastrar a primeira pessoa" href="/app/pessoas/nova" />
              <Step
                done={members >= 10}
                label={`Registrar o ${v.memberRoll.toLowerCase()}`}
                href="/app/pessoas"
              />
              <Step done={false} label="Convidar a equipe (em breve)" />
              <Step done={false} label="Conectar PIX (Fase 1)" />
            </ol>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone?: "primary" }) {
  return (
    <Card className={tone === "primary" ? "border-primary/30 bg-primary-soft/40" : undefined}>
      <CardContent className="py-4">
        <p className="text-sm text-fg-muted">{label}</p>
        <p className="mt-1 text-3xl font-semibold tabular-nums tracking-tight">{value}</p>
      </CardContent>
    </Card>
  );
}

function Step({ done, label, href }: { done: boolean; label: string; href?: string }) {
  const content = (
    <>
      <span
        aria-hidden
        className={`inline-flex size-5 shrink-0 items-center justify-center rounded-full border text-[10px] ${
          done ? "border-success bg-success text-white" : "border-border-strong"
        }`}
      >
        {done ? "✓" : ""}
      </span>
      <span className={done ? "text-fg-muted line-through" : ""}>{label}</span>
    </>
  );
  return (
    <li>
      {href && !done ? (
        <Link
          href={href as never}
          className="flex items-center gap-3 rounded-md py-1 hover:text-primary"
        >
          {content}
        </Link>
      ) : (
        <span className="flex items-center gap-3 py-1">{content}</span>
      )}
    </li>
  );
}
