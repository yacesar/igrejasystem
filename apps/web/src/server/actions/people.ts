"use server";

import { hasPermission } from "@mca/core";
import { schema, eq, and, isNull, sql } from "@mca/db";
import {
  RESTRICTED_EVENT_TYPES,
  createMembershipEventSchema,
  createPersonSchema,
  updatePersonSchema,
} from "@mca/validators";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getChurchContext } from "@/lib/auth";
import { runAsUser } from "@/lib/db";
import { fail, formToObject, fromZod, type ActionResult } from "./_result";

const nullIfEmpty = (v: string | undefined | null) => (v ? v : null);

function personValues(input: ReturnType<typeof createPersonSchema.parse>) {
  return {
    campusId: input.campusId,
    householdId: input.householdId ?? null,
    householdRole: input.householdRole ?? null,
    fullName: input.fullName,
    preferredName: nullIfEmpty(input.preferredName),
    gender: input.gender,
    birthDate: nullIfEmpty(input.birthDate),
    maritalStatus: input.maritalStatus,
    cpf: nullIfEmpty(input.cpf),
    email: nullIfEmpty(input.email)?.toLowerCase() ?? null,
    phone: nullIfEmpty(input.phone),
    whatsapp: nullIfEmpty(input.whatsapp),
    profession: nullIfEmpty(input.profession),
    address: input.address ?? null,
    status: input.status,
    notes: nullIfEmpty(input.notes),
    tags: input.tags,
  };
}

export async function createPerson(_: unknown, formData: FormData): Promise<ActionResult> {
  const ctx = await getChurchContext();
  if (!hasPermission(ctx.roles, "pessoas.criar"))
    return fail("Você não tem permissão para cadastrar pessoas.");

  const parsed = createPersonSchema.safeParse(formToObject(formData));
  if (!parsed.success) return fromZod(parsed.error);
  const input = parsed.data;
  if (!ctx.campuses.some((c) => c.id === input.campusId)) return fail("Congregação inválida.");

  let personId: string | undefined;
  try {
    personId = await runAsUser(async (tx, userId) => {
      // Número de rol sequencial por igreja, só para membros.
      let memberNumber: number | null = null;
      if (input.status === "membro") {
        const [row] = await tx
          .select({ max: sql<number>`coalesce(max(${schema.people.memberNumber}), 0)` })
          .from(schema.people)
          .where(eq(schema.people.churchId, ctx.church.id));
        memberNumber = Number(row?.max ?? 0) + 1;
      }
      const [p] = await tx
        .insert(schema.people)
        .values({
          churchId: ctx.church.id,
          ...personValues(input),
          memberNumber,
          joinedAt: input.status === "membro" ? sql`current_date` : null,
          createdBy: userId,
        })
        .returning({ id: schema.people.id });
      await tx.insert(schema.auditLogs).values({
        churchId: ctx.church.id,
        userId,
        action: "pessoas.criar",
        entity: "people",
        entityId: p!.id,
        data: { fullName: input.fullName, status: input.status },
      });
      return p!.id;
    });
  } catch (e) {
    if (String(e).includes("people_cpf_unique"))
      return fail("Já existe uma pessoa com este CPF.", { cpf: "CPF duplicado" });
    throw e;
  }
  revalidatePath("/app/pessoas");
  redirect(`/app/pessoas/${personId}`);
}

export async function updatePerson(_: unknown, formData: FormData): Promise<ActionResult> {
  const ctx = await getChurchContext();
  if (!hasPermission(ctx.roles, "pessoas.editar"))
    return fail("Você não tem permissão para editar pessoas.");

  const parsed = updatePersonSchema.safeParse(formToObject(formData));
  if (!parsed.success) return fromZod(parsed.error);
  const { id, ...rest } = parsed.data;
  const full = createPersonSchema.safeParse(rest);
  if (!full.success) return fromZod(full.error);
  const input = full.data;

  try {
    await runAsUser(async (tx, userId) => {
      const [current] = await tx
        .select({ status: schema.people.status, memberNumber: schema.people.memberNumber })
        .from(schema.people)
        .where(and(eq(schema.people.id, id), eq(schema.people.churchId, ctx.church.id)));
      if (!current) throw new Error("not_found");

      let memberNumber = current.memberNumber;
      if (input.status === "membro" && memberNumber == null) {
        const [row] = await tx
          .select({ max: sql<number>`coalesce(max(${schema.people.memberNumber}), 0)` })
          .from(schema.people)
          .where(eq(schema.people.churchId, ctx.church.id));
        memberNumber = Number(row?.max ?? 0) + 1;
      }
      await tx
        .update(schema.people)
        .set({ ...personValues(input), memberNumber })
        .where(and(eq(schema.people.id, id), eq(schema.people.churchId, ctx.church.id)));
      await tx.insert(schema.auditLogs).values({
        churchId: ctx.church.id,
        userId,
        action: "pessoas.editar",
        entity: "people",
        entityId: id,
        data: { statusFrom: current.status, statusTo: input.status },
      });
    });
  } catch (e) {
    if (String(e).includes("not_found")) return fail("Pessoa não encontrada.");
    if (String(e).includes("people_cpf_unique"))
      return fail("Já existe uma pessoa com este CPF.", { cpf: "CPF duplicado" });
    throw e;
  }
  revalidatePath("/app/pessoas");
  revalidatePath(`/app/pessoas/${id}`);
  redirect(`/app/pessoas/${id}`);
}

export async function archivePerson(id: string): Promise<ActionResult> {
  const ctx = await getChurchContext();
  if (!hasPermission(ctx.roles, "pessoas.excluir")) return fail("Sem permissão.");
  await runAsUser(async (tx, userId) => {
    await tx
      .update(schema.people)
      .set({ deletedAt: new Date(), isActive: false })
      .where(
        and(
          eq(schema.people.id, id),
          eq(schema.people.churchId, ctx.church.id),
          isNull(schema.people.deletedAt),
        ),
      );
    await tx.insert(schema.auditLogs).values({
      churchId: ctx.church.id,
      userId,
      action: "pessoas.arquivar",
      entity: "people",
      entityId: id,
    });
  });
  revalidatePath("/app/pessoas");
  redirect("/app/pessoas");
}

export async function addMembershipEvent(_: unknown, formData: FormData): Promise<ActionResult> {
  const ctx = await getChurchContext();
  const parsed = createMembershipEventSchema.safeParse(formToObject(formData));
  if (!parsed.success) return fromZod(parsed.error);
  const input = parsed.data;

  const restricted = RESTRICTED_EVENT_TYPES.includes(input.type);
  const needed = restricted ? "pessoas.sensivel.escrever" : "pessoas.editar";
  if (!hasPermission(ctx.roles, needed))
    return fail("Você não tem permissão para registrar este evento.");

  await runAsUser(async (tx, userId) => {
    await tx.insert(schema.membershipEvents).values({
      churchId: ctx.church.id,
      personId: input.personId,
      campusId: input.campusId ?? null,
      type: input.type,
      occurredAt: input.occurredAt,
      details: input.details,
      isRestricted: restricted,
      createdBy: userId,
    });
    // Efeitos no status
    const statusByType: Partial<
      Record<typeof input.type, (typeof schema.people.$inferSelect)["status"]>
    > = {
      recepcao_membro: "membro",
      transferencia_entrada: "membro",
      transferencia_saida: "transferido",
      falecimento: "falecido",
    };
    const next = statusByType[input.type];
    if (next) {
      await tx
        .update(schema.people)
        .set({ status: next })
        .where(
          and(eq(schema.people.id, input.personId), eq(schema.people.churchId, ctx.church.id)),
        );
    }
    await tx.insert(schema.auditLogs).values({
      churchId: ctx.church.id,
      userId,
      action: "pessoas.evento",
      entity: "membership_events",
      entityId: input.personId,
      data: { type: input.type, restricted },
    });
  });
  revalidatePath(`/app/pessoas/${input.personId}`);
  return { ok: true, data: undefined };
}
