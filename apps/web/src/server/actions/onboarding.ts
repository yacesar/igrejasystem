"use server";

import { getDb, schema, eq } from "@mca/db";
import { createChurchSchema } from "@mca/validators";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth";
import { formToObject, fromZod, type ActionResult } from "./_result";

/**
 * Cria a igreja, a sede, a primeira congregação (opcional) e torna o usuário
 * atual administrador. Usa a conexão administrativa porque ainda não existe
 * papel para a RLS avaliar — a única checagem necessária é "usuário autenticado".
 */
export async function createChurch(_: unknown, formData: FormData): Promise<ActionResult> {
  const user = await requireUser();
  const parsed = createChurchSchema.safeParse(formToObject(formData));
  if (!parsed.success) return fromZod(parsed.error);
  const input = parsed.data;

  const db = getDb();
  const [existing] = await db
    .select({ id: schema.churches.id })
    .from(schema.churches)
    .where(eq(schema.churches.slug, input.slug));
  if (existing) {
    return {
      ok: false,
      error: "Este endereço já está em uso.",
      fieldErrors: { slug: "Escolha outro" },
    };
  }

  const churchId = await db.transaction(async (tx) => {
    const [church] = await tx
      .insert(schema.churches)
      .values({
        name: input.name,
        shortName: input.shortName || null,
        slug: input.slug,
        preset: input.preset,
      })
      .returning({ id: schema.churches.id });
    const id = church!.id;

    const [sede] = await tx
      .insert(schema.campuses)
      .values({ churchId: id, name: input.sedeName, kind: "sede" })
      .returning({ id: schema.campuses.id });
    if (input.firstCongregationName) {
      await tx.insert(schema.campuses).values({
        churchId: id,
        name: input.firstCongregationName,
        kind: "congregacao",
        parentId: sede!.id,
      });
    }

    await tx
      .insert(schema.profiles)
      .values({ id: user.id, email: user.email, lastChurchId: id })
      .onConflictDoUpdate({ target: schema.profiles.id, set: { lastChurchId: id } });

    await tx.insert(schema.roleAssignments).values({
      churchId: id,
      userId: user.id,
      role: "admin_igreja",
      scopeType: "church",
      createdBy: user.id,
    });

    await tx.insert(schema.auditLogs).values({
      churchId: id,
      userId: user.id,
      action: "igreja.criar",
      entity: "churches",
      entityId: id,
      data: { name: input.name, preset: input.preset },
    });
    return id;
  });

  void churchId;
  redirect("/app");
}
