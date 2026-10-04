import { relations } from "drizzle-orm";
import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { id, timestamps } from "./_shared";
import { campuses, churches, profiles } from "./tenancy";

export const personStatusEnum = pgEnum("person_status", [
  "visitante",
  "frequentador",
  "membro",
  "inativo",
  "transferido",
  "falecido",
]);
export const genderEnum = pgEnum("gender", ["feminino", "masculino", "nao_informado"]);
export const maritalStatusEnum = pgEnum("marital_status", [
  "solteiro",
  "casado",
  "uniao_estavel",
  "divorciado",
  "viuvo",
  "nao_informado",
]);
export const householdRoleEnum = pgEnum("household_role", [
  "responsavel",
  "conjuge",
  "filho",
  "dependente",
  "outro",
]);
export const membershipEventTypeEnum = pgEnum("membership_event_type", [
  "conversao",
  "batismo_aguas",
  "batismo_espirito_santo",
  "recepcao_membro",
  "apresentacao_crianca",
  "casamento",
  "consagracao",
  "transferencia_entrada",
  "transferencia_saida",
  "disciplina",
  "reconciliacao",
  "falecimento",
]);

/** Unidade familiar. */
export const households = pgTable(
  "households",
  {
    id,
    churchId: uuid("church_id")
      .notNull()
      .references(() => churches.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    address: jsonb("address").$type<Record<string, unknown>>(),
    ...timestamps,
  },
  (t) => [index("households_church_idx").on(t.churchId)],
);

export const people = pgTable(
  "people",
  {
    id,
    churchId: uuid("church_id")
      .notNull()
      .references(() => churches.id, { onDelete: "cascade" }),
    campusId: uuid("campus_id")
      .notNull()
      .references(() => campuses.id),
    householdId: uuid("household_id").references(() => households.id, { onDelete: "set null" }),
    householdRole: householdRoleEnum("household_role"),
    /** Vínculo com usuário autenticado (membro que usa o app). */
    userId: uuid("user_id").references(() => profiles.id, { onDelete: "set null" }),

    fullName: text("full_name").notNull(),
    preferredName: text("preferred_name"),
    gender: genderEnum("gender").notNull().default("nao_informado"),
    birthDate: date("birth_date"),
    maritalStatus: maritalStatusEnum("marital_status").notNull().default("nao_informado"),
    cpf: text("cpf"),
    email: text("email"),
    phone: text("phone"),
    whatsapp: text("whatsapp"),
    photoUrl: text("photo_url"),
    address: jsonb("address").$type<Record<string, unknown>>(),
    profession: text("profession"),

    status: personStatusEnum("status").notNull().default("visitante"),
    /** Número no rol de membros (por igreja). */
    memberNumber: integer("member_number"),
    joinedAt: date("joined_at"),
    tags: text("tags").array().notNull().default([]),
    notes: text("notes"),

    /** Consentimentos LGPD (comunicação, fotos, aniversário público). */
    consents: jsonb("consents").$type<Record<string, boolean>>().notNull().default({}),
    isActive: boolean("is_active").notNull().default(true),

    createdBy: uuid("created_by"),
    ...timestamps,
  },
  (t) => [
    index("people_church_idx").on(t.churchId),
    index("people_campus_idx").on(t.campusId),
    index("people_household_idx").on(t.householdId),
    index("people_status_idx").on(t.churchId, t.status),
    index("people_user_idx").on(t.userId),
    uniqueIndex("people_member_number_unique").on(t.churchId, t.memberNumber),
    uniqueIndex("people_cpf_unique").on(t.churchId, t.cpf),
  ],
);

/** Histórico eclesiástico. Eventos restritos (disciplina) só para quem tem permissão. */
export const membershipEvents = pgTable(
  "membership_events",
  {
    id,
    churchId: uuid("church_id")
      .notNull()
      .references(() => churches.id, { onDelete: "cascade" }),
    personId: uuid("person_id")
      .notNull()
      .references(() => people.id, { onDelete: "cascade" }),
    campusId: uuid("campus_id").references(() => campuses.id),
    type: membershipEventTypeEnum("type").notNull(),
    occurredAt: date("occurred_at").notNull(),
    details: jsonb("details").$type<Record<string, unknown>>().notNull().default({}),
    isRestricted: boolean("is_restricted").notNull().default(false),
    createdBy: uuid("created_by"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("membership_events_person_idx").on(t.personId),
    index("membership_events_church_type_idx").on(t.churchId, t.type),
  ],
);

/** Trilha de auditoria imutável (apenas inserção). */
export const auditLogs = pgTable(
  "audit_logs",
  {
    id,
    churchId: uuid("church_id").references(() => churches.id, { onDelete: "cascade" }),
    userId: uuid("user_id"),
    action: text("action").notNull(), // ex.: pessoas.criar
    entity: text("entity").notNull(), // ex.: people
    entityId: uuid("entity_id"),
    data: jsonb("data").$type<Record<string, unknown>>(),
    ip: text("ip"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("audit_logs_church_created_idx").on(t.churchId, t.createdAt)],
);

export const householdsRelations = relations(households, ({ many }) => ({
  members: many(people),
}));
export const peopleRelations = relations(people, ({ one, many }) => ({
  church: one(churches, { fields: [people.churchId], references: [churches.id] }),
  campus: one(campuses, { fields: [people.campusId], references: [campuses.id] }),
  household: one(households, { fields: [people.householdId], references: [households.id] }),
  events: many(membershipEvents),
}));
export const membershipEventsRelations = relations(membershipEvents, ({ one }) => ({
  person: one(people, { fields: [membershipEvents.personId], references: [people.id] }),
}));
