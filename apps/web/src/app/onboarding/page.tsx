import { PRESETS } from "@mca/core";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getDb, schema, eq } from "@mca/db";
import { requireUser } from "@/lib/auth";
import { OnboardingForm } from "./onboarding-form";

export const metadata: Metadata = { title: "Criar igreja" };

export default async function OnboardingPage() {
  const user = await requireUser();
  // Se já tem papel em alguma igreja, vai direto ao app.
  const [has] = await getDb()
    .select({ id: schema.roleAssignments.id })
    .from(schema.roleAssignments)
    .where(eq(schema.roleAssignments.userId, user.id))
    .limit(1);
  if (has) redirect("/app");

  const presets = Object.values(PRESETS).map((p) => ({
    id: p.id,
    label: p.label,
    description: p.description,
  }));

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-xl flex-col px-4 py-10">
      <p className="text-xs font-medium tracking-wide text-fg-subtle uppercase">Primeiro acesso</p>
      <h1 className="mt-1 text-2xl font-semibold tracking-tight md:text-3xl">
        Vamos configurar sua igreja
      </h1>
      <p className="mt-2 text-sm text-fg-muted md:text-base">
        Leva menos de um minuto. Tudo pode ser alterado depois nas configurações.
      </p>
      <div className="mt-8">
        <OnboardingForm presets={presets} />
      </div>
    </main>
  );
}
