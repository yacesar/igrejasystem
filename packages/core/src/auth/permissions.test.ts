import { describe, expect, it } from "vitest";
import { ROLE_PERMISSIONS, hasPermission } from "./permissions";

describe("permissões por papel", () => {
  it("secretaria não acessa finanças nem dados sensíveis", () => {
    expect(hasPermission(["secretaria"], "financas.ler")).toBe(false);
    expect(hasPermission(["secretaria"], "pessoas.sensivel.ler")).toBe(false);
    expect(hasPermission(["secretaria"], "pessoas.criar")).toBe(true);
  });
  it("tesouraria lê pessoas mas não edita", () => {
    expect(hasPermission(["tesouraria"], "pessoas.ler")).toBe(true);
    expect(hasPermission(["tesouraria"], "pessoas.editar")).toBe(false);
  });
  it("pastor não configura a igreja, admin sim", () => {
    expect(hasPermission(["pastor"], "igreja.configurar")).toBe(false);
    expect(hasPermission(["admin_igreja"], "igreja.configurar")).toBe(true);
  });
  it("papéis acumulam permissões", () => {
    expect(hasPermission(["membro", "voluntario"], "escalas.proprias")).toBe(true);
  });
  it("membro e visitante não têm permissões administrativas", () => {
    expect(ROLE_PERMISSIONS.membro).toHaveLength(0);
    expect(ROLE_PERMISSIONS.visitante).toHaveLength(0);
  });
});
