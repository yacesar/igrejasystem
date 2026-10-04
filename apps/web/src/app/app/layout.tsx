import { hasPermission } from "@mca/core";
import { AppShell, type NavItem } from "@/components/app-shell";
import { getChurchContext } from "@/lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const ctx = await getChurchContext();
  const v = ctx.preset.vocabulary;

  const nav: NavItem[] = [
    { href: "/app", label: "Início", icon: "dashboard" },
    { href: "/app/pessoas", label: "Pessoas", icon: "people" },
  ];
  if (
    hasPermission(ctx.roles, "igreja.configurar") ||
    hasPermission(ctx.roles, "campus.gerenciar")
  ) {
    nav.push({ href: "/app/configuracoes", label: "Ajustes", icon: "settings" });
  }

  return (
    <AppShell
      churchName={ctx.church.name}
      churchShort={ctx.church.shortName}
      campusLabel={v.campusPlural}
      campusCount={ctx.campuses.length}
      userName={ctx.user.email?.split("@")[0] ?? "Usuário"}
      userEmail={ctx.user.email}
      nav={nav}
    >
      {children}
    </AppShell>
  );
}
