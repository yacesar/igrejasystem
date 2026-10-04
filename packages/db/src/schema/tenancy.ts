import { relations, sql } from "drizzle-orm";
import {
  boolean,
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { id, timestamps } from "./_shared";

export const presetEnum = pgEnum("preset", ["assembleia-de-deus", "generico"]);
export const campusKindEnum = pgEnum("campus_kind", ["sede", "congregacao"]);
export const roleEnum = pgEnum("role", [
  "admin_igreja",
  "pastor",
  "secretaria",
  "tesouraria",
  "lider_ministerio",
  "lider_celula",
  "professor",
  "voluntario",
  "membro",
  "visitante",
]);
export const scopeTypeEnum = pgEnum("scope_type", [
  "church",
  "campus",
  "ministry",
  "cell",
  "class",
]);

/** Tenant: um ministério/campo/igreja. */
export const churches = pgTable("churches", {
  id,
  name: text("name").notNull(),
  shortName: text("short_name"),
  slug: text("slug").notNull().unique(),
  preset: presetEnum("preset").notNull().default("generico"),
  /** Vocabulário sobrescrito pela igreja e outras configurações. */
  settings: jsonb("settings").$type<Record<string, unknown>>().notNull().default({}),
  logoUrl: text("logo_url"),
  brandColor: text("brand_color"),
  ...timestamps,
});

/** Filtro parcial: só uma sede ativa por igreja. */
const sqlSede = sql`kind = 'sede' AND deleted_at IS NULL`;

/** Sede e congregações. `parentId` permite setor → congregação no futuro. */
export const campuses = pgTable(
  "campuses",
  {
    id,
    churchId: uuid("church_id")
      .notNull()
      .references(() => churches.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    kind: campusKindEnum("kind").notNull().default("congregacao"),
    parentId: uuid("parent_id"),
    address: jsonb("address").$type<Record<string, unknown>>(),
    isActive: boolean("is_active").notNull().default(true),
    ...timestamps,
  },
  (t) => [
    index("campuses_church_idx").on(t.churchId),
    uniqueIndex("campuses_one_sede_per_church").on(t.churchId).where(sqlSede),
  ],
);

/** Perfil do usuário autenticado (espelha auth.users do Supabase). */
export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey(), // = auth.users.id
  fullName: text("full_name").notNull().default(""),
  email: text("email"),
  avatarUrl: text("avatar_url"),
  /** Última igreja aberta; usada para abrir o app direto no contexto certo. */
  lastChurchId: uuid("last_church_id"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

/** Papel + escopo. Um usuário pode ter vários. */
export const roleAssignments = pgTable(
  "role_assignments",
  {
    id,
    churchId: uuid("church_id")
      .notNull()
      .references(() => churches.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    role: roleEnum("role").notNull(),
    scopeType: scopeTypeEnum("scope_type").notNull().default("church"),
    /** Nulo quando scopeType = church. */
    scopeId: uuid("scope_id"),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    createdBy: uuid("created_by"),
  },
  (t) => [
    index("role_assignments_user_idx").on(t.userId),
    index("role_assignments_church_idx").on(t.churchId),
    uniqueIndex("role_assignments_unique").on(t.churchId, t.userId, t.role, t.scopeType, t.scopeId),
  ],
);

export const churchesRelations = relations(churches, ({ many }) => ({
  campuses: many(campuses),
  roleAssignments: many(roleAssignments),
}));
export const campusesRelations = relations(campuses, ({ one }) => ({
  church: one(churches, { fields: [campuses.churchId], references: [churches.id] }),
}));
export const roleAssignmentsRelations = relations(roleAssignments, ({ one }) => ({
  church: one(churches, { fields: [roleAssignments.churchId], references: [churches.id] }),
  user: one(profiles, { fields: [roleAssignments.userId], references: [profiles.id] }),
}));
