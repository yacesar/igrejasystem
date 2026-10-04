import { hasPermission } from "@mca/core";
import { PageHeader } from "@mca/ui";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { PersonForm } from "@/components/person-form";
import { getChurchContext } from "@/lib/auth";
import { createPerson } from "@/server/actions/people";

export const metadata: Metadata = { title: "Nova pessoa" };

export default async function NewPersonPage() {
  const ctx = await getChurchContext();
  if (!hasPermission(ctx.roles, "pessoas.criar")) redirect("/app/pessoas");
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <PageHeader
        eyebrow="Pessoas"
        title="Nova pessoa"
        description="Só o nome e a congregação são obrigatórios. O resto pode vir depois."
      />
      <PersonForm
        action={createPerson}
        campuses={ctx.campuses.map((c) => ({ id: c.id, name: c.name, kind: c.kind }))}
        campusLabel={ctx.preset.vocabulary.campus}
        submitLabel="Cadastrar"
        cancelHref="/app/pessoas"
      />
    </div>
  );
}
