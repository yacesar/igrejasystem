import * as React from "react";
import { cn } from "../lib/cn";

export function Separator({ className, ...props }: React.ComponentProps<"hr">) {
  return <hr className={cn("border-0 border-t border-border", className)} {...props} />;
}

export function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      aria-hidden
      className={cn("animate-pulse rounded-md bg-bg-sunken", className)}
      {...props}
    />
  );
}

export interface AlertProps extends React.ComponentProps<"div"> {
  tone?: "info" | "success" | "warning" | "danger";
  title?: string;
}

const alertTones = {
  info: "bg-info-soft text-info border-info/20",
  success: "bg-success-soft text-success border-success/20",
  warning: "bg-warning-soft text-warning border-warning/20",
  danger: "bg-danger-soft text-danger border-danger/20",
};

export function Alert({ tone = "info", title, className, children, ...props }: AlertProps) {
  return (
    <div
      role={tone === "danger" ? "alert" : "status"}
      className={cn("rounded-md border px-4 py-3 text-sm", alertTones[tone], className)}
      {...props}
    >
      {title ? <p className="font-semibold">{title}</p> : null}
      <div className={cn(title && "mt-0.5")}>{children}</div>
    </div>
  );
}
