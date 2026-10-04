import { getDb, withUser, type UserTx } from "@mca/db";
import { requireUser } from "@/lib/auth";

/** Executa consultas Drizzle como o usuário logado, com RLS do Postgres ativa. */
export async function runAsUser<T>(fn: (tx: UserTx, userId: string) => Promise<T>): Promise<T> {
  const user = await requireUser();
  return withUser(getDb(), { userId: user.id }, (tx) => fn(tx, user.id));
}
