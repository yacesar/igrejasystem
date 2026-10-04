import { getDb, schema, withUser, eq, and, isNull, or, sql } from "@mca/db";
import type { Role } from "@mca/core";
import { getPreset } from "@mca/core";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export interface SessionUser {
  id: string;
  email: string | null;
}

/** Usuário autenticado ou null. Memoizado por requisição. */
export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims.sub) return null;
  return { id: data.claims.sub, email: (data.claims.email as string | undefined) ?? null };
});

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) redirect("/entrar");
  return user;
}

export interface ChurchContext {
  user: SessionUser;
  church: typeof schema.churches.$inferSelect;
  campuses: (typeof schema.campuses.$inferSelect)[];
  roles: Role[];
  preset: ReturnType<typeof getPreset>;
}

/**
 * Igreja atual do usuário (última aberta ou a primeira em que tem papel) com
 * campi e papéis. Redireciona para o onboarding se não houver nenhuma.
 */
export const getChurchContext = cache(async (): Promise<ChurchContext> => {
  const user = await requireUser();
  const db = getDb();

  const ctx = await withUser(db, { userId: user.id }, async (tx) => {
    const [profile] = await tx
      .select()
      .from(schema.profiles)
      .where(eq(schema.profiles.id, user.id));
    const assignments = await tx
      .select()
      .from(schema.roleAssignments)
      .where(
        and(
          eq(schema.roleAssignments.userId, user.id),
          or(
            isNull(schema.roleAssignments.expiresAt),
            sql`${schema.roleAssignments.expiresAt} > now()`,
          ),
        ),
      );
    if (assignments.length === 0) return null;

    const churchId =
      profile?.lastChurchId && assignments.some((a) => a.churchId === profile.lastChurchId)
        ? profile.lastChurchId
        : assignments[0]!.churchId;

    const [church] = await tx
      .select()
      .from(schema.churches)
      .where(eq(schema.churches.id, churchId));
    if (!church) return null;
    const campuses = await tx
      .select()
      .from(schema.campuses)
      .where(and(eq(schema.campuses.churchId, churchId), isNull(schema.campuses.deletedAt)))
      .orderBy(
        sql`case when ${schema.campuses.kind} = 'sede' then 0 else 1 end`,
        schema.campuses.name,
      );
    const roles = Array.from(
      new Set(assignments.filter((a) => a.churchId === churchId).map((a) => a.role)),
    ) as Role[];
    return { church, campuses, roles };
  });

  if (!ctx) redirect("/onboarding");
  return { user, ...ctx, preset: getPreset(ctx.church.preset) };
});
