import type { LucideIcon } from "lucide-react";
import * as React from "react";
import { cn } from "../lib/cn";

export interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

/** Nenhuma tela vazia sem orientação: explica e oferece a próxima ação. */
export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border border-dashed border-border-strong bg-bg-elevated px-6 py-12 text-center",
        className,
      )}
    >
      <span className="mb-4 inline-flex size-14 items-center justify-center rounded-full bg-primary-soft text-primary-soft-fg">
        <Icon className="size-7" aria-hidden />
      </span>
      <h3 className="text-lg font-semibold">{title}</h3>
      {description ? <p className="mt-1 max-w-md text-sm text-fg-muted">{description}</p> : null}
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  );
}
