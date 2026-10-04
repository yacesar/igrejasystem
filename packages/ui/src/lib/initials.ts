/** "Maria da Silva Souza" → "MS" */
export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0]!;
  const last = parts.length > 1 ? parts[parts.length - 1]! : "";
  return (first[0]! + (last[0] ?? "")).toUpperCase();
}
