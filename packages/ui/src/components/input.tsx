import * as React from "react";
import { cn } from "../lib/cn";

export const inputClassName =
  "flex h-11 w-full min-w-0 rounded-md border border-border bg-bg-elevated px-3 py-2 text-base text-fg shadow-sm transition-[border-color,box-shadow] placeholder:text-fg-subtle focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30 disabled:cursor-not-allowed disabled:opacity-60 aria-invalid:border-danger aria-invalid:ring-danger/20 md:text-sm";

export function Input({ className, type = "text", ...props }: React.ComponentProps<"input">) {
  return (
    <input type={type} data-slot="input" className={cn(inputClassName, className)} {...props} />
  );
}

export function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(inputClassName, "h-auto min-h-24 resize-y py-2.5", className)}
      {...props}
    />
  );
}

export function Select({ className, children, ...props }: React.ComponentProps<"select">) {
  return (
    <select
      data-slot="select"
      className={cn(
        inputClassName,
        "appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%2216%22 height=%2216%22 viewBox=%220 0 24 24%22 fill=%22none%22 stroke=%22%23777%22 stroke-width=%222%22 stroke-linecap=%22round%22 stroke-linejoin=%22round%22><path d=%22m6 9 6 6 6-6%22/></svg>')] bg-[length:1rem] bg-[position:right_0.75rem_center] bg-no-repeat pr-9",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}
