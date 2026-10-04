import { hasPermission } from "@mca/core";
import { schema, eq, and, isNull, desc } from "@mca/db";
import { Avatar, Button, Card, CardContent, CardHeader, CardTitle, Separator } from "@mca/ui";
import { MEMBERSHIP_EVENT_TYPES, RESTRICTED_EVENT_TYPES } from "@mca/validators";
import { Pencil } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { StatusBadge } from "@/components/status-badge";
import { getChurchContext } from "@/lib/auth";
import { runAsUser } from "@/lib/db";
import { ageFrom, formatCpf, formatDate, formatPhone } from "@/lib/format";
import { EventForm } from "./event-form";
import { ArchiveButton } from "./archive-button";

export const metadata: Metadata = { title: "Pessoa" };

export const EVENT_LABELS: Record<(typeof MEMBERSHIP_EVENT_TYPES)[number], string> = {
  conversao: "Conversão",
  batismo_aguas: "Batismo nas águas",
  batismo_espirito_santo: "Batismo no Espírito Santo",
  recepcao_membro: "Recepção como membro",
  apresentacao_crianca: "Apresentação de criança",
  casamento: "Casamento",
  consagracao: "Consagração / ordenação",
  transferencia_entrada: "Transferência (entrada)",
  transferencia_saida: "Transferência (saída)",
  disciplina: "Disciplina",
  reconciliacao: "Reconciliação",
  falecimento: "Falecimento",
};

export default async function PersonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await getChurchContext();
  const canSeeRestricted = hasPermission(ctx.roles, "pessoas.sensivel.ler");
  const canEdit = hasPermission(ctx.roles, "pessoas.editar");
  const canArchive = hasPermission(ctx.roles, "pessoas.excluir");
  const v = ctx.preset.vocabulary;

  const data = await runAsUser(async (tx) => {
    const [person] = await tx
      .select()
      .from(schema.people)
      .where(
        and(
          eq(schema.people.id, id),
          eq(schema.people.churchId, ctx.church.id),
          isNull(schema.people.deletedAt),
        ),
      );
    if (!person) return null;
    const events = await tx
      .select()
      .from(schema.membershipEvents)
      .where(eq(schema.membershipEvents.personId, id))
      .orderBy(desc(schema.membershipEvents.occurredAt), desc(schema.membershipEvents.createdAt));
    return { person, events };
  });
  if (!data) notFound();
  const { person, events } = data;
  const campus = ctx.campuses.find((c) => c.id === person.campusId);
  const age = ageFrom(person.birthDate);
  const addr = (person.address ?? {}) as Record<string, string | undefined>;
  const addressLine = [addr.street, addr.number, addr.complement].filter(Boolean).join(", ");
  const cityLine = [
    addr.district,
    addr.city && addr.state ? `${addr.city} – ${addr.state}` : addr.city,
  ]
    .filter(Boolean)
    .join(" · ");

  const allowedTypes = MEMBERSHIP_EVENT_TYPES.filter((t) =>
    RESTRICTED_EVENT_TYPES.includes(t)
      ? hasPermission(ctx.roles, "pessoas.sensivel.escrever")
      : canEdit,
  );

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar name={person.fullName} src={person.photoUrl} size="lg" />
          <div>
            <p className="text-xs font-medium tracking-wide text-fg-subtle uppercase">
              {campus?.name ?? v.campus}
              {person.memberNumber ? ` · Rol nº ${person.memberNumber}` : ""}
            </p>
            <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">{person.fullName}</h1>
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-sm text-fg-muted">
              <StatusBadge status={person.status} />
              {age != null ? <span>{age} anos</span> : null}
              {person.preferredName ? <span>“{person.preferredName}”</span> : null}
            </div>
          </div>
        </div>
        {canEdit ? (
          <Button asChild variant="secondary">
            <Link href={`/app/pessoas/${person.id}/editar` as never}>
              <Pencil aria-hidden /> Editar
            </Link>
          </Button>
        ) : null}
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Contato</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
                <Row label="WhatsApp">
                  {person.whatsapp ? (
                    <a
                      className="text-primary hover:underline"
                      href={`https://wa.me/55${person.whatsapp}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {formatPhone(person.whatsapp)}
                    </a>
                  ) : (
                    "—"
                  )}
                </Row>
                <Row label="Telefone">{formatPhone(person.phone)}</Row>
                <Row label="E-mail">
                  {person.email ? (
                    <a className="text-primary hover:underline" href={`mailto:${person.email}`}>
                      {person.email}
                    </a>
                  ) : (
                    "—"
                  )}
                </Row>
                <Row label="Endereço">
                  {addressLine || cityLine ? (
                    <>
                      {addressLine}
                      {addressLine && cityLine ? <br /> : null}
                      {cityLine}
                    </>
                  ) : (
                    "—"
                  )}
                </Row>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dados pessoais</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
                <Row label="Nascimento">{formatDate(person.birthDate)}</Row>
                <Row label="CPF">{formatCpf(person.cpf)}</Row>
                <Row label="Estado civil">{person.maritalStatus.replace("_", " ")}</Row>
                <Row label="Profissão">{person.profession || "—"}</Row>
                <Row label="Desde">{formatDate(person.joinedAt)}</Row>
              </dl>
              {person.notes ? (
                <>
                  <Separator className="my-4" />
                  <p className="text-sm whitespace-pre-wrap text-fg-muted">{person.notes}</p>
                </>
              ) : null}
            </CardContent>
          </Card>

          {canArchive ? <ArchiveButton id={person.id} name={person.fullName} /> : null}
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Histórico eclesiástico</CardTitle>
            </CardHeader>
            <CardContent>
              {events.length === 0 ? (
                <p className="text-sm text-fg-muted">Nenhum evento registrado ainda.</p>
              ) : (
                <ol className="relative flex flex-col gap-4 border-l border-border pl-5">
                  {events.map((e) => {
                    const hidden = e.isRestricted && !canSeeRestricted;
                    return (
                      <li key={e.id} className="relative">
                        <span
                          aria-hidden
                          className={`absolute top-1.5 -left-[1.4rem] size-3 rounded-full border-2 border-bg-elevated ${
                            e.isRestricted ? "bg-warning" : "bg-primary"
                          }`}
                        />
                        <p className="text-sm font-medium">
                          {hidden ? "Registro restrito" : EVENT_LABELS[e.type]}
                        </p>
                        <p className="text-xs text-fg-muted">
                          {formatDate(e.occurredAt)}
                          {!hidden && e.campusId
                            ? ` · ${ctx.campuses.find((c) => c.id === e.campusId)?.name ?? ""}`
                            : ""}
                        </p>
                        {!hidden &&
                        typeof e.details?.observacao === "string" &&
                        e.details.observacao ? (
                          <p className="mt-1 text-sm text-fg-muted">{e.details.observacao}</p>
                        ) : null}
                      </li>
                    );
                  })}
                </ol>
              )}
              {allowedTypes.length > 0 ? (
                <>
                  <Separator className="my-5" />
                  <EventForm
                    personId={person.id}
                    types={allowedTypes.map((t) => ({
                      value: t,
                      label: EVENT_LABELS[t],
                      restricted: RESTRICTED_EVENT_TYPES.includes(t),
                    }))}
                    campuses={ctx.campuses.map((c) => ({ id: c.id, name: c.name }))}
                    defaultCampusId={person.campusId}
                  />
                </>
              ) : null}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <>
      <dt className="text-fg-muted">{label}</dt>
      <dd className="min-w-0 break-words">{children}</dd>
    </>
  );
}
