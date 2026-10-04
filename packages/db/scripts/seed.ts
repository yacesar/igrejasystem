/**
 * Seed de desenvolvimento: cria a ADEMAN (matriz + 1 congregação) e vincula o
 * usuário informado como admin. Uso:
 *   pnpm db:seed -- --user <uuid-do-auth.users>
 */
import { config } from "dotenv";
import { eq } from "drizzle-orm";
import { createDb } from "../src/client";
import { campuses, churches, profiles, roleAssignments } from "../src/schema";

config({ path: "../../.env" });

const userArg = process.argv.indexOf("--user");
const userId = userArg >= 0 ? process.argv[userArg + 1] : undefined;

const db = createDb();

const [church] = await db
  .insert(churches)
  .values({
    name: "Assembleia de Deus em Mangueiras",
    shortName: "ADEMAN",
    slug: "ademan",
    preset: "assembleia-de-deus",
  })
  .onConflictDoUpdate({ target: churches.slug, set: { name: "Assembleia de Deus em Mangueiras" } })
  .returning();
if (!church) throw new Error("falha ao criar igreja");

const existing = await db.select().from(campuses).where(eq(campuses.churchId, church.id));
let sede = existing.find((c) => c.kind === "sede");
if (!sede) {
  [sede] = await db
    .insert(campuses)
    .values({ churchId: church.id, name: "Igreja Sede — Mangueiras", kind: "sede" })
    .returning();
}
if (!existing.some((c) => c.kind === "congregacao")) {
  await db.insert(campuses).values({
    churchId: church.id,
    name: "Congregação 1",
    kind: "congregacao",
    parentId: sede!.id,
  });
}

if (userId) {
  await db
    .insert(profiles)
    .values({ id: userId, fullName: "Administrador", lastChurchId: church.id })
    .onConflictDoUpdate({ target: profiles.id, set: { lastChurchId: church.id } });
  await db
    .insert(roleAssignments)
    .values({ churchId: church.id, userId, role: "admin_igreja", scopeType: "church" })
    .onConflictDoNothing();
  console.log(`✔ usuário ${userId} é admin da ADEMAN`);
}
console.log(`✔ ADEMAN pronta (church ${church.id})`);
process.exit(0);
