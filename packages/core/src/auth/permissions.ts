/**
 * Permissões granulares. Papéis são conjuntos de permissões; a igreja pode
 * criar papéis derivados a partir destas chaves (fase posterior).
 */
export const PERMISSIONS = [
  "igreja.configurar",
  "igreja.papeis.gerenciar",
  "campus.gerenciar",
  "pessoas.ler",
  "pessoas.criar",
  "pessoas.editar",
  "pessoas.excluir",
  "pessoas.importar",
  "pessoas.sensivel.ler", // disciplina, notas pastorais
  "pessoas.sensivel.escrever",
  "documentos.emitir",
  "financas.ler",
  "financas.lancar",
  "financas.fechar",
  "comunicacao.enviar",
  "ensino.gerenciar",
  "ensino.presenca",
  "escalas.gerenciar",
  "escalas.proprias",
  "celulas.gerenciar",
  "celulas.relatorio",
  "cuidado.ler",
  "cuidado.escrever",
  "auditoria.ler",
] as const;
export type Permission = (typeof PERMISSIONS)[number];

export const ROLES = [
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
] as const;
export type Role = (typeof ROLES)[number];

/** Escopo em que um papel vale. `church` cobre todos os campi. */
export const SCOPE_TYPES = ["church", "campus", "ministry", "cell", "class"] as const;
export type ScopeType = (typeof SCOPE_TYPES)[number];

const ALL: readonly Permission[] = PERMISSIONS;

export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  admin_igreja: ALL,
  pastor: ALL.filter((p) => p !== "igreja.configurar"),
  secretaria: [
    "campus.gerenciar",
    "pessoas.ler",
    "pessoas.criar",
    "pessoas.editar",
    "pessoas.importar",
    "documentos.emitir",
    "comunicacao.enviar",
    "ensino.gerenciar",
    "ensino.presenca",
  ],
  tesouraria: ["pessoas.ler", "financas.ler", "financas.lancar", "financas.fechar"],
  lider_ministerio: ["pessoas.ler", "escalas.gerenciar", "escalas.proprias", "comunicacao.enviar"],
  lider_celula: ["pessoas.ler", "celulas.relatorio", "cuidado.escrever"],
  professor: ["pessoas.ler", "ensino.presenca"],
  voluntario: ["escalas.proprias"],
  membro: [],
  visitante: [],
};

export function hasPermission(roles: readonly Role[], permission: Permission): boolean {
  return roles.some((r) => ROLE_PERMISSIONS[r].includes(permission));
}

/** Rótulos em português para a interface. */
export const ROLE_LABELS: Record<Role, string> = {
  admin_igreja: "Administrador",
  pastor: "Pastor",
  secretaria: "Secretaria",
  tesouraria: "Tesouraria",
  lider_ministerio: "Líder de ministério",
  lider_celula: "Líder de célula",
  professor: "Professor(a)",
  voluntario: "Voluntário(a)",
  membro: "Membro",
  visitante: "Visitante",
};
