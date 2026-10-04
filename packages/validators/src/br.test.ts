import { describe, expect, it } from "vitest";
import { cpfSchema, isValidCpf, phoneBrSchema } from "./br";

describe("CPF", () => {
  it("aceita CPF válido com máscara", () => {
    expect(isValidCpf("529.982.247-25")).toBe(true);
    expect(cpfSchema.parse("529.982.247-25")).toBe("52998224725");
  });
  it("rejeita CPF inválido e sequências repetidas", () => {
    expect(isValidCpf("111.111.111-11")).toBe(false);
    expect(isValidCpf("123.456.789-00")).toBe(false);
    expect(() => cpfSchema.parse("123")).toThrow();
  });
  it("aceita vazio (campo opcional)", () => {
    expect(cpfSchema.parse("")).toBe("");
  });
});

describe("Telefone", () => {
  it("normaliza celular com DDI e máscara", () => {
    expect(phoneBrSchema.parse("+55 (21) 98765-4321")).toBe("21987654321");
  });
  it("aceita fixo com 10 dígitos", () => {
    expect(phoneBrSchema.parse("(21) 3456-7890")).toBe("2134567890");
  });
  it("rejeita número curto", () => {
    expect(() => phoneBrSchema.parse("9876")).toThrow();
  });
});
