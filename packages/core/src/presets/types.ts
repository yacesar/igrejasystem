import type { PresetId } from "@mca/validators";

/** Vocabulário configurável: a interface nunca usa termos fixos, sempre `t("campus")`. */
export interface Vocabulary {
  church: string; // "Ministério" | "Igreja"
  campus: string; // "Congregação" | "Campus"
  campusPlural: string;
  sede: string; // "Igreja Sede" | "Matriz"
  campusLeader: string; // "Dirigente" | "Pastor local"
  member: string;
  memberPlural: string;
  memberRoll: string; // "Rol de membros"
  smallGroup: string; // "Célula" | "Pequeno grupo"
  smallGroupPlural: string;
  ministry: string; // "Departamento" | "Ministério"
  ministryPlural: string;
  tithe: string; // "Dízimo" | "Contribuição"
  offering: string;
  sundaySchool: string; // "EBD" | "Escola Bíblica"
  worker: string; // "Obreiro" | "Líder"
  workerPlural: string;
}

export interface OfficeDefinition {
  key: string;
  label: string;
  order: number;
}

export interface ClassDefinition {
  key: string;
  label: string;
  ageMin?: number;
  ageMax?: number;
}

export interface FinanceCategory {
  key: string;
  label: string;
  kind: "entrada" | "saida";
}

export interface Preset {
  id: PresetId;
  label: string;
  description: string;
  vocabulary: Vocabulary;
  /** Cargos/ofícios eclesiásticos em ordem hierárquica. */
  offices: OfficeDefinition[];
  /** Classes padrão de escola bíblica. */
  sundaySchoolClasses: ClassDefinition[];
  /** Departamentos/ministérios padrão. */
  ministries: string[];
  /** Tipos de culto padrão. */
  serviceTypes: string[];
  financeCategories: FinanceCategory[];
}
