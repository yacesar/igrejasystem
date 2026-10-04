import { sql } from "drizzle-orm";
import { timestamp, uuid } from "drizzle-orm/pg-core";

/** Colunas comuns a toda entidade de domínio. */
export const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
};

/** Chave primária UUID gerada no banco (gen_random_uuid). */
export const id = uuid("id")
  .primaryKey()
  .default(sql`gen_random_uuid()`);
