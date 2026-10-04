import { Badge } from "@mca/ui";
import type { PersonStatus } from "@mca/validators";

export const STATUS_LABELS: Record<PersonStatus, string> = {
  visitante: "Visitante",
  frequentador: "Frequentador(a)",
  membro: "Membro",
  inativo: "Inativo(a)",
  transferido: "Transferido(a)",
  falecido: "Falecido(a)",
};

const TONES: Record<
  PersonStatus,
  "neutral" | "primary" | "success" | "warning" | "danger" | "info"
> = {
  visitante: "info",
  frequentador: "warning",
  membro: "success",
  inativo: "neutral",
  transferido: "neutral",
  falecido: "neutral",
};

export function StatusBadge({ status }: { status: PersonStatus }) {
  return <Badge tone={TONES[status]}>{STATUS_LABELS[status]}</Badge>;
}
