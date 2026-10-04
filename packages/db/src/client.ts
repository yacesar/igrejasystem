import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export type Database = ReturnType<typeof createDb>;

/**
 * Conexão administrativa (role `postgres`): ignora RLS.
 * Use SOMENTE em migrações, seeds e jobs. Para requisições de usuário use `withUser`.
 */
export function createDb(url = process.env.DATABASE_URL) {
  if (!url) throw new Error("DATABASE_URL não definida");
  const client = postgres(url, { prepare: false, max: 10 });
  return drizzle(client, { schema, casing: "snake_case" });
}

let _db: Database | undefined;
export function getDb(): Database {
  _db ??= createDb();
  return _db;
}
