import * as React from "react";
import { cn } from "../lib/cn";
import { initials } from "../lib/initials";

export interface AvatarProps extends React.ComponentProps<"span"> {
  name: string;
  src?: string | null;
  size?: "sm" | "md" | "lg";
}

const sizes = { sm: "size-8 text-xs", md: "size-10 text-sm", lg: "size-14 text-lg" };

/** Avatar com iniciais; a cor de fundo deriva do nome para ser estável. */
export function Avatar({ name, src, size = "md", className, ...props }: AvatarProps) {
  const hue = React.useMemo(() => {
    let h = 0;
    for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) % 360;
    return h;
  }, [name]);
  return (
    <span
      role="img"
      aria-label={name}
      className={cn(
        "inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full font-semibold select-none",
        sizes[size],
        className,
      )}
      style={
        src ? undefined : { background: `oklch(0.9 0.05 ${hue})`, color: `oklch(0.35 0.08 ${hue})` }
      }
      {...props}
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="size-full object-cover" />
      ) : (
        initials(name)
      )}
    </span>
  );
}
