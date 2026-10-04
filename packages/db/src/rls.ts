import { sql } from "drizzle-orm";
import type { PgTransaction } from "drizzle-orm/pg-core";
import type { PostgresJsQueryResultHKT } from "drizzle-orm/postgres-js";
import type { Database } from "./client";
import type * as schema from "./schema";

export type UserTx = PgTransaction<PostgresJsQueryResultHKT, typeof schema, Record<string, never>>;

export interface UserContext {
  /** auth.users.id (JWT `sub`). */
  userId: string;
  /** Claims adicionais do JWT, se houver. */
  claims?: Record<string, unknown>;
}

/**
 * Executa `fn` dentro de uma transação com a role `authenticated` e os claims do
 * usuário, de modo que TODA política de RLS do Postgres se aplique — a mesma
 * segurança que o cliente Supabase teria, mas com as consultas tipadas do Drizzle.
 */
export async function withUser<T>(
  db: Database,
  ctx: UserContext,
  fn: (tx: UserTx) => Promise<T>,
): Promise<T> {
  const claims = JSON.stringify({ sub: ctx.userId, role: "authenticated", ...ctx.claims });
  return db.transaction(async (tx) => {
    await tx.execute(sql`select set_config('request.jwt.claims', ${claims}, true)`);
    await tx.execute(sql`select set_config('request.jwt.claim.sub', ${ctx.userId}, true)`);
    // SET LOCAL vale só até o fim da transação: não precisa (nem pode) resetar
    // depois de um erro, pois a transação já estará abortada.
    await tx.execute(sql`set local role authenticated`);
    return fn(tx as unknown as UserTx);
  });
}
