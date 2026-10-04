export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-bg px-4 py-10">
      <div className="mb-8 flex items-center gap-3">
        <span className="inline-flex size-10 items-center justify-center rounded-xl bg-primary text-primary-fg shadow-md">
          <svg viewBox="0 0 64 64" className="size-6" aria-hidden>
            <path
              d="M32 12v40M20 24h24"
              stroke="currentColor"
              strokeWidth="7"
              strokeLinecap="round"
            />
          </svg>
        </span>
        <span className="text-xl font-semibold tracking-tight">MCA Igrejas</span>
      </div>
      <div className="w-full max-w-sm">{children}</div>
      <p className="mt-10 text-center text-xs text-fg-subtle">Versão de testes · piloto ADEMAN</p>
    </main>
  );
}
