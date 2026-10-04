import { z } from "zod";
import { addressSchema, cpfSchema, phoneBrSchema } from "./br";

export const PERSON_STATUSES = [
  "visitante",
  "frequentador",
  "membro",
  "inativo",
  "transferido",
  "falecido",
] as const;
export type PersonStatus = (typeof PERSON_STATUSES)[number];

export const GENDERS = ["feminino", "masculino", "nao_informado"] as const;

export const MARITAL_STATUSES = [
  "solteiro",
  "casado",
  "uniao_estavel",
  "divorciado",
  "viuvo",
  "nao_informado",
] as const;

export const HOUSEHOLD_ROLES = ["responsavel", "conjuge", "filho", "dependente", "outro"] as const;

const optionalText = (max: number) => z.string().trim().max(max).optional().or(z.literal(""));

const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Data inválida")
  .refine((v) => !Number.isNaN(new Date(v).getTime()), "Data inválida");

export const createPersonSchema = z.object({
  fullName: z.string().trim().min(3, "Informe o nome completo").max(160),
  preferredName: optionalText(60),
  gender: z.enum(GENDERS).default("nao_informado"),
  birthDate: isoDate.optional().or(z.literal("")),
  maritalStatus: z.enum(MARITAL_STATUSES).default("nao_informado"),
  cpf: cpfSchema.optional().or(z.literal("")),
  email: z.email("E-mail inválido").optional().or(z.literal("")),
  phone: phoneBrSchema.optional().or(z.literal("")),
  whatsapp: phoneBrSchema.optional().or(z.literal("")),
  status: z.enum(PERSON_STATUSES).default("visitante"),
  campusId: z.uuid("Selecione a congregação"),
  householdId: z.uuid().optional().nullable(),
  householdRole: z.enum(HOUSEHOLD_ROLES).optional().nullable(),
  profession: optionalText(100),
  address: addressSchema.optional(),
  notes: optionalText(2000),
  tags: z.array(z.string().trim().min(1).max(40)).max(30).default([]),
});
export type CreatePersonInput = z.infer<typeof createPersonSchema>;

export const updatePersonSchema = createPersonSchema.partial().extend({ id: z.uuid() });
export type UpdatePersonInput = z.infer<typeof updatePersonSchema>;

export const MEMBERSHIP_EVENT_TYPES = [
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
] as const;
export type MembershipEventType = (typeof MEMBERSHIP_EVENT_TYPES)[number];

/** Tipos que só pastor/dirigente e secretaria geral podem ler. */
export const RESTRICTED_EVENT_TYPES: readonly MembershipEventType[] = [
  "disciplina",
  "reconciliacao",
];

export const createMembershipEventSchema = z.object({
  personId: z.uuid(),
  type: z.enum(MEMBERSHIP_EVENT_TYPES),
  occurredAt: isoDate,
  campusId: z.uuid().optional().nullable(),
  details: z.record(z.string(), z.unknown()).default({}),
});
export type CreateMembershipEventInput = z.infer<typeof createMembershipEventSchema>;
