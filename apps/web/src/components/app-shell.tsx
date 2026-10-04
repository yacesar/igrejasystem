"use client";

import { Avatar, Button, cn } from "@mca/ui";
import {
  Church,
  LayoutDashboard,
  LogOut,
  Moon,
  Settings,
  Sun,
  Users,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import { signOut } from "@/server/actions/auth";

export interface NavItem {
  href: string;
  label: string;
  icon: "dashboard" | "people" | "settings";
}

const ICONS: Record<NavItem["icon"], LucideIcon> = {
  dashboard: LayoutDashboard,
  people: Users,
  settings: Settings,
};

interface AppShellProps {
  churchName: string;
  churchShort: string | null;
  campusLabel: string;
  campusCount: number;
  userName: string;
  userEmail: string | null;
  nav: NavItem[];
  children: React.ReactNode;
}

export function AppShell({
  churchName,
  churchShort,
  campusLabel,
  campusCount,
  userName,
  userEmail,
  nav,
  children,
}: AppShellProps) {
  const pathname = usePathname();
  const isActive = (href: string) =>
    href === "/app" ? pathname === "/app" : pathname.startsWith(href);

  return (
    <div className="flex min-h-dvh">
      {/* Barra lateral (≥ md) */}
      <aside className="sticky top-0 hidden h-dvh w-(--sidebar-w) shrink-0 flex-col border-r border-border bg-bg-elevated md:flex">
        <div className="flex items-center gap-3 px-5 py-5">
          <span className="inline-flex size-9 items-center justify-center rounded-lg bg-primary text-primary-fg">
            <Church className="size-5" aria-hidden />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold leading-tight">
              {churchShort || churchName}
            </p>
            <p className="truncate text-xs text-fg-muted">
              {campusCount} {campusLabel.toLowerCase()}
            </p>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1 px-3" aria-label="Principal">
          {nav.map((item) => {
            const Icon = ICONS[item.icon];
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href as never}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex h-11 items-center gap-3 rounded-md px-3 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary-soft text-primary-soft-fg"
                    : "text-fg-muted hover:bg-bg-muted hover:text-fg",
                )}
              >
                <Icon className="size-5" aria-hidden />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-border p-3">
          <div className="flex items-center gap-3 px-2 py-2">
            <Avatar name={userName} size="sm" />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{userName}</p>
              {userEmail ? <p className="truncate text-xs text-fg-muted">{userEmail}</p> : null}
            </div>
            <ThemeToggle />
            <form action={signOut}>
              <Button type="submit" variant="ghost" size="icon-sm" aria-label="Sair">
                <LogOut aria-hidden />
              </Button>
            </form>
          </div>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Cabeçalho móvel */}
        <header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-bg-elevated/90 px-4 backdrop-blur md:hidden">
          <div className="flex items-center gap-2">
            <span className="inline-flex size-8 items-center justify-center rounded-lg bg-primary text-primary-fg">
              <Church className="size-4" aria-hidden />
            </span>
            <span className="truncate text-sm font-semibold">{churchShort || churchName}</span>
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <form action={signOut}>
              <Button type="submit" variant="ghost" size="icon-sm" aria-label="Sair">
                <LogOut aria-hidden />
              </Button>
            </form>
          </div>
        </header>

        <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-6 pb-[calc(var(--bottom-nav-h)+1.5rem)] md:px-8 md:py-8">
          {children}
        </main>

        {/* Barra inferior (< md) */}
        <nav
          className="fixed inset-x-0 bottom-0 z-20 grid h-(--bottom-nav-h) border-t border-border bg-bg-elevated/95 backdrop-blur safe-bottom md:hidden"
          style={{ gridTemplateColumns: `repeat(${nav.length}, minmax(0, 1fr))` }}
          aria-label="Principal"
        >
          {nav.map((item) => {
            const Icon = ICONS[item.icon];
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href as never}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex flex-col items-center justify-center gap-0.5 text-[11px] font-medium",
                  active ? "text-primary" : "text-fg-muted",
                )}
              >
                <Icon className="size-5" aria-hidden />
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

function subscribeTheme(cb: () => void) {
  const obs = new MutationObserver(cb);
  obs.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => obs.disconnect();
}
const isDark = () => document.documentElement.classList.contains("dark");

function ThemeToggle() {
  const dark = useSyncExternalStore(subscribeTheme, isDark, () => false);
  function toggle() {
    const next = !dark;
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("mca-theme", next ? "dark" : "light");
    } catch {}
  }
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      onClick={toggle}
      aria-label={dark ? "Tema claro" : "Tema escuro"}
    >
      {dark ? <Sun aria-hidden /> : <Moon aria-hidden />}
    </Button>
  );
}
