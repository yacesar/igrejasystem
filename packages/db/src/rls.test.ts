/**
 * Testes de integração da RLS. Rodam só quando DATABASE_URL_TEST aponta para um
 * Postgres com as migrações aplicadas (CI sobe um serviço; local: pnpm db:migrate).
 */
import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { createDb, type Database } from "./client";
import { withUser } from "./rls";
import { campuses, churches, membershipEvents, people, profiles, roleAssignments } from "./schema";

const url = process.env.DATABASE_URL_TEST;
const run = url ? describe : describe.skip;

/** O Drizzle embrulha o erro do Postgres em `cause`; 42501 = violação de RLS/privilégio. */
async function expectRlsDenied(p: Promise<unknown>) {
  let err: unknown;
  try {
    await p;
  } catch (e) {
    err = e;
  }
  expect(err, "esperava bloqueio da RLS").toBeDefined();
  const cause = (err as { cause?: { code?: string; message?: string } }).cause ?? err;
  const text = `${(cause as { code?: string }).code ?? ""} ${(cause as { message?: string }).message ?? ""}`;
  expect(text).toMatch(/42501|row-level security/i);
}

run("RLS multi-tenant", () => {
  let db: Database;
  const adminA = randomUUID();
  const secretariaA = randomUUID();
  const tesourariaA = randomUUID();
  const adminB = randomUUID();
  let churchA: string, churchB: string, campusA: string, campusB: string, personA: string;

  beforeAll(async () => {
    db = createDb(url);
    const [a] = await db
      .insert(churches)
      .values({ name: "Igreja A", slug: `a-${randomUUID().slice(0, 8)}` })
      .returning();
    const [b] = await db
      .insert(churches)
      .values({ name: "Igreja B", slug: `b-${randomUUID().slice(0, 8)}` })
      .returning();
    churchA = a!.id;
    churchB = b!.id;
    const [ca] = await db
      .insert(campuses)
      .values({ churchId: churchA, name: "Sede A", kind: "sede" })
      .returning();
    const [cb] = await db
      .insert(campuses)
      .values({ churchId: churchB, name: "Sede B", kind: "sede" })
      .returning();
    campusA = ca!.id;
    campusB = cb!.id;
    await db.insert(profiles).values([
      { id: adminA, fullName: "Admin A" },
      { id: secretariaA, fullName: "Secretaria A" },
      { id: tesourariaA, fullName: "Tesouraria A" },
      { id: adminB, fullName: "Admin B" },
    ]);
    await db.insert(roleAssignments).values([
      { churchId: churchA, userId: adminA, role: "admin_igreja" },
      { churchId: churchA, userId: secretariaA, role: "secretaria" },
      { churchId: churchA, userId: tesourariaA, role: "tesouraria" },
      { churchId: churchB, userId: adminB, role: "admin_igreja" },
    ]);
    const [p] = await db
      .insert(people)
      .values({ churchId: churchA, campusId: campusA, fullName: "Maria A", status: "membro" })
      .returning();
    personA = p!.id;
    await db.insert(people).values({ churchId: churchB, campusId: campusB, fullName: "João B" });
  });

  afterAll(async () => {
    await db.delete(churches).where(eq(churches.id, churchA));
    await db.delete(churches).where(eq(churches.id, churchB));
    await db.delete(profiles).where(eq(profiles.id, adminA));
    await db.delete(profiles).where(eq(profiles.id, secretariaA));
    await db.delete(profiles).where(eq(profiles.id, tesourariaA));
    await db.delete(profiles).where(eq(profiles.id, adminB));
  });

  it("admin da igreja A só vê a igreja A", async () => {
    const rows = await withUser(db, { userId: adminA }, (tx) => tx.select().from(churches));
    expect(rows.map((r) => r.id)).toEqual([churchA]);
  });

  it("pessoas de outra igreja são invisíveis", async () => {
    const rows = await withUser(db, { userId: adminB }, (tx) => tx.select().from(people));
    expect(rows.every((r) => r.churchId === churchB)).toBe(true);
    expect(rows.some((r) => r.id === personA)).toBe(false);
  });

  it("secretaria cadastra pessoas; tesouraria só lê", async () => {
    const [created] = await withUser(db, { userId: secretariaA }, (tx) =>
      tx
        .insert(people)
        .values({ churchId: churchA, campusId: campusA, fullName: "Nova" })
        .returning(),
    );
    expect(created?.fullName).toBe("Nova");

    const lidas = await withUser(db, { userId: tesourariaA }, (tx) => tx.select().from(people));
    expect(lidas.length).toBeGreaterThan(0);

    await expectRlsDenied(
      withUser(db, { userId: tesourariaA }, (tx) =>
        tx.insert(people).values({ churchId: churchA, campusId: campusA, fullName: "Proibida" }),
      ),
    );
  });

  it("não é possível inserir pessoa em igreja alheia", async () => {
    await expectRlsDenied(
      withUser(db, { userId: secretariaA }, (tx) =>
        tx.insert(people).values({ churchId: churchB, campusId: campusB, fullName: "Intrusa" }),
      ),
    );
  });

  it("evento restrito (disciplina): secretaria não vê nem cria; admin sim", async () => {
    await expectRlsDenied(
      withUser(db, { userId: secretariaA }, (tx) =>
        tx.insert(membershipEvents).values({
          churchId: churchA,
          personId: personA,
          type: "disciplina",
          occurredAt: "2026-01-01",
          isRestricted: true,
        }),
      ),
    );

    await withUser(db, { userId: adminA }, (tx) =>
      tx.insert(membershipEvents).values({
        churchId: churchA,
        personId: personA,
        type: "disciplina",
        occurredAt: "2026-01-01",
        isRestricted: true,
      }),
    );
    await withUser(db, { userId: secretariaA }, (tx) =>
      tx.insert(membershipEvents).values({
        churchId: churchA,
        personId: personA,
        type: "batismo_aguas",
        occurredAt: "2026-01-02",
      }),
    );

    const daSecretaria = await withUser(db, { userId: secretariaA }, (tx) =>
      tx.select().from(membershipEvents).where(eq(membershipEvents.personId, personA)),
    );
    expect(daSecretaria.map((e) => e.type)).toEqual(["batismo_aguas"]);

    const doAdmin = await withUser(db, { userId: adminA }, (tx) =>
      tx.select().from(membershipEvents).where(eq(membershipEvents.personId, personA)),
    );
    expect(doAdmin.map((e) => e.type).sort()).toEqual(["batismo_aguas", "disciplina"]);
  });

  it("só admin altera dados da igreja", async () => {
    const r = await withUser(db, { userId: secretariaA }, (tx) =>
      tx.update(churches).set({ name: "Hackeada" }).where(eq(churches.id, churchA)).returning(),
    );
    expect(r).toHaveLength(0); // UPDATE sem linhas visíveis para a política

    const ok = await withUser(db, { userId: adminA }, (tx) =>
      tx.update(churches).set({ shortName: "IA" }).where(eq(churches.id, churchA)).returning(),
    );
    expect(ok[0]?.shortName).toBe("IA");
  });
});
