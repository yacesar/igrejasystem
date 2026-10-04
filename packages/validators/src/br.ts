import { z } from "zod";

/** Remove tudo que não for dígito. */
export const onlyDigits = (v: string) => v.replace(/\D/g, "");

/** Valida CPF pelos dígitos verificadores. Aceita com ou sem máscara. */
export function isValidCpf(input: string): boolean {
  const cpf = onlyDigits(input);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  const calc = (len: number) => {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += Number(cpf[i]) * (len + 1 - i);
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };
  return calc(9) === Number(cpf[9]) && calc(10) === Number(cpf[10]);
}

export const cpfSchema = z
  .string()
  .trim()
  .transform(onlyDigits)
  .refine((v) => v.length === 0 || isValidCpf(v), { message: "CPF inválido" });

export const cepSchema = z
  .string()
  .trim()
  .transform(onlyDigits)
  .refine((v) => v.length === 0 || v.length === 8, { message: "CEP deve ter 8 dígitos" });

/** Telefone brasileiro: 10 (fixo) ou 11 (celular) dígitos, com ou sem DDI 55. */
export const phoneBrSchema = z
  .string()
  .trim()
  .transform((v) => {
    const d = onlyDigits(v);
    return d.startsWith("55") && d.length > 11 ? d.slice(2) : d;
  })
  .refine((v) => v.length === 0 || v.length === 10 || v.length === 11, {
    message: "Telefone inválido",
  });

export const addressSchema = z.object({
  cep: cepSchema.optional().or(z.literal("")),
  street: z.string().trim().max(200).optional().or(z.literal("")),
  number: z.string().trim().max(20).optional().or(z.literal("")),
  complement: z.string().trim().max(100).optional().or(z.literal("")),
  district: z.string().trim().max(100).optional().or(z.literal("")),
  city: z.string().trim().max(100).optional().or(z.literal("")),
  state: z.string().trim().length(2).toUpperCase().optional().or(z.literal("")),
  lat: z.number().optional(),
  lng: z.number().optional(),
});
export type Address = z.infer<typeof addressSchema>;
