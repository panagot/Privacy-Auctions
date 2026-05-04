import type { ReactNode } from "react";

import { cn } from "@/lib/cn";

type BadgeTone =
  | "neutral"
  | "violet"
  | "emerald"
  | "amber"
  | "sky"
  | "rose";

const toneClass: Record<BadgeTone, string> = {
  neutral:
    "border-zinc-200 bg-zinc-100 text-zinc-700 dark:border-zinc-700 dark:bg-zinc-800/80 dark:text-zinc-200",
  violet:
    "border-violet-200/80 bg-violet-50 text-violet-800 dark:border-violet-800/60 dark:bg-violet-950/40 dark:text-violet-200",
  emerald:
    "border-emerald-200/80 bg-emerald-50 text-emerald-800 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-200",
  amber:
    "border-amber-200/80 bg-amber-50 text-amber-900 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-200",
  sky:
    "border-sky-200/80 bg-sky-50 text-sky-800 dark:border-sky-800/60 dark:bg-sky-950/40 dark:text-sky-200",
  rose:
    "border-rose-200/80 bg-rose-50 text-rose-800 dark:border-rose-800/60 dark:bg-rose-950/40 dark:text-rose-200",
};

export function Badge({
  children,
  tone = "neutral",
  className,
  icon,
}: {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
  icon?: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[11px] font-medium leading-5 tracking-wide",
        toneClass[tone],
        className,
      )}
    >
      {icon ? <span className="-ms-0.5 inline-flex">{icon}</span> : null}
      {children}
    </span>
  );
}
