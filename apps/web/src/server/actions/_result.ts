import type { ZodError } from "zod";

export type ActionResult<T = undefined> =
  { ok: true; data: T } | { ok: false; error: string; fieldErrors?: Record<string, string> };

export function fail(error: string, fieldErrors?: Record<string, string>): ActionResult<never> {
  return { ok: false, error, fieldErrors };
}

export function fromZod(err: ZodError): ActionResult<never> {
  const fieldErrors: Record<string, string> = {};
  for (const issue of err.issues) {
    const key = issue.path.join(".") || "_";
    fieldErrors[key] ??= issue.message;
  }
  return { ok: false, error: "Verifique os campos destacados.", fieldErrors };
}

/** Converte FormData em objeto simples; campos repetidos viram array. */
export function formToObject(fd: FormData): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of fd.entries()) {
    if (typeof v !== "string") continue;
    if (k.endsWith("[]")) {
      const key = k.slice(0, -2);
      const arr = (out[key] as string[] | undefined) ?? [];
      arr.push(v);
      out[key] = arr;
    } else if (k.includes(".")) {
      const [a, b] = k.split(".", 2) as [string, string];
      ((out[a] ??= {}) as Record<string, unknown>)[b] = v;
    } else out[k] = v;
  }
  return out;
}
