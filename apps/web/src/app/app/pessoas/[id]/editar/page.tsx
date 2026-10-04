import { hasPermission } from "@mca/core";
import { schema, eq, and, isNull } from "@mca/db";
import { PageHeader } from "@mca/ui";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { PersonForm } from "@/components/person-form";
import { getChurchContext } from "@/lib/auth";
import { runAsUser } from "@/lib/db";
import { updatePerson } from "@/server/actions/people";

export const metadata: Metadata = { title: "Editar pessoa" };

export default async function EditPersonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const ctx = await getChurchContext();
  if (!hasPermission(ctx.roles, "pessoas.editar")) redirect(`/app/pessoas/${id}`);

  const [person] = await runAsUser((tx) =>
    tx
      .select()
      .from(schema.people)
      .where(
        and(
          eq(schema.people.id, id),
          eq(schema.people.churchId, ctx.church.id),
          isNull(schema.people.deletedAt),
        ),
      ),
  );
  if (!person) notFound();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <PageHeader eyebrow="Pessoas" title={person.fullName} description="Editar cadastro" />
      <PersonForm
        action={updatePerson}
        campuses={ctx.campuses.map((c) => ({ id: c.id, name: c.name, kind: c.kind }))}
        campusLabel={ctx.preset.vocabulary.campus}
        initial={{ ...person, address: person.address }}
        submitLabel="Salvar alterações"
        cancelHref={`/app/pessoas/${id}`}
      />
    </div>
  );
}
