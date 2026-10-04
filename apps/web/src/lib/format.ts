export const formatDate = (value: string | Date | null | undefined) => {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(`${value}T00:00:00`) : value;
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short" }).format(d);
};

export const formatDateTime = (value: string | Date | null | undefined) => {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(d);
};

export const formatPhone = (digits: string | null | undefined) => {
  if (!digits) return "—";
  const d = digits.replace(/\D/g, "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return digits;
};

export const formatCpf = (digits: string | null | undefined) => {
  if (!digits || digits.length !== 11) return digits || "—";
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
};

export const ageFrom = (birthDate: string | null | undefined) => {
  if (!birthDate) return null;
  const b = new Date(`${birthDate}T00:00:00`);
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  const m = now.getMonth() - b.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < b.getDate())) age--;
  return age;
};

export const slugify = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
