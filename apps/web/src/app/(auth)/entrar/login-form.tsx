"use client";

import { Alert, Button, Card, CardContent, Field, Input } from "@mca/ui";
import { Mail } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { createClient } from "@/lib/supabase/client";

type Mode = "senha" | "link";

export function LoginForm({ next, initialError }: { next?: string; initialError?: string }) {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("senha");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(initialError ?? null);
  const [sent, setSent] = useState(false);
  const [pending, start] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    start(async () => {
      const supabase = createClient();
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next ?? "/app")}`;
      if (mode === "senha") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) return setError(traduz(error.message));
        router.replace((next as never) ?? "/app");
        router.refresh();
      } else {
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: redirectTo },
        });
        if (error) return setError(traduz(error.message));
        setSent(true);
      }
    });
  }

  if (sent) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <span className="inline-flex size-12 items-center justify-center rounded-full bg-primary-soft text-primary-soft-fg">
            <Mail aria-hidden />
          </span>
          <h1 className="text-lg font-semibold">Verifique seu e-mail</h1>
          <p className="text-sm text-fg-muted">
            Enviamos um link de acesso para <strong>{email}</strong>. Abra-o neste dispositivo.
          </p>
          <Button variant="link" onClick={() => setSent(false)}>
            Usar outro e-mail
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="flex flex-col gap-5">
        <div>
          <h1 className="text-xl font-semibold">Entrar</h1>
          <p className="mt-1 text-sm text-fg-muted">Acesse o painel da sua igreja.</p>
        </div>

        {error ? <Alert tone="danger">{error}</Alert> : null}

        <form onSubmit={submit} className="flex flex-col gap-4" noValidate>
          <Field label="E-mail" htmlFor="email" required>
            <Input
              type="email"
              autoComplete="email"
              inputMode="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="voce@igreja.org"
              required
            />
          </Field>
          {mode === "senha" ? (
            <Field label="Senha" htmlFor="password" required>
              <Input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </Field>
          ) : null}
          <Button type="submit" size="lg" loading={pending} className="mt-1">
            {mode === "senha" ? "Entrar" : "Enviar link de acesso"}
          </Button>
        </form>

        <button
          type="button"
          className="text-sm text-primary underline-offset-4 hover:underline"
          onClick={() => setMode(mode === "senha" ? "link" : "senha")}
        >
          {mode === "senha" ? "Entrar sem senha (link por e-mail)" : "Entrar com senha"}
        </button>
      </CardContent>
    </Card>
  );
}

function traduz(msg: string): string {
  const m = msg.toLowerCase();
  if (m.includes("invalid login credentials")) return "E-mail ou senha incorretos.";
  if (m.includes("email not confirmed")) return "Confirme seu e-mail antes de entrar.";
  if (m.includes("rate limit")) return "Muitas tentativas. Aguarde um minuto e tente de novo.";
  if (m.includes("signups not allowed"))
    return "Cadastro desativado. Peça um convite ao administrador.";
  return "Não foi possível entrar. Tente novamente.";
}
