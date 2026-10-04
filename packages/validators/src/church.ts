import { z } from "zod";
import { addressSchema } from "./br";

export const PRESET_IDS = ["assembleia-de-deus", "generico"] as const;
export type PresetId = (typeof PRESET_IDS)[number];

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Mínimo de 3 caracteres")
  .max(40, "Máximo de 40 caracteres")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use apenas letras minúsculas, números e hífens");

export const createChurchSchema = z.object({
  name: z.string().trim().min(3, "Informe o nome da igreja").max(120),
  shortName: z.string().trim().max(30).optional().or(z.literal("")),
  slug: slugSchema,
  preset: z.enum(PRESET_IDS).default("assembleia-de-deus"),
  sedeName: z.string().trim().min(2).max(120).default("Igreja Sede"),
  firstCongregationName: z.string().trim().max(120).optional().or(z.literal("")),
});
export type CreateChurchInput = z.infer<typeof createChurchSchema>;

export const CAMPUS_KINDS = ["sede", "congregacao"] as const;
export type CampusKind = (typeof CAMPUS_KINDS)[number];

export const createCampusSchema = z.object({
  name: z.string().trim().min(2).max(120),
  kind: z.enum(CAMPUS_KINDS),
  parentId: z.uuid().optional().nullable(),
  address: addressSchema.optional(),
});
export type CreateCampusInput = z.infer<typeof createCampusSchema>;
