import { ROLE_LABELS, hasPermission } from "@mca/core";
import { schema, eq } from "@mca/db";
import { Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@mca/ui";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getChurchContext } from "@/lib/auth";
import { runAsUser } from "@/lib/db";
import { CampusForm, ChurchForm } from "./forms";

export const metadata: Metadata = { title: "Ajustes" };

export default async function SettingsPage() {
  const ctx = await getChurchContext();
  const canConfig = hasPermission(ctx.roles, "igreja.configurar");
  const canCampus = hasPermission(ctx.roles, "campus.gerenciar");
  if (!canConfig && !canCampus) redirect("/app");
  const v = ctx.preset.vocabulary;

  const team = await runAsUser((tx) =>
    tx
      .select({
        role: schema.roleAssignments.role,
        scopeType: schema.roleAssignments.scopeType,
        scopeId: schema.roleAssignments.scopeId,
        email: schema.profiles.email,
        fullName: schema.profiles.fullName,
      })
      .from(schema.roleAssignments)
      .innerJoin(schema.profiles, eq(schema.profiles.id, schema.roleAssignments.userId))
      .where(eq(schema.roleAssignments.churchId, ctx.church.id)),
  );

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight md:text-3xl">Ajustes</h1>
        <p className="mt-1 text-sm text-fg-muted">
          Identidade, {v.campusPlural.toLowerCase()} e equipe.
        </p>
      </header>

      {canConfig ? (
        <Card>
          <CardHeader>
            <CardTitle>Identidade</CardTitle>
            <CardDescription>
              Preset: <strong>{ctx.preset.label}</strong>. Endereço:{" "}
              <code className="text-xs">{ctx.church.slug}</code>
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ChurchForm
              name={ctx.church.name}
              shortName={ctx.church.shortName}
              brandColor={ctx.church.brandColor}
            />
          </CardContent>
        </Card>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>{v.campusPlural}</CardTitle>
          <CardDescription>
            A {v.sede.toLowerCase()} concentra a visão consolidada; cada {v.campus.toLowerCase()}{" "}
            tem seu próprio {v.memberRoll.toLowerCase()}.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
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
          {canCampus ? <CampusForm label={v.campus} /> : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Equipe</CardTitle>
          <CardDescription>
            Quem tem acesso ao sistema e com qual papel. Convites chegam na próxima etapa.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="divide-y divide-border">
            {team.map((t, i) => (
              <li key={i} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">
                    {t.fullName || t.email || "Usuário"}
                  </p>
                  {t.fullName && t.email ? (
                    <p className="truncate text-xs text-fg-muted">{t.email}</p>
                  ) : null}
                </div>
                <Badge tone="primary">
                  {ROLE_LABELS[t.role]}
                  {t.scopeType !== "church"
                    ? ` · ${ctx.campuses.find((c) => c.id === t.scopeId)?.name ?? t.scopeType}`
                    : ""}
                </Badge>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
