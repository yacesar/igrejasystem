import { Button } from "@mca/ui";
import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 text-center">
      <p className="text-6xl font-semibold text-fg-subtle">404</p>
      <h1 className="text-xl font-semibold">Página não encontrada</h1>
      <p className="text-sm text-fg-muted">
        O endereço pode estar errado ou o registro foi arquivado.
      </p>
      <Button asChild>
        <Link href="/app">Voltar ao início</Link>
      </Button>
    </main>
  );
}
