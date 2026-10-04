"use server";

import { hasPermission } from "@mca/core";
import { schema, eq, and } from "@mca/db";
import { createCampusSchema } from "@mca/validators";
import { revalidatePath } from "next/cache";
import { getChurchContext } from "@/lib/auth";
import { runAsUser } from "@/lib/db";
import { fail, formToObject, fromZod, type ActionResult } from "./_result";

export async function createCampus(_: unknown, formData: FormData): Promise<ActionResult> {
  const ctx = await getChurchContext();
  if (!hasPermission(ctx.roles, "campus.gerenciar"))
    return fail("Sem permissão para gerenciar congregações.");
  const parsed = createCampusSchema.safeParse({ ...formToObject(formData), kind: "congregacao" });
  if (!parsed.success) return fromZod(parsed.error);
  const sede = ctx.campuses.find((c) => c.kind === "sede");

  await runAsUser(async (tx, userId) => {
    const [c] = await tx
      .insert(schema.campuses)
      .values({
        churchId: ctx.church.id,
        name: parsed.data.name,
        kind: "congregacao",
        parentId: sede?.id ?? null,
      })
      .returning({ id: schema.campuses.id });
    await tx.insert(schema.auditLogs).values({
      churchId: ctx.church.id,
      userId,
      action: "campus.criar",
      entity: "campuses",
      entityId: c!.id,
      data: { name: parsed.data.name },
    });
  });
  revalidatePath("/app/configuracoes");
  revalidatePath("/app");
  return { ok: true, data: undefined };
}

export async function updateChurchBasics(_: unknown, formData: FormData): Promise<ActionResult> {
  const ctx = await getChurchContext();
  if (!hasPermission(ctx.roles, "igreja.configurar")) return fail("Sem permissão.");
  const name = String(formData.get("name") ?? "").trim();
  const shortName = String(formData.get("shortName") ?? "").trim();
  const brandColor = String(formData.get("brandColor") ?? "").trim();
  if (name.length < 3) return fail("Informe o nome da igreja.", { name: "Mínimo de 3 caracteres" });
  if (brandColor && !/^\d{1,3}$/.test(brandColor))
    return fail("Matiz inválido.", { brandColor: "Use um número de 0 a 360" });

  await runAsUser(async (tx) => {
    await tx
      .update(schema.churches)
      .set({ name, shortName: shortName || null, brandColor: brandColor || null })
      .where(and(eq(schema.churches.id, ctx.church.id)));
  });
  revalidatePath("/app", "layout");
  return { ok: true, data: undefined };
}
